// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
'use strict';

const events = require('events');
const bluebird = require('bluebird');
const dbg = require('debug')('anamorph:instagramDataFetcher');

module.exports = class InstagramDataFetcher {
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
     // .then(data => this.fetchFeed())
      .then(() => this.data)
      .catch(err => dbg(`Error: ${err.message}`));
  }

  //Fetching user name
  fetchName() {
    dbg(`Fetching instagram user name`);

    return this.get(`/me`).then(res => {
      this.data.name = res.name;
    });
  }

  //Fetching user feed
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




  get(url, parameters) {
    parameters = parameters || {};
    Object.assign(parameters, {access_token: this.accessToken});
    return getFb(url, parameters);
  }
};
