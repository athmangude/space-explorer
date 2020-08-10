const { paginationResults, paginateResults } = require('./utils');

module.exports = {
  Query: {
    launches: (_, __, { dataSources }) => dataSources.launchAPI.getAllLaunches(),

    launches: async (_, { pageSize = 20, after }, { dataSources }) => {
      const allLaunches = await dataSources.launchAPI.getAllLaunches();

      // we want thes in reverse chronological order
      allLaunches.reverse();

      const launches = paginateResults({ after, pageSize, results: allLaunches });

      return {
        launches,
        cursor: launches.length ? launches[launches.length - 1].cursor : null,
        // if the cursor at the end of the paginated results is the same as the last item in all results, then there are no more items after this
        hasMore: launches.length ? launches[launches.length - 1].cursor !== allLaunches[allLaunches.length - 1].cursor : false
      }
    },
    launch: (_, { id }, { dataSources }) => dataSources.launchAPI.getLaunchById({ launchId: id }),
    me: (_, __, { dataSources }) => dataSources.userAPI.findOrCreateUser(),
  },
  Mutation: {
    login: async (_, { email }, { dataSources }) => {
      const user = await dataSources.userAPI.findOrCreateUser({ email });
      if (user) {
        return Buffer.from(email).toString('base64');
      }
    },
    bookTrips: async (_, { launchIds }, { dataSources }) => {
      const results = await dataSources.userAPI.bookTrips({ launchIds });
      const launches = await dataSources.launchAPI.getLaunchesByIds({
        lauchIds,
      });

      return {
        success: results && results.length === launchIds.length,
        message: results.length === launchIds.lenth ? 'trips booked successfully' : `the following launches could not be booked ${launchIds.filter(id => !results.includes(id),)}`,
        launches,
      }
    },
    cancelTrip: async (_, { launchId }, { dataSources }) => {
      const result = await dataSources.cancelTrip({ launchId });

      if (!result) {
        return {
          success: false,
          message: 'failed to cancel trip',
        };
      }

      const launch = await dataSources.launchAPI.getLaunchById({ launchId });

      return {
        success: true,
        message: 'trip cancelled',
        launches: [launch],
      };
    }
  },
  Mission: {
    missionPatch: (mission, { size } = { size: 'LARGE' }) => {
      return size === 'SMALL' ? mission.missionPatchSmall : mission.missionPatchLarge
    }
  },
  Launch: {
    isBooked: async (launch, _, { dataSources }) => dataSources.userAPI.isBookedOnLaunch({ launchId: launch.id })
  },
  User: {
    trips: async (_, __, { dataSources }) => {
      // get ids of launches by user
      const launchIds = await dataSources.userAPI.getLaunchByIdsByUser();

      if (!launchIds.length) {
        return [];
      }

      return dataSources.launchAPI.getLaunchesByIds({ launchIds }) || [];
    }
  }
}