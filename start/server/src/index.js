require('dotenv').config();
const isEmail = require('isemail');

const { ApolloServer } = require('apollo-server');
const typeDefs = require('./schema');
const { createStore } = require('./utils');
const resolvers = require('./resolvers');

const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');
const IsEmail = require('isemail');

const store = createStore();

const server = new ApolloServer({
  context: async ({ req }) => {
    // simple auth check on every request
    const auth = req.headers && req.headers.authorization || '';
    console.log('[req.headers]', req.headers);
    console.log('[auth]', auth);
    const email = Buffer.from(auth, 'base64').toString('ascii');
    console.log('[email]', email);

    if (!isEmail.validate(email)) {
      return { user: null };
    }

    const users = await store.users.findOrCreate({ where: { email } });
    console.log('[users]', users);

    const user = users && users[0] || null;
    console.log('[user]', user);
    return { user: { ...user.dataValues } };
  },
  typeDefs,
  resolvers,
  dataSources: () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store }),
  })
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
})