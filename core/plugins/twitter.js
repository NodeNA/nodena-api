import Promise from 'bluebird';
import Twitter from 'twitter';
import { twitter } from '../config';

const client = new Twitter({
  consumer_key: twitter.consumerKey,
  consumer_secret: twitter.consumerSecret,
  access_token_key: twitter.accessTokenKey,
  access_token_secret: twitter.accessTokenSecret
});

let Plugin  = null;

export default function () {
  if (Plugin) {
    return Plugin;
  }

  Plugin  = {
    name: 'twitter'
  };

  Plugin.getTweets = function (twitterHandle, limit) {
    return new Promise(function(resolve, reject) {
      let params = {
        screen_name: twitterHandle,
        limit: limit || 10
      };

      client.get('statuses/user_timeline', params, function(error, tweets, response){
        if (error) {
          console.error(error);
          resolve(null);
        }
        else {
          resolve(tweets);
        }
      });
    });
  };

  return Plugin
};