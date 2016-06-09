'use strict';

const Bluebird = require('bluebird');

const FacebookAuth = require('./facebookAuth');
const TwitterAuth = require('./twitterAuth');
const InstagramAuth = require('./instagramAuth');
const LinkedinAuth = require('./linkedinAuth');

const dbg = require('debug')('anamorph:authManager');

module.exports = class AuthManager {
  constructor(clientId) {
    dbg('Initializing new AuthManager');
    this.facebookAuth = new FacebookAuth(clientId);
    this.twitterAuth = new TwitterAuth(clientId);
    this.instagramAuth = new InstagramAuth(clientId);
    this.linkedinAuth = new LinkedinAuth(clientId);
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
