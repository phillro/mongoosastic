/**
 * User: philliprosen
 * Date: 3/31/12
 * Time: 7:44 PM
 */

var mongoose = require('mongoose')
var nodeio = require('node.io');
var async = require('async')
module.exports = function (conf, params, jobOptions) {
    var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
    var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
    var logger = conf.scrapeLogger
    var MediaAmpModels = require('mediaamp-models/index.js')
    var Tweet = mediaAmpDb.model('tweet', MediaAmpModels.TweeterSchema)
    var SourceContent = mediaAmpDb.model('source_content', MediaAmpModels.SourceContentSchema)

    params = params || {}
    var defaultParams = {
        tweetStatus:2
    }
    for (var p in params) {
        defaultParams[p] = params[p]
    }

    var defaultOptions = {
        redirects:10,
        take:1
    }
    jobOptions = jobOptions || {}
    for (var o in jobOptions) {
        defaultOptions[o] = jobOptions = [o]
    }


    var methods = {
        input:function (start, num, callback) {
            Tweet.find({tweetStatus:defaultParams.tweetStatus})
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
            console.log('run')

            async.forEach(tweet._doc.entities.urls, function (url, callback) {//executed for each url in the tweet entities list
                var sourceContent = new SourceContent({url:url,tweet_id:tweet.tweet_id,categorizationStatus:MediaAmpModels.SourceContentStatus.uncategorized})
                self.get(url.url, function (getHtmlError, rawData, headers) {
                    if (getHtmlError) {
                        console.log(getHtmlError)
                        callback(getHtmlError)
                    } else {
                        sourceContent.body = rawData
                        sourceContent.save(function (err, result) {
                            callback()
                        })
                    }
                })
            }, function (forEachTweetErr) {//executed when scraping tweet urls is complete
                if (forEachTweetErr) {
                    console.log('error ' + forEachTweetErr)
                    tweet._doc['tweetStatus'] = MediaAmpModels.TweetStatus.errorScraping
                } else {
                    tweet._doc['tweetStatus'] = MediaAmpModels.TweetStatus.scraped
                }
                tweet.markModified('tweetStatus')
                tweet.save(function (tweetSaveError, tweetSaveResult) {
                    self.emit(tweetSaveResult)
                })

            })
        },
        output:function (results) {
            console.log(results)
        },
        complete:function (callback) {
            console.log('complete')
            if (typeof callback == 'function') {
                callback();
            }
        }
    }

    return new nodeio.Job(defaultOptions, methods)

}