var async = require('async')


function loadExpertiseNodeParents(expertiseId,loadExpertiseNodeParentCallback){
    models.Expertise.find({children:expertiseId},function(err,parents){
        loadExpertiseNodeParentCallback(err,parents)
    })
}

function getExpertiseNodeParentIds(expertiseId,parentIds,getExpertiseNodeParentIdsCallback){
    loadExpertiseNodeParents(expertiseId,function(err,parents){
        if(parents){
            async.forEachSeries(parents,function(parent,parentCallback){
                parentIds.push(parent._id.toString())
                getExpertiseNodeParentIds(parent._id,parentIds,getExpertiseNodeParentIdsCallback)
            },function(err){
                getExpertiseNodeParentIdsCallback(parentIds)
            })
        }else{
            getExpertiseNodeParentIdsCallback(parentIds)
        }
    })
}



function loadExpertiseIds(expertises, loadExpertiseIdsCallback) {
    var populatedExpertises = []
    expertises = expertises || []
    if (expertises.length > 0) {
        async.forEachSeries(expertises, function (expertiseId, childPopulateCallback) {

            if (expertiseId._id) {
                expertiseId = expertiseId._id
            }

            models.Expertise.findById(expertiseId, function (findError, expertise) {
                if (expertise) {
                    async.waterfall([
                        function (stepOneCallback) {
                            if (expertise.children) {
                                loadExpertiseIds(expertise.children, function (err, populatedChildren) {
                                    expertise.populatedChildren = populatedChildren
                                    stepOneCallback(undefined, expertise)
                                })
                            } else {
                                stepOneCallback(expertise)
                            }
                        },
                        function (expertise, stepTwoCallback) {
                            populatedExpertises.push(expertise)
                            stepTwoCallback(undefined, populatedExpertises)
                        }
                    ], function (err, populatedExpertises) {
                        childPopulateCallback()
                    })
                } else {
                    childPopulateCallback()
                }
            })
        }, function (err) {
            loadExpertiseIdsCallback(undefined, populatedExpertises)
        })
    } else {
        loadExpertiseIdsCallback(undefined, populatedExpertises)
    }
}


exports.expertisesList = function (req, res) {
    var start = parseInt(req.query.start || 0)
    var perpage = 20
    var previous = 0
    previous = (start - perpage) > 0 ? start - perpage : 0

    models.Expertise.count(function (countError, count) {
        models.Expertise.find({is_root:true}).skip(start).limit(perpage).sort('createdAt', 'descending').execFind(function (err, expertises) {
            if (err) {
                res.send(err)
            } else {
                loadExpertiseIds(expertises, function (err, populatedExpertises) {
                    if (req.query.ajax) {
                        res.partial('expertises/expertise_tree.ejs', {
                            expertises:populatedExpertises
                        })

                    } else {
                        res.render('expertises/expertises_list.ejs', {
                            expertises:populatedExpertises,
                            total:count,
                            start:start + perpage,
                            previous:previous,
                            filter:{}
                        })
                    }
                })

            }
        })
    })
}


exports.expertisesShow = function (req, res) {

    var _id = req.params.id

    async.waterfall([

        function (stepOneCallback) {
            models.Expertise.findById(_id, function (err, expertise) {
                console.log(err)
                stepOneCallback(err, expertise)
            });
        },
        function (expertise, stepTwoCallback) {
            models.Tweeter.find({ma_expertise:{$ne:expertise._id}}, function (err, availableTweeters) {
                console.log(err)
                availableTweeters = availableTweeters || []
                stepTwoCallback(err, expertise, availableTweeters)
            });
        },
        function (expertise, availableTweeters, stepThreeCallback) {
            models.Tweeter.find({ma_expertise:expertise._id}, function (err, expertiseTweeters) {
                if(err)
                    console.log(err)
                expertiseTweeters = expertiseTweeters || []
                stepThreeCallback(err, expertise, availableTweeters, expertiseTweeters)
            });
        }
    ], function (err, expertise, availableTweeters, expertiseTweeters) {
        if (err) {
            console.log(err)
            res.send(err)
        } else {
            if (req.query.ajax) {
                res.partial('expertises/expertise_edit_panel', {
                    expertise:expertise,
                    availableTweeters:availableTweeters,
                    expertiseTweeters:expertiseTweeters
                })
            } else {
                res.render('expertises/expertises_show', {
                    expertise:expertise,
                    availableTweeters:availableTweeters,
                    expertiseTweeters:expertiseTweeters
                })

            }
        }

    })

}

exports.expertisesDelete = function (req, res) {
    var _id = req.params.id
    models.Expertise.findById(_id, function (err, expertise) {
        if (expertise) {
            expertise.remove(function (err, result) {
                if (req.query.ajax) {
                    res.send({success:true})
                } else {
                    res.redirect('/expertises/list');
                }
            })
        }
    })
}

