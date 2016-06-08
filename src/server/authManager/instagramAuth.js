'use strict';

const Bluebird = require('bluebird');
const Nodegram = require('nodegram');

const InstagramDataFetcher = require('../instagramDataFetcher');
const config = require('../../../config/config');

const dbg = require('debug')('anamorph:authManager:instagramAuth');

module.exports = class InstagramAuth {
  constructor(clientId) {
    this.clientId = clientId;
  }

  getAuthData() {
    dbg('Getting instagram auth data');


    const nodegram = new Nodegram({
      clientId: config.api.instagram.key,
      clientSecret: config.api.instagram.secret,
      redirectUri: `http://${config.server.domain}:${config.server.port}/insta?clientId=${this.clientId}`,
    });

    nodegram.getAuthUrl();

    this.authData = {
      authUrl: nodegram.getAuthUrl(),
    };

    if (this.authData) {
      return Bluebird.resolve(this.authData);
    }
  }

  getDataFetcher(oauthToken) {
    const nodegram = new Nodegram({
      clientId: config.api.instagram.key,
      clientSecret: config.api.instagram.secret,
      redirectUri: `http://${config.server.domain}:${config.server.port}/insta?clientId=${this.clientId}`,
    });

    nodegram.getAuthUrl();

    return nodegram.getAccessToken(oauthToken)
      .then(res => new InstagramDataFetcher({ accessToken: res.access_token }));
  }
};
