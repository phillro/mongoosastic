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

module.exports = function (conf, params, jobOptions) {
    var logger = conf.scrapeLogger
    var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
    var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
    var Article = mediaAmpDb.model('article', MediaAmpModels.ArticleSchema)
    var Publication = mediaAmpDb.model('publication', MediaAmpModels.PublicationSchema)
    var SourceContent = mediaAmpDb.model('source_content', MediaAmpModels.SourceContentSchema)
    var Helpers = require('../Helpers')(conf)

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
            SourceContent.find(defaultParams.query)
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
            var url = Helpers.removeQueryStringAndHashesFromUrl(sourceContent.url)
            var hostName = Helpers.extractHostNameFromUrl(url)
            console.log('Processing ' + sourceContent._id + ' ' + sourceContent.categorizationStatus)
            Article.findOne({url:url}, function (findExistingErr, existingArticle) {
                if (findExistingErr) {
                    logger.log('error', 'Error finding sourceContent existing articles ' + sourceContent._id)
                    logger.log('error', findExistingErr)
                    self.emit(findExistingErr)
                } else {
                    if (existingArticle) {
                        //Article exists. Check if it references the source tweet, if not add it
                        logger.log('info', 'Found article at ' + url)
                        //check if the article has an entry for sources tweet
                        var found = false
                        for (var referencingTweetId in existingArticle.referencing_tweet_ids) {
                            if (existingArticle.referencing_tweet_ids[referencingTweetId] == sourceContent.tweet_id) {
                                found = true
                            }
                        }
                        if (!found) {
                            existingArticle.referencing_tweet_ids.push(sourceContent.tweet_id)
                            existingArticle.save(function (existingArticleSaveError, sourceContentSaveResult) {
                                if (existingArticleSaveError) {
                                    logger.log('error', 'Error saving article tweet reference for sourceContent._id' + sourceContent._id + ' article._id ' + existingArticle._id)
                                    logger.log('error', sourceContentSaveError)
                                }
                                sourceContent.categorizationStatus = MediaAmpModels.SourceContentStatus.articleCreated
                                sourceContent.save(function (err, result) {
                                    self.emit(sourceContent)
                                })

                            })
                        } else {
                            //we are done, article exists and references the source
                            logger.log('info', 'Source and tweet reference found for articl._id ' + existingArticle._id)
                            sourceContent.categorizationStatus = MediaAmpModels.SourceContentStatus.articleCreated
                            sourceContent.save(function (err, result) {
                                self.emit(sourceContent)
                            })
                        }
                    } else {
                        //Article does not exist, create it
                        async.waterfall([
                            function (stepOneCallback) {
                                //Find the publication

                                Publication.findOne({host_name:hostName}, function (pubFindError, publication) {
                                    if (pubFindError) {
                                        logger.log('error', 'Error finding publication for ' + host_name)
                                    }
                                    stepOneCallback(pubFindError, publication)
                                })
                            },
                            function (publication, stepTwoCallback) {
                                var articleData = {
                                    first_tweet_id:sourceContent.tweet_id,
                                    referencing_tweet_ids:[sourceContent.tweet_id],
                                    url:url
                                }
                                if (publication) {
                                    articleData.publication_id = publication._id,
                                        articleData.pub_name = publication.pub_name
                                }
                                try {

                                    var window = jsdom.jsdom(sourceContent.body, null, {features:self.options.windowFeatures, url:url}).createWindow();
                                    var $ = jquery.create(window);
                                    articleData.title = $('h1').text()
                                    if (articleData.title) {
                                        articleData.title = articleData.title.replace(/(\r\n|\n|\r|\t)/gm," ").replace(/\s+/g,' ')
                                    }
                                    var article = new Article(articleData)
                                    article.save(function (saveArticleError, saveArticleResult) {
                                        if(saveArticleResult){
                                            if(defaultParams.articlePublishingWrapper){
                                                defaultParams.articlePublishingWrapper.publishArticle(saveArticleResult)
                                            }
                                        }
                                        stepTwoCallback(saveArticleError, saveArticleResult)
                                    })
                                } catch (ex) {
                                    logger.log('error', 'Parsing sourceContent ' + sourceContent._id)

                                    sourceContent.categorizationStatus = MediaAmpModels.SourceContentStatus.parseError
                                    sourceContent.save(function (err, result) {
                                        stepTwoCallback(ex)
                                    })

                                }
                            },
                            function (saveArticleResult, stepThreeCallback) {
                                sourceContent.categorizationStatus = MediaAmpModels.SourceContentStatus.articleCreated
                                sourceContent.save(function (err, result) {
                                    stepThreeCallback(err, sourceContent)
                                })
                            }
                        ], function (err, results) {
                            if (err) {
                                logger.log('error', 'error saving and creating article for sourceContent._id ' + sourceContent._id)
                                logger.log('error', err)
                            }
                            self.emit(results)
                        })
                    }
                }
            })
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