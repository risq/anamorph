'use strict';

const events = require('events');
const shortid = require('shortid');

module.exports = class Client {
  constructor(id) {
    this.id = id;
    this.socket = null;
    this.remoteSocket = null;
    this.syncId = shortid.generate();
    this.events = new events.EventEmitter();
  }

  register(socket) {
    this.socket = socket;
  }

  unregister() {
    this.socket = null;
    this.unregisterRemote();
  }

  isRegistered() {
    return this.socket !== null;
  }

  registerRemote(socket) {
    this.remoteSocket = socket;
  }

  unregisterRemote() {
    this.remoteSocket = null;
  }

  remoteIsRegistered() {
    return this.remoteSocket !== null;
  }

  onStateChange() {
    this.events.emit('state:change');
  }
};
