'use strict';

const Bluebird = require('bluebird');
const Nodegram = require('nodegram');

const dbg = require('debug')('anamorph:instagramDataFetcher');

module.exports = class InstagramDataFetcher {
  constructor(tokens) {
    this.tokens = tokens;

    this.data = {
      numberOfUserPublications: '',
      numberOfUserFollowers: [],
      numberOfUserFollows: [],
      averageOfGetLikes: [],
      averageOfGetComments: [],
      averageOfTagsForPostPublication: [],
    };
  }

  fetch() {
    dbg('Fetching instagram data');

    this.gram = new Nodegram({ accessToken: this.tokens.accessToken });

    this.gram.getAuthUrl();
    return this.fetchNumberOfUserPublications()
      .then(() => this.fetchNumberOfUserFollowers())
      .then(() => this.fetchNumberOfUserFollows())
      .then(() => this.fetchAverageOfGetLikes())
      .then(() => this.fetchAverageOfGetComments())
      .then(() => this.fetchAverageTagsForPostPublication())
      .then(() => this.data)
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchNumberOfUserPublications() {
    dbg('Retrieving number of publications');

    return this.gram.get('/users/self/', {})
      .then(res => {
        this.data.numberOfUserPublications = res.counts.media;
      })
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchNumberOfUserFollowers() {
    dbg('Retrieving number of followers');

    return this.gram.get('/users/self/', {})
      .then(res => {
        this.data.numberOfUserFollowers = res.counts.followed_by;
      })
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchNumberOfUserFollows() {
    dbg('Retrieving number of follows');

    return this.gram.get('/users/self/', {})
      .then(res => {
        this.data.numberOfUserFollows = res.counts.follows;
      })
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchAverageOfGetLikes() {
    dbg('Retrieving average of likes per publication');
    let numberOfPublications = 0;
    let numberOfLikes = 0;

    return this.gram.get('/users/self/media/recent', {})
      .then(res => {
        numberOfPublications += res.length;
        res.forEach(res => numberOfLikes += res.likes.count);

        this.data.averageOfGetLikes = Math.round(numberOfLikes / numberOfPublications);
      })
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchAverageOfGetComments() {
    dbg('Retrieving average of comments per publication');

    let numberOfPublications = 0;
    let numberOfComments = 0;

    return this.gram.get('/users/self/media/recent', {})
      .then(res => {
        numberOfPublications += res.length;
        res.forEach(res => numberOfComments += res.comments.count);

        this.data.averageOfGetComments = Math.round(numberOfComments / numberOfPublications);
      })
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchAverageTagsForPostPublication() {
    dbg('Retrieving average of tags used per publication');
    let numberOfPublications = 0;
    let numberOfTags = 0;

    return this.gram.get('/users/self/media/recent', {})
      .then(res => {
        numberOfPublications += res.length;
        res.forEach(res => numberOfTags += res.tags.length);

        this.data.averageOfTagsForPostPublication = Math.round(numberOfTags / numberOfPublications);
      })
      .catch(err => dbg(`Error: ${err.message}`));
  }
};
