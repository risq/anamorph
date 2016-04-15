'use strict';

const Bluebird = require('bluebird');

const dbg = require('debug')('anamorph:twitterDataFetcher');

module.exports = class TwitterDataFetcher {
  constructor(api, tokens) {
    dbg('Initializing new TwitterDataFetcher');

    this.api = api;
    this.tokens = tokens;
  }

  fetch() {
    dbg('Fetching twitter data');

    return this.fetchNumberOfFollowers()
      .catch(err => dbg(err));
  }

  fetchNumberOfFollowers() {
    dbg('Fetching number of followers');

    return new Bluebird((resolve, reject) => {
      this.api.followers('ids', {},
        this.tokens.accessToken,
        this.tokens.accessTokenSecret,
        (err, data) => {
          if (err) {
            reject(err);
          } else {
            dbg(`Found ${data.ids.length} followers`);
            resolve(data.ids.length);
          }
        }
      );
    });
  }
};
