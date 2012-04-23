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
    models.Tweeter.findById(_id, function (err, result) {
        if (err) {
            res.send(err)
        } else {

            res.render('tweeters/tweeter_show', {
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
