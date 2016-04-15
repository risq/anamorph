// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
'use strict';

const Bluebird = require('bluebird');
const fbgraph = require('fbgraph');
const getFb = Bluebird.promisify(fbgraph.get);
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
    return this.fetchName()
      .then(() => this.fetchAge())
      .then(() => this.fetchFeed())
      .then(() => this.fetchNumberOfFriends())
      .then(() => this.fetchNumberOfPhotos())
      .then(() => this.numberOfPagesLiked())
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchName() {
    dbg('Fetching user name');

    return this.get('/me').then(res => {
      this.data.name = res.name;
      dbg(`Found name: ${this.data.name}`);

      return Bluebird.resolve(true); // TODO
    });
  }

  fetchAge() {
    dbg('Fetching user Age');

    return this.get('/me?fields=age_range').then(res => {
      this.data.age_min = res.age_range.min;
      dbg(`Found age: ${this.data.age_min}`);

      return Bluebird.resolve(true); // TODO
    });
  }

  fetchFeed(url) {
    dbg('Fetching user feed');

    return this.get(url || '/me/feed', {
      limit: 100,
    }).then(res => {
      dbg(`Found ${res.data.length} posts`);
      this.data.posts.push(...res.data);

      if (res.paging && res.paging.next) {
        return this.fetchFeed(res.paging.next);
      }

      return Bluebird.resolve(true); // TODO
    });
  }

  fetchNumberOfFriends() {
    dbg('Fetching number of friends');

    return this.get('me/friends').then(res => {
      this.data.numberOfFriends = res.summary.total_count;
      dbg(`Found ${this.data.numberOfFriends} friends`);
    });
  }

  fetchNumberOfPhotos(url) {
    dbg('Fetching number of photos where the user is identified');

    return this.get(url || '/me?fields=photos', {
      limit: 0,
    }).then(res => {
      if (res.paging && res.paging.next) {
        return this.fetchFeed(res.paging.next);
      }

      this.data.numberOfPhotos = res.photos.data.length;
      dbg(`Found ${this.data.numberOfPhotos} photos`);

      return Bluebird.resolve(true); // TODO
    });
  }

  numberOfPagesLiked(url) {
    dbg('Fetching number of pages liked by user');

    return this.get(url || '/me/?fields=likes', {
      limit: 0,
    }).then(res => {
      if (res.paging && res.paging.next) {
        return this.fetchFeed(res.paging.next);
      }

      // TODO: fix bug - res only returns { id: 'xxxxxxxxxxxxxxxxx' }

      // this.data.numberOfPagesLiked = res.likes.data.length;
      // dbg(`Found ${this.data.numberOfPagesLiked} pages liked`);

      return Bluebird.resolve(true); // TODO
    });
  }

  get(url, parameters) {
    parameters = parameters || {};
    Object.assign(parameters, { access_token: this.accessToken });
    return getFb(url, parameters);
  }
};
