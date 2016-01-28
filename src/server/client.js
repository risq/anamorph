'use strict';

const events = require('events');
const shortid = require('shortid');
const dbg = require('debug')('mirage:client');

const UserData = require('./userData');

module.exports = class Client {
  constructor(id) {
    this.id = id;
    this.socket = null;
    this.remoteSocket = null;
    this.syncId = shortid.generate();
    this.events = new events.EventEmitter();
    this.userData = new UserData();
  }

  register(socket) {
    if (socket) {
      this.socket = socket;
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
      this.remoteSocket.on('remote:auth', this.onAuthResponse.bind(this));
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
    dbg('onAuthResponse');
    this.userData.fetchFacebookData(authResponse.accessToken);
  }
};
