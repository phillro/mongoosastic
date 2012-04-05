exports.sourcecontentShowBody = function (req, res) {
    var _id = req.params.id
    models.SourceContent.findById(_id, function (err, result) {
        if (err) {
            res.send(err)
        } else {
            res.send(result.body)
        }
    })
};


exports.sourcecontentShow = function (req, res) {
    var _id = req.params.id
    models.SourceContent.findById(_id, function (err, result) {
        if (err) {
            res.send(err)
        } else {

            res.render('source_content_show', {
                source_content:result
            })
        }
    })
};

exports.sourcecontentList = function (req, res) {
    var start = parseInt(req.query.start || 0)
    var perpage = 20
    var previous = 0
    previous = (start - perpage) > 0 ? start - perpage : 0

    models.SourceContent.count(function (countError, count) {
        models.SourceContent.find().skip(start).limit(perpage).sort('createdAt', 'descending').execFind(function (err, results) {
            if (err) {
                res.send(err)
            } else {
                res.render('source_content_list', {
                    source_contents:results,
                    total:count,
                    start:start + perpage,
                    previous:previous
                })
            }
        })
    })
};

exports.tweetersList = function (req, res) {
    var start = parseInt(req.query.start || 0)
    var perpage = 20
    var previous = 0
    previous = (start - perpage) > 0 ? start - perpage : 0

    models.Tweeter.count(function (countError, count) {
        models.Tweeter.find().skip(start).limit(perpage).sort('createdAt', 'descending').execFind(function (err, results) {
            if (err) {
                res.send(err)
            } else {
                res.render('tweeters_list', {
                    tweeters:results,
                    total:count,
                    start:start + perpage,
                    previous:previous
                })
            }
        })
    })
}

exports.tweeterShow = function (req, res) {
    var _id = req.params.id
    models.Tweeter.findById(_id, function (err, result) {
        if (err) {
            res.send(err)
        } else {

            res.render('tweeter_show', {
                tweeter:result
            })
        }
    })
};

exports.tweeterNew = function (req, res) {
    res.render('tweeter_new', {})
};

exports.tweeterSave = function (req, res) {
    if (req.body._id == '' || (typeof req.body._id == undefined))
        delete req.body._id
    var tweeter = new models.Tweeter(req.body)
    tweeter.save(function (err, result) {
        if (err) {
            res.send(err)
            console.log(err)
        } else {
            var _id=result._id
            maHelper.updateTweeterProfile(result,function(err,result){
                if(err){
                    res.send(err)
                }else{
                    res.redirect('/tweeters/show/' + _id)
                }
            })

        }
    })
};


exports.articlesList = function (req, res) {
    var start = parseInt(req.query.start || 0)
    var perpage = 20
    var previous = 0
    previous = (start - perpage) > 0 ? start - perpage : 0

    models.Tweeter.count(function (countError, count) {
        models.Article.find().skip(start).limit(perpage).sort('createdAt', 'descending').execFind(function (err, results) {
            if (err) {
                res.send(err)
            } else {
                res.render('article_list', {
                    articles:results,
                    total:count,
                    start:start + perpage,
                    previous:previous
                })
            }
        })
    })
}



exports.index = function (req, res) {
    res.send('hi')
}
