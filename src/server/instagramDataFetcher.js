'use strict';

const Bluebird = require('bluebird');
const Nodegram = require('nodegram');

const dbg = require('debug')('anamorph:instagramDataFetcher');

module.exports = class InstagramDataFetcher {
  constructor(tokens) {
    this.tokens = tokens;

    this.data = {
      nbOfPosts: '',
      numberOfUserPhotos: '',
      numberOfUserFollowers: [],
      numberOfUserFollows: [],
      mostPopularPhoto: '',
      nbOfLikes: 0,
      averageOfGetLikes: [],
      averageOfGetComments: [],
      averageOfTagsForPostPublication: [],
      frequency: [],
      mostUsedHashtags: [],
    };
    this.datePosts = [];
  }

  fetch() {
    dbg('Fetching instagram data');

    this.gram = new Nodegram({ accessToken: this.tokens.accessToken });

    this.gram.getAuthUrl();
    return this.fetchNumberOfUserPhotos()
      .then(() => this.fetchNumberOfUserFollowers())
      .then(() => this.fetchNumberOfUserFollows())
      .then(() => this.fetchAverageOfGetLikes())
      .then(() => this.fetchAverageOfGetComments())
      .then(() => this.fetchAverageTagsForPostPublication())
      .then(() => this.fetchPostsFrequency())
      .then(() => this.data)
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchNumberOfUserPhotos() {
    dbg('Retrieving number of publications');

    return this.gram.get('/users/self/', {})
      .then(res => {
          if(res.counts.media){
            this.data.numberOfUserPhotos = res.counts.media;
            this.data.nbOfPosts = this.data.numberOfUserPhotos;
          }
          else{
            this.data.numberOfUserPhotos = 0;
            this.data.nbOfPosts = this.data.numberOfUserPhotos;
          }
          dbg(`Number of user publications: ${this.data.numberOfUserPhotos}`);
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
          res.forEach(res => {
            numberOfLikes += res.likes.count;

            //GET MOST POPULAR PHOTO
            if(res.likes.counts > this.mostLikedPhoto && res.images.standard_resolution.url){
              this.data.mostPopularPhoto = res.images.standard_resolution.url;
              this.mostLikedPhoto = res.likes.count;
            }
            else if(this.data.mostPopularPhoto == '' && res.images.standard_resolution.url){
              this.data.mostPopularPhoto = res.images.standard_resolution.url;
              this.mostLikedPhoto = res.likes.count;
            }
          });

          this.data.nbOfLikes = numberOfLikes;
          this.data.averageOfGetLikes = Math.round(numberOfLikes / numberOfPublications);
          dbg(`Average of likes: ${this.data.averageOfGetLikes}`);
          dbg(`Most popular photo: ${this.data.mostPopularPhoto}`);
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
    var wordList = [];

    return this.gram.get('/users/self/media/recent', {})
      .then(res => {
          numberOfPublications += res.length;
          res.forEach((res => {

            if(res.tags){
              numberOfTags += res.tags.length;

              res.tags.forEach((result => {
                wordList.push(result);
              }));
            }
            else{
              numberOfTags = 0;
            }
          }));

          this.data.averageOfTagsForPostPublication = Math.round(numberOfTags / numberOfPublications);
          dbg(`Average of tags for post publication: ${this.data.averageOfTagsForPostPublication}`);


          //Get the most used hashtags
          var wordAssociation = this.getWordFrequency(wordList);
          for(var i=0; i<3; i++){
            this.data.mostUsedHashtags.push(wordAssociation[i]);
          }
          dbg('Most used hashtags:');
          dbg(this.data.mostUsedHashtags);

        })
      .catch(err => dbg(`Error: ${err.message}`));
  }

  //Get word frequency for used hashtags and sort them in array (bigger to smaller)
  getWordFrequency(wordList){
    var a = [], b = [], prev;

    wordList.sort();
    for ( var i = 0; i < wordList.length; i++ ) {
      if ( wordList[i] !== prev ) {
        a.push(wordList[i]);
        b.push(1);
      } else {
        b[b.length-1]++;
      }
      prev = wordList[i];
    }

    //Associate the words with their occurrence
    var associated = a.reduce(function (previous, key, index) {
      previous[key] = b[index];
      return previous
    }, {});

    //Sort and reverse the associated array
    var tupleArray = [];
    for (var key in associated) tupleArray.push([key, associated[key]]);
    tupleArray.sort(function (a, b) { return a[1] - b[1] }).reverse();

    return tupleArray;
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
