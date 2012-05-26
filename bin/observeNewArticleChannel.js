/**
 * User: philliprosen
 * Date: 4/7/12
 * Time: 1:44 PM
 * Will just observe and report article publish events
 */


var async = require('async')
var cli = require('cli')
var Redis = require('redis')
var mongoose = require('mongoose')
var MediaAmpModels = require('mediaamp-models')
cli.parse({
    verbose:['v', 'Print response']
});

var env = cli.args.shift() || 'development'
conf = require('../etc/conf')[env]


var logger = conf.scrapeLogger
var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
/*var Article = mediaAmpDb.model('article', MediaAmpModels.ArticleSchema)
 var Publication = mediaAmpDb.model('publication', MediaAmpModels.PublicationSchema)
 var SourceContent = mediaAmpDb.model('source_content', MediaAmpModels.SourceContentSchema)*/
var redisClient = new Redis.createClient(conf.redis.port, conf.redis.host);
var schemas = MediaAmpModels
var models = MediaAmpModels.loadModels(mediaAmpDb, schemas)
var services = MediaAmpModels.loadServices(models, redisClient)


var redisClient = new Redis.createClient(conf.redis.port, conf.redis.host);


services.articlePublishingService.subscribePublishArticleEvents(function (artcileId) {
    console.log('Received publish article event ' + artcileId)
})