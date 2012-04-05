/**
 * User: philliprosen
 * Date: 3/31/12
 * Time: 7:15 PM
 */



var mongoose = require('mongoose')
var async = require('async')
var TwitterClient = require('ntwitter');

module.exports = function (conf) {

    var self = this
    self.conf = conf
    var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
    var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
    var MediaAmpModels = require('mediaamp-models/index.js')
    var Tweet = mediaAmpDb.model('tweet', MediaAmpModels.TweetSchema)
    var logger = self.conf.logger
    var twit = new TwitterClient({
        consumer_key:self.conf.twitter.consumer_key,
        consumer_secret:self.conf.twitter.consumer_secret,
        access_token_key:self.conf.twitter.access_token,
        access_token_secret:self.conf.twitter.access_token_secret
    })
    var Tweeter = mediaAmpDb.model('tweeter', MediaAmpModels.TweeterSchema)


    self.convertTweetToMaTweet = function (originalTweetObject) {
        var tweet = new Tweet()
        //Delete the user off of the tweet
        tweet._doc['twitter_user_id'] = originalTweetObject.user.id
        tweet.markModified('twitter_user_id')
        tweet._doc['tweet_id_str'] = originalTweetObject.user.id_str
        tweet.markModified('tweet_id_str')
        tweet._doc['screen_name'] = originalTweetObject.user.screen_name
        tweet.markModified('screen_name')
        delete originalTweetObject.user

        //Rename fields
        tweet._doc['tweet_id'] = originalTweetObject.id
        tweet.markModified('tweet_id')
        delete originalTweetObject.id

        for (var tweetField in originalTweetObject) {
            tweet._doc[tweetField] = originalTweetObject[tweetField]
            tweet.markModified(tweetField)
        }
        return tweet
    }


    //Maximum of 100 users per lookup showUser API call
    var maxTermsPerRequest = 100


    self.updateTweeterWithTwitterUser = function (twitterUserObject, callback) {

        //Rename id to twitter_id to avoid confusion and conflicts
        twitterUserObject.twitter_user_id = twitterUserObject.id
        delete twitterUserObject.id;
        twitterUserObject.twitter_user_id_str = twitterUserObject.id_str
        delete twitterUserObject.id_str

        //We don't want the last status which is included with the tweeter.
        delete twitterUserObject.status;
        //Use a regex to find the tweeter by screen_name. This is slow, but necesary to account for differences in capitalization of screen_name
        var screenNameRegex = new RegExp(twitterUserObject.screen_name, "i")
        Tweeter.findOne({screen_name:screenNameRegex}, function (error, tweeter) {
            if (error) {
                logger.log('error', error)
            }
            if (tweeter) {
                //Take all fields in the twitter user object
                for (var field in twitterUserObject) {
                    if (field != '_id') {
                        tweeter._doc[field] = twitterUserObject[field]
                        //We do this to avoid having to define the fields in the schema
                        tweeter.markModified(field)
                    }
                }
                tweeter.save(function (error, result) {
                    if (error) {
                        logger.log('error', error)
                    } else {
                        logger.log('info', result)
                    }
                    callback(error, result)
                })
            }
        })
    }

    self.updateTweeterProfile = function (tweeterId, callback) {
        Tweeter.findById(tweeterId, function (error, tweeter) {
            if (error) {
                logger.log('error', error)
                callback(false)
            } else {

                var tweeter = tweeter.screen_name.replace(/\@/, '')
                twit.showUser(tweeter, function (err, users) {
                    if (err) {
                        logger.log('error', error)
                    } else {
                        //for (var u = 0; u < users.length; u++) {
                        async.forEachSeries(users, updateTweeterWithTwitterUser, function (err, result) {
                            callback()
                        })
                    }
                })

            }
        })
    }

    self.extractHostNameFromUrl = function (url) {
        var hostName=false
        url=url.toLowerCase().replace('https://','').replace('http://','')
        if(url.indexOf('/')>-1){
            url=url.substring(0,url.indexOf('/'))
        }
        var hostNameParts = url.split('.')
        if (hostNameParts.length > 0) {
            hostName = hostNameParts[hostNameParts.length - 2] + '.' + hostNameParts[hostNameParts.length - 1]
        }else{
            hostName=url
        }
        return hostName
    }

    self.removeQueryStringAndHashesFromUrl = function(url){
        if(url.indexOf('#')>-1){
            url=url.substring(0,url.indexOf('#'))
        }
        if(url.indexOf('?')>-1){
            url=url.substring(0,url.indexOf('?'))
        }
        return url
    }





        return self
    }


