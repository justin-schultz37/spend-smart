const { User, Income } = require('../models');
const { signToken, AuthenticationError } = require('../utils/auth');

const resolvers = {
    Query: {
        users: async (_, __, context) => {
            if (context.user) {
                const user = await User.findOne({ _id: context.user._id });
                return user;
            }
            throw AuthenticationError;
        },
        getUser: async (_, __, context) => {
            try {
                if (!context.user) {
                    throw new Error('You must be logged in to fetch user data');
                }

                const user = await User.findOne({ _id: context.user._id });
                return user;
            } catch (error) {
                console.error(error);
                throw error;
            }
        },
    },
    Mutation: {
        signup: async (parent, { email, password }) => {
            const user = await User.create({ email, password });
            const token = signToken(user);
            return { token, user };
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw AuthenticationError;
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw AuthenticationError;
            }

            const token = signToken(user);

            return { token, user };
        },
        signout: async (parent, args, context) => {
            return new Promise((resolve, reject) => {
                context.user = null;
                resolve({
                    message: 'Successfully signed out',
                });
            });
        },
        addIncomeSource: async (_, { source, incomeAmount }, context) => {
            try {
                if (!context.user) {
                    throw new Error('You must be logged in to add an income source');
                }

                const user = await User.findOne({ _id: context.user._id });

                const newIncome = new Income({
                    source,
                    incomeAmount,
                    frequency: 'monthly', // Set the frequency as needed
                });

                user.incomes.push(newIncome);
                await user.save();

                return newIncome;
            } catch (error) {
                console.error(error);
                throw error; // Ensure you're re-throwing the error to let Apollo Client catch it
            }
        },
    },
};

module.exports = resolvers;

