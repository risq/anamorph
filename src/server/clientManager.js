'use strict';

const events = require('events');
const dbg = require('debug')('anamorph:clientManager');
const Client = require('./client');

module.exports = new class ClientManager {
  constructor() {
    this.clients = [];
    this.events = new events.EventEmitter();
  }

  getClient(id) {
    if (!this.clients[id]) {
      this.clients[id] = new Client(id);
    }

    return this.clients[id];
  }

  getClientBySyncId(syncId) {
    return this.clients.find(client => client && client.syncId === syncId);
  }

  registerClient(id, socket) {
    dbg(`Registering client ${id}`);

    if (!this.getClient(id).isRegistered()) {
      this.getClient(id).register(socket);
      socket.on('disconnect', () => this.unregisterClient(id));
      socket.emit('client:register:status', {
        err: null,
      });
    } else {
      dbg(`Client ${id} already registered`);
      socket.emit('client:register:status', {
        err: `Client ${id} already registered`,
      });
    }

    this.onStateChange(this.getClient(id));
  }

  unregisterClient(id) {
    dbg(`Unregistering client ${id}`);

    if (this.getClient(id).isRegistered()) {
      this.getClient(id).unregister();
    } else {
      dbg(`Client ${id} already unregistered`);
    }

    this.onStateChange(this.getClient(id));
  }

  registerRemote(syncId, socket) {
    const client = this.getClientBySyncId(syncId);

    if (client && client.isRegistered()) {
      dbg(`Registering remote for client ${client.id}`);

      if (!client.remoteIsRegistered()) {
        client.registerRemote(socket);
        socket.on('disconnect', () => this.unregisterRemote(client.id));
        socket.emit('remote:register:status', {
          err: null,
          id: client.id,
        });

        this.onStateChange(client);
      } else {
        const err = `Remote already registered for client ${client.id}`;
        socket.emit('remote:register:status', {
          err,
        });
        dbg(err);
      }
    } else if (client) {
      const err = `Cannot find client ${client.id}`;
      socket.emit('remote:register:status', { err });
      dbg(err);
    } else {
      const err = `Cannot find client for remote ${syncId}`;
      socket.emit('remote:register:status', { err });
      dbg(err);
    }
  }

  unregisterRemote(id) {
    dbg(`Unregistering remote for client ${id}`);
    this.getClient(id).unregisterRemote();

    this.onStateChange(this.getClient(id));
  }

  onStateChange(client) {
    this.events.emit('state:change', client);
  }
};
