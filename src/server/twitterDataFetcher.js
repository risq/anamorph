'use strict';

const Bluebird = require('bluebird');

const dbg = require('debug')('anamorph:twitterDataFetcher');

module.exports = class TwitterDataFetcher {
  constructor(api, tokens, user) {
    dbg('Initializing new TwitterDataFetcher');

    this.api = api;
    this.tokens = tokens;
    this.user = user;
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
              dbg(`Found ${data.followers_count} followers`);
              dbg(`Found ${data.friends_count} friends`);
              resolve(data);
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
              //dbg(data);
              dbg(`Found ${data.length} tweets + retweets`);
                
                var usedHashtags = [];
                data.forEach((data => {
                    data.entities.hashtags.forEach((hashtag) => {
                        usedHashtags.push(hashtag.text);
                    });
                }));
                dbg(`Used hashtags: ${hashtags}`);

              resolve(data, usedHashtags);
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
                        //dbg(data);
                        dbg(`Found ${data.length} mentions`);
                        resolve(data);
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
                        //dbg(data);
                        dbg(`Found ${data.length} user likes`);
                        resolve(data);
                    }
                }
            );
        });
    }
};
