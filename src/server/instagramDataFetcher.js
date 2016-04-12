// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
'use strict';

const events = require('events');
const bluebird = require('bluebird');
const dbg = require('debug')('anamorph:instagramDataFetcher');
const instagram = bluebird.promisifyAll(require('instagram-node').instagram());

module.exports = class InstagramDataFetcher {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.data = {
      name: '',
      posts: [],
    };

    instagram.useAsync({access_token: this.accessToken});
    //instagram.useAsync({client_id: '208f9dfdb4b44a228b4c7f95b56bc58e', client_secret: '00afe917a374431296dcc65bd645fccf'});
  }

  fetch() {
    const data = {};
    return this.fetchTest()
      .then(() => this.data)
      .catch(err => dbg(`Error: ${err.message}`));
  }

  fetchTest(){
    return instagram.user_searchAsync('username').then(() => {

        this.data.test = "zzz";
        console.log(arguments);
      dbg("eee");
    }).catch(function(e) {
      console.error(e);
    });

  }

};
