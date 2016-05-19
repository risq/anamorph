'use strict';

const Bluebird = require('bluebird');

const dbg = require('debug')('anamorph:dataManager');

module.exports = class DataManager {
    constructor() {
        dbg('Initializing new DataManager');

    }
    
    validConnections(userData) {
        dbg('Valid Connections');

        dbg('Facebook data');
        dbg(userData.facebookData);
        dbg('Instagram data');
        dbg(userData.instagramData);
        dbg('Twitter data');
        dbg(userData.twitterData);
        dbg('LinkedIn data');
        dbg(userData.linkedinData);

        return Bluebird.resolve(userData);
    }
};
