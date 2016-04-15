// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
'use strict';

const Bluebird = require('bluebird');
const Nodegram = require('nodegram');

const dbg = require('debug')('anamorph:instagramDataFetcher');
// const instagram = bluebird.promisifyAll(require('instagram-node').instagram());

module.exports = class InstagramDataFetcher {
  constructor(clientId, code) {
    this.clientId = clientId;
    this.code = code;

    this.data = {
      numberOfUserPublications: '',
      numberOfUserFollowers: [],
      numberOfUserFollows: [],
      averageOfGetLikes: [],
      averageOfGetComments: [],
      averageOfTagsForPostPublication: [],
    };
  }

  authenticate() {
    dbg('authenticate process');
    const nodegram = new Nodegram({
      clientId: '208f9dfdb4b44a228b4c7f95b56bc58e',
      clientSecret: '00afe917a374431296dcc65bd645fccf',
      redirectUri: `http://localhost:3000/insta?clientId=${this.clientId}`,
    });

    nodegram.getAuthUrl();

    return nodegram.getAccessToken(this.code)
      .then(res => res.access_token);
  }

  fetch() {
    dbg('fetch process');
    return this.authenticate()
      .then((accessToken) => {
        this.gram = new Nodegram({ accessToken });

        this.gram.getAuthUrl();
        return this.fetchNumberOfUserPublications()
          .then(() => this.fetchNumberOfUserFollowers())
          .then(() => this.fetchNumberOfUserFollows())
          .then(() => this.fetchAverageOfGetLikes())
          .then(() => this.fetchAverageOfGetComments())
          .then(() => this.fetchAverageTagsForPostPublication())
          .then(() => this.data)
          .catch(err => dbg(`Error: ${err.message}`));
      });
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
