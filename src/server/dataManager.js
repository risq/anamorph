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
        this.globalNbOfPhotos = getTotal(userData, {facebook: 'nbOfPhotos', twitter: 'nbOfPhotos', instagram: 'numberOfUserPhotos'});
        this.globalNbOfShares = getTotal(userData, {facebook: 'nbOfShares', twitter: 'totalRetweets'});
        this.globalNbOfPosts = getTotal(userData, {facebook: 'nbOfPosts', twitter: 'nbOfPosts', instagram: 'nbOfPosts'});
        this.globalPostFrequency = getTotal(userData, {facebook: 'frequency', twitter: 'frequency', instagram: 'frequency'});

        this.publicNbOfPhotos = getTotal(userData, {twitter: 'nbOfPhotos', instagram: 'numberOfUserPhotos'});
        this.publicNbOfPosts = getTotal(userData, {twitter: 'nbOfPosts', instagram: 'nbOfPosts'});
        this.publicPostFrequency = getTotal(userData, {twitter: 'frequency', instagram: 'frequency'});


        //DOMINANT PROFIL
        if((userData.facebook.nbOfPosts || 0) > (userData.instagram.nbOfPosts || 0)
            && (userData.facebook.nbOfPosts || 0) > (userData.twitter.nbOfPosts || 0)){
            this.dominantProfile = 'privé';
        }
        else if((userData.instagram.nbOfPosts || 0) > (userData.facebook.nbOfPosts || 0)
            && (userData.instagram.nbOfPosts || 0) > (userData.twitter.nbOfPosts || 0)){
            this.dominantProfile = 'publique';
        }
        else if((userData.twitter.nbOfPosts || 0) > (userData.facebook.nbOfPosts || 0)
            && (userData.twitter.nbOfPosts || 0) > (userData.instagram.nbOfPosts || 0)){
            this.dominantProfile = 'publique';
        }

        //PROFIL TYPE
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

        //DISTRIBUTION
        this.publicFrequencyDistribution = this.publicPostFrequency/this.globalPostFrequency;
        this.privateFrequencyDistribution = (userData.facebook.frequency || 0)/this.globalPostFrequency;

        this.publicVolumeDistribution = this.publicNbOfPosts/this.globalNbOfPosts;
        this.privateVolumeDistribution = (userData.facebook.nbOfPosts || 0)/this.globalNbOfPosts;


        return {
            globalData: {
                postFrequency: this.globalPostFrequency,
                nbOfPhotos: clamp(getNormValue(this.globalNbOfPhotos, 0, 500), 0, 1),
                nbOfShares: this.globalNbOfShares,
                nbOfPosts: clamp(getNormValue(this.globalNbOfPosts,0, 500), 0, 1),
                seniority: userData.facebook.activeUserSince || 0,
                dominantProfile: this.dominantProfile,
                typeProfile: this.typeProfile,
            },
            publicData: {
                postFrequency: this.publicPostFrequency,
                nbOfShare: userData.twitter.totalRetweets || 0,
                nbOfPosts: clamp(getNormValue((this.publicNbOfPosts || 0),0, 500), 0, 1),
                nbOfPhotos: clamp(getNormValue(this.publicNbOfPhotos,0,1)),
                frequencyDistribution: this.publicFrequencyDistribution,
                volumeDistribution: this.publicVolumeDistribution,
            },
            privateData: {
                postFrequency: userData.facebook.postsFrequency || 0,
                nbOfPhotos: clamp(getNormValue((userData.facebook.nbOfPhotos || 0),0, 500), 0, 1),
                nbOfShare: userData.facebook.nbOfShares || 0,
                nbOfPosts: clamp(getNormValue((userData.facebook.nbOfPosts || 0),0, 500), 0, 1),
                frequencyDistribution: this.privateFrequencyDistribution,
                volumeDistribution: this.privateVolumeDistribution,
            },
            professionalData: {
                postFrequency: 0,
                nbOfShare: 0,
                nbOfPosts: 0,
            },
            raw: {
                facebook: {
                    nbOfPhotos: userData.facebook.nbOfPhotos || 0,
                    nbOfShare: userData.facebook.nbOfShares || 0,
                    nbOfPosts: userData.facebook.nbOfPosts || 0,
                    postFrequency: userData.facebook.postsFrequency || 0,
                },
                twitter: {
                    nbOfPhotos: userData.twitter.nbOfPhotos || 0,
                    nbOfShare: userData.twitter.totalRetweets || 0,
                    nbOfPosts: userData.twitter.totalTweets || 0,
                    postFrequency: userData.twitter.frequency || 0,
                },
                linkedin: {
                    nbOfShare: 0,
                    nbOfPosts: 0,
                },
                instagram: {
                    nbOfPhotos: userData.instagram.numberOfUserPhotos || 0,
                    postFrequency: userData.instagram.frequency || 0,
                },
            }
        }
    }

    treatInfluenceCircle(userData){

        if(userData.facebook.averageCommentOnPost && userData.facebook.averageLikeOnPost){
            this.privateAverageFeedbackOnPost = userData.facebook.averageCommentOnPost + userData.facebook.averageLikeOnPost;
        }

        this.publicNbOfFollowers = getTotal(userData, {twitter: 'numberOfFollowers', instagram: 'numberOfUserFollowers'});
        this.publicNbOfLikes = getTotal(userData, {twitter: 'totalLikesForUserPosts', instagram: 'nbOfLikes'});
        this.publicAverageFeedbackOnPost = getTotal(userData, {twitter: 'averageLikePerUserPost', instagram: 'averageOfGetLikes'})
            + getTotal(userData, {twitter: 'averageRetweetPerUserPost', instagram: 'averageOfGetComments'});;


        this.publicInfluence = this.publicNbOfFollowers + this.publicNbOfLikes + (userData.instagram.nbOfComments || 0) + (userData.twitter.totalRetweets || 0);
        this.privateInfluence = userData.facebook.nbOfFriends + (userData.facebook.nbOfComments || 0) + (userData.facebook.nbOfLike || 0);
        this.globalInfluence = this.publicInfluence + this.privateInfluence;


        //DISTRIBUTION
        this.publicInfluenceDistribution = this.publicInfluence/this.globalInfluence;
        this.privateInfluenceDistribution = this.privateInfluence/this.globalInfluence;


        return {
            globalData: {
                influence: clamp(getNormValue(this.globalInfluence,0,500), 0, 1),
                nbOfLikes: this.publicNbOfLikes + userData.facebook.nbOfLike,
            },
            publicData: {
                influence: clamp(getNormValue(this.publicInfluence,0, 500), 0, 1),
                nbOfFollowers: this.publicNbOfFollowers,
                nbOfRetweets: userData.twitter.totalRetweets || 0,
                nbOfLikes: clamp(getNormValue(this.publicNbOfLikes,0, 500), 0, 1),
                averageFeedbackOnPost: this.publicAverageFeedbackOnPost,
                mostPopularPhoto: userData.instagram.mostPopularPhoto || '',
                mostPopularTweet: userData.twitter.mostPopularTweet || '',
                influenceDistribution: this.publicInfluenceDistribution,
            },
            privateData: {
                influence: clamp(getNormValue(this.privateInfluence,0, 500), 0, 1),
                nbOfLikes: clamp(getNormValue((userData.facebook.nbOfLike || 0),0, 500), 0, 1),
                nbOfFriends: userData.facebook.nbOfFriends || 0,
                averageFeedbackOnPost: this.privateAverageFeedbackOnPost,
                lessPopularPost: userData.facebook.lessPopularPost || '',
                mostPopularPost: userData.facebook.mostPopularPost || '',
                lessPopularPhoto: userData.facebook.lessPopularPhoto || '',
                mostPopularPhoto: userData.facebook.mostPopularPhoto || '',
                influenceDistribution: this.privateInfluenceDistribution,
            },
            professionalData: {
            },
            raw: {
                facebook: {
                    nbOfLikes: userData.facebook.nbOfLike || 0,
                    nbOfFriends: userData.facebook.nbOfFriends || 0,
                    averageFeedbackOnPost: this.privateAverageFeedbackOnPost,
                    lessPopularPost: userData.facebook.lessPopularPost || '',
                    mostPopularPost: userData.facebook.mostPopularPost || '',
                    lessPopularPhoto: userData.facebook.lessPopularPhoto || '',
                    mostPopularPhoto: userData.facebook.mostPopularPhoto || '',
                },
                twitter: {
                    nbOfFollowers: userData.twitter.numberOfFollowers || 0,
                    nbOfLikes: userData.twitter.totalLikesForUserPosts || 0,
                    averageFeedbackOnPost: (userData.twitter.averageRetweetPerUserPost || 0) + (userData.twitter.averageLikePerUserPost || 0),
                    mostPopularTweet: (userData.twitter.mostPopularTweet || ''),
                },
                linkedin: {
                    nbOfReference: 0,
                    nbOfConnections: userData.linkedin.connections || 0,
                    nbOfViewPerMonth: 0,
                },
                instagram: {
                    nbOfFollowers: userData.instagram.numberOfUserFollowers || 0,
                    nbOfLikes: userData.instagram.nbOfLikes || 0,
                    averageFeedbackOnPost: (userData.instagram.averageOfGetLikes || 0) + (userData.instagram.averageOfGetComments || 0),
                    mostPopularPhoto: (userData.instagram.mostPopularPhoto || ''),
                },
            }
        }
    }

    //todo: to finish
    treatMoodCircle(userData){

        this.publicPejorativeWords =  joinWordsOccs((userData.instagram.pejorativeWords || []), (userData.twitter.pejorativeWords || []));
        this.publicMeliorativeWords = joinWordsOccs((userData.instagram.meliorativeWords || []), (userData.twitter.meliorativeWords || []));
        this.publicSmiley = joinWordsOccs((userData.instagram.smiley || []), (userData.twitter.smiley || []));

        //PUBLIC
        this.publicPejorativeWords.foreach((data => {
            this.nbOfPublicPejorativeWords += data.occ;
        }));
        this.publicMeliorativeWords.foreach((data => {
            this.nbOfPublicMeliorativeWords += data.occ;
        }));

        //PRIVATE
        userData.facebook.pejorativeWords.foreach((data => {
            this.nbOfPrivatePejorativeWords += data.occ;
        }));
        userData.facebook.meliorativeWords.foreach((data => {
            this.nbOfPrivateMeliorativeWords += data.occ;
        }));


        //EXPRESSIVITY
        let publicExpressivityTab = joinWordsOccs((this.publicPejorativeWords || []), (this.publicMeliorativeWords || []), (this.publicSmiley || []));
        let privateExpressivityTab = joinWordsOccs((userData.facebook.pejorativeWords || []), (userData.facebook.meliorativeWords || []), (userData.facebook.smiley || []));

        publicExpressivityTab.foreach((data => {
            this.publicExpressivity += data.occ;
        }));
        privateExpressivityTab.foreach((data => {
            this.privateExpressivity += data.occ;
        }));

        this.globalExpressivity = this.publicExpressivity || 0 + this.privateExpressivity || 0;


        //ATTITUDE
        //PUBLIC
        if(this.nbOfPublicPejorativeWords < this.nbOfPublicMeliorativeWords){
            this.publicAttitude = (this.nbOfPublicPejorativeWords/this.nbOfPublicMeliorativeWords)/2;
        }
        else if(this.nbOfPublicPejorativeWords > this.nbOfPublicMeliorativeWords){
            this.publicAttitude = 1 - (this.nbOfPublicMeliorativeWords/this.nbOfPublicPejorativeWords);
        }
        else{
            this.publicAttitude = (this.nbOfPublicPejorativeWords/this.nbOfPublicMeliorativeWords)/2;
        }

        //PRIVATE
        if(this.nbOfPrivatePejorativeWords < this.nbOfPrivateMeliorativeWords){
            this.privateAttitude = (this.nbOfPrivatePejorativeWords/this.nbOfPrivateMeliorativeWords)/2;
        }
        else if(this.nbOfPrivatePejorativeWords > this.nbOfPrivateMeliorativeWords){
            this.privateAttitude = 1 - (this.nbOfPrivateMeliorativeWords/this.nbOfPrivatePejorativeWords);
        }
        else{
            this.privateAttitude = (1/2);
        }

        this.sumAttitude = this.publicAttitude + this.privateAttitude;

        //GLOBAL
        let globalNbPejorativeWords = this.nbOfPublicPejorativeWords || 0 + this.nbOfPrivatePejorativeWords || 0;
        let globalNbMeliorativeWords = this.nbOfPublicMeliorativeWords || 0 + this.nbOfPrivateMeliorativeWords || 0;

        if(globalNbPejorativeWords < globalNbMeliorativeWords){
            this.globalAttitude = (globalNbPejorativeWords/globalNbMeliorativeWords)/2;
        }
        else if(globalNbPejorativeWords > globalNbMeliorativeWords){
            this.globalAttitude = 1 - (globalNbMeliorativeWords/globalNbPejorativeWords);
        }
        else{
            this.globalAttitude = (1/2);
        }


        //DISTRIBUTION
        this.publicExpressivityDistribution = this.publicExpressivity/this.globalExpressivity;
        this.privateExpressivityDistribution = this.privateExpressivity/this.globalExpressivity;

        this.publicAttitudeDistribution = this.publicAttitude/this.sumAttitude;
        this.privateAttitudeDistribution = this.privateAttitude/this.sumAttitude;

        return {
            globalData: {
                expressivity: clamp(getNormValue((this.globalExpressivity || 0),0, 500), 0, 1),
                attitude: this.globalAttitude || (1/2),
            },
            publicData: {
                pejorativeWords: this.publicPejorativeWords,
                meliorativeWords: this.publicMeliorativeWords,
                smiley: this.publicSmiley,
                expressivity: clamp(getNormValue((this.publicExpressivity || 0),0, 500), 0, 1),
                attitude: this.publicAttitude || (1/2),
                expressivityDistribution: this.publicExpressivityDistribution,
                attitudeDistribution: this.publicAttitudeDistribution,
            },
            privateData: {
                pejorativeWords: userData.facebook.pejorativeWords || [],
                meliorativeWords: userData.facebook.pejorativeWords || [],
                smiley: userData.facebook.smiley || [],
                expressivity: clamp(getNormValue((this.privateExpressivity || 0),0, 500), 0, 1),
                attitude: this.privateAttitude || (1/2),
                expressivityDistribution: this.privateExpressivityDistribution,
                attitudeDistribution: this.privateAttitudeDistribution,
            },
            professionalData: {
            },
            raw: {
                facebook: {
                    pejorativeWords: userData.facebook.pejorativeWords || [],
                    meliorativeWords: userData.facebook.pejorativeWords || [],
                    smiley: userData.facebook.smiley || [],
                },
                twitter: {
                    pejorativeWords: userData.twitter.pejorativeWords || [],
                    meliorativeWords: userData.twitter.pejorativeWords || [],
                    smiley: userData.twitter.smiley || [],
                },
                linkedin: {
                },
                instagram: {
                    pejorativeWords: userData.instagram.pejorativeWords || [],
                    meliorativeWords: userData.instagram.pejorativeWords || [],
                    smiley: userData.instagram.smiley || [],
                },
            }
        }
    }

    //todo: to finish
    treatPassiveIdentityCircle(){

        this.publicScore = (userData.twitter.userMentions || 0) + (userData.twitter.totalRetweetForUserPosts || 0);
        this.privateScore = (userData.facebook.nbOfComments || 0) + (userData.facebook.nbOfPhotosWhereUserIsIdentified || 0);
        this.sumScore = this.publicScore + this.privateScore;

        //DISTRIBUTION
        this.publicPassiveIdentityDistribution = this.publicScore/this.sumScore;
        this.privatePassiveIdentityDistribution = this.privateScore/this.sumScore;


        return {
            globalData: {
                score: this.sumScore,
            },
            publicData: {
                percentScore: this.publicPassiveIdentityDistribution,
                score: clamp(getNormValue(this.publicScore,0, 500), 0, 1),
                totalRetweetForUserPosts: userData.twitter.totalRetweetForUserPosts || 0 ,
                userMentions: userData.twitter.userMentions || 0,
            },
            privateData: {
                percentScore: this.privatePassiveIdentityDistribution,
                score: clamp(getNormValue(this.privateScore,0, 500), 0, 1),
                nbOfComments: userData.facebook.nbOfComments || 0,
                averageCommentOnPost: userData.facebook.averageCommentOnPost || 0,
                nbOfOtherUsersPostOnFeed: userData.facebook.nbOfOtherUsersPostOnFeed || 0,
                nbOfPhotosWhereUserIsIdentified: userData.facebook.nbOfPhotosWhereUserIsIdentified || 0,
            },
            professionalData: {
            },
            raw: {
                facebook: {
                    nbOfComments: userData.facebook.nbOfComments || 0,
                    averageCommentOnPost: userData.facebook.averageCommentOnPost || 0,
                    nbOfOtherUsersPostOnFeed: userData.facebook.nbOfOtherUsersPostOnFeed || 0,
                    nbOfPhotosWhereUserIsIdentified: userData.facebook.nbOfPhotosWhereUserIsIdentified || 0,
                },
                twitter: {
                    totalRetweetForUserPosts: userData.twitter.totalRetweetForUserPosts || 0,
                    userMentions: userData.twitter.userMentions || 0,
                },
                linkedin: {
                },
                instagram: {
                },
            }
        }
    }

    treatHobbiesCircle(userData){
        this.publicMostUsedHashtags = joinWordsOccs((userData.instagram.mostUsedHashtags || []), (userData.twitter.mostUsedHashtags || []));
        this.hobbiesVolume = (userData.facebook.nbOfPagesLiked || 0) + (userData.facebook.nbOfMoviesLiked || 0)
            + (userData.facebook.nbOfBooksLiked || 0) + (userData.facebook.nbOfArtistsLiked || 0);

        /*this.publicMostUsedHashtags = userData.instagram.mostUsedHashtags.concat(userData.twitter.mostUsedHashtags);
        this.hobbiesVolume = userData.facebook.nbOfPagesLiked + userData.facebook.nbOfMoviesLiked
                            + userData.facebook.nbOfBooksLiked + userData.facebook.nbOfArtistsLiked;*/

        return {
            globalData: {
                hobbiesVolume: clamp(getNormValue(this.hobbiesVolume,0, 500), 0, 1),
            },
            publicData: {
                mostUsedHashtags: this.publicMostUsedHashtags,
            },
            privateData: {
                favoriteArtists: userData.facebook.favoriteArtists || '',
                lastMoviesSeen: userData.facebook.lastMoviesSeen || '',
                pagesCategoryLiked: userData.facebook.pagesCategoryLiked || '',
                nbOfPagesLiked: userData.facebook.nbOfPagesLiked || 0,
                nbOfBooksLiked: userData.facebook.nbOfBooksLiked || 0,
                nbOfMoviesLiked: userData.facebook.nbOfMoviesLiked || 0,
                nbOfArtistsLiked: userData.facebook.nbOfArtistsLiked || 0,
            },
            professionalData: {
            },
            raw: {
                facebook: {
                    favoriteArtists: userData.facebook.favoriteArtists || '',
                    lastMoviesSeen: userData.facebook.lastMoviesSeen || '',
                    pagesCategoryLiked: userData.facebook.pagesCategoryLiked || '',
                    nbOfPagesLiked: userData.facebook.nbOfPagesLiked || 0,
                    nbOfBooksLiked: userData.facebook.nbOfBooksLiked || 0,
                    nbOfMoviesLiked: userData.facebook.nbOfMoviesLiked || 0,
                    nbOfArtistsLiked: userData.facebook.nbOfArtistsLiked || 0,
                },
                twitter: {
                    mostUsedHashtags: userData.twitter.mostUsedHashtags || '',
                },
                linkedin: {
                },
                instagram: {
                    mostUsedHashtags: userData.instagram.mostUsedHashtags || '',
                },
            }
        }
    }

    function getNormValue(val, min, max){
        return (val - min)/(max - min);
    }
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    //Get total of values
    function getTotal(data, {facebook, twitter, instagram, linkedin}) {
        const fbValue = data.facebook && data.facebook[facebook] ? data.facebook[facebook] : 0;
        const twValue = data.twitter && data.twitter[twitter] ? data.twitter[twitter] : 0;
        const instaValue = data.instagram && data.instagram[instagram] ? data.instagram[instagram] : 0;
        const linkedinValue = data.linkedin && data.linkedin[linkedin] ? data.linkedin[linkedin] : 0;

        return fbValue + twValue + instaValue + linkedinValue;
    }

    //Get average of values
    function getAverage(data, {facebook, twitter, instagram, linkedin}) {
        const total = getTotal(data, { facebook, twitter, instagram, linkedin });
        let count = 0;

        if (data.facebook && data.facebook[facebook])
            count++;
        if (data.twitter && data.twitter[twitter])
            count++;
        if (data.instagram && data.instagram[instagram])
            count++;
        if (data.linkedin && data.linkedin[linkedin])
            count++;

        return count > 0 ? total / count : 0;
    }

    function joinWordsOccs(...wordOccsArray) {
        return wordOccsArray.reduce((res, wordsOccs) => {
            wordsOccs.forEach(wordsOcc => {
                if (!res[wordsOcc.word]) {
                    res[wordsOcc.word] = 0;
                }
                res[wordsOcc.word] += wordsOcc.occ;
            });

            return res;
        }, {});
    }

    getData(userData) {
      return {
        activity: this.treatActivityCircle(userData),
        influence: this.treatInfluenceCircle(userData),
      }
    }
};
