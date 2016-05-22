'use strict';

const Bluebird = require('bluebird');
const LinkedinAPI = require('node-linkedin')('77cvm308kbnwo2', 'JUwiNWEddBpjSNbA');

const LinkedinDataFetcher = require('../linkedinDataFetcher');

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

        LinkedinAPI.auth.setCallback(`http://localhost:3000/linkedin?clientId=${this.clientId}`);

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
