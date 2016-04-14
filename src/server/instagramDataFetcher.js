// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
'use strict';

const events = require('events');
const bluebird = require('bluebird');
const Nodegram = require('nodegram');

const dbg = require('debug')('anamorph:instagramDataFetcher');
// const instagram = bluebird.promisifyAll(require('instagram-node').instagram());

module.exports = class InstagramDataFetcher {
    constructor(clientId, code) {
        this.clientId = clientId
        this.code = code;
        this.numberOfPublications = 0;
        this.numberOfLikes = 0;

        this.data = {
            numberOfUserPublications: '',
            numberOfUserFollowers: [],
            numberOfUserFollows: [],
            averageOfGetLikes: [],
        };
    }

    authenticate() {
        dbg('authenticate process');
        const nodegram = new Nodegram({
            clientId: '208f9dfdb4b44a228b4c7f95b56bc58e',
            clientSecret: '00afe917a374431296dcc65bd645fccf',
            redirectUri: `http://localhost:3000/insta?clientId=${this.clientId}`,
        });

        nodegram.getAuthUrl();

        return nodegram.getAccessToken(this.code)
            .then(res => res.access_token);
    }

    fetch() {
        dbg('fetch process');
        const data = {};
        return this.authenticate()
            .then((accessToken) => {

                this.gram = new Nodegram({accessToken});
                this.gram.getAuthUrl();
                return this.fetchNumberOfUserPublications()
                    .then(data => this.fetchNumberOfUserFollowers())
                    .then(data => this.fetchNumberOfUserFollows())
                    .then(data => this.fetchAverageOfGetLikes())
                    .then(() => this.data)
                    .catch(err => dbg(`Error: ${err.message}`));
            });
    }


    fetchNumberOfUserPublications(){
        return this.gram.get('/users/self/', {})
            .then((res, pag) => {
                this.data.numberOfUserPublications = res.counts.media;
            })
            .catch(err => dbg(`Error: ${err.message}`));
    }

    fetchNumberOfUserFollowers(){
        return this.gram.get('/users/self/', {})
            .then((res, pag) => {
                this.data.numberOfUserFollowers = res.counts.followed_by;
            })
            .catch(err => dbg(`Error: ${err.message}`));
    }

    fetchNumberOfUserFollows(){
        return this.gram.get('/users/self/', {})
            .then((res, pag) => {
                this.data.numberOfUserFollows = res.counts.follows;
            })
            .catch(err => dbg(`Error: ${err.message}`));
    }

    //Get average of likes per publication
    fetchAverageOfGetLikes(url){
        dbg('fetchAverageOfGetLikes');

        return this.gram.get('/users/self/media/liked', {})
            .then((res, pag) => {
                this.numberOfPublications+= res.length;
                res.forEach(res => this.numberOfLikes+=res.likes.count);

                this.data.averageOfGetLikes = Math.round(this.numberOfLikes/this.numberOfPublications);
            })
            .catch(err => dbg(`Error: ${err.message}`));

    }
};
