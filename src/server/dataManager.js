'use strict';

const Bluebird = require('bluebird');

const dbg = require('debug')('anamorph:dataManager');

module.exports = class DataManager {
    constructor() {
      dbg('Initializing new DataManager');
    }

    validConnections(userData) {
        dbg('Valid Connections');
        //(this.userData || 1) = userData;

        return new Bluebird((resolve, reject) => {
          userData.events.on('allDataFetched', () => {
            dbg('allDataFetched event fired');
            resolve(this.getData(userData.data));
            //resolve(JSON.stringify(this.getData(userData.data)));
          });

          userData.terminate();
        });
    }

    treatActivityCircle(userData){
        this.globalNbOfPhotos = this.getTotal(userData, {facebook: 'nbOfPhotos', twitter: 'nbOfPhotos', instagram: 'numberOfUserPhotos'});
        this.globalNbOfShares = this.getTotal(userData, {facebook: 'nbOfShares', twitter: 'totalRetweets'});
        this.globalNbOfPosts = this.getTotal(userData, {facebook: 'nbOfPosts', twitter: 'nbOfPosts', instagram: 'nbOfPosts'});
        this.globalPostFrequency = this.getTotal(userData, {facebook: 'frequency', twitter: 'frequency', instagram: 'frequency'});

        this.publicNbOfPhotos = this.getTotal(userData, {twitter: 'nbOfPhotos', instagram: 'numberOfUserPhotos'});
        this.publicNbOfPosts = this.getTotal(userData, {twitter: 'nbOfPosts', instagram: 'nbOfPosts'});
        this.publicPostFrequency = this.getTotal(userData, {twitter: 'frequency', instagram: 'frequency'});

        //DOMINANT PROFILE
        if((userData.facebook.nbOfPosts || 0) > (userData.instagram.nbOfPosts || 0)
            && (userData.facebook.nbOfPosts || 0) > (userData.twitter.nbOfPosts || 0)){
            this.dominantProfile = 'private';
        }
        else if((userData.instagram.nbOfPosts || 0) > (userData.facebook.nbOfPosts || 0)
            && (userData.instagram.nbOfPosts || 0) > (userData.twitter.nbOfPosts || 0)){
            this.dominantProfile = 'public';
        }
        else if((userData.twitter.nbOfPosts || 0) > (userData.facebook.nbOfPosts || 0)
            && (userData.twitter.nbOfPosts || 0) > (userData.instagram.nbOfPosts || 0)){
            this.dominantProfile = 'public';
        }
        else{
            this.dominantProfile = 'pro';
        }

        //PROFILE TYPE
        //*30 = per month
        if(this.globalPostFrequency*30 < 20){
            this.typeProfile = "Publication peu fr�quente";
        }
        else if(this.globalPostFrequency*30 >= 20 && this.globalPostFrequency*30 < 40){
            this.typeProfile = "Publication fr�quente";
        }
        else if(this.globalPostFrequency*30 >= 40){
            this.typeProfile = "Publication tr�s fr�quente";
        }

        //DISTRIBUTION
        this.publicFrequencyDistribution = this.publicPostFrequency/(this.globalPostFrequency || 1);
        this.privateFrequencyDistribution = (userData.facebook.frequency || 0)/(this.globalPostFrequency || 1);

        this.publicVolumeDistribution = this.publicNbOfPosts/(this.globalNbOfPosts || 1);
        this.privateVolumeDistribution = (userData.facebook.nbOfPosts || 0)/(this.globalNbOfPosts || 1);

        return {
            globalData: {
                postFrequency: this.globalPostFrequency || 0,
                postFrequencyScore: this.clamp(this.getNormValue(this.globalPostFrequency || 0, 0, 500), 0, 1),
                nbOfPhotos: this.globalNbOfPhotos,
                volumePhotos: this.clamp(this.getNormValue(this.globalNbOfPhotos || 0, 0, 500), 0, 1),
                nbOfShares: this.globalNbOfShares,
                nbOfPosts: this.globalNbOfPosts,
                volumePosts: this.clamp(this.getNormValue(this.globalNbOfPosts,0, 500), 0, 1),
                seniority: userData.facebook.activeUserSince || 0,
                dominantProfile: this.dominantProfile,
                typeProfile: this.typeProfile,
            },
            publicData: {
                postFrequency: this.publicPostFrequency || 0,
                postFrequencyScore: this.clamp(this.getNormValue(this.publicPostFrequency, 0, 500), 0, 1),
                nbOfShare: userData.twitter.totalRetweets || 0,
                nbOfPosts: this.publicNbOfPosts,
                volumePosts: this.clamp(this.getNormValue((this.publicNbOfPosts || 0),0, 500), 0, 1),
                nbOfPhotos: this.publicNbOfPhotos,
                volumePhotos: this.clamp(this.getNormValue(this.publicNbOfPhotos || 0,0,500), 0, 1),
                frequencyDistribution: this.publicFrequencyDistribution,
                volumeDistribution: this.publicVolumeDistribution,
            },
            privateData: {
                postFrequency: userData.facebook.frequency || 0,
                postFrequencyScore: this.clamp(this.getNormValue(userData.facebook.frequency || 0,0, 500), 0, 1),
                nbOfPhotos: userData.facebook.nbOfPhotos,
                volumePhotos: this.clamp(this.getNormValue((userData.facebook.nbOfPhotos || 0),0, 500), 0, 1),
                nbOfShare: userData.facebook.nbOfShares || 0,
                nbOfPosts: userData.facebook.nbOfPosts,
                volumePosts: this.clamp(this.getNormValue((userData.facebook.nbOfPosts || 0),0, 500), 0, 1),
                frequencyDistribution: this.privateFrequencyDistribution,
                volumeDistribution: this.privateVolumeDistribution,
            },
            professionalData: {
                postFrequency: 0,
                postFrequencyScore: 0,
                nbOfPhotos: 0,
                volumePhotos: 0,
                nbOfShare: 0,
                nbOfPosts: 0,
                volumePosts: 0,
                frequencyDistribution: 0,
                volumeDistribution: 0,
            },
            raw: {
                facebook: {
                    nbOfPhotos: userData.facebook.nbOfPhotos || 0,
                    nbOfShare: userData.facebook.nbOfShares || 0,
                    nbOfPosts: userData.facebook.nbOfPosts || 0,
                    postFrequency: userData.facebook.frequency || 0,
                },
                twitter: {
                    nbOfPhotos: userData.twitter.nbOfPhotos || 0,
                    nbOfShare: userData.twitter.totalRetweets || 0,
                    nbOfPosts: userData.twitter.totalTweets || 0,
                    postFrequency: userData.twitter.frequency || 0,
                },
                linkedin: {},
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

        this.publicNbOfFollowers = this.getTotal(userData, {twitter: 'numberOfFollowers', instagram: 'numberOfUserFollowers'});
        this.publicNbOfLikes = this.getTotal(userData, {twitter: 'totalLikesForUserPosts', instagram: 'nbOfLikes'});
        this.publicAverageFeedbackOnPost = this.getTotal(userData, {twitter: 'averageLikePerUserPost', instagram: 'averageOfGetLikes'})
            + this.getTotal(userData, {twitter: 'averageRetweetPerUserPost', instagram: 'averageOfGetComments'});;


        this.publicInfluence = this.publicNbOfFollowers || 0 + this.publicNbOfLikes || 0 + (userData.instagram.nbOfComments || 0) + (userData.twitter.totalRetweets || 0);
        this.privateInfluence = userData.facebook.nbOfFriends || 0 + (userData.facebook.nbOfComments || 0) + (userData.facebook.nbOfLike || 0);
        this.globalInfluence = this.publicInfluence || 0 + this.privateInfluence || 0;


        //DISTRIBUTION
        this.publicInfluenceDistribution = this.publicInfluence/(this.globalInfluence || 1);
        this.privateInfluenceDistribution = this.privateInfluence/(this.globalInfluence || 1);


        this.globalAverageFeedbackOnPost = this.publicAverageFeedbackOnPost + this.privateAverageFeedbackOnPost;

        return {
            globalData: {
                influence: this.clamp(this.getNormValue(this.globalInfluence,0,500), 0, 1),
                nbOfLikes: this.publicNbOfLikes + userData.facebook.nbOfLike,
                averageFeedbackOnPost: this.globalAverageFeedbackOnPost,
            },
            publicData: {
                influence: this.clamp(this.getNormValue(this.publicInfluence,0, 500), 0, 1),
                nbOfFollowers: this.publicNbOfFollowers,
                nbOfRetweets: userData.twitter.totalRetweets || 0,
                nbOfLikes: this.publicNbOfLikes,
                likesScore: this.clamp(this.getNormValue(this.publicNbOfLikes,0, 3076), 0, 1),
                averageFeedbackOnPost: this.publicAverageFeedbackOnPost,
                mostPopularPhoto: userData.instagram.mostPopularPhoto || '',
                mostPopularTweet: userData.twitter.mostPopularTweet || '',
                influenceDistribution: this.publicInfluenceDistribution,
            },
            privateData: {
                influence: this.clamp(this.getNormValue(this.privateInfluence,0, 500), 0, 1),
                nbOfLikes: userData.facebook.nbOfLike,
                likesScore: this.clamp(this.getNormValue((userData.facebook.nbOfLike || 0),0, 1000), 0, 1),
                nbOfFriends: userData.facebook.nbOfFriends || 0,
                averageFeedbackOnPost: this.privateAverageFeedbackOnPost,
                lessPopularPost: userData.facebook.lessPopularPost || '',
                mostPopularPost: userData.facebook.mostPopularPost || '',
                lessPopularPhoto: userData.facebook.lessPopularPhoto || '',
                mostPopularPhoto: userData.facebook.mostPopularPhoto || '',
                influenceDistribution: this.privateInfluenceDistribution,
            },
            professionalData: {
                influence: 0,
                nbOfLikes: 0,
                likesScore: 0,
                nbOfFriends: 0,
                averageFeedbackOnPost: 0,
                lessPopularPost: '',
                mostPopularPost: '',
                lessPopularPhoto: '',
                mostPopularPhoto: '',
                influenceDistribution: 0,
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
                    nbOfConnections: userData.linkedin.connections || 0,
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

        this.publicPejorativeWords =  this.joinWordsOccs((userData.instagram.pejorativeWords || []), (userData.twitter.pejorativeWords || []));
        this.publicMeliorativeWords = this.joinWordsOccs((userData.instagram.meliorativeWords || []), (userData.twitter.meliorativeWords || []));
        this.publicSmiley = this.joinWordsOccs((userData.instagram.smiley || []), (userData.twitter.smiley || []));

        //PUBLIC
        if(this.publicPejorativeWords){
            this.nbOfPublicPejorativeWords = Object.keys(this.publicPejorativeWords).reduce((sum, value) => {
                sum = sum + this.publicPejorativeWords[value].occ;
                return sum;
            }, 0);
        }

        if(this.publicMeliorativeWords){
            this.nbOfPublicMeliorativeWords = Object.keys(this.publicMeliorativeWords).reduce((sum, value) => {
                sum = sum + this.publicMeliorativeWords[value].occ;
                return sum;
            }, 0);
        }

        //PRIVATE
        if(userData.facebook.pejorativeWords){
            this.nbOfPrivatePejorativeWords = Object.keys(userData.facebook.pejorativeWords).reduce((sum, value) => {
                sum = sum + userData.facebook.pejorativeWords[value].occ;
                return sum;
            }, 0);
        }

        if(userData.facebook.meliorativeWords){
            this.nbOfPrivateMeliorativeWords = Object.keys(userData.facebook.meliorativeWords).reduce((sum, value) => {
                sum = sum + userData.facebook.meliorativeWords[value].occ;
                return sum;
            }, 0);
        }

        //EXPRESSIVITY
        let publicExpressivityTab = Object.assign(this.publicPejorativeWords, this.publicMeliorativeWords, this.publicSmiley);
        let privateExpressivityTab = this.joinWordsOccs((userData.facebook.pejorativeWords || []), (userData.facebook.meliorativeWords || []), (userData.facebook.smiley || []));


        if(publicExpressivityTab){
            this.publicExpressivity = Object.keys(publicExpressivityTab).reduce((sum, value) => {
                sum = sum + publicExpressivityTab[value];
                return sum;
            }, 0);
        }

        if(privateExpressivityTab){
            this.privateExpressivity = Object.keys(privateExpressivityTab).reduce((sum, value) => {
                sum = sum + privateExpressivityTab[value];
                return sum;
            }, 0);
        }

        this.globalExpressivity = this.publicExpressivity || 0 + this.privateExpressivity || 0;


        //ATTITUDE
        //PUBLIC
        if(this.nbOfPublicPejorativeWords < this.nbOfPublicMeliorativeWords){
            this.publicAttitude = (this.nbOfPublicPejorativeWords/(this.nbOfPublicMeliorativeWords || 1))/2;
        }
        else if(this.nbOfPublicPejorativeWords > this.nbOfPublicMeliorativeWords){
            this.publicAttitude = 1 - (this.nbOfPublicMeliorativeWords/(this.nbOfPublicPejorativeWords || 1));
        }
        else{
            this.publicAttitude = (1/2);
        }

        //PRIVATE
        if(this.nbOfPrivatePejorativeWords < this.nbOfPrivateMeliorativeWords){
            this.privateAttitude = (this.nbOfPrivatePejorativeWords/(this.nbOfPrivateMeliorativeWords || 1))/2;
        }
        else if(this.nbOfPrivatePejorativeWords > this.nbOfPrivateMeliorativeWords){
            this.privateAttitude = 1 - (this.nbOfPrivateMeliorativeWords/(this.nbOfPrivatePejorativeWords || 1));
        }
        else{
            this.privateAttitude = (1/2);
        }

        this.sumAttitude = (this.publicAttitude || 0) + (this.privateAttitude || 0);

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
        this.publicExpressivityDistribution = this.publicExpressivity / (this.globalExpressivity || 1);
        this.privateExpressivityDistribution = this.privateExpressivity / (this.globalExpressivity || 1);

        this.publicAttitudeDistribution = this.publicAttitude / (this.sumAttitude || 1);
        this.privateAttitudeDistribution = this.privateAttitude / (this.sumAttitude || 1);

        return {
            globalData: {
                expressivity: this.clamp(this.getNormValue((this.globalExpressivity || 0),0, 500), 0, 1),
                attitude: this.globalAttitude || (1/2),
            },
            publicData: {
                pejorativeWords: this.publicPejorativeWords,
                meliorativeWords: this.publicMeliorativeWords,
                smiley: this.publicSmiley,
                expressivity: this.clamp(this.getNormValue((this.publicExpressivity || 0),0, 500), 0, 1),
                attitude: this.publicAttitude || (1/2),
                expressivityDistribution: this.publicExpressivityDistribution,
                attitudeDistribution: this.publicAttitudeDistribution || 0,
            },
            privateData: {
                pejorativeWords: userData.facebook.pejorativeWords || [],
                meliorativeWords: userData.facebook.meliorativeWords || [],
                smiley: userData.facebook.smiley || [],
                expressivity: this.clamp(this.getNormValue((this.privateExpressivity || 0),0, 500), 0, 1),
                attitude: this.privateAttitude || (1/2),
                expressivityDistribution: this.privateExpressivityDistribution,
                attitudeDistribution: this.privateAttitudeDistribution || 0,
            },
            professionalData: {
                pejorativeWords: [],
                meliorativeWords:[],
                smiley: [],
                expressivity: 0,
                attitude: (1/2),
                expressivityDistribution: 0,
                attitudeDistribution: 0,
            },
            raw: {
                facebook: {
                    pejorativeWords: userData.facebook.pejorativeWords || [],
                    meliorativeWords: userData.facebook.meliorativeWords || [],
                    smiley: userData.facebook.smiley || [],
                },
                twitter: {
                    pejorativeWords: userData.twitter.pejorativeWords || [],
                    meliorativeWords: userData.twitter.meliorativeWords || [],
                    smiley: userData.twitter.smiley || [],
                },
                linkedin: {},
                instagram: {
                    pejorativeWords: userData.instagram.pejorativeWords || [],
                    meliorativeWords: userData.instagram.pejorativeWords || [],
                    smiley: userData.instagram.smiley || [],
                },
            }
        }
    }

    //todo: to finish
    treatPassiveIdentityCircle(userData){

        this.publicScore = (userData.twitter.userMentions || 0) + (userData.twitter.totalRetweetForUserPosts || 0);
        this.privateScore = (userData.facebook.nbOfComments || 0) + (userData.facebook.nbOfPhotosWhereUserIsIdentified || 0);
        this.sumScore = this.publicScore + this.privateScore;

        //DISTRIBUTION
        this.publicPassiveIdentityDistribution = this.publicScore/(this.sumScore || 1);
        this.privatePassiveIdentityDistribution = this.privateScore/(this.sumScore || 1);


        return {
            globalData: {
                score: this.clamp(this.getNormValue(this.sumScore,0, 900), 0, 1),
            },
            publicData: {
                percentDistribution: this.publicPassiveIdentityDistribution,
                score: this.clamp(this.getNormValue(this.publicScore,0, 600), 0, 1),
                totalRetweetForUserPosts: userData.twitter.totalRetweetForUserPosts || 0 ,
                userMentions: userData.twitter.userMentions || 0,
            },
            privateData: {
                percentDistribution: this.privatePassiveIdentityDistribution,
                score: this.clamp(this.getNormValue(this.privateScore,0, 130), 0, 1),
                nbOfComments: userData.facebook.nbOfComments || 0,
                averageCommentOnPost: userData.facebook.averageCommentOnPost || 0,
                nbOfOtherUsersPostOnFeed: userData.facebook.nbOfOtherUsersPostOnFeed || 0,
                nbOfPhotosWhereUserIsIdentified: userData.facebook.nbOfPhotosWhereUserIsIdentified || 0,
            },
            professionalData: {
                percentDistribution: 0,
                score: 0.3,
                nbOfComments: 45,
                averageCommentOnPost: 0,
                nbOfOtherUsersPostOnFeed: 0,
                nbOfPhotosWhereUserIsIdentified: 0,
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
                linkedin: {},
                instagram: {},
            }
        }
    }

    treatHobbiesCircle(userData){
        this.publicMostUsedHashtags = userData.instagram.mostUsedHashtags ? userData.instagram.mostUsedHashtags.concat(userData.twitter.mostUsedHashtags) : [];
        this.hobbiesVolume = (userData.facebook.nbOfPagesLiked || 0) + (userData.facebook.nbOfMoviesLiked || 0)
            + (userData.facebook.nbOfBooksLiked || 0) + (userData.facebook.nbOfArtistsLiked || 0);

        return {
            globalData: {
                hobbiesVolume: this.clamp(this.getNormValue(this.hobbiesVolume,0, 500), 0, 1),
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
                favoriteArtists: '',
                lastMoviesSeen: '',
                pagesCategoryLiked: '',
                nbOfPagesLiked: 0,
                nbOfBooksLiked: 0,
                nbOfMoviesLiked: 0,
                nbOfArtistsLiked: 0,
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
                linkedin: {},
                instagram: {
                    mostUsedHashtags: userData.instagram.mostUsedHashtags || '',
                },
            }
        }
    }

    treatGeneral(userData){

        this.publicDistribution = (this.publicFrequencyDistribution + this.publicVolumeDistribution + this.publicInfluenceDistribution +
            this.publicExpressivityDistribution + this.publicAttitudeDistribution + this.publicPassiveIdentityDistribution)/6;

        this.privateDistribution = (this.privateFrequencyDistribution + this.privateVolumeDistribution + this.privateInfluenceDistribution +
            this.privateExpressivityDistribution + this.privateAttitudeDistribution + this.privatePassiveIdentityDistribution)/6;

        if(this.publicDistribution > this.privateDistribution){
            if(this.publicDistribution > 75){
                this.primaryCircle = this.secondaryCircle = 'public';
            }
            else{
                this.primaryCircle = 'public';
                this.secondaryCircle = 'public';
            }
        }
        else if(this.privateDistribution > this.publicDistribution){
            if(this.privateDistribution > 75){
                this.primaryCircle = this.secondaryCircle = 'private';
            }
            else{
                this.primaryCircle = 'private';
                this.secondaryCircle = 'public';
            }
        }

        return {
            globalData: {
                primaryCircle: this.primaryCircle,
                secondaryCircle: this.secondaryCircle,
            },
            raw: {
                facebook: {
                    name: userData.facebook.name || '',
                    ageMin: userData.facebook.age_min || '',
                },
                twitter: {
                    pseudo: userData.twitter.pseudo || '',
                },
                linkedin: {},
                instagram: {
                    pseudo: userData.instagram.pseudo || '',
                },
            }
        }
    }

    getNormValue(val, min, max){
        return (val - min)/(max - min);
    }
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    //Get total of values
    getTotal(data, options) {
        const fbValue = data.facebook && data.facebook[options.facebook] ? data.facebook[options.facebook] : 0;
        const twValue = data.twitter && data.twitter[options.twitter] ? data.twitter[options.twitter] : 0;
        const instaValue = data.instagram && data.instagram[options.instagram] ? data.instagram[options.instagram] : 0;
        const linkedinValue = data.linkedin && data.linkedin[options.linkedin] ? data.linkedin[options.linkedin] : 0;

        return fbValue + twValue + instaValue + linkedinValue;
    }

    //Get average of values
    getAverage(data, options) {
        let facebook = options.facebook;
        let twitter = options.twitter;
        let instagram = options.instagram;
        let linkedin = options.linkedin;

        const total = this.getTotal(data, { facebook, twitter, instagram, linkedin });
        let count = 0;

        if (data.facebook && data.facebook[options.facebook])
            count++;
        if (data.twitter && data.twitter[options.twitter])
            count++;
        if (data.instagram && data.instagram[options.instagram])
            count++;
        if (data.linkedin && data.linkedin[options.linkedin])
            count++;

        return count > 0 ? total / count : 0;
    }

    joinWordsOccs() {
        return [].reduce.call(arguments, (res, wordsOccs) => {
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
        if (!userData.facebook) {
            dbg('FACEBOOK UNDEFINED');
            userData.facebook = {};
        }
        if (!userData.twitter) {
            dbg('TWITTER UNDEFINED');
            userData.twitter = {};
        }
        if (!userData.instagram) {
            dbg('INSTAGRAM UNDEFINED');
            userData.instagram = {};
        }
        if (!userData.linkedin) {
            dbg('LINKEDIN UNDEFINED');
            userData.linkedin = {};
        }

      return {
        activity: this.treatActivityCircle(userData),
        influence: this.treatInfluenceCircle(userData),
        mood: this.treatMoodCircle(userData),
        passiveIdentity: this.treatPassiveIdentityCircle(userData),
        hobbies: this.treatHobbiesCircle(userData),
        general: this.treatGeneral(userData),
      }
    }
};
