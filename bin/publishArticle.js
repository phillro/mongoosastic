/**
 * User: philliprosen
 * Date: 5/27/12
 * Time: 3:10 AM
 */
var async = require('async')
var cli = require('cli')
var mongoose = require('mongoose')
var nodeio = require('node.io');
var async = require('async')
var jsdom = require('jsdom')
var jquery = require('jquery')
var MediaAmpModels = require('mediaamp-models/index.js')
var Redis = require("redis")

cli.parse({
    verbose:['v', 'Print response'],
    articleId:['a', 'Article Id', 'string']
});

cli.main(function (args, options) {
    var env = cli.args.shift() || 'development'
    conf = require('../etc/conf')[env]

    var logger = conf.scrapeLogger
    var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
    var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
    /*var Article = mediaAmpDb.model('article', MediaAmpModels.ArticleSchema)
     var Publication = mediaAmpDb.model('publication', MediaAmpModels.PublicationSchema)
     var SourceContent = mediaAmpDb.model('source_content', MediaAmpModels.SourceContentSchema)*/
    var redisClient = new Redis.createClient(conf.redis.port, conf.redis.host);
    var redisClient2 = new Redis.createClient(conf.redis.port, conf.redis.host);
    var schemas = MediaAmpModels
    var models = MediaAmpModels.loadModels(mediaAmpDb, schemas)
    var services = MediaAmpModels.loadServices({models:models, redisClient:redisClient, logger:logger, conf:conf})
    var services2 = MediaAmpModels.loadServices({models:models, redisClient:redisClient2, logger:logger, conf:conf})
/*
    services2.articlePublishingService.subscribePublishArticleEvents(function (err, message) {

        if (err) {
            console.log(err)
        }
        if (result) {
            console.log(result)
        }
    })*/
    services.articlePublishingService.publishArticle({_id:options.articleId}, function (err, result) {
        if (err) {
            console.log(err)
        }
        if (result) {
            console.log(result)
        }
        //  process.exit(0)
    })
})

