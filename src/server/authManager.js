// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
'use strict';

const events = require('events');
const bluebird = require('bluebird');
const TwitterAPI = require('node-twitter-api');

const dbg = require('debug')('anamorph:authManager');

module.exports = new class TwitterDataFetcher {
    constructor() {

    }

    getRequestToken() {
        return new bluebird((resolve, reject) => {
            this.twitter.getRequestToken((err, requestToken, requestTokenSecret, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({requestToken, requestTokenSecret, results});
                }
            })
        });
    }

    getTwitterAuthData() {
        if (this.twitterAuthData) {
            dbg('TwitterAuthData already stored');
            return bluebird.resolve(this.twitterAuthData);
        }

        this.twitter =  new TwitterAPI({
            consumerKey: 'ZJPdAmxSjyCGU8dJYYbuleyfY',
            consumerSecret: 'NFhrW1LbpEPZ6dhexbLO8Z1JX4FBcQuohRwsDnMhQQy3DLHx27',
            callback: `http://www.localhost:3000/twitter?clientId=${this.clientId}`,
        });

        return this.getRequestToken()
            .then(res => {
                dbg('TwitterAuthData successfully retrieved');
                this.twitterAuthData = {
                    twitterApi: this.twitter,
                    requestToken: res.requestToken,
                    requestTokenSecret: res.requestTokenSecret,
                    authUrl: this.twitter.getAuthUrl(res.requestToken),
                };

                return this.twitterAuthData;
            });
    }

    getAuthData() {
        return bluebird.props({
            twitter: this.getTwitterAuthData()
        }).then(data => ({
            twitter: data.twitter
        }));
    }
};
