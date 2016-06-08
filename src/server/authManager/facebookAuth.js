'use strict';

const Bluebird = require('bluebird');
const fbgraph = require('fbgraph');

const FacebookDataFetcher = require('../facebookDataFetcher');
const config = require('../../../config/config');
const dbg = require('debug')('anamorph:authManager:facebookAuth');

module.exports = class FacebookAuth {
  constructor(clientId) {
    this.clientId = clientId;
    this.state = 'available';
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
      client_id:      config.api.facebook.key,
      client_secret:  config.api.facebook.secret,
      scope:          'public_profile,email,user_likes,user_about_me,user_actions.music,user_actions.video,user_actions.books,user_birthday,user_friends,user_education_history,user_hometown,user_location,user_photos,user_posts,user_religion_politics,user_tagged_places,user_work_history',
      redirect_uri:   `http://${config.server.domain}:${config.server.port}/facebook?clientId=${this.clientId}`,
    };

    var authUrl = fbgraph.getOauthUrl({
      "client_id":     this.conf.client_id,
      "redirect_uri":  this.conf.redirect_uri,
      "scope": this.conf.scope,
    });


    this.authData = {
      authUrl: authUrl,
    };

    return this.authData;

  }

  getDataFetcher(code, state) {
    dbg('Getting access token');

    this.state = 'working';

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
                  this.state = 'working';
                  resolve(new FacebookDataFetcher(results.access_token));
                }
              });
        }));
  }
};
