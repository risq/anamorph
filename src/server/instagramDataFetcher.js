'use strict';

const Bluebird = require('bluebird');
const Nodegram = require('nodegram');

const dbg = require('debug')('anamorph:instagramDataFetcher');

module.exports = class InstagramDataFetcher {
  constructor(tokens) {
    this.tokens = tokens;

    this.data = {
      pseudo: '',
      nbOfPosts: '',
      numberOfUserPhotos: '',
      numberOfUserFollowers: [],
      numberOfUserFollows: [],
      mostPopularPhoto: '',
      nbOfLikes: 0,
      nbOfComments: 0,
      averageOfGetLikes: [],
      averageOfGetComments: [],
      averageOfTagsForPostPublication: [],
      pejorativeWords: [],
      meliorativeWords: [],
      smiley: [],
      frequency: [],
      mostUsedHashtags: [],
    };
    this.datePosts = [];

    this.pejorativeWordsList = ['horrible', 'nul', 'ringard', 'bof', 'con', 'débile', 'merde'];
    this.meliorativeWordsList = ['cool', 'super', 'chanmé', 'génial', 'magnifique', 'beau', 'content', 'gentil'];
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

          this.data.pseudo = res.username;

          if(res.counts.media){
            this.data.numberOfUserPhotos = res.counts.media;
            this.data.nbOfPosts = this.data.numberOfUserPhotos;
          }
          else{
            this.data.numberOfUserPhotos = 0;
            this.data.nbOfPosts = this.data.numberOfUserPhotos;
          }
          dbg(`Pseudo: ${this.data.pseudo}`);
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

          this.data.nbOfComments = numberOfComments;
        this.data.averageOfGetComments = Math.round(numberOfComments / numberOfPublications);
          dbg(`Average of comments: ${this.data.averageOfGetComments}`);
      })
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchAverageTagsForPostPublication() {
    dbg('Retrieving average of tags used per publication');
    let numberOfPublications = 0;
    let numberOfTags = 0;
    let wordList = [];
    let sentences = [];

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

            sentences.push(res.caption.text);
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


          //Get pejorative and meliorative words in sentence
          this.joinSentences = sentences.join(' ').toLowerCase();
          this.data.pejorativeWords = this.getWordsFrequencyInContent(this.pejorativeWordsList, this.joinSentences);
          this.data.meliorativeWords = this.getWordsFrequencyInContent(this.meliorativeWordsList, this.joinSentences);
          this.data.smiley = this.getSmileyFrequencyInContent(this.joinSentences);

          dbg(`Pejorative words used`);
          if(this.data.pejorativeWords){
            this.data.pejorativeWords.forEach((data => {
              dbg(data);
            }));
          }
          dbg(`Meliorative words used`);
          if(this.data.meliorativeWords){
            this.data.meliorativeWords.forEach((data => {
              dbg(data);
            }));
          }

          dbg(`Smiley used`);
          dbg(this.data.smiley);

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

  getWordsFrequencyInContent(wordsToFind, content){
    //const wordsToFind = ['mot1', 'mot2', 'mot3'];
    wordsToFind = wordsToFind.map(word => `\\b(${word})\\b`);
    const re = new RegExp(wordsToFind.join('|'), 'gi');
    const str = content;

    if(str.match(re)){
      const res = str.match(re).reduce((result, word) => {
        if (!result[word]) {
          result[word] = 0;
        }
        result[word]++;
        return result;
      }, {});

      const sortedRes = Object.keys(res).map(word => {
        return {
          word,
          occ: res[word]
        };
      }).sort((a, b) => a.occ < b.occ);

      return sortedRes;
    }
  }

  getSmileyFrequencyInContent(content){
    let smileyToFind = ['=D', ':D', ":\\)", ':\\(', '^^', '\\s:\\/'];
    smileyToFind = smileyToFind.map(smiley => `(${smiley})`);
    const re = new RegExp(smileyToFind.join('|'), 'gi');
    const str = content;

    if(str.match(re)){
      const res = str.match(re).reduce((result, smiley) => {
        if (!result[smiley]) {
          result[smiley] = 0;
        }
        result[smiley]++;
        return result;
      }, {});

      const sortedRes = Object.keys(res).map(smiley => {
        return {
          smiley,
          occ: res[smiley]
        };
      }).sort((a, b) => a.occ < b.occ);

      return sortedRes;
    }
  }

  fetchPostsFrequency() {
    dbg('Retrieving posts frequency');

    return this.gram.get('/users/self/media/recent', {})
        .then(res => {

          res.forEach((data => {
            var date = new Date(data.created_time*1000);
            var year = 'y'+date.getFullYear();

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

          this.data.frequency = Object.keys(this.datePosts).reduce((sum, value) => {
            if(value == 'y2016'){
              sum = sum + ((this.datePosts[value] /day)*30); //Get only the days past in the actual year
            }
            else{
              sum = sum + ((this.datePosts[value] /365)*30);
            }
            return sum;
          }, 0);

          dbg('Frequency');
          dbg(this.data.frequency);

        })
        .catch(err => dbg(`Error: ${err.message}`));
  }
};
