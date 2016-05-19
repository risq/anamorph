'use strict';

const dbg = require('debug')('anamorph:userData');

const FacebookDataFetcher = require('./facebookDataFetcher');

module.exports = class UserData {
  constructor() {
    this.tokens = {};
    this.data = {};
    this.facebookData = {};
    this.instagramData = {};
    this.twitterData = {};
    this.linkedinData = {};
  }

   fetchFacebookData(facebookDataFetcher) {
     facebookDataFetcher.fetch()
      .then(data => {
        this.facebookData = data;
     });
   }

  fetchInstagramData(instagramDataFetcher) {
    instagramDataFetcher.fetch()
      .then(data => {
        this.instagramData = data;
      });
  }

  fetchTwitterData(twitterDataFetcher) {
    twitterDataFetcher.fetch()
      .then(data => {
        this.twitterData = data;
      });
  }

  fetchLinkedinData(linkedinDataFetcher) {
    linkedinDataFetcher.fetch()
      .then(data => {
        this.linkedinData = data;
      });
  }
};
