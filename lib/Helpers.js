/**
 * User: philliprosen
 * Date: 3/31/12
 * Time: 7:15 PM
 */


var mongoose = require('mongoose')



module.exports = function(conf){

    var self = this
    var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
    var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
    var MediaAmpModels = require('mediaamp-models/index.js')
    var Tweet = mediaAmpDb.model('tweet',MediaAmpModels.TweetSchema)

    self.convertTweetToMaTweet  = function  (originalTweetObject){
           var tweet = new Tweet()
           //Delete the user off of the tweet
           tweet.twitter_user_id=originalTweetObject.user.id
           tweet.screen_name=originalTweetObject.user.screen_name
           delete originalTweetObject.user

           //Rename fields
           tweet.tweet_id=originalTweetObject.id
           delete originalTweetObject.id

           for (var tweetField in originalTweetObject) {
               tweet._doc[tweetField] = originalTweetObject[tweetField]
               tweet.markModified(tweetField)
           }
           return tweet
       }

    return self
}