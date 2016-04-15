'use strict';

const events = require('events');
const shortid = require('shortid');
const dbg = require('debug')('anamorph:client');

const UserData = require('./userData');
const AuthManager = require('./authManager');

module.exports = class Client {
  constructor(id) {
    this.id = id;
    this.socket = null;
    this.remoteSocket = null;
    this.syncId = shortid.generate();
    this.events = new events.EventEmitter();
    this.userData = new UserData();
    this.authManager = new AuthManager(id);
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
      this.remoteSocket.on('remote:auth:facebook', this.onFacebookAuthResponse.bind(this));
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

  onFacebookAuthResponse(authResponse) {
    dbg('onFacebookAuthResponse');
    this.userData.fetchFacebookData(authResponse.accessToken);
  }

  onInstagramAuthResponse(code) {
    dbg('onInstagramAuthResponse', this.id, code);
    this.userData.fetchInstagramData(this.id, code);
  }

  onTwitterAuthResponse(oauthToken) {
    dbg('onTwitterAuthResponse', this.id, oauthToken);

    this.authManager.getTwitterDataFetcher(oauthToken)
      .then(twitterDataFetcher => this.userData.fetchTwitterData(twitterDataFetcher));
  }
};
