/**
 * User: philliprosen
 * Date: 6/4/12
 * Time: 2:34 PM
 */
var mongoose = require('mongoose')

var csv = require('csv');
var cli = require('cli')
var hash = require('mhash').hash
var MediaAmpModels = require('mediaamp-models/index.js')
var cli = require('cli')
cli.parse({
    verbose:['v', 'Print response']
});


var env = cli.args.shift() || 'production'
console.log(env)
conf = require('../etc/conf')[env]
var async = require('async')
var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);

var schemas = MediaAmpModels
var db = MediaAmpModels.loadModels(mediaAmpDb, schemas)
var stats = require('../lib/stats')
var updateScore = function (count, cb) {
    var attribute_importance = {
        white_click_count:.15,
        unknown_click_count:.15,
        white_amp_count:.05,
        unknown_amp_count:.05,
        white_saved_count:.05,
        unknown_saved_count:.05,
        referenced_count:.5
    }
    var oneDay = new Date();
    oneDay.setDate(oneDay.getDate() - 1);
    var queryRange = {createdAt:{$gt:oneDay}}
    {
        createdAt:-1
    }
    scoreDate = new Date()
    var scores = []
    db.Article.find(queryRange, {"meta.white_click_count":1}, {sort:{"meta.white_click_count":-1}}).limit(1).exec(function (err, maxWhiteClickCountArticle) {
        //console.log(maxWhiteClickCountArticle)
        db.Article.find(queryRange, {"meta.unknown_click_count":1}, {sort:{"meta.unknown_click_count":-1}}).limit(1).exec(function (err, maxUnkownClickCountArticle) {
            db.Article.find(queryRange, {"meta.white_amp_count":1}, {sort:{"meta.white_amp_count":-1}}).limit(1).exec(function (err, maxWhiteAmpCountArticle) {
                db.Article.find(queryRange, {"meta.unknown_amp_count":1}, {sort:{"meta.unknown_amp_count":-1}}).limit(1).exec(function (err, maxUnkownAmpArticle) {
                    db.Article.find(queryRange, {"meta.white_saved_count":1}, {sort:{"meta.white_saved_count":-1}}).limit(1).exec(function (err, maxWhiteSavedCount) {
                        db.Article.find(queryRange, {"meta.unknown_saved_count":1}, {sort:{"meta.unknown_saved_count":-1}}).limit(1).exec(function (err, maxUnkownSaveCountArticle) {
                            db.Article.find(queryRange, {"meta.referenced_count":1}, {sort:{"meta.referenced_count":-1}}).limit(1).exec(function (err, maxReferenceCount) {
                                var max_attribute_values = {}
                                var test = maxWhiteClickCountArticle[0].meta.white_click_count + 3
                                max_attribute_values.white_click_count = maxWhiteClickCountArticle[0].meta.white_click_count || 1
                                max_attribute_values.unknown_click_count = maxUnkownClickCountArticle[0].meta.unknown_click_count || 1
                                max_attribute_values.white_amp_count = maxWhiteAmpCountArticle[0].meta.white_amp_count || 1
                                max_attribute_values.unknown_amp_count = maxUnkownAmpArticle[0].meta.unknown_amp_count || 1
                                max_attribute_values.white_saved_count = maxWhiteSavedCount[0].meta.white_saved_count || 1
                                max_attribute_values.unknown_saved_count = maxUnkownSaveCountArticle[0].meta.unknown_saved_count || 1
                                max_attribute_values.referenced_count = maxReferenceCount[0].meta.referenced_count || 1
                                max_attribute_values.createdAt = new Date()
                                //console.log(max_attribute_values)
                                // console.log('--------------------')
                                //db.maxAttributeValues.save(max_attribute_values)
                                db.Article.find(queryRange, function (error, articles) {
                                    async.forEach(articles, function (article, forEachArticleCallback) {
                                        //    console.log(article.meta)
                                        var score = 0
                                        for (var att in attribute_importance) {
                                            if (!article.meta[att])
                                                article.meta[att] = 0
                                            else {
                                                if (typeof article.meta[att] == 'object') {
                                                    var tmp = article.meta[att].toString()
                                                    article.meta[att] = parseFloat(tmp)
                                                }
                                            }
                                            if (typeof max_attribute_values[att] == 'object') {
                                                max_attribute_values[att] = parseFloat(max_attribute_values[att].toString())
                                            }
                                            score += (attribute_importance[att] * ((article.meta[att] || 0))) / (max_attribute_values[att] || 1)
                                        }
                                        // score=score*100
                                        if (!article.meta)
                                            article.meta = {}
                                        article.meta.score = score
                                        article.meta.scoreDate = scoreDate
                                        //console.log(score)
                                        scores.push({articleId:article._id, score:score})
                                        article.save(function (err, result) {
                                            forEachArticleCallback(err)

                                        })
                                    }, function (forEachError) {
                                        if (forEachError) {
                                            cb(forEachError, scoredArticles)
                                        }
                                        else {
                                            //scores=[2,3,4,5,3,2,3,4,5,6,9,9,100,-100];

                                            scores.sort(function (a, b) {
                                                return(a.score - b.score)
                                            })
                                            var scoreValues = []
                                            for (var i = 0; i < scores.length; i++) {
                                                scoreValues.push(scores[i].score)
                                            }
                                            var avg = stats.getAverageFromNumArr(scoreValues)
                                            var standard_deviation = stats.getStandardDeviation(scoreValues)
                                            var scoredArticles = []
                                            var positionValue = 100 / scoreValues.length;
                                            var s = 1
                                            async.forEach(scores, function (score, scoreCallback) {
                                                s++
                                                var uniformScore = s * positionValue
                                                var normalScore = (100 / 2) + (100 / 8) * (score.score - avg) / standard_deviation
                                                scoredArticles.push({articleId:score.articleId, score:score.score, normal:normalScore, uniform:uniformScore})

                                                db.Article.update({_id:score.articleId}, {$set:{'meta.normal_score':normalScore, 'meta.uniform_score':uniformScore}}, {multi:true}, function (err, result) {
                                                    scoreCallback(err, result)
                                                })

                                            }, function (forEachScoreError) {
                                                cb(forEachScoreError, scoredArticles)
                                            })
                                        }

                                    })

                                })
                            })
                        })
                    })
                })
            })
        })
    })

}

function runUpdateScore() {
    console.log('updating scores')
    updateScore(100, runUpdateScoreComplete)
}

function runUpdateScoreComplete(err, scoredArticles) {
    if (err) {
        console.log(err)
    }
    //var csvFile = cli.args.shift()
    if (false) {
        csv()
            .from(scoredArticles)
            .toPath(__dirname + '/scores.csv')
            .transform(function (data) {
                return [data.articleId.toString(), data.score, data.normal, data.uniform]
            })
            .on('end', function (count) {
                console.log('Number of lines: ' + count);
                process.exit(0)
            })
            .on('error', function (error) {
                console.log(error.message);
                process.exit(0)
            });
    } else {
        console.log('Number of articles: ' + scoredArticles.length);
        console.log('done')
    }
    setTimeout(runUpdateScore, 30000)
}

runUpdateScore()