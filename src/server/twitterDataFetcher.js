// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
'use strict';

const events = require('events');
const bluebird = require('bluebird');
const TwitterAPI = require('node-twitter-api');
const authManager = require('./authManager');

const dbg = require('debug')('anamorph:twitterDataFetcher');

module.exports = class TwitterDataFetcher {
    constructor(clientId, oauth_verifier) {
        this.clientId = clientId;
        this.oauth_verifier = oauth_verifier;

        this.data = {

        };
    }


    fetch() {
        dbg('fetch process');
        const data = {};

       return this.getAuthData()
           .then(twitterKeys => {
               dbg('twitterKeys: ', twitterKeys);

                return bluebird.props({
                       numberOfFollowers: this.fetchNumberOfFollowers(twitterKeys),

                   })
                    .then(data => {
                        dbg('display datas');
                        dbg(data);
                }   )
                    .catch(err => dbg(`Error: ${err.message}`));
           })
    }

    getAuthData(){
        return authManager.getAuthData()
            .then(authData => {
                const twitterAuthData = authData.twitter;
                dbg('OAUTH TOKEN VERIFIER', this.oauth_verifier);

                this.twitterApi = twitterAuthData.twitterApi;

                return this.getAccessToken(twitterAuthData);
            })
    }

    getAccessToken(twitterAuthData){
        dbg('getAccessToken');
        return new bluebird((resolve, reject) => {
            this.twitterApi.getAccessToken(twitterAuthData.requestToken, twitterAuthData.requestTokenSecret, this.oauth_verifier, function(err, accessToken, accessTokenSecret, results){
                if (err) {
                    reject(err);
                } else {
                    dbg('success', accessToken, accessTokenSecret);
                    resolve({accessToken, accessTokenSecret, results});
                }
            })
        });

    }

    //Get the number of followers
    fetchNumberOfFollowers(twitterKeys){
        dbg('fetchNumberOfFollowers');
        return new bluebird((resolve, reject) => {
            this.twitterApi.followers("ids", {},
                twitterKeys.accessToken,
                twitterKeys.accessTokenSecret,
                function (err, data, response) {
                    if (err) {
                        reject(err);
                    } else {
                        dbg(data);
                        resolve(data.ids.length);
                    }
                }
            );
        });
    }
};
