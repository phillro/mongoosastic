/**
 * User: philliprosen
 * Date: 3/19/12
 * Time: 3:08 PM
 * Uses Twitter API to update tweeters entities with all public user data in twitter
 */

var TwitterClient = require('ntwitter');
var conf = require('../etc/conf.js').development
logger = conf.logger
var mongoose = require('mongoose')
var async = require('async')

var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
var MediaAmpModels = require('mediaamp-models/index.js')
var Tweeter = mediaAmpDb.model('tweeter',MediaAmpModels.TweeterSchema)

//Maximum of 100 users per lookup showUser API call
var maxTermsPerRequest = 100


var cli = require('cli')

cli.parse({
    verbose:['v', 'Print response']
});


var twit = new TwitterClient({
    consumer_key:conf.twitter.consumer_key,
    consumer_secret:conf.twitter.consumer_secret,
    access_token_key:conf.twitter.access_token,
    access_token_secret:conf.twitter.access_token_secret
})

var updateTweeterWithTwitterUser = function (twitterUserObject,callback) {

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
                tweeter._doc[field] = twitterUserObject[field]
                //We do this to avoid having to define the fields in the schema
                tweeter.markModified(field)
            }
            tweeter.save(function (error, result) {
                if (error) {
                    logger.log('error', error)
                } else {
                    logger.log('info', result)
                }
                callback(error,result)
            })
        }
    })
}

Tweeter.find({}, function (error, results) {
    if (error) {
        logger.log('error', error)
    } else {
        //Batch the requests if we have more user terms then maxTermsPerRequest
        var requestsRequired = Math.ceil(results.length / maxTermsPerRequest)
        for (var r = 0; r < requestsRequired; r++) {
            var users = ''
            var end = (results.length - r * maxTermsPerRequest) > maxTermsPerRequest ? maxTermsPerRequest : results.length
            for (var i = (r * maxTermsPerRequest); i < end; i++) {
                users += results[i].screen_name.replace(/\@/, '') + ","
            }
            logger.log('info', users)
            twit.showUser(users, function (err, users) {
                if (err) {
                    logger.log('error', error)
                } else {
                    //for (var u = 0; u < users.length; u++) {
                    async.forEachSeries(users, updateTweeterWithTwitterUser, function(err, result){
                    })
                }
            })
        }

    }
})