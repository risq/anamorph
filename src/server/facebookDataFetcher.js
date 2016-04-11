'use strict';

const events = require('events');
const bluebird = require('bluebird');
const fbgraph = require('fbgraph');
const getFb = bluebird.promisify(fbgraph.get);
const dbg = require('debug')('anamorph:facebookDataFetcher');

module.exports = class FacebookDataFetcher {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.data = {
      name: '',
      posts: [],
    };
  }

  fetch() {
    const data = {};
    return this.fetchName()
      .then(data => this.fetchAge())
      .then(data => this.fetchFeed())
      .then(data => this.fetchNumberOfFriend())
      .then(data => this.fetchNumberOfPhotos())
      .then(data => this.numberOfPagesLiked())
      .then(() => this.data)
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchName() {
    dbg(`Fetching user name`);

    return this.get(`/me`).then(res => {
      this.data.name = res.name;
    });
  }

  fetchAge() {
    dbg(`Fetching user Age`);

    return this.get(`/me?fields=age_range`).then(res => {
      this.data.age_min = res.age_range.min;
    });
  }

  fetchFeed(url) {
    dbg(`Fetching user feed`);

    url = url || `/me/feed`;
    return this.get(url, {
      limit: 100,
    }).then(res => {
      dbg(`Found ${res.data.length} posts`);
      this.data.posts.push(...res.data);

      if (res.paging && res.paging.next) {
        return this.fetchFeed(res.paging.next);
      }
    });
  }

  fetchNumberOfFriend() {
    dbg(`Fetching number of friend`);

    return this.get(`me/friends`).then(res => {
      this.data.numberOfFriends = res.summary.total_count;
    });
  }

  fetchNumberOfPhotos(url) {
    dbg(`Fetching number of photos where the user is identified`);

    url = url || `/me?fields=photos`;
    return this.get(url, {
      limit: 0,
    }).then(res => {
      if (res.paging && res.paging.next) {
        return this.fetchFeed(res.paging.next);
      }
      else{
        this.data.numberOfPhotos = res.photos.data.length;
      }
    });
  }

  numberOfPagesLiked(url) {
    dbg(`Fetching number of pages liked by user`);

    url = url || `/me/?fields=likes`;
    return this.get(url, {
      limit: 0,
    }).then(res => {
      if (res.paging && res.paging.next) {
        return this.fetchFeed(res.paging.next);
      }
      else{
        this.data.numberOfPagesLiked = res.likes.data.length;
      }
    });
  }

  get(url, parameters) {
    parameters = parameters || {};
    Object.assign(parameters, {access_token: this.accessToken});
    return getFb(url, parameters);
  }
};
