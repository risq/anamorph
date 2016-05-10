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
      posts: [],
      albums: [],
      nbOfComments: 0,
    };
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
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchName() {
    dbg('Fetching user name');

    return this.get('/me').then(res => {
      this.data.name = res.name;
      dbg(`Found name: ${this.data.name}`);

      return Bluebird.resolve(true); // TODO
    });
  }

  fetchAge() {
    dbg('Fetching user Age');

    return this.get('/me?fields=age_range').then(res => {
      this.data.age_min = res.age_range.min;
      dbg(`Found age: ${this.data.age_min}`);

      return Bluebird.resolve(true); // TODO
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
        dbg('Fetching user feed');
        dbg(`Found ${this.data.posts.length} posts`);
      }

      return Bluebird.resolve(true); // TODO
    });
  }

  fetchNumberOfFriends() {
    dbg('Fetching number of friends');

    return this.get('me/friends').then(res => {
      this.data.numberOfFriends = res.summary.total_count;
      dbg(`Found ${this.data.numberOfFriends} friends`);
    });
  }

  fetchNumberOfPhotos(url) {
    dbg('Fetching number of photos where the user is identified');

    return this.get(url || '/me?fields=photos', {
      limit: 0,
    }).then(res => {
      if (res.paging && res.paging.next) {
        return this.fetchFeed(res.paging.next);
      }

      this.data.numberOfPhotos = res.photos.data.length;
      dbg(`Found ${this.data.numberOfPhotos} photos`);

      return Bluebird.resolve(true); // TODO
    });
  }

  fetchNumberOfPagesLiked(url) {
    dbg('Fetching number of pages liked by user');

    return this.get(url || '/me/?fields=likes', {
      limit: 0,
    }).then(res => {
      if (res.paging && res.paging.next) {
        return this.fetchFeed(res.paging.next);
      }

      //res only returns { id: 'xxxxxxxxxxxxxxxxx' } ?Q

       this.data.numberOfPagesLiked = res.likes.data.length;
       dbg(`Found ${this.data.numberOfPagesLiked} pages liked`);

      return Bluebird.resolve(true); // TODO
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
      });

      return Bluebird.resolve(true); // TODO
    });
  }

  fetchWork() {
    dbg('Fetching work');

    return this.get('me?fields=work').then(res => {
      this.data.employer = res.work[0].employer.name; //[0] for most recent
      dbg(`Most recent employer :  ${this.data.employer}`);

      return Bluebird.resolve(true); // TODO
    });
  }

  fetchEducation() {
    dbg('Fetching education');

    return this.get('me?fields=education').then(res => {
      this.data.school = res.education[res.education.length - 1].school.name; //for most recent
      dbg(`Most recent school :  ${this.data.school}`);

      return Bluebird.resolve(true); // TODO
    });
  }

  fetchNumberOfAlbums(url) {

    return this.get(url || '/me?fields=albums', {
      limit: 100,
    }).then(res => {
      this.data.albums.push(...res.albums.data);

      if (res.paging && res.paging.next) {
        return this.fetchFeed(res.paging.next);
      }
      else{
        dbg('Fetching number of albums');
        dbg(`Found ${this.data.albums.length} albums`);
      }

      return Bluebird.resolve(true); // TODO
    });
  }

  fetchNumberOfCommentOnUserPosts(url) {

    return this.get(url || '/me?fields=feed{comments}', {
      limit: 100,
    }).then(res => {

      if (res.paging && res.paging.next) {
        return this.fetchFeed(res.paging.next);
      }
      else{
        dbg('Fetching number of comments on user\'s posts');

        res.feed.data.forEach((data => {
          if(typeof(data.comments) != 'undefined'){
            this.data.nbOfComments+= data.comments.data.length;
          }
        }));
        dbg(`Found: ${this.data.nbOfComments} comments`);
      }

      return Bluebird.resolve(true); // TODO
    });
  }

  get(url, parameters) {
    parameters = parameters || {};
    Object.assign(parameters, { access_token: this.accessToken });
    return getFb(url, parameters);
  }
};
