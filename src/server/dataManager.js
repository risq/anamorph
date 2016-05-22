'use strict';

const Bluebird = require('bluebird');

const dbg = require('debug')('anamorph:dataManager');

module.exports = class DataManager {
    constructor() {
      dbg('Initializing new DataManager');
    }

    validConnections(userData) {
        dbg('Valid Connections');
        //this.userData = userData;

        return new Bluebird((resolve, reject) => {
          userData.events.on('allDataFetched', () => {
            dbg('allDataFetched event fired');
            resolve(userData.data);
          });

          userData.terminate();
        });
    }

    onDataFetched() {
      dbg('Facebook data');
      dbg(this.userData.facebookData);
      dbg('Instagram data');
      dbg(this.userData.instagramData);
      dbg('Twitter data');
      dbg(this.userData.twitterData);
      dbg('LinkedIn data');
      dbg(this.userData.linkedinData);
    }

    getData() {
      return {
        activity: {},
        influence: {},
      }
    }
};
