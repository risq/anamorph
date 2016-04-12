// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
'use strict';

const events = require('events');
const bluebird = require('bluebird');
const Nodegram = require('nodegram');

const dbg = require('debug')('anamorph:instagramDataFetcher');
// const instagram = bluebird.promisifyAll(require('instagram-node').instagram());

module.exports = class InstagramDataFetcher {
  constructor(clientId, code) {
    this.gram = new Nodegram({
      clientId: '208f9dfdb4b44a228b4c7f95b56bc58e',
      clientSecret: '00afe917a374431296dcc65bd645fccf',
      redirectUri: `http://localhost:3000/insta?clientId=${clientId}`,
    });
    this.gram.getAuthUrl();
    this.gram.getAccessToken(code)
      .then(res => {
        dbg('getAccessToken', res);
      }).catch(err => dbg(err));

    this.data = {
      name: '',
      posts: [],
    };
  }

  authenticate(code) {
    this.gram.getAccessToken(code)
      .then(res => dbg(res));
  }

  fetch() {
    const data = {};
    // return this.fetchTest()
    //   .then(() => this.data)
    //   .catch(err => dbg(`Error: ${err.message}`));
    return bluebird.resolve(true);
  }

  fetchTest(){
    // return instagram.user_searchAsync('username').then(() => {
    //
    //     this.data.test = "zzz";
    //     console.log(arguments);
    //   dbg("eee");
    // }).catch(function(e) {
    //   console.error(e);
    // });

  }

};
