var async = require('async')
var cli = require('cli')
var mongoose = require('mongoose')
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
    var schemas = MediaAmpModels
    var models = MediaAmpModels.loadModels(mediaAmpDb, schemas)
    var services = MediaAmpModels.loadServices({models:models, redisClient:redisClient, logger:logger, conf:conf})
    console.log('Start update scores 2 score constants at ' + new Date())
    var oneDay = new Date();
    oneDay.setDate(oneDay.getDate() - .5);
    var queryRange = {createdAt:{$gt:oneDay}}
    models.Article.find(queryRange, function (err, articles) {

        async.forEachSeries(articles, function (article, forEachArticleCallback) {
            services.scoringService.updateArticleRankings(article, {}, function (err, updatedArticle) {
                forEachArticleCallback(err, updatedArticle)
            })
        }, function (forEachSeriesComplete) {
            if (forEachSeriesComplete)
                console.log(forEachSeriesComplete)
            else {

                console.log('updateARticlesComplete')
                process.exit(0)

            }

        })
    })


})

