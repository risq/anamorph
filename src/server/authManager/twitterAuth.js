'use strict';

const Bluebird = require('bluebird');
const TwitterAPI = require('node-twitter-api');

const TwitterDataFetcher = require('../twitterDataFetcher');
const config = require('../../../config/config');

const dbg = require('debug')('anamorph:authManager:twitterAuth');

module.exports = class TwitterAuth {
  constructor(clientId) {
    this.clientId = clientId;
  }

  getAuthData() {
    dbg('Getting twitter auth data');

    if (this.authData) {
      return Bluebird.resolve(this.authData);
    }

    return this.initializeAuth();
  }

  initializeAuth() {
    dbg(`Initializing twitter auth for client ${this.clientId}`);

    this.api = new TwitterAPI({
      consumerKey: 'ZJPdAmxSjyCGU8dJYYbuleyfY',
      consumerSecret: 'NFhrW1LbpEPZ6dhexbLO8Z1JX4FBcQuohRwsDnMhQQy3DLHx27',
      callback: `http://${config.server.ip}:${config.server.port}/twitter?clientId=${this.clientId}`,
    });

    return this.getRequestToken()
      .then(res => {
        this.authData = {
          api: this.api,
          requestToken: res.requestToken,
          requestTokenSecret: res.requestTokenSecret,
          authUrl: this.api.getAuthUrl(res.requestToken),
        };

        return this.authData;
      });
  }

  getRequestToken() {
    dbg('Getting request token');

    return new Bluebird((resolve, reject) => {
      this.api.getRequestToken((err, requestToken, requestTokenSecret, results) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            requestToken,
            requestTokenSecret,
            results,
          });
        }
      });
    });
  }

  getDataFetcher(oauthToken) {
    dbg('Getting access token');

    return this.getAuthData()
      .then(authData => new Bluebird((resolve, reject) => {
        this.api.getAccessToken(
          authData.requestToken,
          authData.requestTokenSecret,
          oauthToken,
          (err, accessToken, accessTokenSecret, results) => {
            if (err) {
              reject(err);
            } else {
              resolve(new TwitterDataFetcher(this.api, {
                accessToken,
                accessTokenSecret,
              },
                  results //user information
              ));
            }
          }
        );
      }));
  }
};