exports.expertisesSave = function (req, res) {
    var expertise
    var tweeterIdList = req.body.tweeters || []
        //Includes parents
    var expertiseIdList= []

    async.waterfall([
        function(stepZeroCallback){
            getExpertiseNodeParentIds(req.body._id,[],function(parentIds){
                expertiseIdList=parentIds
                expertiseIdList.push(req.body._id)
                stepZeroCallback()
            })
        },
        function (stepOneCallback) {
            if (req.body._id == '' || (typeof req.body._id == undefined) || (!req.body._id)) {
                //its a new expertise
                delete req.body._id
                expertise = new models.Expertise(req.body)
                expertise.save(function (err, savedExpertise) {
                    stepOneCallback(err, savedExpertise)
                })
            } else {
                models.Expertise.findById(req.body._id, function (error, existingExpertise) {
                    for (var field in req.body) {
                        if (field != '_id') {
                            existingExpertise._doc[field] = req.body[field]
                            existingExpertise.markModified(field)
                        }
                    }
                    existingExpertise.save(function (err, updatedExpertise) {
                        stepOneCallback(err, updatedExpertise)
                    })
                })
            }
        },
        function (savedExpertise, stepTwoCallback) {
            if (req.body.parentId) {
                models.Expertise.findById(req.body.parentId, function (err, parent) {
                    if (err) {
                        stepTwoCallback(err)
                    } else {
                        if (parent) {
                            parent.children.push(savedExpertise._id)
                            parent.save(function (parentError, updatedParent) {
                                stepTwoCallback(parentError, savedExpertise, updatedParent)
                            })
                        }
                    }
                })
            } else {
                stepTwoCallback(undefined, savedExpertise,undefined)
            }
        },
        function (savedExpertise, updatedParent, stepThreeCallback) {
            //Remove expertises from tweeters not in tweeterIdList
            models.Tweeter.update({_id:{$nin:tweeterIdList}}, {$pull:{ma_expertise:savedExpertise._id}},{multi: true}, function (err, numberAffected) {
                if (err) {
                    console.log(err)
                }
                stepThreeCallback(err, savedExpertise, updatedParent)
            })
        },
        function (savedExpertise, updatedParent, stepFourCallback) {
            //Add expertise to tweeters  in tweeterIdList
            models.Tweeter.update({_id:{$in:tweeterIdList}}, {$addToSet:{ma_expertise:{$each:expertiseIdList}}},{multi: true}, function (err, numberAffected) {
                if (err) {
                    console.log(err)
                }
                stepFourCallback(err, savedExpertise, updatedParent)
            })
        },

    ], function (err, savedExpertise) {
        if (req.query.ajax) {
            var response = {}
            response.success = err ? false : true
            if (savedExpertise)
                response.result = savedExpertise._doc
            res.send(response)
        } else {
            res.redirect('/expertises/show/' + savedExpertise._id)
        }
    })

    /*
     if (req.body._id == '' || (typeof req.body._id == undefined) || (!req.body._id)) {
     //its a new expertise
     delete req.body._id
     expertise = new models.Expertise(req.body)
     expertise.save(function (err, result) {
     if (err) {
     res.send(err)
     console.log(err)
     } else {
     if (req.body.parentId) {
     models.Expertise.findById(req.body.parentId, function (err, parent) {
     if (err) {
     console.log(err)
     } else {
     if (parent) {
     parent.children.push(result._id)
     parent.save(function (error, result) {
     if (req.query.ajax) {
     res.send({success:true, result:result._doc})
     } else {
     res.redirect('/expertises/show/' + _id)
     }
     })
     }
     }
     })
     } else {
     if (req.query.ajax) {
     res.send({success:true, result:result._doc})
     } else {
     res.redirect('/expertises/show/' + _id)
     }
     }
     }
     })
     } else {
     //editting existing
     models.Expertise.findById(req.body._id, function (error, expertise) {
     for (var field in req.body) {
     if (field != '_id') {
     expertise._doc[field] = req.body[field]
     expertise.markModified(field)
     }
     }
     expertise.save(function (err, result) {
     if (err) {
     res.render('expertises/expertises_new', {
     page_name:'Create',
     expertise:{},
     errors:{
     'Error saving':error
     }
     })
     } else {
     if (req.body.parentId) {
     models.Expertise.findById(req.body.parentId, function (err, parent) {
     if (err) {
     console.log(err)
     } else {
     if (parent) {
     parent.children.push(result._id)
     parent.save(function (result, error) {
     if (req.query.ajax) {
     res.send({success:true, result:result._doc})
     } else {
     res.redirect('/expertises/show/' + _id)
     }
     })
     }
     }
     })
     } else {
     if (req.query.ajax) {
     res.send({success:true, result:result._doc})
     } else {
     res.redirect('/expertises/show/' + expertise._id)
     }
     }
     }
     })
     });
     }*/
}