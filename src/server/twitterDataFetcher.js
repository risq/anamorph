'use strict';

const Bluebird = require('bluebird');

const dbg = require('debug')('anamorph:twitterDataFetcher');

module.exports = class TwitterDataFetcher {
    constructor(api, tokens, user) {
        dbg('Initializing new TwitterDataFetcher');

        this.api = api;
        this.tokens = tokens;
        this.user = user;

        this.data = {
            pseudo: '',
            numberOfFollowers: 0,
            numberOfFriends: 0,
            totalTweetsAndRetweets: 0,
            nbOfPosts: 0,
            totalTweets: 0,
            totalRetweets: 0,
            averageRetweetPerUserPost: 0,
            averageLikePerUserPost: 0,
            mostPopularTweet: '',
            mostUsedHashtags: [],
            totalRetweetForUserPosts: 0,
            totalLikesForUserPosts: 0,
            usedHashtags: [],
            pejorativeWords: [],
            meliorativeWords: [],
            smiley: [],
            nbOfPhotos: 0,
            userLikes: 0,
            userMentions: 0,
            frequency: [],
        };

        this.datePosts = [];

        this.pejorativeWordsList = ['horrible', 'nul', 'ringard', 'bof', 'con', 'd�bile', 'merde'];
        this.meliorativeWordsList = ['cool', 'super', 'chanm�', 'g�nial', 'magnifique', 'beau', 'content', 'gentil'];
    }

    fetch() {
        dbg('Fetching twitter data');
        return this.fetchUserInformation()
            .then(() => this.fetchUserSettings())
            .then(() => this.fetchUserTweets())
            .then(() => this.fetchUserMentions())
            .then(() => this.fetchUserLikedTweets())
            .then(() => this.fetchPostsFrequency())
            .catch(err => dbg(err));
    }

    //Get the user information
    fetchUserInformation() {
        dbg('Fetching user');

        return new Bluebird((resolve, reject) => {
            this.api.users('show', {user_id: this.user.user_id},
                this.tokens.accessToken,
                this.tokens.accessTokenSecret,
                (err, data) => {
                    if (err) {
                        dbg('error: ', err);
                        reject(err);
                    } else {
                        this.data.numberOfFollowers = data.followers_count;
                        this.data.totalTweets = data.statuses_count;
                        this.data.nbOfPosts = this.data.totalTweets;
                        this.data.numberOfFriends = data.friends_count;
                        dbg(`Total tweets: ${this.data.totalTweets}`);
                        dbg(`Found ${this.data.numberOfFollowers} followers`);
                        dbg(`Found ${this.data.numberOfFriends} friends`);
                        resolve(this.data);
                    }
                }
            );
        });
    }

    //Get the user information
    fetchUserSettings() {
        dbg('Fetching user settings');

        return new Bluebird((resolve, reject) => {
            this.api.account('settings', {user_id: this.user.user_id},
                this.tokens.accessToken,
                this.tokens.accessTokenSecret,
                (err, data) => {
                    if (err) {
                        dbg('error: ', err);
                        reject(err);
                    } else {
                        this.data.pseudo = data.screen_name;
                        dbg(`Pseudo ${this.data.pseudo}`);
                        resolve(this.data);
                    }
                }
            );
        });
    }

    //Get the user's tweets (max: 200)
    fetchUserTweets() {
        dbg('Fetching user tweets');
        let wordList = [];
        let sentences = [];

        return new Bluebird((resolve, reject) => {
            //Best practice to set include_rts: 1 -> to get retweets
            this.api.getTimeline('user_timeline', {user_id: this.user.user_id, count: 200, include_rts: 1},
                this.tokens.accessToken,
                this.tokens.accessTokenSecret,
                (err, data) => {
                    if (err) {
                        dbg('error: ', err);
                        reject(err);
                    } else {

                        if (data) {
                            this.data.totalTweetsAndRetweets = data.length;
                        }
                        else {
                            this.data.totalTweetsAndRetweets = 0;
                        }

                        dbg(`Found ${this.data.totalTweetsAndRetweets} tweets + retweets`);

                        data.forEach((data => {

                            if (data.retweeted == true) {
                                this.data.totalRetweets += 1;
                            }
                            else {
                                //this.data.totalTweets += 1;
                            }

                            this.data.totalRetweetForUserPosts += data.retweet_count;
                            this.data.totalLikesForUserPosts += data.favorite_count;

                            data.entities.hashtags.forEach((hashtag) => {
                                wordList.push(hashtag.text);
                            });

                            if (data.entities.media) {
                                this.data.nbOfPhotos += data.entities.media.length;
                            }

                            //GET MOST POPULAR TWEET
                            if(data.favorite_count > this.mostLikedTweet && data.text){
                                this.data.mostPopularTweet = data.text;
                                this.mostLikedTweet = data.favorite_count;
                            }
                            else if(this.data.mostPopularTweet == '' && data.text){
                                this.data.mostPopularTweet = data.text;
                                this.mostLikedTweet = data.favorite_count;
                            }

                            sentences.push(data.text);
                        }));

                        //this.data.nbOfPosts = this.data.totalTweets;

                        //dbg(`Total tweets: ${this.data.totalTweets}`);
                        dbg(`Total retweets: ${this.data.totalRetweets}`);
                        dbg(`Number of photos: ${this.data.nbOfPhotos}`);

                        this.data.averageRetweetPerUserPost = (this.data.totalRetweetForUserPosts / this.data.totalTweetsAndRetweets);
                        this.data.averageLikePerUserPost = (this.data.totalLikesForUserPosts / this.data.totalTweetsAndRetweets);

                        dbg(`Total retweets for user posts: ${this.data.totalRetweetForUserPosts}`);
                        dbg(`Total likes or user posts: ${this.data.totalLikesForUserPosts}`);

                        dbg(`Average of retweets per post: ${this.data.averageRetweetPerUserPost}`);
                        dbg(`Average of likes per post: ${this.data.averageLikePerUserPost}`);

                        dbg(`Most popular tweet: ${this.data.mostPopularTweet}`);

                        //Get the most used hashtags
                        var wordAssociation = this.getWordFrequency(wordList);
                        for(var i=0; i<3; i++){
                            this.data.mostUsedHashtags.push(wordAssociation[i]);
                        }
                        dbg('Most used hashtags:');
                        dbg(this.data.mostUsedHashtags);


                        //Get pejorative and meliorative words in sentence
                        this.joinSentences = sentences.join(' ').toLowerCase();
                        this.data.pejorativeWords = this.getWordsFrequencyInContent(this.pejorativeWordsList, this.joinSentences);
                        this.data.meliorativeWords = this.getWordsFrequencyInContent(this.meliorativeWordsList, this.joinSentences);
                        this.data.smiley = this.getSmileyFrequencyInContent(this.joinSentences);

                        dbg(`Pejorative words used`);
                        if(this.data.pejorativeWords){
                            this.data.pejorativeWords.forEach((data => {
                                dbg(data);
                            }));
                        }
                        dbg(`Meliorative words used`);
                        if(this.data.meliorativeWords){
                            this.data.meliorativeWords.forEach((data => {
                                dbg(data);
                            }));
                        }

                        dbg(`Smiley used`);
                        dbg(this.data.smiley);

                        resolve(this.data);
                    }
                }
            );
        });
    }

    //Get word frequency for used hashtags and sort them in array (bigger to smaller)
    getWordFrequency(wordList){
        var a = [], b = [], prev;

        wordList.sort();
        for ( var i = 0; i < wordList.length; i++ ) {
            if ( wordList[i] !== prev ) {
                a.push(wordList[i]);
                b.push(1);
            } else {
                b[b.length-1]++;
            }
            prev = wordList[i];
        }

        //Associate the words with their occurrence
        var associated = a.reduce(function (previous, key, index) {
            previous[key] = b[index];
            return previous
        }, {});

        //Sort and reverse the associated array
        var tupleArray = [];
        for (var key in associated) tupleArray.push([key, associated[key]]);
        tupleArray.sort(function (a, b) { return a[1] - b[1] }).reverse();

        return tupleArray;
    }

    getWordsFrequencyInContent(wordsToFind, content){
        //const wordsToFind = ['mot1', 'mot2', 'mot3'];
        wordsToFind = wordsToFind.map(word => `\\b(${word})\\b`);
        const re = new RegExp(wordsToFind.join('|'), 'gi');
        const str = content;

        if(str.match(re)){
            const res = str.match(re).reduce((result, word) => {
                if (!result[word]) {
                    result[word] = 0;
                }
                result[word]++;
                return result;
            }, {});

            const sortedRes = Object.keys(res).map(word => {
                return {
                    word,
                    occ: res[word]
                };
            }).sort((a, b) => a.occ < b.occ);

            return sortedRes;
        }
    }

    getSmileyFrequencyInContent(content){
        let smileyToFind = ['=D', ':D', ":\\)", ':\\(', '^^', '\\s:\\/'];
        smileyToFind = smileyToFind.map(smiley => `(${smiley})`);
        const re = new RegExp(smileyToFind.join('|'), 'gi');
        const str = content;

        if(str.match(re)){
            const res = str.match(re).reduce((result, smiley) => {
                if (!result[smiley]) {
                    result[smiley] = 0;
                }
                result[smiley]++;
                return result;
            }, {});

            const sortedRes = Object.keys(res).map(smiley => {
                return {
                    smiley,
                    occ: res[smiley]
                };
            }).sort((a, b) => a.occ < b.occ);

            return sortedRes;
        }
    }

    //Get the user mentions (max: 800)
    fetchUserMentions() {
        dbg('Fetching user mentions');

        return new Bluebird((resolve, reject) => {
            this.api.getTimeline('mentions_timeline', {count: 200},
                this.tokens.accessToken,
                this.tokens.accessTokenSecret,
                (err, data) => {
                    if (err) {
                        dbg('error: ', err);
                        reject(err);
                    } else {
                        this.data.userMentions = data.length;

                        dbg(`Found ${this.data.userMentions} mentions`);
                        resolve(this.data);
                    }
                }
            );
        });
    }

    //Get the most recent liked (favorites) tweets (max: 200)
    fetchUserLikedTweets() {
        dbg('Fetching user likes');

        return new Bluebird((resolve, reject) => {
            //Best practice to set include_rts: 1
            this.api.favorites('list', {user_id: this.user.user_id, count: 200},
                this.tokens.accessToken,
                this.tokens.accessTokenSecret,
                (err, data) => {
                    if (err) {
                        dbg('error: ', err);
                        reject(err);
                    } else {
                        this.data.userLikes = data.length;

                        dbg(`Found ${this.data.userLikes} user likes`);
                        resolve(this.data);
                    }
                }
            );
        });
    }

    fetchPostsFrequency() {
        dbg('Retrieving posts frequency');

        return new Bluebird((resolve, reject) => {
            //Best practice to set include_rts: 1 -> to get retweets
            this.api.getTimeline('user_timeline', {user_id: this.user.user_id, count: 200, include_rts: 1},
                this.tokens.accessToken,
                this.tokens.accessTokenSecret,
                (err, data) => {
                    if (err) {
                        dbg('error: ', err);
                        reject(err);
                    } else {

                        data.forEach((data => {
                            var date = new Date(data.created_at);
                            var year = 'y'+ date.getFullYear();

                            if (typeof(this.datePosts[year]) != 'undefined') {
                                this.datePosts[year] += 1;
                            } else {
                                this.datePosts[year] = 0;
                                this.datePosts[year] += 1;
                            }

                        }));

                        //Calculate the number of day since the beginning of the current year
                        var now = new Date();
                        var start = new Date(now.getFullYear(), 0, 0);
                        var diff = now - start;
                        var oneDay = 1000 * 60 * 60 * 24;
                        var day = Math.floor(diff / oneDay);

                        this.data.frequency = Object.keys(this.datePosts).reduce((sum, value) => {
                            if(value == 'y2016'){
                                sum = sum + ((this.datePosts[value] /day)*30); //Get only the days past in the actual year
                            }
                            else{
                                sum = sum + ((this.datePosts[value] /365)*30);
                            }
                            return sum;
                        }, 0);

                        dbg('Frequency');
                        dbg(this.data.frequency);

                        resolve(this.data);
                    }
                }
            );
        });
    }
};
