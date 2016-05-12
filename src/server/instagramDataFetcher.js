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
      frequency: [],
    };
    this.datePosts = [];
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
      .then(() => this.fetchPostsFrequency())
      .then(() => this.data)
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchNumberOfUserPublications() {
    dbg('Retrieving number of publications');

    return this.gram.get('/users/self/', {})
      .then(res => {
        this.data.numberOfUserPublications = res.counts.media;
          dbg(`Number of user publications: ${this.data.numberOfUserPublications}`);
      })
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchNumberOfUserFollowers() {
    dbg('Retrieving number of followers');

    return this.gram.get('/users/self/', {})
      .then(res => {
        this.data.numberOfUserFollowers = res.counts.followed_by;
          dbg(`Number of user followers: ${this.data.numberOfUserFollowers}`);
      })
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchNumberOfUserFollows() {
    dbg('Retrieving number of follows');

    return this.gram.get('/users/self/', {})
      .then(res => {
        this.data.numberOfUserFollows = res.counts.follows;
          dbg(`Number of user follows: ${this.data.numberOfUserFollows}`);
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
          dbg(`Average of likes: ${this.data.averageOfGetLikes}`);
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
          dbg(`Average of comments: ${this.data.averageOfGetComments}`);
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
          dbg(`Average of tags for post publication: ${this.data.averageOfTagsForPostPublication}`);
      })
      .catch(err => dbg(`Error: ${err.message}`));
  }


  fetchPostsFrequency() {
    dbg('Retrieving posts frequency');

    return this.gram.get('/users/self/media/recent', {})
        .then(res => {

          res.forEach((data => {
            var date = new Date(data.created_time*1000);
            var year = 'A-'+date.getFullYear();

            if(typeof(this.datePosts[year]) != 'undefined'){
              this.datePosts[year]+= 1;
            }else{
              this.datePosts[year] = 0;
              this.datePosts[year]+= 1;
            }
          }));

          //Calculate the number of day since the beginning of the current year
          var now = new Date();
          var start = new Date(now.getFullYear(), 0, 0);
          var diff = now - start;
          var oneDay = 1000 * 60 * 60 * 24;
          var day = Math.floor(diff / oneDay);

          //Todo -> improved this recuperation - iteration?
          this.data.frequency['A-2016']= (this.datePosts['A-2016'] /day).toFixed(3);
          this.data.frequency['A-2015']= (this.datePosts['A-2015'] /365).toFixed(3);

          dbg('Frequency');
          dbg(this.data.frequency);

        })
        .catch(err => dbg(`Error: ${err.message}`));
  }
};
