// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
'use strict';

const Bluebird = require('bluebird');
const fbgraph = require('fbgraph');
const dbg = require('debug')('anamorph:facebookDataFetcher');

module.exports = class FacebookDataFetcher {
  constructor(accessToken) {
    this.accessToken = accessToken;

    fbgraph.setAccessToken(accessToken);
    this.getFb = Bluebird.promisify(fbgraph.get);
    this.data = {
      name: '',
      posts: [],
      albums: [],
      nbOfComments: 0,
      nbOfLike: 0,
      frequency: [],
    };
    this.tempDatePosts = [];
    this.datePosts = [];
  }

  fetch() {
    return this.fetchName()
      .then(() => this.fetchAge())
      .then(() => this.fetchFeed())
      .then(() => this.fetchNumberOfFriends())
      .then(() => this.fetchNumberOfPhotos())
      .then(() => this.fetchNumberOfPagesLiked())
      .then(() => this.fetchLocation())
      .then(() => this.fetchWork())
      .then(() => this.fetchEducation())
      .then(() => this.fetchNumberOfAlbums())
      .then(() => this.fetchNumberOfCommentOnUserPosts())
      .then(() => this.fetchNumberOfLikeOnUserPosts())
      .then(() => this.fetchPostsFrequency())
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchName() {
    dbg('Fetching user name');

    return this.get('/me').then(res => {
      this.data.name = res.name;
      dbg(`Found name: ${this.data.name}`);

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

    return this.get(url || '/me/feed', {
      limit: 100,
    }).then(res => {
      this.data.posts.push(...res.data);

      if (res.paging && res.paging.next) {
        return this.fetchFeed(res.paging.next);
      }
      else{

        var date = new Date(this.data.posts[this.data.posts.length-2].created_time);
        this.data.activeUserSince = date.getDate()+'-'+(date.getMonth()+1)+'-'+date.getFullYear();

        dbg('Fetching user feed');
        dbg(`Found ${this.data.posts.length} posts`);
        dbg(`Active user since ${this.data.activeUserSince}`);
      }

      return Bluebird.resolve(this.data);
    });
  }

  fetchPostsFrequency(url) {

    return this.get(url || '/me/feed', {
      limit: 100,
    }).then(res => {

      this.tempDatePosts.push(...res.data);

      if (res.paging && res.paging.next) {
        return this.fetchPostsFrequency(res.paging.next);
      }
      else{
        dbg('Fetching posts frequency');

        this.tempDatePosts.forEach((data => {
          var year = 'A-'+data.created_time.substr(0, 4).toString();

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
      }

      return Bluebird.resolve(this.data);
    });
  }

  fetchNumberOfFriends() {
    dbg('Fetching number of friends');

    return this.get('me/friends')
        .then(res => {
          this.data.numberOfFriends = res.summary.total_count;
          dbg(`Found ${this.data.numberOfFriends} friends`);

          return Bluebird.resolve(true);
    });
  }

  fetchNumberOfPhotos(url) {
    dbg('Fetching number of photos where the user is identified');

    return this.get(url || '/me?fields=photos', {
      limit: 0,
    }).then(res => {
      if (res.paging && res.paging.next) {
        return this.fetchNumberOfPhotos(res.paging.next);
      }

      this.data.numberOfPhotos = res.photos.data.length;
      dbg(`Found ${this.data.numberOfPhotos} photos`);

      return Bluebird.resolve(this.data);
    });
  }

  fetchNumberOfPagesLiked(url) {
    dbg('Fetching number of pages liked by user');

    return this.get(url || '/me/?fields=likes', {
      limit: 0,
    }).then(res => {
      if (res.paging && res.paging.next) {
        return this.fetchNumberOfPagesLiked(res.paging.next);
      }

      //res only returns { id: 'xxxxxxxxxxxxxxxxx' } ?Q

       this.data.numberOfPagesLiked = res.likes.data.length;
       dbg(`Found ${this.data.numberOfPagesLiked} pages liked`);

      return Bluebird.resolve(this.data);
    });
  }

  fetchLocation() {
    dbg('Fetching location');

    return this.get('me?fields=location').then(res => {
      this.data.locationName = res.location.name;
      dbg(`Location :  ${this.data.locationName}`);

      this.get(`${res.location.id}?fields=location`).then(res => {
        this.data.locationLatitude = res.location.latitude;
        this.data.locationLongitude = res.location.longitude;
        dbg(`Latitude : ${this.data.locationLatitude}`);
        dbg(`Longitude : ${this.data.locationLatitude}`);

        return Bluebird.resolve(true);
      });
    });
  }

  fetchWork() {
    dbg('Fetching work');

    return this.get('me?fields=work').then(res => {
      this.data.employer = res.work[0].employer.name; //[0] for most recent
      dbg(`Most recent employer :  ${this.data.employer}`);

      return Bluebird.resolve(this.data);
    });
  }

  fetchEducation() {
    dbg('Fetching education');

    return this.get('me?fields=education').then(res => {
      this.data.school = res.education[res.education.length - 1].school.name; //for most recent
      dbg(`Most recent school :  ${this.data.school}`);

      return Bluebird.resolve(this.data);
    });
  }

  fetchNumberOfAlbums(url) {

    return this.get(url || '/me?fields=albums', {
      limit: 100,
    }).then(res => {
      this.data.albums.push(...res.albums.data);

      if (res.paging && res.paging.next) {
        return this.fetchNumberOfAlbums(res.paging.next);
      }
      else{
        dbg('Fetching number of albums');
        dbg(`Found ${this.data.albums.length} albums`);
      }

      return Bluebird.resolve(true);
    });
  }

  fetchNumberOfCommentOnUserPosts(url) {

    return this.get(url || '/me?fields=feed{comments}', {
      limit: 100,
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

    return this.get(url || '/me?fields=feed{likes}', {
      limit: 100,
    }).then(res => {

      if (res.paging && res.paging.next) {
        return this.fetchNumberOfCommentOnUserPosts(res.paging.next);
      }
      else{
        dbg('Fetching number of likes on user\'s posts');

        res.feed.data.forEach((data => {
          if(typeof(data.likes) != 'undefined'){
            this.data.nbOfLike+= data.likes.data.length;
          }
        }));
        this.data.averageLikeOnPost = (this.data.nbOfLike/res.feed.data.length).toFixed(2);

        dbg(`Found: ${this.data.nbOfLike} likes`);
        dbg(`Average like per post: ${this.data.averageLikeOnPost}`);
      }

      return Bluebird.resolve(this.data);
    });
  }

  get(url, parameters) {
    parameters = parameters || {};
    Object.assign(parameters, { access_token: this.accessToken });
    return this.getFb(url, parameters);
  }
};
