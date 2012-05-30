/**
 * User: philliprosen
 * Date: 4/22/12
 * Time: 10:09 PM
 */

var md5 = require('md5')
var async = require('async')
var mongoose = require('mongoose')

exports.userList = function (req, res) {
    var start = parseInt(req.query.start || 0)
    var perpage = 20
    var previous = 0
    previous = (start - perpage) > 0 ? start - perpage : 0

    models.User.count(function (countError, count) {
        models.User.find().skip(start).limit(perpage).sort('createdAt', 'descending').execFind(function (err, results) {
            if (err) {
                res.send(err)
            } else {
                res.render('users/users_list', {
                    users:results,
                    total:count,
                    start:start + perpage,
                    previous:previous
                })
            }
        })
    })
}

exports.userShow = function (req, res) {
    var _id = req.params.id

    async.waterfall([
        function findUser(findUserCallback) {
            models.User.findById(_id, function (err, user) {
                findUserCallback(err, user)

            })
        },
        function findUserTweeter(user, findUserTweeterCallback) {
            if (user.tweeter_id) {
                models.Tweeter.findById(user.tweeter_id, function (err, tweeter) {
                    findUserTweeterCallback(err, user, tweeter)
                })
            } else {
                findUserTweeterCallback(undefined, user, false)
            }
        }
    ], function waterfallComplete(err, user, tweeter) {
        res.render('users/users_show.ejs', {
            userObj:user,
            tweeter:tweeter
        })
    })
};


exports.userEdit = function (req, res) {
    var _id = req.params.id
    async.waterfall([
        function findUser(findUserCallback) {
            models.User.findById(_id, function (err, user) {
                findUserCallback(err, user)

            })
        },
        function findUserTweeter(user, findUserTweeterCallback) {
            if (user.tweeter_id) {
                models.Tweeter.findById(user.tweeter_id, function (err, tweeter) {
                    findUserTweeterCallback(err, user, tweeter)
                })
            } else {
                findUserTweeterCallback(undefined, user, false)
            }
        },
        function findUserTweeters(user, tweeter, findUserTweetersCallback) {
            models.Tweeter.find({}, {}, {limit:2000}, function (err, availableTweeters) {
                findUserTweetersCallback(err, user, tweeter, availableTweeters)
            })
        }
    ], function waterfallComplete(err, user, tweeter, availableTweeters) {
        res.render('users/users_new', {
            userObj:user,
            availableTweeters:availableTweeters,
            page_name:'Edit'
        })
    })
};

exports.userNew = function (req, res) {
    models.Tweeter.find({}, {}, {limit:2000}, function (err, availableTweeters) {
    res.render('users/users_new', {
        page_name:'Create',
        availableTweeters:availableTweeters||[],
        userObj:{}
    })
    })
};

exports.userSave = function (req, res) {
    var user
    var tweeter_id = false
    if (req.body.tweeter_id) {
        if (req.body.tweeter_id == 'none')
            delete req.body.tweeter_id
        else {
            req.body.tweeter_id = tweeter_id = mongoose.Types.ObjectId(req.body.tweeter_id);
        }
    }

    if (req.body._id == '' || (typeof req.body._id == undefined)) {
        //its a new user
        delete req.body._id
        req.body.password = md5.digest_s(req.body.password)

        user = new models.User(req.body)
        async.waterfall([
            function saveUser(saveUserCallback) {

                user.save(function (err, newUser) {
                    saveUserCallback(err, newUser)
                })
            },
            function updateTweeters(newUser, updateTweetersCallback) {
                if (tweeter_id) {
                    models.Tweeter.update({_id:tweeter_id}, {$set:{ma_user_id:newUser._id}}, {multi:true}, function (updateError, updateResult) {
                        updateTweetersCallback(updateError, updateResult)
                    })
                } else {
                    updateTweetersCallback(undefined, newUser)
                }
            }
        ], function (waterfallError, newUser) {
            var _id = newUser._id
            if (waterfallError) {
                console.log(waterfallError)
                res.send(waterfallError)
            } else {
                res.redirect('/users/show/' + _id)
            }
        })

    }

    else {
        //editting existing
        if (req.body.password) {
            if (req.body.password.length = 0) {
                delete req.body.password;
            } else {
                req.body.password = md5.digest_s(req.body.password)
            }
        }

        models.User.findById(req.body._id, function (error, user) {
            for (var field in req.body) {
                if (field != '_id') {
                    user._doc[field] = req.body[field]
                    user.markModified(field)
                }
            }

            async.waterfall([
                function saveUser(saveUserCallback) {
                    user.save(function (err, updatedUser) {
                        if (updatedUser) {
                            if (updatedUser.tweeter_id && !tweeter_id) {
                                models.User.update({_id:updatedUser._id}, {$unset:{tweeter_id:1}}, {}, function (unsetTweeterError, unsetTweeterResult) {
                                    saveUserCallback(unsetTweeterError, updatedUser)
                                })
                            } else {
                                saveUserCallback(err, updatedUser)
                            }
                        } else {
                            saveUserCallback(err, updatedUser)
                        }
                    })
                },
                function updateTweeters(updatedUser, updateTweetersCallback) {
                    models.Tweeter.update({ma_user_id:updatedUser._id}, {$unset:{ma_user_id:1}}, {multi:true}, function (unsetError, unsetResult) {
                        if (tweeter_id) {
                            models.Tweeter.update({_id:tweeter_id}, {$set:{ma_user_id:updatedUser._id}}, {multi:true}, function (updateError, updateResult) {
                                updateTweetersCallback(updateError, updatedUser, updateResult)
                            })
                        } else {
                            updateTweetersCallback(unsetError, updatedUser, unsetResult)
                        }
                    })
                }
            ], function (waterfallError, updatedUser) {

                if (waterfallError) {
                    models.Tweeter.find({}, {}, {limit:2000}, function (err, availableTweeters) {
                        res.render('users/users_new', {
                            page_name:'Create',
                            userObj:{},
                            availableTweeters:availableTweeters || [],
                            errors:{
                                'Error saving':waterfallError
                            }
                        })

                    })
                } else {
                    var _id = updatedUser._id
                    res.redirect('/users/show/' + user._id)
                }
            })
        });
    }


};
