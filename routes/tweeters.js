/**
 * User: philliprosen
 * Date: 4/22/12
 * Time: 10:09 PM
 */





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
                res.render('tweeters/tweeters_list', {
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
    models.Tweeter.findById(_id, function (err, tweeter) {
        if (err) {
            res.send(err)
        } else {
            var ma_expertises = tweeter.ma_expertise || []
            models.Expertise.find({_id:{$in:ma_expertises}}, function (error, expertises) {


                models.Publication.find({}, {_id:1, pub_name:1}, {sort:{pub_name:1}}, function (error, publications) {
                    tweeter.loaded_ma_publications = []
                    if (tweeter.ma_publications) {
                        for (var p = 0; p < publications.length; p++) {
                            var pid = publications[p]._id.toString()
                            if (tweeter.ma_publications.indexOf(pid) > -1) {
                                tweeter.loaded_ma_publications.push(publications[p])
                            }
                        }
                    }
                    res.render('tweeters/tweeters_show.ejs', {
                        tweeter:tweeter,
                        expertises:expertises
                    })
                })
            })
        }
    })
};

exports.tweeterNew = function (req, res) {
    res.render('tweeter_new', {})
};


exports.tweeterEdit = function (req, res) {
    var _id = req.params.id
    models.Tweeter.findById(_id, function (err, tweeter) {
        if (err) {
            res.send(err)
        } else {
            var ma_expertises = tweeter.ma_expertise || []
            models.Expertise.find({_id:{$in:ma_expertises}}, function (error, selectedExpertises) {
                models.Expertise.find({_id:{$in:ma_expertises}}, function (error, availableExpertises) {
                    models.Publication.find({}, {_id:1, pub_name:1}, {sort:{pub_name:1}}, function (error, publications) {
                        if (tweeter.ma_publications) {
                            for (var p = 0; p < publications.length; p++) {
                                var pid = publications[p]._id.toString()
                                if (tweeter.ma_publications.indexOf(pid) > -1) {
                                    publications[p].selected = true
                                }
                            }
                        }
                        for(var s=0;s<selectedExpertises;s++){
                            for(var a=0;a<availableExpertises;a++){
                                if(selectedExpertises[s]._id==availableExpertises[a]._id)
                                    availableExpertises[a].selected=true
                            }
                        }
                        res.render('tweeters/tweeters_new', {
                            tweeter:tweeter,
                            publications:publications,
                            page_name:'Edit',
                            selectedExpertises:selectedExpertises,
                            availableExpertises:availableExpertises
                        })
                    })
                })
            })
        }
    })
};

exports.tweeterNew = function (req, res) {
    models.Publication.find({}, {_id:1, pub_name:1}, {sort:{pub_name:1}}, function (error, publications) {
        res.render('tweeters/tweeters_new', {
            page_name:'Create',
            publications:publications,
            tweeter:{}
        })
    })
};

exports.tweeterSave = function (req, res) {
    var tweeter


    if (req.body._id == '' || (typeof req.body._id == undefined)) {
        //its a new tweeter
        delete req.body._id

            if(typeof req.body.ma_expertise=='string')
                req.body.ma_expertise=[req.body.ma_expertise]

        tweeter = new models.Tweeter(req.body)
        tweeter.save(function (err, result) {
            if (err) {
                res.send(err)
                console.log(err)
            } else {
                var _id = result._id
                maHelper.updateTweeterProfile(result, function (err, result) {
                    if (err) {
                        res.send(err)
                    } else {
                        res.redirect('/tweeters/show/' + _id)
                    }
                })

            }
        })
    }

    else {
        //editting existing
        models.Tweeter.findById(req.body._id, function (error, tweeter) {
            for (var field in req.body) {
                if (field != '_id') {
                    tweeter._doc[field] = req.body[field]
                    tweeter.markModified(field)
                }
            }
            tweeter.save(function (err, result) {
                if (err) {
                    res.render('tweeters/tweeters_new', {
                        page_name:'Create',
                        tweeter:{},
                        errors:{
                            'Error saving':error
                        }
                    })
                } else {
                    res.redirect('/tweeters/show/' + tweeter._id)
                }
            })
        });
    }


};
