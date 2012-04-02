/**
 * User: philliprosen
 * Date: 4/1/12
 * Time: 9:22 PM
 */
conf = require('./etc/conf').development
var express = require('express')
var routes = require('./routes');
var mongoose = require('mongoose')


var app = module.exports = express.createServer();

var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
GLOBAL.modelsDb = mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
var MediaAmpModels = require('mediaamp-models/index.js')

GLOBAL.models = {
    SourceContent:mediaAmpDb.model('source_content', MediaAmpModels.SourceContentSchema),
    Tweet:mediaAmpDb.model('tweet', MediaAmpModels.TweeterSchema),
    Tweeter:mediaAmpDb.model('tweeter', MediaAmpModels.TweeterSchema)
}


app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
});

app.get('/sourcecontent/show/:id', routes.sourcecontentShow);
app.get('/sourcecontent/show/:id/body', routes.sourcecontentShowBody);
app.get('/sourcecontent/list', routes.sourcecontentList);
app.get('/', routes.index);


app.listen(3000);