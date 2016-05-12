'use strict';

const Bluebird = require('bluebird');

const dbg = require('debug')('anamorph:linkedinDataFetcher');

module.exports = class LinkedinDataFetcher {
    constructor(api, user) {
        dbg('Initializing new LinkedinDataFetcher');

        this.user = user;
        this.api = api.init(this.user.access_token);

        this.data = {
            connections: '',
        };
    }

    fetch() {
        dbg('Fetching linkedin data');

        return this.fetchUserInformation()
            .catch(err => dbg(err));
    }

    //Get the user information
    fetchUserInformation() {
        dbg('Fetching user');

        return new Bluebird((resolve, reject) => {
                this.api.people.me((err, data) => {
                    if (err) {
                        dbg('error: ', err);
                        reject(err);
                    } else {
                        dbg(data);
                        this.data.email = data.emailAddress;
                        this.data.connections = data.numConnections;
                        dbg(`Email: ${this.data.email}`);
                        dbg(`Number of connections: ${this.data.connections}`);
                        resolve(data);
                    }
                }
            );
        });
    }
};
