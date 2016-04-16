'use strict';

const Nodegram = require('nodegram');

const InstagramDataFetcher = require('../instagramDataFetcher');

const dbg = require('debug')('anamorph:authManager:instagramAuth');

module.exports = class InstagramAuth {
  constructor(clientId) {
    this.clientId = clientId;
  }

  getDataFetcher(oauthToken) {
    const nodegram = new Nodegram({
      clientId: '208f9dfdb4b44a228b4c7f95b56bc58e',
      clientSecret: '00afe917a374431296dcc65bd645fccf',
      redirectUri: `http://localhost:3000/insta?clientId=${this.clientId}`,
    });

    nodegram.getAuthUrl();

    return nodegram.getAccessToken(oauthToken)
      .then(res => new InstagramDataFetcher({ accessToken: res.access_token }));
  }
};
