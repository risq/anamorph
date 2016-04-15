'use strict';

const Bluebird = require('bluebird');
const TwitterAuth = require('./twitterAuth');

const dbg = require('debug')('anamorph:authManager');

module.exports = class AuthManager {
  constructor(clientId) {
    dbg('Initializing new AuthManager');
    this.twitterAuth = new TwitterAuth(clientId);
  }

  getAuthData() {
    return Bluebird.props({
      twitter: this.twitterAuth.getAuthData(),
    }).then(data => ({
      twitter: data.twitter,
    }));
  }

  getTwitterDataFetcher(oauthToken) {
    dbg('Getting twitter data fetcher');

    return this.twitterAuth.getDataFetcher(oauthToken);
  }
};
