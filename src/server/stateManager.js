'use strict';
const clientManager = require('./clientManager');
const dbg = require('debug')('anamorph:stateManager');

module.exports = new class StateManager {
  getState(id) {
    this.clientId = id;
    const client = clientManager.getClient(id);

    return client.authManager.getAuthData()
      .then(authData => ({
        syncId: client.syncId,
        status: client.isRegistered() ? 'connected' : 'disconnected',
        remoteStatus: client.remoteIsRegistered() ? 'connected' : 'disconnected',
        auth: {
          clientId: this.clientId,
          syncId: client.syncId,
          facebookUrl: authData.facebook.authUrl,
          twitterUrl: authData.twitter.authUrl,
          linkedinUrl: authData.linkedin.authUrl,
          instagramUrl: authData.instagram.authUrl,
        },
      }));
  }

  onStateChange() {

  }
};
