'use strict';

const Bluebird = require('bluebird');

const FacebookAuth = require('./facebookAuth');
const TwitterAuth = require('./twitterAuth');
const InstagramAuth = require('./instagramAuth');
const LinkedinAuth = require('./linkedinAuth');

const dbg = require('debug')('anamorph:authManager');

module.exports = class AuthManager {
  constructor(clientId) {
    dbg('Creating new AuthManager');
    this.clientId = clientId;

    this.init();
  }

  getAuthData() {
    return Bluebird.props({
      facebook: this.facebookAuth.getAuthData(),
      twitter: this.twitterAuth.getAuthData(),
      linkedin: this.linkedinAuth.getAuthData(),
      instagram: this.instagramAuth.getAuthData(),
    }).then(data => ({
      facebook: data.facebook,
      twitter: data.twitter,
      linkedin: data.linkedin,
      instagram: data.instagram,
    }));
  }

  init() {
    dbg('Initializing auth manager')
    this.facebookAuth = new FacebookAuth(this.clientId);
    this.twitterAuth = new TwitterAuth(this.clientId);
    this.instagramAuth = new InstagramAuth(this.clientId);
    this.linkedinAuth = new LinkedinAuth(this.clientId);
  }

  getFacebookDataFetcher(oauthToken) {
    dbg('Getting facebook data fetcher');

    return this.facebookAuth.getDataFetcher(oauthToken);
  }

  getTwitterDataFetcher(oauthToken) {
    dbg('Getting twitter data fetcher');

    return this.twitterAuth.getDataFetcher(oauthToken);
  }

  getInstagramDataFetcher(oauthToken) {
    dbg('Getting instagram data fetcher');

    return this.instagramAuth.getDataFetcher(oauthToken);
  }

  getLinkedinDataFetcher(code, state) {
    dbg('Getting linkedin data fetcher');

    return this.linkedinAuth.getDataFetcher(code, state);
  }
};
