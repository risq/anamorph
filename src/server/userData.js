'use strict';

const dbg = require('debug')('anamorph:userData');

const FacebookDataFetcher = require('./facebookDataFetcher');

module.exports = class UserData {
  constructor() {
    this.tokens = {};
    this.data = {};
    this.instagramData = {};
    this.twitterData = {};
    this.linkedinData = {};
  }

  fetchFacebookData(accessToken) {
    return new FacebookDataFetcher(accessToken)
        .fetch()
       .then(data => {
         this.facebookData = data;
        });
      // .then(data => dbg("user min age: "+data.age_min));
      // .then(data => dbg("number of friends: "+data.numberOfFriends));
      //  .then(data => dbg("number of photos: "+data.numberOfPhotos));
      //  .then(data => dbg("number of pages liked: "+data.numberOfPagesLiked));
      // .then(data => data.posts.forEach(post => dbg(post)));
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
