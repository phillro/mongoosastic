/**
 * User: philliprosen
 * Date: 4/22/12
 * Time: 10:09 PM
 */

var md5=require('md5')



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
    models.User.findById(_id, function (err, user) {
        if (err) {
            res.send(err)
        } else {
            res.render('users/users_show.ejs', {
                userObj:user,
            })
        }
    })
};


exports.userEdit = function (req, res) {
    var _id = req.params.id
    models.User.findById(_id, function (err, user) {
        if (err) {
            res.send(err)
        } else {
            res.render('users/users_new', {
                userObj:user,
                page_name:'Edit',
            })
        }
    })
};

exports.userNew = function (req, res) {

    res.render('users/users_new', {
        page_name:'Create',
        userObj:{}
    })
};

exports.userSave = function (req, res) {
    var user


    if (req.body._id == '' || (typeof req.body._id == undefined)) {
        //its a new user
        delete req.body._id
        req.body.password=md5.digest_s(req.body.password)
        user = new models.User(req.body)
        user.save(function (err, result) {
            if (err) {
                res.send(err)
                console.log(err)
            } else {
                var _id = result._id
                if (err) {
                    res.send(err)
                } else {
                    res.redirect('/users/show/' + _id)
                }

            }
        })
    }

    else {
        //editting existing
        if(req.body.password){
            if(req.body.password.length=0){
                delete req.body.password;
            }else{
                req.body.password=md5.digest_s(req.body.password)
            }
        }
        models.User.findById(req.body._id, function (error, user) {
            for (var field in req.body) {
                if (field != '_id') {
                    user._doc[field] = req.body[field]
                    user.markModified(field)
                }
            }
            user.save(function (err, result) {
                if (err) {
                    res.render('users/users_new', {
                        page_name:'Create',
                        userObj:{},
                        errors:{
                            'Error saving':error
                        }
                    })
                } else {
                    res.redirect('/users/show/' + user._id)
                }
            })
        });
    }


};
