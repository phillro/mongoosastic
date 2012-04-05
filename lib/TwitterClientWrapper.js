/**
 * User: philliprosen
 * Date: 3/31/12
 * Time: 5:41 PM
 */
var async = require('async')
var TwitterClient = require('ntwitter');


module.exports = function (conf) {
    var self = this
    var logger = conf.twitterClientLogger

    var twitterClient = new TwitterClient({
        consumer_key:conf.twitter.consumer_key,
        consumer_secret:conf.twitter.consumer_secret,
        access_token_key:conf.twitter.access_token,
        access_token_secret:conf.twitter.access_token_secret
    })


    self.getUserTimeline = function (params, callback) {
        logger.log('info', 'TwitterRestClientWrapper.getUserTimeline ' + params)
        twitterClient.getUserTimeline(params, function (error, tweets) {
            if (error) {
                logger.log('error', error)
                callback(error)
            } else {
                callback(undefined, tweeters)
            }
        })

    }

    self.createStream = function (stream, params, methods) {
        conf.logger.log('info', 'TwitterRestClientWrapper.stream ' + 'stream ' + params)
        twitterClient.stream(stream, params, function (stream) {
            for (var eventName in methods) {
                stream.on(eventName, methods[eventName])
            }
            return stream;
        });
    }

    return self;
}