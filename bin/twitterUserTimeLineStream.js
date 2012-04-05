/**
 * User: philliprosen
 * Date: 3/31/12
 * Time: 5:52 PM
 */
var async = require('async')
var cli = require('cli')
cli.parse({
    verbose:['v', 'Print response']
});

var env = cli.args.shift()||'development'

conf = require('../etc/conf')[env]

var twitterClient = new require('../lib/TwitterClientWrapper')(conf)
var mongoose = require('mongoose')
var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
var MediaAmpModels = require('mediaamp-models/index.js')
var logger = conf.twitterClientLogger

var Tweeter = mediaAmpDb.model('tweeter', MediaAmpModels.TweeterSchema)
var Tweet = mediaAmpDb.model('tweet', MediaAmpModels.TweeterSchema)
var Helpers = new require('../lib/Helpers')(conf)
var schedule = require('node-schedule');
var child_proc = require('child_process');


var startStream = function () {
    Tweeter.find({twitter_user_id:{$exists:true}}, function (error, tweeters) {
        if (error) {
            console.log(error)
        } else {
            var tweeterIds = []
            async.forEachSeries(tweeters, function (tweeter, callback) {
                tweeterIds.push(tweeter.twitter_user_id_str)
                callback()
            }, function (error) {
                var twitterFollowString = tweeterIds.join(',')
                twitterFollowString = twitterFollowString.substr(1, twitterFollowString.length)

                twitterClient.createStream('statuses/filter', {follow:twitterFollowString}, {
                    data:function (data) {
                        logger.log('info', 'data received')

                        var tweet = Helpers.convertTweetToMaTweet(data)

                        tweet._doc['tweetStatus'] = MediaAmpModels.TweetStatus.scrapePending
                        tweet.markModified('tweetStatus')
                        tweet.save(function (error, result) {
                            if (error) {
                                logger.log('error', error)
                                console.log(error)
                            } else {
                                logger.log('info', 'save tweet ' + result._id)
                            }
                        })
                    },
                    error:function (error) {
                        logger.log('error', 'twitterUserTimeLineStream error ' + error)
                        console.log(error)
                    },
                    end:function (response) {
                        logger.log('info', 'end received')
                    },
                    destroy:function (response) {
                        logger.log('info', 'destory received')
                    }
                })
            })
        }
    })
}

startStream()
var twitterStreamReinitSchedule = schedule.scheduleJob('0,10 * * * *', function () {
    logger.log('info', 'Exeucting startStream')
    startStream()
});
