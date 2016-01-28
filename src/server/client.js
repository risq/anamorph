'use strict';

const events = require('events');
const shortid = require('shortid');
const dbg = require('debug')('mirage:client');

module.exports = class Client {
  constructor(id) {
    this.id = id;
    this.socket = null;
    this.remoteSocket = null;
    this.syncId = shortid.generate();
    this.events = new events.EventEmitter();
  }

  register(socket) {
    if (socket) {
      this.socket = socket;
      this.socket.on('remote:auth', this.onAuthResponse.bind(this));
      dbg(`Registered client ${this.id}`);
    }
  }

  unregister() {
    this.socket = null;
    this.unregisterRemote();
    dbg(`Unregistered client ${this.id}`);
  }

  isRegistered() {
    return this.socket !== null;
  }

  registerRemote(socket) {
    if (socket) {
      dbg(`Registered remote for client ${this.id}`);
      this.remoteSocket = socket;
    }
  }

  unregisterRemote() {
    dbg(`Unregistered remote for client ${this.id}`);
    this.remoteSocket = null;
  }

  remoteIsRegistered() {
    return this.remoteSocket !== null;
  }

  onStateChange() {
    this.events.emit('state:change');
  }

  onAuthResponse(authResponse) {
    dbg('onAuthResponse', authResponse);
  }
};
