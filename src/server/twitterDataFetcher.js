// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
'use strict';

const events = require('events');
const bluebird = require('bluebird');
const TwitterAPI = require('node-twitter-api');

const dbg = require('debug')('anamorph:twitterDataFetcher');

module.exports = class TwitterDataFetcher {
    constructor(clientId) {
        this.clientId = clientId;

        this.data = {
            a: '',
            b: '',
        };
    }

    authenticate() {
        dbg('authenticate process');

        this.twitter =  new TwitterAPI({
            consumerKey: 'ZJPdAmxSjyCGU8dJYYbuleyfY',
            consumerSecret: 'NFhrW1LbpEPZ6dhexbLO8Z1JX4FBcQuohRwsDnMhQQy3DLHx27',
            callback: 'http://www.localhost:3000/twitter'
        });

        return this.getRequestToken();

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

    fetch() {
        dbg('fetch process');
        const data = {};
        return this.authenticate()
            .then(res => {
                dbg('requestToken', res.requestToken);
                dbg('requestTokenSecret', res.requestTokenSecret);
                dbg('results', res.results);


                bluebird.resolve(true);

                /*return this.fetchNumberOfUserPublications()
                    .then(() => this.data)
                    .catch(err => dbg(`Error: ${err.message}`));*/
            });
    }

    //Get number of publications
    fetchNumberOfUserPublications(){
       /* return this.gram.get('/users/self/', {})
            .then((res, pag) => {
                this.data.numberOfUserPublications = res.counts.media;
            })
            .catch(err => dbg(`Error: ${err.message}`));*/
    }
};
