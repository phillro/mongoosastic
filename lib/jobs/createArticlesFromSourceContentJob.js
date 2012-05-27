/**
 * User: philliprosen
 * Date: 4/5/12
 * Time: 12:27 AM
 */


var mongoose = require('mongoose')
var nodeio = require('node.io');
var async = require('async')
var jsdom = require('jsdom')
var jquery = require('jquery')
var MediaAmpModels = require('mediaamp-models/index.js')
var Redis = require("redis")
module.exports = function (conf, params, jobOptions) {
    var logger = conf.scrapeLogger
    var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
    var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
    /*var Article = mediaAmpDb.model('article', MediaAmpModels.ArticleSchema)
     var Publication = mediaAmpDb.model('publication', MediaAmpModels.PublicationSchema)
     var SourceContent = mediaAmpDb.model('source_content', MediaAmpModels.SourceContentSchema)*/
    var redisClient = new Redis.createClient(conf.redis.port, conf.redis.host);
    var ProtoHelpers = require('../ProtoHelpers.js')(conf)
    var schemas = MediaAmpModels
    var models = MediaAmpModels.loadModels(mediaAmpDb, schemas)
    var services = MediaAmpModels.loadServices({models:models, redisClient:redisClient, logger:logger, conf:conf})


    params = params || {}
    var defaultParams = {
        query:{categorizationStatus:MediaAmpModels.SourceContentStatus.uncategorized}
    }
    for (var p in params) {
        defaultParams[p] = params[p]
    }

    var defaultOptions = {
        take:1,
        windowFeatures:{
            FetchExternalResources:true,
            ProcessExternalResources:true,
            QuerySelector:false
        }
    }
    jobOptions = jobOptions || {}
    for (var o in jobOptions) {
        defaultOptions[o] = jobOptions = [o]
    }


    var methods = {
        input:function (start, num, callback) {
            console.log('createArticlesFromSourceContentJob ')
            console.log(defaultParams.query)
            models.SourceContent.find(defaultParams.query)
                .sort('createdAt', -1)
                .limit(2)
                .execFind(function (error, sourceContents) {
                    if (error) {
                        logger.log('error', 'createArticlesFromSourceContentJob job:' + error)
                        callback(false)
                    } else {
                        if (sourceContents.length == 0) {
                            callback(false)
                        } else {
                            callback(sourceContents)
                        }
                    }
                })
        },
        run:function (sourceContent) {//executed for each sourceContents
            var self = this
            var url = ProtoHelpers.removeQueryStringAndHashesFromUrl(sourceContent.url)
            var hostName = ProtoHelpers.extractHostNameFromUrl(url)
            console.log('Processing ' + sourceContent._id + ' ' + sourceContent.categorizationStatus)
            models.Article.findOne({url:url}, function (findExistingErr, existingArticle) {
                    if (findExistingErr) {
                        logger.log('error', 'Error finding sourceContent existing articles ' + sourceContent._id)
                        logger.log('error', findExistingErr)
                        self.emit(findExistingErr)
                    } else {
                        if (existingArticle) {
                            //Article exists. Check if it references the source tweet, if not add it
                            logger.log('info', 'Found article at ' + url)
                            async.waterfall([
                                //checkif the article has an entry for sources tweet
                                function checkForExistingArticleTweetReference(checkForExistingArticleTweetReferenceCallback) {
                                    var existingArticleTweetReference = false
                                    for (var referencingTweetId in existingArticle.referencing_tweet_ids) {
                                        if (existingArticle.referencing_tweet_ids[referencingTweetId] == sourceContent.tweet_id) {
                                            existingArticleTweetReference = true
                                            break;
                                        }
                                    }
                                    checkForExistingArticleTweetReferenceCallback(undefined, existingArticleTweetReference, existingArticle)
                                },
                                function updateArticle(existingArticleTweetReference, article, updateArticleCallback) {
                                    if (!existingArticleTweetReference) {
                                        if (sourceContent.twitter_user_id) {
                                            article.twitter_user_ids.push(sourceContent.twitter_user_id)
                                        }
                                        if (sourceContent.tweeter_id) {
                                            article.tweeter_ids.push(sourceContent.tweeter_id)
                                        }
                                        article.referencing_tweet_ids.push(sourceContent.tweet_id)
                                        article.referencing_tweets = article.referencing_tweets || []
                                        article.referencing_tweets.push({tweet_id:sourceContent.tweet_id, createdAt:new Date})
                                        article.save(function (articleSaveError, articleSaveResult) {
                                            if (articleSaveError) {
                                                logger.log('error', 'Error saving article tweet reference for sourceContent._id' + sourceContent._id + ' article._id ' + article._id)
                                            }
                                            updateArticleCallback(articleSaveError, existingArticleTweetReference, articleSaveResult)
                                        })
                                    } else {
                                        updateArticleCallback(undefined, existingArticleTweetReference, article)
                                    }
                                },
                                function updateArticleMeta(existingArticleTweetReference, article, updateArticleMetaCallback) {
                                    if (!existingArticleTweetReference) {
                                        services.articleService.updateArticleMeta(article._id, {referenced_count:1}, function (updateArticleMetaError, updateArticleMetaResult) {
                                            updateArticleMetaCallback(updateArticleMetaError, existingArticleTweetReference, article)
                                        })
                                    } else {
                                        updateArticleMetaCallback(undefined, existingArticleTweetReference, article)
                                    }
                                },
                                function updateSourceContentCategorizationStatus(existingArticleTweetReference, article, updateSourceContentCategorizationStatusCallback) {
                                    sourceContent.categorizationStatus = MediaAmpModels.SourceContentStatus.articleCreated
                                    sourceContent.save(function (sourceContentSaveError, result) {
                                        if (sourceContentSaveError) {
                                            logger.log('error', 'sourceContent save error')
                                        }
                                        updateSourceContentCategorizationStatusCallback(sourceContentSaveError, existingArticleTweetReference, article)
                                    })
                                }
                            ], function (updateArticleWaterfallError, existingArticleTweetReference, article) {
                                if (updateArticleWaterfallError) {
                                    logger.log('error', updateArticleWaterfallError)
                                }
                                self.emit(sourceContent)
                            })
                        }
                        else {
                            //Article does not exist, create it
                            async.waterfall([
                                function parseSourceContent(parseSourceContentCallback) {
                                    var articleData = {}
                                    try {
                                        var window = jsdom.jsdom(sourceContent.body, null, {features:self.options.windowFeatures, url:url}).createWindow();
                                        var $ = jquery.create(window);
                                        articleData.title = $('h1').text()
                                        if (articleData.title) {
                                            articleData.title = articleData.title.replace(/(\r\n|\n|\r|\t)/gm, " ").replace(/\s+/g, ' ')
                                        }
                                        parseSourceContentCallback(undefined, sourceContent, articleData)
                                    } catch (ex) {
                                        logger.log('error', 'Parsing sourceContent ' + sourceContent._id)
                                        sourceContent.categorizationStatus = MediaAmpModels.SourceContentStatus.parseError
                                        sourceContent.save(function (err, result) {
                                            parseSourceContentCallback(ex)
                                        })
                                    }
                                },
                                function createArticle(sourceContent, articleData, createArticleCallback) {
                                    services.articleService.createArticleFromSourceContent(sourceContent, articleData, function (error, article) {
                                        createArticleCallback(error, sourceContent, articleData, article)
                                    })
                                },
                                function createShortUrl(sourceContent, articleData, article, createShortUrlCallback) {
                                    services.shortenerService.generate(url, {data:{articleId:article._id}}, function (error, shortUrl) {
                                        if (typeof shortUrl !=undefined) {
                                            articleData.ma_short_url_hash = shortUrl.hash
                                        }
                                        createShortUrlCallback(error, sourceContent, articleData)
                                    })
                                },
                                function updateArticleMeta(sourceContent, articleData, article, updateArticleMetaCallback) {
                                    services.articleService.updateArticleMeta(article._id, {referenced_count:1}, function (updateArticleMetaError, updateArticleMetaResult) {
                                        updateArticleMetaCallback(updateArticleMetaError, sourceContent, articleData, article)
                                    })
                                },
                                function updateSourceContent(sourceContent, articleData, Article, updateSourceContentCallback) {
                                    sourceContent.categorizationStatus = MediaAmpModels.SourceContentStatus.articleCreated
                                    sourceContent.save(function (err, result) {
                                        updateSourceContentCallback(err, sourceContent, articleData, Article)
                                    })
                                }
                            ], function waterFallCallback(err, sourceContent, articleData, Article) {
                                if (err) {
                                    logger.log('error', 'Error creating article from source content')
                                    logger.log('error', err)
                                    self.fail('')
                                } else {
                                    self.emit('')
                                }
                            })

                        }
                    }
                }
            )
        },
        output:function (results) {
            if (results instanceof Array) {
                for (var i = 0; i < results.length; i++) {
                    logger.log('info', 'Processed sourceContent created article ' + results[i]._id)
                }
            } else {
                logger.log('info', results)
            }

        },
        complete:function (callback) {
            logger.log('info', ' createArticlesFromSourceContentJob complete')
            if (typeof callback == 'function') {
                callback();
            }
        }
    }

    return new nodeio.Job(defaultOptions, methods)

}