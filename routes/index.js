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
    var previous=0
    previous=(start-perpage)>0 ? start-perpage :0

    models.SourceContent.count(function(countError,count){
        models.SourceContent.find().skip(start).limit(perpage).sort('createdAt', 'descending').execFind(function (err, results) {
            if (err) {
                res.send(err)
            } else {
                res.render('source_content_list', {
                    source_contents:results,
                    total:count,
                    start:start+perpage,
                    previous:previous
                })
            }
        })
    })
};


exports.index = function (req, res) {
    res.send('hi')
}
