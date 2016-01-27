'use strict';

const clientManager = require('./clientManager');

module.exports = new class StateManager {
  constructor() {

  }

  getState() {
    const client1 = clientManager.getClient(1);
    const client2 = clientManager.getClient(2);

    return {
      client1: {
        syncId: client1.syncId,
        status: client1.isRegistered() ? `connected` : `disconnected`,
        remoteStatus: client1.remoteIsRegistered() ? `connected` : `disconnected`,
      },
      client2: {
        syncId: client2.syncId,
        status: client2.isRegistered() ? `connected` : `disconnected`,
        remoteStatus: client2.remoteIsRegistered() ? `connected` : `disconnected`,
      },
    };
  }

  onStateChange() {

  }
};
