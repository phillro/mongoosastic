/**
 * User: philliprosen
 * Date: 4/22/12
 * Time: 10:12 PM
 */





exports.publicationsList = function (req, res) {
    var start = parseInt(req.query.start || 0)
    var perpage = 20
    var previous = 0
    previous = (start - perpage) > 0 ? start - perpage : 0

    models.Publication.count(function (countError, count) {
        models.Publication.find().skip(start).limit(perpage).sort('createdAt', 'descending').execFind(function (err, results) {
            if (err) {
                res.send(err)
            } else {
                res.render('publications/publications_list', {
                    publications:results,
                    total:count,
                    start:start + perpage,
                    previous:previous,
                    //  MediaAmpModels:MediaAmpModels
                })
            }
        })
    })
}

exports.publicationShow = function (req, res) {
    var _id = req.params.id

    models.Publication.findById(_id, function (err, publication) {
        if (err) {
            res.send(err)
        } else {
            models.Tweeter.find({ma_publications:_id},function(err,tweeters){

            res.render('publications/publications_show', {
                publication:publication,
                tweeters:tweeters||[]

            })
            })
        }
    })
};

exports.publicationEdit = function (req, res) {
    var _id = req.params.id
    models.Publication.findById(_id, function (err, result) {
        if (err) {
            res.send(err)
        } else {

            res.render('publications/publications_new', {
                publication:result,
                page_name:'Edit'
            })
        }
    })
};

exports.publicationNew = function (req, res) {
    res.render('publications/publications_new', {
        page_name:'Create',
        publication:{}
    })
};

exports.publicationSave = function (req, res) {
    var publication
    if(req.body.host_name){
        req.body.host_name=req.body.host_name.toLocaleLowerCase().replace(/(http|https)\:\/\//gi,'')
    }

    if (req.body._id == '' || (typeof req.body._id == undefined)){
        //its a new publication
        delete req.body._id
        publication = new models.Publication(req.body)
        publication.save(function (err, result) {
                if (err) {
                    res.send(err)
                    console.log(err)
                } else {
                    var _id = result._id
                    maHelper.updatePublicationProfile(result, function (err, result) {
                        if (err) {
                            res.send(err)
                        } else {
                            res.redirect('/publications/show/' + _id)
                        }
                    })

                }
            })
    }

    else{
        //editting existing
        models.Publication.findById(req.body._id, function(error, publication){
            for(var field in req.body){
                if(field!='_id'){
                    publication._doc[field]=req.body[field]
                    publication.markModified(field)
                }
            }
            publication.save(function(err,result){
                if(err){
                    res.render('publications/publications_new', {
                        page_name:'Create',
                        publication:{},
                        errors:{
                            'Error saving':error
                        }
                    })
                }else{
                    res.redirect('/publications/show/' + publication._id)
                }
            })
        });
    }


};
