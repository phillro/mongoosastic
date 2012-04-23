/**
 * User: philliprosen
 * Date: 4/22/12
 * Time: 10:09 PM
 */



exports.articlesList = function (req, res) {
    var start = parseInt(req.query.start || 0)
    var perpage = 20
    var previous = 0
    previous = (start - perpage) > 0 ? start - perpage : 0

    models.Article.count(function (countError, count) {
        models.Article.find().skip(start).limit(perpage).sort('createdAt', 'descending').execFind(function (err, results) {
            if (err) {
                res.send(err)
            } else {
                res.render('articles/article_list', {
                    articles:results,
                    total:count,
                    start:start + perpage,
                    previous:previous
                })
            }
        })
    })
}

