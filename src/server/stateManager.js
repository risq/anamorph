'use strict';

const clientManager = require('./clientManager');
const dbg = require('debug')('mirage:stateManager');

module.exports = new class StateManager {
  constructor() {

  }

  getState(id) {
    const client = clientManager.getClient(id);

    return {
      syncId: client.syncId,
      status: client.isRegistered() ? `connected` : `disconnected`,
      remoteStatus: client.remoteIsRegistered() ? `connected` : `disconnected`,
    };
  }

  onStateChange() {

  }
};
