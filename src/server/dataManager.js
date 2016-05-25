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
        this.globalNbOfPhotos = userData.facebookData.nbOfPhotos + userData.instagramData.numberOfUserPhotos + userData.twitterData.nbOfPhotos;
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
            this.typeProfile = "Publication peu fréquente";
        }
        else if(this.globalPostFrequency*30 >= 20 && this.globalPostFrequency*30 < 40){
            this.typeProfile = "Publication fréquente";
        }
        else if(this.globalPostFrequency*30 >= 40){
            this.typeProfile = "Publication très fréquente";
        }

        return {
            globalData: {
                nbOfPhotos: getNormValue(this.globalNbOfPhotos, 0, 1),
                nbOfShares: this.globalNbOfShares,
                nbOfPosts: getNormValue(this.globalNbOfPosts,0,1),
                seniority: userData.facebookData.activeUserSince,
                dominantProfile: this.dominantProfile,
                typeProfile: this.typeProfile,
            },
            publicData: {
                postFrequency: this.publicPostFrequency,
                nbOfShare: userData.twitterData.totalRetweets,
                nbOfPosts: getNormValue(userData.twitterData.totalTweets,0,1),
                nbOfPhotos: getNormValue(this.publicNbOfPhotos,0,1),
            },
            privateData: {
                postFrequency: userData.facebookData.postsFrequency,
                nbOfPhotos: getNormValue(userData.facebookData.nbOfPhotos,0,1),
                nbOfShare: userData.facebookData.nbOfShares,
                nbOfPosts: getNormValue(userData.facebookData.nbOfPosts,0,1),
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


        this.publicInfluence = this.publicNbOfFollowers + this.publicNbOfLikes + userData.instagramData.nbOfComments + userData.twitterData.totalRetweets;
        this.privateInfluence = userData.facebookData.nbOfFriends + userData.facebookData.nbOfComments + userData.facebookData.nbOfLike;
        this.globalInfluence = this.publicInfluence + this.privateInfluence;

        return {
            globalData: {
                influence: getNormValue(this.globalInfluence,0,1),
            },
            publicData: {
                influence: getNormValue(this.publicInfluence,0,1),
                nbOfFollowers: this.publicNbOfFollowers,
                nbOfRetweets: userData.twitterData.totalRetweets,
                nbOfLikes: getNormValue(this.publicNbOfLikes,0,1),
                averageFeedbackOnPost: this.publicAverageFeedbackOnPost,
                mostPopularPhoto: userData.instagramData.mostPopularPhoto,
                mostPopularTweet: userData.twitterData.mostPopularTweet,
            },
            privateData: {
                influence: getNormValue(this.privateInfluence,0,1),
                nbOfLikes: getNormValue(userData.facebookData.nbOfLike,0,1),
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

    treatMoodCircle(){

        return {
            globalData: {

            },
            publicData: {
            },
            privateData: {
            },
            professionalData: {
            },
            raw: {
                facebook: {
                },
                twitter: {
                },
                linkedin: {
                },
                instagram: {
                },
            }
        }
    }

    //todo: to finish
    treatPassiveIdentityCircle(){

        this.publicScore = userData.twitterData.userMentions + userData.twitterData.totalRetweetForUserPosts;
        this.privateScore = userData.facebookData.nbOfComments + userData.facebookData.nbOfPhotosWhereUserIsIdentified;
        this.globalScore = this.publicScore + this.privateScore;

        return {
            globalData: {
                score: this.globalScore,
            },
            publicData: {
                score: getNormValue(this.publicScore,0,1),
                totalRetweetForUserPosts: userData.twitterData.totalRetweetForUserPosts,
                userMentions: userData.twitterData.userMentions,
            },
            privateData: {
                score: getNormValue(this.privateScore,0,1),
                nbOfComments: userData.facebookData.nbOfComments,
                averageCommentOnPost: userData.facebookData.averageCommentOnPost,
                nbOfOtherUsersPostOnFeed: userData.facebookData.nbOfOtherUsersPostOnFeed,
                nbOfPhotosWhereUserIsIdentified: userData.facebookData.nbOfPhotosWhereUserIsIdentified,
            },
            professionalData: {
            },
            raw: {
                facebook: {
                    nbOfComments: userData.facebookData.nbOfComments,
                    averageCommentOnPost: userData.facebookData.averageCommentOnPost,
                    nbOfOtherUsersPostOnFeed: userData.facebookData.nbOfOtherUsersPostOnFeed,
                    nbOfPhotosWhereUserIsIdentified: userData.facebookData.nbOfPhotosWhereUserIsIdentified,
                },
                twitter: {
                    totalRetweetForUserPosts: userData.twitterData.totalRetweetForUserPosts,
                    userMentions: userData.twitterData.userMentions,
                },
                linkedin: {
                },
                instagram: {
                },
            }
        }
    }

    treatHobbiesCircle(){
        this.publicMostUsedHashtags = userData.instagramData.mostUsedHashtags.concat(userData.twitterData.mostUsedHashtags);

        return {
            globalData: {

            },
            publicData: {
                mostUsedHashtags: this.publicMostUsedHashtags,
            },
            privateData: {
                favoriteArtists: userData.facebookData.favoriteArtists,
                lastMoviesSeen: userData.facebookData.lastMoviesSeen,
                pagesCategoryLiked: userData.facebookData.pagesCategoryLiked,
                nbOfPagesLiked: userData.facebookData.nbOfPagesLiked,
                nbOfBooksLiked: userData.facebookData.nbOfBooksLiked,
                nbOfMoviesLiked: userData.facebookData.nbOfMoviesLiked,
                nbOfArtistsLiked: userData.facebookData.nbOfArtistsLiked,
            },
            professionalData: {
            },
            raw: {
                facebook: {
                    favoriteArtists: userData.facebookData.favoriteArtists,
                    lastMoviesSeen: userData.facebookData.lastMoviesSeen,
                    pagesCategoryLiked: userData.facebookData.pagesCategoryLiked,
                    nbOfPagesLiked: userData.facebookData.nbOfPagesLiked,
                    nbOfBooksLiked: userData.facebookData.nbOfBooksLiked,
                    nbOfMoviesLiked: userData.facebookData.nbOfMoviesLiked,
                    nbOfArtistsLiked: userData.facebookData.nbOfArtistsLiked,
                },
                twitter: {
                    mostUsedHashtags: userData.twitterData.mostUsedHashtags,
                },
                linkedin: {
                },
                instagram: {
                    mostUsedHashtags: userData.instagramData.mostUsedHashtags,
                },
            }
        }
    }

    getNormValue(val, min, max){
        return (val - min)/(max - min);
    }

    getData() {
      return {
        activity: this.treatActivityCircle(),
        influence: this.treatInfluenceCircle(),
      }
    }
};
