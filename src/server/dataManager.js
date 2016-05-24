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
        this.globalNbOfPhotos = userData.facebookData.nbOfPhotos + userData.instagramData.numberOfUserPublications + userData.twitterData.nbOfPhotos;
        this.globalNbOfShares = userData.facebookData.nbOfShares + userData.twitterData.totalRetweets;
        this.globalNbOfPosts = userData.facebookData.nbOfPosts + userData.twitterData.totalTweets;
        this.globalPostFrequency = userData.facebookData.frequency + userData.instagramData.frequency + userData.twitterData.frequency;

        this.publicNbOfPhotos = userData.instagramData.numberOfUserPublications + userData.twitterData.nbOfPhotos;
        this.publicPostFrequency = userData.instagramData.frequency + userData.twitterData.frequency;
        
        if(userData.facebookData.nbOfPosts > userData.instagramData.nbOfPosts
            && userData.facebookData.nbOfPosts > userData.twitterData.nbOfPosts){
            this.dominantProfile = 'privé';
        }
        else if(userData.instagramData.nbOfPosts > userData.facebookData.nbOfPosts
            && userData.instagramData.nbOfPosts > userData.twitterData.nbOfPosts){
            this.dominantProfile = 'publique';
        }
        else if(userData.twitterData.nbOfPosts > userData.facebookData.nbOfPosts
            && userData.twitterData.nbOfPosts > userData.instagramData.nbOfPosts){
            this.dominantProfile = 'publique';
        }

        //*30 = per month
        if(this.globalPostFrequency*30 < 20){
            this.typeProfile = "Publication peu féquente";
        }
        else if(this.globalPostFrequency*30 >= 20 && this.globalPostFrequency*30 < 40){
            this.typeProfile = "Publication féquente";
        }
        else if(this.globalPostFrequency*30 >= 40){
            this.typeProfile = "Publication très féquente";
        }


        this.activity = {
            globalData: {
                nbOfPhotos: this.globalNbOfPhotos,
                nbOfShares: this.globalNbOfShares,
                nbOfPosts: this.globalNbOfPosts,
                seniority: userData.facebookData.activeUserSince,
                dominantProfile: this.dominantProfile,
                typeProfile: this.typeProfile,
            },
            publicData: {
                postFrequency: this.publicPostFrequency,
                nbOfShare: userData.twitterData.totalRetweets,
                nbOfPosts: userData.twitterData.totalTweets,
                nbOfPhotos: this.publicNbOfPhotos,
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
