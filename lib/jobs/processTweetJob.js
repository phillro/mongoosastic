/**
 * User: philliprosen
 * Date: 3/31/12
 * Time: 7:44 PM
 */

var mongoose = require('mongoose')
var nodeio = require('node.io');
var async = require('async')
var MediaAmpModels = require('mediaamp-models/index.js')
var Redis = require('redis')

module.exports = function (conf, params, jobOptions) {
    var jobSelf = this
    var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
    var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
    var logger = conf.scrapeLogger
    /*
     var Tweet = mediaAmpDb.model('tweet', MediaAmpModels.TweeterSchema)
     var SourceContent = mediaAmpDb.model('source_content', MediaAmpModels.SourceContentSchema)
     var Tweeter = mediaAmpDb.model('tweeter', MediaAmpModels.TweeterSchema)
     var ProtoHelpers = require('../ProtoHelpers.js')(conf)*/

    var redisClient = new Redis.createClient(conf.redis.port, conf.redis.host);
    var ProtoHelpers = require('../ProtoHelpers.js')(conf)
    var schemas = MediaAmpModels
    var models = MediaAmpModels.loadModels(mediaAmpDb, schemas)
    var services = MediaAmpModels.loadServices({models:models, redisClient:redisClient, logger:logger, conf:conf})
    //var services = MediaAmpModels.loadServices(models, redisClient)

    var extensionsToIgnore = ['mp4', 'avi', 'mp3', 'mpg', 'mpeg']

    params = params || {}
    var defaultParams = {
        query:{tweetStatus:2}
    }
    for (var p in params) {
        defaultParams[p] = params[p]
    }

    var defaultOptions = {
        redirects:5,
        take:1,
        timeout:15
    }
    jobOptions = jobOptions || {}
    for (var o in jobOptions) {
        defaultOptions[o] = jobOptions = [o]
    }

    jobSelf.createSourceContent = function (getHtmlError, rawData, headers, response, createSourceContentCallback) {
        if (response.request.uri.host.indexOf('t.co') > -1) {
            console.log('')
            console.log(response.request.uri)
            console.log(response.request.href)
            console.log(tweet._id);
            console.log(tweet._doc.entities)
        }

        sourceContent.tweet_id = tweet._doc['id_str']
        sourceContent.twitter_user_id = tweet._doc['twitter_user_id']
        if (tweeter) {
            sourceContent.tweeter_id = tweeter._id
        }
        sourceContent.categorizationStatus = MediaAmpModels.SourceContentStatus.uncategorized
        sourceContent.expanded_host = response.request.uri.host
        sourceContent.url = response.request.href
        sourceContent.body = rawData
        sourceContent.save(function (err, savedSourceContent) {
            if (err) {
                logger.log('error', 'processTweetJob tweet _id: ' + tweet._id + ' ' + url.url + ' saving source ' + err);
                createSourceContentCallback(err)
            } else {
                createSourceContentCallback(undefined, savedSourceContent)
            }

        })
    }


    var methods = {
        input:function (start, num, callback) {
            var limit = 10
            console.log('loading ' + limit + ' tweets for processing')
            models.Tweet.find(defaultParams.query)
                .limit(20)
                .sort('createdAt', -1)
                .execFind(function (error, tweets) {
                    if (error) {
                        logger.log('error', 'processTweet job:' + error)
                        callback(false)
                    } else {
                        if (tweets.length == 0) {
                            callback(false)
                        } else {
                            callback(tweets)
                        }
                    }
                })
        },
        run:function (tweet) {//executed for each tweet
            var self = this
            var matchedTweeter = false

            async.waterfall([
                function findTweeter(findTweeterCallback) {
                    models.Tweeter.findOne({'twitter_user_id':tweet._doc['twitter_user_id']}, function (findTweeterError, tweeter) {
                        if (findTweeterError) {
                            findTweeterCallback(findTweeterError)
                        } else {
                            if (tweeter)
                                matchedTweeter = tweeter
                            findTweeterCallback(undefined, tweet, tweeter)
                        }
                    })
                },
                function processEntities(tweet, tweeter, processEntitiesCallback) {
                    if (!tweet._doc.entities) {
                        processEntitiesCallback(undefined, tweet, tweeters)
                    } else {
                        async.forEach(tweet._doc.entities.urls, function (url, forEachCallback) {//executed for each url in the tweet entities list
                            self.get(url.url, function (getHtmlError, rawData, headers, response) {
                                    if (getHtmlError) {
                                        console.log(getHtmlError)
                                        forEachCallback(getHtmlError)
                                    } else {
                                        var sourceContent = new models.SourceContent()
                                        sourceContent.tweet_id = tweet._doc['id_str']
                                        sourceContent.twitter_user_id = tweet._doc['twitter_user_id']
                                        if (tweeter) {
                                            sourceContent.tweeter_id = tweeter._id
                                        }
                                        sourceContent.categorizationStatus = MediaAmpModels.SourceContentStatus.uncategorized
                                        sourceContent.expanded_host = response.request.uri.host
                                        sourceContent.url = response.request.href
                                        sourceContent.body = rawData
                                        sourceContent.save(function (err, savedSourceContent) {
                                            if (err) {
                                                logger.log('error', 'processTweetJob tweet _id: ' + tweet._id + ' ' + url.url + ' saving source ' + err);
                                                forEachCallback(err)
                                            } else {

                                                forEachCallback(undefined, savedSourceContent)
                                            }

                                        })
                                    }
                                })
                        }, function forEachComplete(forEachError) {
                            processEntitiesCallback(forEachError, tweet, tweeter)

                        })
                    }
                }
            ],
                function waterfallComplete(error) {
                    if (error) {
                        console.log('error ' + error)
                        tweet._doc['scrapeError'] = error
                        tweet.markModified('scrapeError')
                        tweet._doc['tweetStatus'] = MediaAmpModels.TweetStatus.errorScraping
                    } else {
                        tweet._doc['tweetStatus'] = MediaAmpModels.TweetStatus.scraped
                    }
                    if (matchedTweeter) {
                        tweet._doc['tweeter_id'] = matchedTweeter._id
                        tweet.markModified('tweeter_id')
                    }
                    tweet.markModified('tweetStatus')
                    tweet.save(function (tweetSaveError, tweetSaveResult) {
                        self.emit(tweetSaveResult)
                    })
                }

            )
        },
        output:function (results) {
            if (results instanceof Array) {
                for (var i = 0; i < results.length; i++) {
                    logger.log('info', 'Processed tweet _id ' + results[i]._id)
                }
            } else {
                logger.log('info', results)
            }

        },
        complete:function (callback) {
            logger.log('info', ' processTweetJob complete')
            if (typeof callback == 'function') {
                callback();
            }
        },
        fail:function (input, status) {
            console.log(input + ' failed with status: ' + status);
            this.emit('failed');
        }
    }

    return new nodeio.Job(defaultOptions, methods)

}