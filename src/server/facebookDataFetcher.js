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
      userId: 0,
      age_min: 0,
      posts: [],
      nbOfPosts: 0,
      activeUserSince: 0,
      nbOfOtherUsersPostOnFeed: 0,
      pejorativeWords: [],
      meliorativeWords: [],
      smiley: [],
      frequency: [],
      nbOfFriends: 0,
      nbOfPhotos: 0,
      nbOfPhotosWhereUserIsIdentified: 0,
      nbOfPagesLiked: 0,
      pagesCategoryLiked: [],
      shares: [],
      nbOfShares: 0,
      locationName: null,
      locationLatitude: null,
      locationLongitude: null,
      employer: null,
      school: null,
      albums: [],
      nbOfAlbums: 0,
      nbOfMoviesLiked: 0,
      lastMoviesSeen: [],
      nbOfBooksLiked: 0,
      nbOfArtistsLiked: 0,
      favoriteArtists: [],
      nbOfComments: 0,
      averageCommentOnPost: 0,
      nbOfLike: 0,
      lessPopularPost: '',
      mostPopularPost: '',
      lessPopularPhoto: '',
      mostPopularPhoto: '',
      averageLikeOnPost: 0,
    };
    this.tempDatePosts = [];
    this.datePosts = {};
    this.pagesCategoryList = [];
    this.pagesCategoryTemp = [];
    this.nbOfPhotosTemp = [];

    this.pejorativeWordsList = ['horrible', 'nul', 'ringard', 'bof', 'con', 'débile', 'merde'];
    this.meliorativeWordsList = ['cool', 'super', 'chanmé', 'génial', 'magnifique', 'beau', 'content', 'gentil'];
  }

  fetch() {
    return this.fetchName()
      .then(() => this.fetchAge())
      .then(() => this.fetchFeed())
      .then(() => this.fetchNumberOfFriends())
      .then(() => this.fetchNumberOfPhotos())
      .then(() => this.fetchNumberOfPhotosWhereUserIsIdentified())
      .then(() => this.fetchNumberOfPagesLiked())
      .then(() => this.fetchNumberOfShares())
      .then(() => this.fetchLocation())
      .then(() => this.fetchWork())
      .then(() => this.fetchEducation())
      .then(() => this.fetchNumberOfAlbums())
      .then(() => this.fetchLastMoviesSeen())
      .then(() => this.fetchBooks())
      .then(() => this.fetchFavoriteArtists())
      .then(() => this.fetchNumberOfCommentOnUserPosts())
      .then(() => this.fetchNumberOfLikeOnUserPosts())
      .then(() => this.fetchPostsFrequency())
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchName() {
    dbg('Fetching user name and id');

    return this.get('/me').then(res => {
      this.data.name = res.name;
      this.data.userId = res.id.toString();
      dbg(`Found name: ${this.data.name}`);
      dbg(`Found id: ${this.data.userId}`);

      return Bluebird.resolve(this.data);
    });
  }

  fetchAge() {
    dbg('Fetching user Age');

    return this.get('/me?fields=age_range').then(res => {
      this.data.age_min = res.age_range.min;
      dbg(`Found age: ${this.data.age_min}`);

      return Bluebird.resolve(this.data);
    });
  }

  fetchFeed(url) {
    let sentences = [];
    return this.get(url || '/me/feed?fields=from,message,story,created_time', {
      limit: 10000,
    }).then(res => {
      this.data.posts.push(...res.data);

      if (res.paging && res.paging.next) {
        return this.fetchFeed(res.paging.next);
      }
      else{

        var date = new Date(this.data.posts[this.data.posts.length-2].created_time);
        //this.data.activeUserSince = date.getDate()+'-'+(date.getMonth()+1)+'-'+date.getFullYear();

        var now = new Date();
        this.data.activeUserSince = now.getFullYear() - date.getFullYear();

        this.data.nbOfPosts = this.data.posts.length;

        this.data.posts.forEach((data => {
          if(data.from.id != this.data.userId){
            this.data.nbOfOtherUsersPostOnFeed+= 1;
          }
           sentences.push(data.message);
        }));

        //Get pejorative and meliorative words in sentence
        this.joinSentences = sentences.join(' ');
        this.data.pejorativeWords = this.getWordsFrequencyInContent(this.pejorativeWordsList, this.joinSentences);
        this.data.meliorativeWords = this.getWordsFrequencyInContent(this.meliorativeWordsList, this.joinSentences);
        this.data.smiley = this.getSmileyFrequencyInContent(this.joinSentences);


        dbg('Fetching user feed');
        dbg(`Found ${this.data.nbOfPosts} posts`);
        dbg(`Active user since ${this.data.activeUserSince} years`);
        dbg(`Nb of other users post on feed: ${this.data.nbOfOtherUsersPostOnFeed}`);

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

      }

      return Bluebird.resolve(this.data);
    });
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


  fetchPostsFrequency(url) {

    return this.get(url || '/me/feed', {
      limit: 10000,
    }).then(res => {

      this.tempDatePosts.push(...res.data);

      if (res.paging && res.paging.next) {
        return this.fetchPostsFrequency(res.paging.next);
      }
      else{
        dbg('Fetching posts frequency');

        this.tempDatePosts.forEach((data => {
          var year = 'y'+data.created_time.substr(0, 4).toString();

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
      }

      return Bluebird.resolve(this.data);
    });
  }

  fetchNumberOfFriends() {
    dbg('Fetching number of friends');

    return this.get('me/friends', {limit: 10000})
        .then(res => {
          this.data.nbOfFriends = res.summary.total_count;
          dbg(`Found ${this.data.nbOfFriends} friends`);

          return Bluebird.resolve(true);
    });
  }

  fetchNumberOfPhotos(url) {
    dbg('Fetching number of photos user posts');

    return this.get(url || '/me?fields=albums{photos}', {
      limit: 10000,
    }).then(res => {

      this.nbOfPhotosTemp.push(...res.albums.data);

      if (res.paging && res.paging.next) {
        return this.fetchNumberOfPhotos(res.paging.next);
      }

      this.nbOfPhotosTemp.forEach((result => {
          this.data.nbOfPhotos+= result.photos.data.length;
      }));

      dbg(`Found ${this.data.nbOfPhotos} photos user posts`);

      return Bluebird.resolve(this.data);
    });
  }

  fetchNumberOfPhotosWhereUserIsIdentified(url) {
    dbg('Fetching number of photos where the user is identified');

    return this.get(url || '/me?fields=photos', {
      limit: 10000,
    }).then(res => {
      if (res.paging && res.paging.next) {
        return this.fetchNumberOfPhotosWhereUserIsIdentified(res.paging.next);
      }

      if(res.photos){
        this.data.nbOfPhotosWhereUserIsIdentified = res.photos.data.length;
      }

      dbg(`Found ${this.data.nbOfPhotosWhereUserIsIdentified} photos where user is identified`);

      return Bluebird.resolve(this.data);
    });
  }

  fetchNumberOfPagesLiked(url) {
    dbg('Fetching number of pages liked by user');

    return this.get(url || '/me/?fields=likes{name,created_time,category}', {
      limit: 10000,
    }).then(res => {

      this.pagesCategoryTemp.push(...res.likes.data);

      if (res.paging && res.paging.next) {
        return this.fetchNumberOfPagesLiked(res.paging.next);
      }

      //res only returns { id: 'xxxxxxxxxxxxxxxxx' } ?Q
      if (res.likes) {
        this.data.nbOfPagesLiked = res.likes.data.length;
      }

      this.pagesCategoryTemp.forEach((result => {
        this.pagesCategoryList.push(result.category);
      }));

      //Get the most used hashtags
      var wordAssociation = this.getWordFrequency(this.pagesCategoryList);
      for(var i=0; i<wordAssociation.length; i++){
        this.data.pagesCategoryLiked.push(wordAssociation[i]);
      }
      dbg('Pages Category liked:');
      dbg(this.data.pagesCategoryLiked);

      dbg(`Found ${this.data.nbOfPagesLiked} pages liked`);

      return Bluebird.resolve(this.data);
    });
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

  fetchNumberOfShares(url) {
    dbg('Fetching number of shares by user');

    return this.get(url || '/me/feed/?fields=status_type', {
      limit: 10000,
    }).then(res => {

      this.data.shares.push(...res.data);

      if (res.paging && res.paging.next) {
        return this.fetchNumberOfShares(res.paging.next);
      }

      this.data.shares.forEach((data => {
        if(typeof(data.status_type) != 'undefined' && data.status_type == 'shared_story'){
          this.data.nbOfShares+= 1;
        }
      }));

      dbg(`Found ${this.data.nbOfShares} shares`);

      return Bluebird.resolve(this.data);
    });
  }

  fetchLocation() {
    dbg('Fetching location');

    return this.get('me?fields=location', {limit: 10000}).then(res => {

      if(res.location){
        this.data.locationName = res.location.name;
        dbg(`Location :  ${this.data.locationName}`);

        this.get(`${res.location.id}?fields=location`).then(res => {
          this.data.locationLatitude = res.location.latitude;
          this.data.locationLongitude = res.location.longitude;
          dbg(`Latitude : ${this.data.locationLatitude}`);
          dbg(`Longitude : ${this.data.locationLatitude}`);

          return Bluebird.resolve(true);
        });
      }
      else{
        this.data.locationName = null;
        this.data.locationLatitude = null;
        this.data.locationLongitude = null;

        return Bluebird.resolve(true);
      }
    });
  }

  fetchWork() {
    dbg('Fetching work');

    return this.get('me?fields=work', {limit: 10000}).then(res => {

      this.data.employer = res.work ? res.work[0].employer.name : null;

      dbg(`Most recent employer :  ${this.data.employer}`);

      return Bluebird.resolve(this.data);
    });
  }

  fetchEducation() {
    dbg('Fetching education');

    return this.get('me?fields=education', {limit: 10000}).then(res => {

      this.data.school = res.education ? res.education[res.education.length - 1].school.name : null;
      
      dbg(`Most recent school :  ${this.data.school}`);

      return Bluebird.resolve(this.data);
    });
  }

  fetchNumberOfAlbums(url) {

    return this.get(url || '/me?fields=albums', {
      limit: 10000,
    }).then(res => {
      this.data.albums.push(...res.albums.data);

      if (res.paging && res.paging.next) {
        return this.fetchNumberOfAlbums(res.paging.next);
      }
      else{
        dbg('Fetching number of albums');
        this.data.nbOfAlbums = this.data.albums.length;
        dbg(`Found ${this.data.nbOfAlbums} albums`);
      }

      return Bluebird.resolve(true);
    });
  }

  fetchLastMoviesSeen() { //video.watches doesn't work, why?

    return this.get('/me/video.watches', {limit: 10000}).then(res => {
      dbg('Fetching last movies seen');

      for(var i=0;i<3;i++){
        if(res.data[i]){
          if(res.data[i].data.movie){
            this.data.lastMoviesSeen.push(res.data[i].data.movie.title);
          }
        }
      }

      this.data.nbOfMoviesLiked = res.data.length;

      dbg(`Number of movies liked: ${this.data.nbOfMoviesLiked}`);
      dbg(`Last movies seen: ${this.data.lastMoviesSeen}`);

      return Bluebird.resolve(true);
    });
  }

  fetchBooks() {

    return this.get('/me/books', {limit: 10000}).then(res => {
      dbg('Fetching books');

      this.data.nbOfBooksLiked = res.data.length;

      dbg(`Number of books liked: ${this.data.nbOfBooksLiked}`);

      return Bluebird.resolve(true);
    });
  }

  fetchFavoriteArtists() {

    return this.get('/me/music', {limit: 10000}).then(res => {
      dbg('Fetching favorite artists');

      for(var i=0;i<3;i++){
        if(res.data[i]){
          this.data.favoriteArtists.push(res.data[i].name);
        }
      }

      this.data.nbOfArtistsLiked = res.data.length;

      dbg(`Number of artists liked: ${this.data.nbOfArtistsLiked}`);
      dbg(`Favorite artists: ${this.data.favoriteArtists}`);

      return Bluebird.resolve(true);
    });
  }

  fetchNumberOfCommentOnUserPosts(url) {

    return this.get(url || '/me?fields=feed{comments}', {
      limit: 10000,
    }).then(res => {

      if (res.paging && res.paging.next) {
        return this.fetchNumberOfCommentOnUserPosts(res.paging.next);
      }
      else{
        dbg('Fetching number of comments on user\'s posts');

        res.feed.data.forEach((data => {
          if(typeof(data.comments) != 'undefined'){
            this.data.nbOfComments+= data.comments.data.length;
          }
        }));
        this.data.averageCommentOnPost = (this.data.nbOfComments/res.feed.data.length).toFixed(2);

        dbg(`Found: ${this.data.nbOfComments} comments`);
        dbg(`Average comment per post: ${this.data.averageCommentOnPost}`);
      }

      return Bluebird.resolve(this.data);
    });
  }

  fetchNumberOfLikeOnUserPosts(url) {

    return this.get(url || '/me?fields=feed{likes,message,picture}', {
      limit: 10000,
    }).then(res => {

      if (res.paging && res.paging.next) {
        return this.fetchNumberOfCommentOnUserPosts(res.paging.next);
      }
      else{
        dbg('Fetching number of likes on user\'s posts');

        res.feed.data.forEach((data => {
          if(typeof(data.likes) != 'undefined'){
            this.data.nbOfLike+= data.likes.data.length;


            //GET MOST POPULAR POST AND PHOTO
            if(data.likes.data.length > this.mostLikedPost && data.message){
              this.data.mostPopularPost = data.message;
              this.mostLikedPost = data.likes.data.length;

              if(data.picture){
                this.data.mostPopularPhoto = data.picture;
              }
            }
            else if(this.data.mostPopularPost == '' && data.message){
              this.data.mostPopularPost = data.message;
              this.mostLikedPost = data.likes.data.length;

              if(data.picture){
                this.data.mostPopularPhoto = data.picture;
              }
            }

            //GET LESS POPULAR POST AND PHOTO
            if(data.likes.data.length < this.lessLikedPost && data.message){
              this.data.lessPopularPost = data.message;
              this.lessLikedPost = data.likes.data.length;

              if(data.picture){
                this.data.lessPopularPhoto = data.picture;
              }
            }
            else if(this.data.lessPopularPost == '' && data.message){
              this.data.lessPopularPost = data.message;
              this.lessLikedPost = data.likes.data.length;

              if(data.picture){
                this.data.lessPopularPhoto = data.picture;
              }
            }

          }
        }));
        this.data.averageLikeOnPost = (this.data.nbOfLike/res.feed.data.length).toFixed(2);

        dbg(`Found: ${this.data.nbOfLike} likes`);
        dbg(`Average like per post: ${this.data.averageLikeOnPost}`);
        dbg(`Less popular post: ${this.data.lessPopularPost}`);
        dbg(`Most popular post: ${this.data.mostPopularPost}`);
        dbg(`Less popular photo: ${this.data.lessPopularPhoto}`);
        dbg(`Most popular photo: ${this.data.mostPopularPhoto}`);
      }

      return Bluebird.resolve(this.data);
    });
  }

  get(url, parameters) {
    parameters = parameters || {};
    Object.assign(parameters, { access_token: this.accessToken });
    return getFb(url, parameters);
  }
};
