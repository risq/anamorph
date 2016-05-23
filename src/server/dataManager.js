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
            resolve(this.dataTreatment());
          });

          userData.terminate();
        });
    }

    dataTreatment() {
        dbg('Facebook data');
        //dbg(this.userData.facebookData);
        dbg('Instagram data');
        //dbg(this.userData.instagramData);
        dbg('Twitter data');
        //dbg(this.userData.twitterData);
        dbg('LinkedIn data');
        //dbg(this.userData.linkedinData);

        return this.getData();
    }

    activityTreatment(){

        this.globalNbOfPhotos = userData.facebookData.nbOfPhotos + userData.instagramData.numberOfUserPublications;
        this.globalNbOfShares = userData.facebookData.nbOfShares;
        this.globalNbOfPosts = userData.facebookData.nbOfPosts;


        this.activity = {
            globalData: {
                nbOfPhotos: this.globalNbOfPhotos,
                nbOfShares: this.globalNbOfShares,
                nbOfPosts: this.globalNbOfPosts,
                seniority: 0,
                dominantProfile: 0,
                typeProfile: 0,
            },
            publicData: {
                postFrequency: 0,
                nbOfShare: 0,
                nbOfPosts: 0,
                nbOfPhotos: 0,
            },
            privateData: {
                postFrequency: userData.facebookData.postsFrequency,
                nbOfPhotos: userData.facebookData.nbOfPhotos,
                nbOfShare: userData.facebookData.nbOfShares,
                nbOfPosts: userData.facebookData.nbOfPosts,
            },
            professionalData: {
                postFrequency: 0,
                nbOfShare: 0,
                nbOfPosts: 0,
            },
            raw: {
                facebook: {
                    nbOfPhotos: userData.facebookData.nbOfPhotos,
                    nbOfShare: userData.facebookData.nbOfShares,
                    nbOfPosts: userData.facebookData.nbOfPosts,
                },
                twitter: {
                    nbOfPhotos: userData.twitterData.nbOfPhotos,
                    nbOfShare: userData.twitterData.totalRetweets,
                    nbOfPosts: userData.twitterData.totalTweets,
                },
                linkedin: {
                    nbOfShare: 0,
                    nbOfPosts: 0,
                },
                instagram: {
                    nbOfPhotos: userData.instagramData.numberOfUserPublications,
                },
            }
        }
    }

    getData() {
      return {
        activity: {},
        influence: {},
      }
    }
};
