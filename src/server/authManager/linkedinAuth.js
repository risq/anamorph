'use strict';
const Bluebird = require('bluebird');

const LinkedinDataFetcher = require('../linkedinDataFetcher');
const config = require('../../../config/config');
const LinkedinAPI = require('node-linkedin')(config.api.linkedin.key, config.api.linkedin.secret);

const dbg = require('debug')('anamorph:authManager:linkedinAuth');

module.exports = class LinkedinAuth {
    constructor(clientId) {
        this.clientId = clientId;
        this.scope = ['r_basicprofile', 'r_emailaddress'];
    }

    getAuthData() {
        dbg('Getting linkedin auth data');

        if (this.authData) {
            return Bluebird.resolve(this.authData);
        }

        return this.initializeAuth();
    }

    initializeAuth() {
        dbg(`Initializing linkedin auth for client ${this.clientId}`);

        LinkedinAPI.auth.setCallback(`http://${config.server.url}/linkedin?clientId=${this.clientId}`);

        this.authData = {
            api: LinkedinAPI,
            authUrl: LinkedinAPI.auth.authorize(this.scope),
        };

        return this.authData;
    }

    getDataFetcher(code, state) {
        dbg('Getting access token');

        return this.getAuthData()
            .then(() => new Bluebird((resolve, reject) => {
                LinkedinAPI.auth.getAccessToken(
                    code,
                    state,
                    (err, results) => {
                        if (err) {
                            dbg('error: ', err);
                            reject(err);
                        }
                        else{
                            dbg('success');
                            resolve(new LinkedinDataFetcher(LinkedinAPI,
                                results //user information
                            ));
                        }
                });
            }));
    }
};
