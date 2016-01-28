'use strict';
const events = require('events');
const dbg = require('debug')('mirage:clientManager');

const Client = require('./client');

module.exports = new class ClientManager {
  constructor(server) {
    this.clients = {
      1: new Client(1),
      2: new Client(2),
    };

    this.events = new events.EventEmitter();
  }

  getClient(id) {
    return this.clients[id];
  }

  getClientBySyncId(syncId) {
    return syncId === this.getClient(1).syncId ? this.getClient(1) :
      syncId === this.getClient(2).syncId ? this.getClient(2) : null;
  }

  registerClient(id, socket) {
    dbg(`Registering client ${id}`);

    if (!this.getClient(id).isRegistered()) {
      this.getClient(id).register(socket);
      socket.on(`disconnect`, () => this.unregisterClient(id));
      socket.emit(`client:register:status`, {err: null});
    } else {
      dbg(`Client ${id} already registered`);
      socket.emit(`client:register:status`, {err: `Client ${id} already registered`});
    }

    this.onStateChange();
  }

  unregisterClient(id) {
    dbg(`Unregistering client ${id}`);

    if (this.getClient(id).isRegistered()) {
      this.getClient(id).unregister();
    } else {
      dbg(`Client ${id} already unregistered`);
    }

    this.onStateChange();
  }

  registerRemote(syncId, socket) {
    const client = this.getClientBySyncId(syncId);

    dbg(`Registering remote for client ${client.id}`);

    if (client && client.isRegistered()) {
      if (!client.remoteIsRegistered()) {
        client.registerRemote(socket);
        socket.on('disconnect', () => this.unregisterRemote(client.id));
        socket.emit(`remote:register:status`, {err: null, id: client.id});

        this.onStateChange();
      } else {
        const err = `Remote already registered for client ${client.id}`;
        socket.emit(`remote:register:status`, {err});
        dbg(err);
      }
    } else {
      const err = `Cannot find client ${client.id}`;
      socket.emit(`remote:register:status`, {err});
      dbg(err);
    }
  }

  unregisterRemote(id) {
    dbg(`Unregistering remote for client ${id}`);
    this.getClient(id).unregisterRemote();

    this.onStateChange();
  }

  onStateChange() {
    this.events.emit('state:change');
  }
};
