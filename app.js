/**
 * User: philliprosen
 * Date: 4/1/12
 * Time: 9:22 PM
 */
var cli = require('cli')
cli.parse({
    verbose:['v', 'Print response']
});

var env = cli.args.shift() || 'test'
    console.log(env)
conf = require('./etc/conf')[env]
var express = require('express')
var everyauth = require('everyauth')
var mongoose = require('mongoose')


var app = module.exports = express.createServer();

var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
GLOBAL.modelsDb = mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
var MediaAmpModels = require('mediaamp-models/index.js')
GLOBAL.schemas = app.schemas =  MediaAmpModels
GLOBAL.models = app.models= MediaAmpModels.loadModels(modelsDb,app.schemas)
GLOBAL.maHelper = new require('lib/ProtoHelpers.js')(conf)

var everyauth = new require('./lib/auth')(app)

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.cookieParser())
    app.use(express.session({secret:'foo'}))
    app.use(express.bodyParser());
    app.use(express.methodOverride())
    app.use(express.static(__dirname + '/public'));
    app.use(everyauth.middleware())
});
everyauth.helpExpress(app);

//Protect the paths
app.all(/^\/(tweeters|articles|publications|sourcecontent|users|expertises)\/.*/,function(req,res, next){
    if(env=='production'){
    if(req.session.auth){
        if(req.session.auth.loggedIn)
            next()
    }
    else
        res.redirect('/login')
    }else{
        next()
    }
})

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

var index = require('./routes');
var articles = require('./routes/articles')
var tweeters = require('./routes/tweeters')
var users = require('./routes/users')
var sourceContent = require('./routes/sourceContent')
var publications = require('./routes/publications')
var expertises = require('./routes/expertises')


app.get('/expertises/list.:format?', expertises.expertisesList);
app.get('/expertises/show/:id.:format?', expertises.expertisesShow);
app.post('/expertises/save', expertises.expertisesSave);
app.del('/expertises/del/:id', expertises.expertisesDelete);

app.get('/articles/list', articles.articlesList);

app.get('/sourcecontent/show/:id', sourceContent.sourcecontentShow);
app.get('/sourcecontent/show/:id/body', sourceContent.sourcecontentShowBody);
app.get('/sourcecontent/list', sourceContent.sourcecontentList);

app.get('/tweeters/list', tweeters.tweetersList);
app.get('/tweeters/show/:id', tweeters.tweeterShow);
app.get('/tweeters/create', tweeters.tweeterNew);
app.get('/tweeters/edit/:id', tweeters.tweeterEdit);
app.post('/tweeters/save', tweeters.tweeterSave);

app.get('/users/list', users.userList);
app.get('/users/show/:id', users.userShow);
app.get('/users/create', users.userNew);
app.get('/users/edit/:id', users.userEdit);
app.post('/users/save', users.userSave);


app.get('/publications/list', publications.publicationsList);
app.get('/publications/show/:id', publications.publicationShow);
app.del('/publications/delete/:id', publications.publicationDelete);
app.get('/publications/delete/:id', publications.publicationDelete);
app.get('/publications/create', publications.publicationNew);
app.get('/publications/edit/:id', publications.publicationEdit);
app.post('/publications/save', publications.publicationSave);


app.get('/', index.index);


app.listen(3000);