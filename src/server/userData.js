'use strict';

const events = require('events');
const dbg = require('debug')('anamorph:userData');

const FacebookDataFetcher = require('./facebookDataFetcher');
const InstagramDataFetcher = require('./instagramDataFetcher');

module.exports = class UserData {
  constructor() {
    this.tokens = {};
    this.data = {};
  }

  fetchFacebookData(accessToken) {
    return new FacebookDataFetcher(accessToken)
      .fetch()
       // .then(data => dbg(data.name))
       // .then(data => dbg("user min age: "+data.age_min));
       // .then(data => dbg("number of friends: "+data.numberOfFriends));
        //  .then(data => dbg("number of photos: "+data.numberOfPhotos));
        //  .then(data => dbg("number of pages liked: "+data.numberOfPagesLiked));
          .then(data => data.posts.forEach(post => dbg(post)));
  }
};
