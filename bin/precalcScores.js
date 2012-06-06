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

    services.scoringService.calculateScoreConstants(undefined, function (err, result) {
        if (err)
            console.log(err)
        else {
            console.log('Calculated Score Constants')
            process.exit(0)
        }
    })
})

