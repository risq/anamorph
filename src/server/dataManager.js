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
            resolve(this.getData());
          });

          userData.terminate();
        });
    }

    treatActivityCircle(){
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

        return {
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
                    postFrequency: userData.facebookData.postsFrequency,
                },
                twitter: {
                    nbOfPhotos: userData.twitterData.nbOfPhotos,
                    nbOfShare: userData.twitterData.totalRetweets,
                    nbOfPosts: userData.twitterData.totalTweets,
                    postFrequency: userData.twitterData.frequency,
                },
                linkedin: {
                    nbOfShare: 0,
                    nbOfPosts: 0,
                },
                instagram: {
                    nbOfPhotos: userData.instagramData.numberOfUserPublications,
                    postFrequency: userData.instagramData.frequency,
                },
            }
        }
    }

    treatInfluenceCircle(){

        this.privateAverageFeedbackOnPost = userData.facebookData.averageCommentOnPost + userData.facebookData.averageLikeOnPost;

        this.publicNbOfFollowers = userData.instagramData.numberOfUserFollowers + userData.twitterData.numberOfFollowers;
        this.publicNbOfLikes = userData.instagramData.nbOfLikes +  userData.twitterData.totalLikesForUserPosts;
        this.publicAverageFeedbackOnPost = userData.instagramData.averageOfGetLikes + userData.instagramData.averageOfGetComments +
                                            userData.twitterData.averageRetweetPerUserPost + userData.twitterData.averageLikePerUserPost;

        return {
            globalData: {

            },
            publicData: {
                nbOfFollowers: this.publicNbOfFollowers,
                nbOfRetweets: userData.twitterData.totalRetweets,
                nbOfLikes: this.publicNbOfLikes,
                averageFeedbackOnPost: this.publicAverageFeedbackOnPost,
                mostPopularPhoto: userData.instagramData.mostPopularPhoto,
                mostPopularTweet: userData.twitterData.mostPopularTweet,
            },
            privateData: {
                nbOfLikes: userData.facebookData.nbOfLike,
                nbOfFriends: userData.facebookData.nbOfFriends,
                averageFeedbackOnPost: this.privateAverageFeedbackOnPost,
                lessPopularPost: userData.facebookData.lessPopularPost,
                mostPopularPost: userData.facebookData.mostPopularPost,
                lessPopularPhoto: userData.facebookData.lessPopularPhoto,
                mostPopularPhoto: userData.facebookData.mostPopularPhoto,
            },
            professionalData: {
            },
            raw: {
                facebook: {
                    nbOfLikes: userData.facebookData.nbOfLike,
                    nbOfFriends: userData.facebookData.nbOfFriends,
                    averageFeedbackOnPost: this.privateAverageFeedbackOnPost,
                    lessPopularPost: userData.facebookData.lessPopularPost,
                    mostPopularPost: userData.facebookData.mostPopularPost,
                    lessPopularPhoto: userData.facebookData.lessPopularPhoto,
                    mostPopularPhoto: userData.facebookData.mostPopularPhoto,
                },
                twitter: {
                    nbOfFollowers: userData.twitterData.numberOfFollowers,
                    nbOfLikes: userData.twitterData.totalLikesForUserPosts,
                    averageFeedbackOnPost: userData.twitterData.averageRetweetPerUserPost + userData.twitterData.averageLikePerUserPost,
                    mostPopularTweet: userData.twitterData.mostPopularTweet,
                },
                linkedin: {
                    nbOfReference: 0,
                    nbOfConnections: userData.linkedinData.connections,
                    nbOfViewPerMonth: 0,
                },
                instagram: {
                    nbOfFollowers: userData.instagramData.numberOfUserFollowers,
                    nbOfLikes: userData.instagramData.nbOfLikes,
                    averageFeedbackOnPost: userData.instagramData.averageOfGetLikes + userData.instagramData.averageOfGetComments,
                    mostPopularPhoto: userData.instagramData.mostPopularPhoto,
                },
            }
        }
    }

    getData() {
      return {
        activity: this.treatActivityCircle(),
        influence: this.treatInfluenceCircle(),
      }
    }
};
