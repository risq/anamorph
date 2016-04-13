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

        this.data = {
            name: '',
            posts: [],
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
        return this.authenticate()
            .then((accessToken) => {

                this.gram = new Nodegram({accessToken});
                this.gram.getAuthUrl();
                return this.fetchNumberOfUserLikes()
                    .then(() => dbg(this.data.numberOfUserLikes))
                    .catch(err => dbg(`Error: ${err.message}`));
            });
    }

    fetchNumberOfUserLikes(url){
        dbg('fetchNumberOfUserLikes');
        this.gram.get('/users/self/media/liked',{count: 2000}).then(this.onSuccess).catch(this.onError);

      /*  url = url || `/users/self/media/liked`;
        return this.gram.get(url, {max_like_id: 2000, count: 2000})
            .then((res, pag) => {
                dbg(res);
                dbg('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
                dbg(pag);
                dbg(res.length);

                dbg('nextUrl:', res.pagination.next_url);
                if (res.pagination && res.pagination.next_url) {
                    return this.fetchNumberOfUserLikes(res.pagination.next_url);
                } else {
                    this.data.numberOfUserLikes = res.length;
                }
            })
            .catch(err => dbg(`Error: ${err.message}`));*/

    }
     onSuccess(res, pag) {
         dbg('aaaaaaaaaaaa');
        //console.log('onSuccess', res, pag);
         dbg(res.length);
    }

     onError(err) {
         dbg('bbbbbbbbbb');
        console.log('onError', err);
    }
};
