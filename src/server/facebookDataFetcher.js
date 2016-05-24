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
      postsFrequency: [],
      nbOfFriends: 0,
      nbOfPhotos: 0,
      nbOfPagesLiked: 0,
      shares: [],
      nbOfShares: 0,
      locationName: null,
      locationLatitude: null,
      locationLongitude: null,
      employer: null,
      school: null,
      albums: [],
      nbOfAlbums: 0,
      lastMoviesSeen: [],
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
    this.datePosts = [];
  }

  fetch() {
    return this.fetchName()
      .then(() => this.fetchAge())
      .then(() => this.fetchFeed())
      .then(() => this.fetchNumberOfFriends())
      .then(() => this.fetchNumberOfPhotos())
      .then(() => this.fetchNumberOfPagesLiked())
      .then(() => this.fetchNumberOfShares())
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

    return this.get(url || '/me/feed?fields=from,message,story,created_time', {
      limit: 100,
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
        }));

        dbg('Fetching user feed');
        dbg(`Found ${this.data.nbOfPosts} posts`);
        dbg(`Active user since ${this.data.activeUserSince} years`);
        dbg(`Nb of other users post on feed: ${this.data.nbOfOtherUsersPostOnFeed}`);
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
        this.data.postsFrequency['A-2016']= ((this.datePosts['A-2016'] /day)*30).toFixed(3); //*30 = per month
        this.data.postsFrequency['A-2015']= ((this.datePosts['A-2015'] /365)*30).toFixed(3);

        dbg('Frequency');
        dbg(this.data.postsFrequency);
      }

      return Bluebird.resolve(this.data);
    });
  }

  fetchNumberOfFriends() {
    dbg('Fetching number of friends');

    return this.get('me/friends')
        .then(res => {
          this.data.nbOfFriends = res.summary.total_count;
          dbg(`Found ${this.data.nbOfFriends} friends`);

          return Bluebird.resolve(true);
    });
  }

  fetchNumberOfPhotos(url) {
    dbg('Fetching number of photos where the user is identified');

    return this.get(url || '/me?fields=photos', {
      limit: 10000,
    }).then(res => {
      if (res.paging && res.paging.next) {
        return this.fetchNumberOfPhotos(res.paging.next);
      }

      if(res.photos){
        this.data.nbOfPhotos = res.photos.data.length;
      }

      dbg(`Found ${this.data.nbOfPhotos} photos`);

      return Bluebird.resolve(this.data);
    });
  }

  fetchNumberOfPagesLiked(url) {
    dbg('Fetching number of pages liked by user');

    return this.get(url || '/me/?fields=likes', {
      limit: 10000,
    }).then(res => {
      if (res.paging && res.paging.next) {
        return this.fetchNumberOfPagesLiked(res.paging.next);
      }

      //res only returns { id: 'xxxxxxxxxxxxxxxxx' } ?Q
      if (res.likes) {
        this.data.nbOfPagesLiked = res.likes.data.length;
      }

      dbg(`Found ${this.data.nbOfPagesLiked} pages liked`);

      return Bluebird.resolve(this.data);
    });
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

    return this.get('me?fields=location').then(res => {

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

    return this.get('me?fields=work').then(res => {

      this.data.employer = res.work ? res.work[0].employer.name : null;

      dbg(`Most recent employer :  ${this.data.employer}`);

      return Bluebird.resolve(this.data);
    });
  }

  fetchEducation() {
    dbg('Fetching education');

    return this.get('me?fields=education').then(res => {

      this.data.school = res.education ? res.education[res.education.length - 1].school.name : null;
      
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
        this.data.nbOfAlbums = this.data.albums.length;
        dbg(`Found ${this.data.nbOfAlbums} albums`);
      }

      return Bluebird.resolve(true);
    });
  }

/*  fetchLastMoviesSeen() { video.watches doesn't work, why?

    return this.get('/me/video.watches').then(res => {
      dbg('Fetching last movies seen');

      for(var i=0;i<3;i++){
        this.data.lastMoviesSeen.push(res.data[i].data.movie.title);
      }

      dbg(`Found ${this.data.nbOfAlbums} albums`);

      return Bluebird.resolve(true);
    });
  }*/

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

    return this.get(url || '/me?fields=feed{likes,message,picture}', {
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
