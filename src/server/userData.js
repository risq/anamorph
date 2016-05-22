'use strict';

const dbg = require('debug')('anamorph:userData');
const events = require('events');

module.exports = class UserData {
  constructor() {
    this.tokens = {};
    this.data = {};
    this.isTerminated = false;
    this.events = new events.EventEmitter();

    this.state = {
      facebook: 'none',
      instagram: 'none',
      twitter: 'none',
      linkedin: 'none',
    }
  }

  terminate() {
    dbg('terminate');
    this.isTerminated = true;
    this.onDataFetched();
  }

  onDataFetched() {
    dbg('onDataFetched');
    if (this.isTerminated &&
        this.state.facebook !== 'working' &&
        this.state.instagram !== 'working' &&
        this.state.twitter !== 'working' &&
        this.state.linkedin !== 'working') {

      dbg('allDataFetched');
      this.events.emit('allDataFetched');
    }
  }

  fetchFacebookData(facebookDataFetcher) {
    this.state.facebook = 'working';
     facebookDataFetcher.fetch()
      .then(data => {
        this.data.facebook = data;
        this.state.facebook = 'done';
        this.onDataFetched();
     });
   }

  fetchInstagramData(instagramDataFetcher) {
    this.state.instagram = 'working';
    instagramDataFetcher.fetch()
      .then(data => {
        this.data.instagram = data;
        this.state.instagram = 'done';
        this.onDataFetched();
      });
  }

  fetchTwitterData(twitterDataFetcher) {
    this.state.twitter = 'working';
    twitterDataFetcher.fetch()
      .then(data => {
        this.data.twitter = data;
        this.state.twitter = 'done';
        this.onDataFetched();
      });
  }

  fetchLinkedinData(linkedinDataFetcher) {
    this.state.linkedin = 'working';
    linkedinDataFetcher.fetch()
      .then(data => {
        this.data.linkedin = data;
        this.state.linkedin = 'done';
        this.onDataFetched();
      });
  }
};
