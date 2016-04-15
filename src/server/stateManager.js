'use strict';

const clientManager = require('./clientManager');
const dbg = require('debug')('anamorph:stateManager');

module.exports = new class StateManager {
  getState(id) {
    const client = clientManager.getClient(id);

    return client.authManager.getAuthData()
      .then(authData => ({
        syncId: client.syncId,
        status: client.isRegistered() ? 'connected' : 'disconnected',
        remoteStatus: client.remoteIsRegistered() ? 'connected' : 'disconnected',
        auth: {
          twitterUrl: authData.twitter.authUrl,
        },
      }));
  }

  onStateChange() {

  }
};
