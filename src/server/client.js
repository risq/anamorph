'use strict';

const events = require('events');
const shortid = require('shortid');
const dbg = require('debug')('anamorph:client');

const UserData = require('./userData');
const AuthManager = require('./authManager');
const DataManager = require('./dataManager');

module.exports = class Client {
  constructor(id) {
    this.id = id;
    this.socket = null;
    this.remoteSocket = null;
    this.syncId = shortid.generate();
    this.events = new events.EventEmitter();
    this.userData = new UserData();
    this.authManager = new AuthManager(id);
    this.dataManager = new DataManager();
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

  onFacebookAuthResponse(oauthToken) {
    dbg('onFacebookAuthResponse');
//    this.userData.fetchFacebookData(authResponse.accessToken);

    this.authManager.getFacebookDataFetcher(oauthToken)
        .then(facebookDataFetcher => this.userData.fetchFacebookData(facebookDataFetcher));
  }

  onInstagramAuthResponse(oauthToken) {
    dbg('onInstagramAuthResponse', this.id, oauthToken);

    this.authManager.getInstagramDataFetcher(oauthToken)
      .then(instagramDataFetcher => this.userData.fetchInstagramData(instagramDataFetcher))
  }

  onTwitterAuthResponse(oauthToken) {
    dbg('onTwitterAuthResponse', this.id, oauthToken);

    this.authManager.getTwitterDataFetcher(oauthToken)
      .then(twitterDataFetcher => this.userData.fetchTwitterData(twitterDataFetcher));
  }

  onLinkedinAuthResponse(code, state) {
    dbg('onLinkedinAuthResponse', this.id, code, state);

    this.authManager.getLinkedinDataFetcher(code, state)
      .then(linkedinDataFetcher => this.userData.fetchLinkedinData(linkedinDataFetcher));
  }
  onValidateConnections(code, state) {
    dbg('Validate social connections with client id: ', this.id);

    this.dataManager.validConnections(this.userData);
  }
};
