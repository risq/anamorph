'use strict';

const events = require('events');
const dbg = require('debug')('mirage:userData');

const FacebookDataFetcher = require('./facebookDataFetcher');

module.exports = class UserData {
  constructor() {
    this.tokens = {};
    this.data = {};
  }

  fetchFacebookData(accessToken) {
    return new FacebookDataFetcher(accessToken)
      .fetch()
      .then(data => data.posts.forEach(post => dbg(post)));
  }
};
