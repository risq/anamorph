'use strict';

const clientManager = require('./clientManager');
const dbg = require('debug')('anamorph:stateManager');
const bluebird = require('bluebird');
const authManager = require('./authManager');


module.exports = new class StateManager {
  constructor() {

  }

  getState(id) {
    const client = clientManager.getClient(id);

    return authManager.getAuthData()
      .then(authData => {
        return {
          syncId: client.syncId,
          status: client.isRegistered() ? `connected` : `disconnected`,
          remoteStatus: client.remoteIsRegistered() ? `connected` : `disconnected`,
          auth: {
            twitterUrl: authData.twitter.authUrl
          }
        };
      })
  }

  onStateChange() {

  }
};
