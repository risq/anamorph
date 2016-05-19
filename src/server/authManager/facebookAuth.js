'use strict';

const Bluebird = require('bluebird');
const fbgraph = require('fbgraph');

const FacebookDataFetcher = require('../facebookDataFetcher');

const dbg = require('debug')('anamorph:authManager:facebookAuth');

module.exports = class FacebookAuth {
  constructor(clientId) {
    this.clientId = clientId;
  }

  getAuthData() {
    dbg('Getting facebook auth data');

    if (this.authData) {
      return Bluebird.resolve(this.authData);
    }

    return this.initializeAuth();
  }

  initializeAuth() {
    dbg(`Initializing facebook auth for client ${this.clientId}`);

    this.conf = {
      client_id:      '1674025106190653',
      client_secret:  'ae2b4058f9322103af2d9f2500821c46',
      scope:          'public_profile,email,user_about_me,user_actions.music,user_birthday,user_friends,user_education_history,user_hometown,user_location,user_photos,user_posts,user_religion_politics,user_tagged_places,user_work_history',
      redirect_uri:   `http://www.localhost:3000/facebook?clientId=${this.clientId}`,
    };

    var authUrl = fbgraph.getOauthUrl({
      "client_id":     this.conf.client_id,
      "redirect_uri":  this.conf.redirect_uri,
    });


    this.authData = {
      authUrl: authUrl,
    };

    return this.authData;

  }

  getDataFetcher(code, state) {
    dbg('Getting access token');

    return this.getAuthData()
        .then(() => new Bluebird((resolve, reject) => {
          fbgraph.authorize({
                "client_id":      this.conf.client_id
                , "redirect_uri":   this.conf.redirect_uri
                , "client_secret":  this.conf.client_secret
                , "code":           code
              },
              (err, results) => {
                if (err) {
                  dbg('error: ', err);
                  reject(err);
                }
                else{
                  dbg('success');
                  resolve(new FacebookDataFetcher(results.access_token));
                }
              });
        }));
  }
};
