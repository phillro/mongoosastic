/**
 * User: philliprosen
 * Date: 4/7/12
 * Time: 1:26 PM
 */
var async = require('async')
var redis = require("redis")
var MediaAmpModels = require('mediaamp-models/index.js')
var mongoose = require('mongoose')


module.exports = function (conf) {
    var self = this
    var logger = conf.twitterClientLogger
    var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
    var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
    var Article = mediaAmpDb.model('article', MediaAmpModels.ArticleSchema)
    var Helpers = require('ProtoHelpers.js')(conf)

    var redisClient = redis.createClient(conf.redis.port, conf.redis.host);

    self.publishArticle = function (article, publishArticleCallback) {
        logger.log('info', 'publishing article ._id ' + article._id)
        try {
            redisClient.publish('new_article_channel', article._id)
            if (typeof publishArticleCallback == 'function')
                publishArticleCallback(undefined, 'published')
        } catch (ex) {
            logger.log('error', 'error publishing article ._id ' + article._id)
            logger.log('error', ex)
            if (typeof publishArticleCallback == 'function')
                publishArticleCallback(ex)

        }
    }

    self.subscribePublishArticleEvents = function(publishArticleEventCallback){
        redisClient.subscribe('new_article_channel')
        redisClient.on("message",function(channel,message){
            if(channel=='new_article_channel'){
                publishArticleEventCallback(message)
            }
        })
    }


    return self;
}