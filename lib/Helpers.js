/**
 * User: philliprosen
 * Date: 3/31/12
 * Time: 7:15 PM
 */


var mongoose = require('mongoose')


module.exports = function (conf) {

    var self = this
    var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
    var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
    var MediaAmpModels = require('mediaamp-models/index.js')
    var Tweet = mediaAmpDb.model('tweet', MediaAmpModels.TweetSchema)

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

    return self
}


