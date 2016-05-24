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
            numberOfFollowers: 0,
            numberOfFriends: 0,
            totalTweetsAndRetweets: 0,
            nbOfPosts: 0,
            totalTweets: 0,
            totalRetweets: 0,
            averageRetweetPerUserPost: 0,
            averageLikePerUserPost: 0,
            mostPopularTweet: '',
            totalRetweetForUserPosts: 0,
            totalLikesForUserPosts: 0,
            usedHashtags: [],
            nbOfPhotos: 0,
            userLikes: 0,
            userMentions: 0,
            frequency: [],
        };

        this.datePosts = [];
    }

    fetch() {
        dbg('Fetching twitter data');
        return this.fetchUserInformation()
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
                        this.data.numberOfFriends = data.friends_count;
                        dbg(`Found ${this.data.numberOfFollowers} followers`);
                        dbg(`Found ${this.data.numberOfFriends} friends`);
                        resolve(this.data);
                    }
                }
            );
        });
    }

    //Get the user's tweets (max: 200)
    fetchUserTweets() {
        dbg('Fetching user tweets');

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
                                this.data.totalTweets += 1;
                            }

                            this.data.totalRetweetForUserPosts += data.retweet_count;
                            this.data.totalLikesForUserPosts += data.favorite_count;

                            data.entities.hashtags.forEach((hashtag) => {
                                this.data.usedHashtags.push(hashtag.text);
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
                        }));

                        this.data.nbOfPosts = this.data.totalTweets;

                        dbg(`Total tweets: ${this.data.totalTweets}`);
                        dbg(`Total retweets: ${this.data.totalRetweets}`);
                        dbg(`Used hashtags: ${this.data.usedHashtags}`);
                        dbg(`Number of photos: ${this.data.nbOfPhotos}`);

                        this.data.averageRetweetPerUserPost = (this.data.totalRetweetForUserPosts / this.data.totalTweetsAndRetweets).toFixed(2);
                        this.data.averageLikePerUserPost = (this.data.totalLikesForUserPosts / this.data.totalTweetsAndRetweets).toFixed(2);

                        dbg(`Total retweets for user posts: ${this.data.totalRetweetForUserPosts}`);
                        dbg(`Total likes or user posts: ${this.data.totalLikesForUserPosts}`);

                        dbg(`Average of retweets per post: ${this.data.averageRetweetPerUserPost}`);
                        dbg(`Average of likes per post: ${this.data.averageLikePerUserPost}`);

                        dbg(`Most popular tweet: ${this.data.mostPopularTweet}`);

                        resolve(this.data);
                    }
                }
            );
        });
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
                            var year = 'A-' + date.getFullYear();

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

                        //Todo -> improved this recuperation - iteration?

                        if(this.datePosts['A-2016']){
                            this.data.frequency['A-2016'] = (this.datePosts['A-2016'] / day).toFixed(3);
                        }
                        if(this.datePosts['A-2015']){
                            this.data.frequency['A-2015'] = (this.datePosts['A-2015'] / 365).toFixed(3);
                        }

                        dbg('Frequency');
                        dbg(this.data.frequency);

                        resolve(this.data);
                    }
                }
            );
        });
    }
};
