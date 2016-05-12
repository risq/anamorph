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
          totalTweetsAndRetweets: 0,
          averageRetweetPerUserPost: 0,
          averageLikePerUserPost: 0,
          totalRetweetForUserPosts: 0,
          totalLikesForUserPosts: 0,
          usedHashtags: [],
          userLikes: 0,
          userMentions: 0,
      };
  }

  fetch() {
    dbg('Fetching twitter data');
    return this.fetchUserInformation()
        .then(() => this.fetchUserTweets())
        .then(() => this.fetchUserMentions())
        .then(() => this.fetchUserLikedTweets())
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

                this.data.totalTweetsAndRetweets = data.length;

                dbg(`Found ${this.data.totalTweetsAndRetweets} tweets + retweets`);

                data.forEach((data => {
                    this.data.totalRetweetForUserPosts+= data.retweet_count;
                    this.data.totalLikesForUserPosts+= data.favorite_count;

                    data.entities.hashtags.forEach((hashtag) => {
                        this.data.usedHashtags.push(hashtag.text);
                    });
                }));
                dbg(`Used hashtags: ${this.data.usedHashtags}`);

                this.data.averageRetweetPerUserPost = (this.data.totalRetweetForUserPosts/this.data.totalTweetsAndRetweets).toFixed(2);
                this.data.averageLikePerUserPost = (this.data.totalLikesForUserPosts/this.data.totalTweetsAndRetweets).toFixed(2);

                dbg(`Total retweets for user posts: ${this.data.totalRetweetForUserPosts}`);
                dbg(`Total likes or user posts: ${this.data.totalLikesForUserPosts}`);

                dbg(`Average of retweets per post: ${this.data.averageRetweetPerUserPost}`);
                dbg(`Average of likes per post: ${this.data.averageLikePerUserPost}`);

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
};
