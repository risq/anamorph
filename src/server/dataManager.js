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
            resolve(this.getData(userData.data));
          });

          userData.terminate();
        });
    }

    treatActivityCircle(userData){
        this.globalNbOfPhotos = userData.facebook.nbOfPhotos + userData.instagram.numberOfUserPhotos + userData.twitter.nbOfPhotos;
        this.globalNbOfShares = userData.facebook.nbOfShares + userData.twitter.totalRetweets;
        this.globalNbOfPosts = userData.facebook.nbOfPosts + userData.twitter.totalTweets;
        this.globalPostFrequency = userData.facebook.frequency + userData.instagram.frequency + userData.twitter.frequency;

        this.publicNbOfPhotos = userData.instagram.numberOfUserPublications + userData.twitter.nbOfPhotos;
        this.publicPostFrequency = userData.instagram.frequency + userData.twitter.frequency;
        
        if(userData.facebook.nbOfPosts > userData.instagram.nbOfPosts
            && userData.facebook.nbOfPosts > userData.twitter.nbOfPosts){
            this.dominantProfile = 'privé';
        }
        else if(userData.instagram.nbOfPosts > userData.facebook.nbOfPosts
            && userData.instagram.nbOfPosts > userData.twitter.nbOfPosts){
            this.dominantProfile = 'publique';
        }
        else if(userData.twitter.nbOfPosts > userData.facebook.nbOfPosts
            && userData.twitter.nbOfPosts > userData.instagram.nbOfPosts){
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
                seniority: userData.facebook.activeUserSince,
                dominantProfile: this.dominantProfile,
                typeProfile: this.typeProfile,
            },
            publicData: {
                postFrequency: this.publicPostFrequency,
                nbOfShare: userData.twitter.totalRetweets,
                nbOfPosts: getNormValue(userData.twitter.totalTweets,0,1),
                nbOfPhotos: getNormValue(this.publicNbOfPhotos,0,1),
            },
            privateData: {
                postFrequency: userData.facebook.postsFrequency,
                nbOfPhotos: getNormValue(userData.facebook.nbOfPhotos,0,1),
                nbOfShare: userData.facebook.nbOfShares,
                nbOfPosts: getNormValue(userData.facebook.nbOfPosts,0,1),
            },
            professionalData: {
                postFrequency: 0,
                nbOfShare: 0,
                nbOfPosts: 0,
            },
            raw: {
                facebook: {
                    nbOfPhotos: userData.facebook.nbOfPhotos,
                    nbOfShare: userData.facebook.nbOfShares,
                    nbOfPosts: userData.facebook.nbOfPosts,
                    postFrequency: userData.facebook.postsFrequency,
                },
                twitter: {
                    nbOfPhotos: userData.twitter.nbOfPhotos,
                    nbOfShare: userData.twitter.totalRetweets,
                    nbOfPosts: userData.twitter.totalTweets,
                    postFrequency: userData.twitter.frequency,
                },
                linkedin: {
                    nbOfShare: 0,
                    nbOfPosts: 0,
                },
                instagram: {
                    nbOfPhotos: userData.instagram.numberOfUserPublications,
                    postFrequency: userData.instagram.frequency,
                },
            }
        }
    }

    treatInfluenceCircle(userData){

        this.privateAverageFeedbackOnPost = userData.facebook.averageCommentOnPost + userData.facebook.averageLikeOnPost;

        this.publicNbOfFollowers = userData.instagram.numberOfUserFollowers + userData.twitter.numberOfFollowers;
        this.publicNbOfLikes = userData.instagram.nbOfLikes +  userData.twitter.totalLikesForUserPosts;
        this.publicAverageFeedbackOnPost = userData.instagram.averageOfGetLikes + userData.instagram.averageOfGetComments +
                                            userData.twitter.averageRetweetPerUserPost + userData.twitter.averageLikePerUserPost;


        this.publicInfluence = this.publicNbOfFollowers + this.publicNbOfLikes + userData.instagram.nbOfComments + userData.twitter.totalRetweets;
        this.privateInfluence = userData.facebook.nbOfFriends + userData.facebook.nbOfComments + userData.facebook.nbOfLike;
        this.globalInfluence = (this.publicInfluence + this.privateInfluence)/2;

        return {
            globalData: {
                influence: getNormValue(this.globalInfluence,0,1),
            },
            publicData: {
                influence: getNormValue(this.publicInfluence,0,1),
                nbOfFollowers: this.publicNbOfFollowers,
                nbOfRetweets: userData.twitter.totalRetweets,
                nbOfLikes: getNormValue(this.publicNbOfLikes,0,1),
                averageFeedbackOnPost: this.publicAverageFeedbackOnPost,
                mostPopularPhoto: userData.instagram.mostPopularPhoto,
                mostPopularTweet: userData.twitter.mostPopularTweet,
            },
            privateData: {
                influence: getNormValue(this.privateInfluence,0,1),
                nbOfLikes: getNormValue(userData.facebook.nbOfLike,0,1),
                nbOfFriends: userData.facebook.nbOfFriends,
                averageFeedbackOnPost: this.privateAverageFeedbackOnPost,
                lessPopularPost: userData.facebook.lessPopularPost,
                mostPopularPost: userData.facebook.mostPopularPost,
                lessPopularPhoto: userData.facebook.lessPopularPhoto,
                mostPopularPhoto: userData.facebook.mostPopularPhoto,
            },
            professionalData: {
            },
            raw: {
                facebook: {
                    nbOfLikes: userData.facebook.nbOfLike,
                    nbOfFriends: userData.facebook.nbOfFriends,
                    averageFeedbackOnPost: this.privateAverageFeedbackOnPost,
                    lessPopularPost: userData.facebook.lessPopularPost,
                    mostPopularPost: userData.facebook.mostPopularPost,
                    lessPopularPhoto: userData.facebook.lessPopularPhoto,
                    mostPopularPhoto: userData.facebook.mostPopularPhoto,
                },
                twitter: {
                    nbOfFollowers: userData.twitter.numberOfFollowers,
                    nbOfLikes: userData.twitter.totalLikesForUserPosts,
                    averageFeedbackOnPost: userData.twitter.averageRetweetPerUserPost + userData.twitter.averageLikePerUserPost,
                    mostPopularTweet: userData.twitter.mostPopularTweet,
                },
                linkedin: {
                    nbOfReference: 0,
                    nbOfConnections: userData.linkedin.connections,
                    nbOfViewPerMonth: 0,
                },
                instagram: {
                    nbOfFollowers: userData.instagram.numberOfUserFollowers,
                    nbOfLikes: userData.instagram.nbOfLikes,
                    averageFeedbackOnPost: userData.instagram.averageOfGetLikes + userData.instagram.averageOfGetComments,
                    mostPopularPhoto: userData.instagram.mostPopularPhoto,
                },
            }
        }
    }

    treatMoodCircle(userData){
        this.publicPejorativeWords =  userData.instagram.pejorativeWords.concat(userData.twitter.pejorativeWords);
        this.publicMeliorativeWords = userData.instagram.meliorativeWords.concat(userData.twitter.meliorativeWords);

        this.publicSmiley = userData.instagram.smiley.concat(userData.twitter.smiley);

        return {
            globalData: {

            },
            publicData: {
                pejorativeWords: this.publicPejorativeWords,
                meliorativeWords: this.publicMeliorativeWords,
                smiley: this.publicSmiley,
            },
            privateData: {
                pejorativeWords: userData.facebook.pejorativeWords,
                meliorativeWords: userData.facebook.pejorativeWords,
                smiley: userData.facebook.smiley,
            },
            professionalData: {
            },
            raw: {
                facebook: {
                    pejorativeWords: userData.facebook.pejorativeWords,
                    meliorativeWords: userData.facebook.pejorativeWords,
                    smiley: userData.facebook.smiley,
                },
                twitter: {
                    pejorativeWords: userData.twitter.pejorativeWords,
                    meliorativeWords: userData.twitter.pejorativeWords,
                    smiley: userData.twitter.smiley,
                },
                linkedin: {
                },
                instagram: {
                    pejorativeWords: userData.instagram.pejorativeWords,
                    meliorativeWords: userData.instagram.pejorativeWords,
                    smiley: userData.instagram.smiley,
                },
            }
        }
    }

    //todo: to finish
    treatPassiveIdentityCircle(){

        this.publicScore = userData.twitter.userMentions + userData.twitter.totalRetweetForUserPosts;
        this.privateScore = userData.facebook.nbOfComments + userData.facebook.nbOfPhotosWhereUserIsIdentified;
        this.sumScore = this.publicScore + this.privateScore;

        this.globalScore = this.sumScore/2;

        this.publicPercentScore = (this.publicScore*100)/this.globalScore;
        this.privatePercentScore = (this.privateScore*100)/this.globalScore;


        return {
            globalData: {
                score: this.globalScore,
            },
            publicData: {
                percentScore: this.publicPercentScore,
                score: getNormValue(this.publicScore,0,1),
                totalRetweetForUserPosts: userData.twitter.totalRetweetForUserPosts,
                userMentions: userData.twitter.userMentions,
            },
            privateData: {
                percentScore: this.privatePercentScore,
                score: getNormValue(this.privateScore,0,1),
                nbOfComments: userData.facebook.nbOfComments,
                averageCommentOnPost: userData.facebook.averageCommentOnPost,
                nbOfOtherUsersPostOnFeed: userData.facebook.nbOfOtherUsersPostOnFeed,
                nbOfPhotosWhereUserIsIdentified: userData.facebook.nbOfPhotosWhereUserIsIdentified,
            },
            professionalData: {
            },
            raw: {
                facebook: {
                    nbOfComments: userData.facebook.nbOfComments,
                    averageCommentOnPost: userData.facebook.averageCommentOnPost,
                    nbOfOtherUsersPostOnFeed: userData.facebook.nbOfOtherUsersPostOnFeed,
                    nbOfPhotosWhereUserIsIdentified: userData.facebook.nbOfPhotosWhereUserIsIdentified,
                },
                twitter: {
                    totalRetweetForUserPosts: userData.twitter.totalRetweetForUserPosts,
                    userMentions: userData.twitter.userMentions,
                },
                linkedin: {
                },
                instagram: {
                },
            }
        }
    }

    treatHobbiesCircle(userData){
        this.publicMostUsedHashtags = userData.instagram.mostUsedHashtags.concat(userData.twitter.mostUsedHashtags);
        this.hobbiesVolume = userData.facebook.nbOfPagesLiked + userData.facebook.nbOfMoviesLiked
                            + userData.facebook.nbOfBooksLiked + userData.facebook.nbOfArtistsLiked;

        return {
            globalData: {
                hobbiesVolume: getNormValue(this.hobbiesVolum,0,1),
            },
            publicData: {
                mostUsedHashtags: this.publicMostUsedHashtags,
            },
            privateData: {
                favoriteArtists: userData.facebook.favoriteArtists,
                lastMoviesSeen: userData.facebook.lastMoviesSeen,
                pagesCategoryLiked: userData.facebook.pagesCategoryLiked,
                nbOfPagesLiked: userData.facebook.nbOfPagesLiked,
                nbOfBooksLiked: userData.facebook.nbOfBooksLiked,
                nbOfMoviesLiked: userData.facebook.nbOfMoviesLiked,
                nbOfArtistsLiked: userData.facebook.nbOfArtistsLiked,
            },
            professionalData: {
            },
            raw: {
                facebook: {
                    favoriteArtists: userData.facebook.favoriteArtists,
                    lastMoviesSeen: userData.facebook.lastMoviesSeen,
                    pagesCategoryLiked: userData.facebook.pagesCategoryLiked,
                    nbOfPagesLiked: userData.facebook.nbOfPagesLiked,
                    nbOfBooksLiked: userData.facebook.nbOfBooksLiked,
                    nbOfMoviesLiked: userData.facebook.nbOfMoviesLiked,
                    nbOfArtistsLiked: userData.facebook.nbOfArtistsLiked,
                },
                twitter: {
                    mostUsedHashtags: userData.twitter.mostUsedHashtags,
                },
                linkedin: {
                },
                instagram: {
                    mostUsedHashtags: userData.instagram.mostUsedHashtags,
                },
            }
        }
    }

    getNormValue(val, min, max){
        return (val - min)/(max - min);
    }

    getData(userData) {
        this.treatMoodCircle(userData);
      return {
        activity: this.treatActivityCircle(userData),
        influence: this.treatInfluenceCircle(userData),
      }
    }
};
