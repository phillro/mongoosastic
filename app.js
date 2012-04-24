/**
 * User: philliprosen
 * Date: 4/1/12
 * Time: 9:22 PM
 */
var cli = require('cli')
cli.parse({
    verbose:['v', 'Print response']
});

var env = cli.args.shift() || 'development'
    console.log(env)
conf = require('./etc/conf')[env]
var express = require('express')
var everyauth = require('everyauth')
var mongoose = require('mongoose')


var app = module.exports = express.createServer();

var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
GLOBAL.modelsDb = mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
var MediaAmpModels = require('mediaamp-models/index.js')
GLOBAL.schemas = schemas = MediaAmpModels
GLOBAL.models = MediaAmpModels.loadModels(modelsDb,schemas)
GLOBAL.maHelper = new require('./lib/Helpers')(conf)

var authWrapper = new require('./lib/auth')()
var everyauthRoot = __dirname + '/node_modules/everyauth';
everyauth.everymodule
    .findUserById(authWrapper.findUserById);

everyauth
    .password
    .loginWith('email')
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('login.jade')
    .loginLocals(function (req, res, done) {
        setTimeout(function () {
            done(null, {
                title:'Async login'
            });
        }, 200);
    })
    .authenticate(function (login, password) {
        var errors = [];
        if (!login) errors.push('Missing login');
        if (!password) errors.push('Missing password');
        if (errors.length) return errors;
        var user = authWrapper.usersByLogin[login];
        if (!user) return ['Login failed'];
        if (user.password !== password) return ['Login failed'];
        return user;
    })

    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register.jade')
    .registerLocals(function (req, res, done) {
        setTimeout(function () {
            done(null, {
                title:'Async Register'
            });
        }, 200);
    })
    .validateRegistration(function (newUserAttrs, errors) {
        var login = newUserAttrs.login;
        if (usersByLogin[login]) errors.push('Login already taken');
        return errors;
    })
    .registerUser(function (newUserAttrs) {
        var login = newUserAttrs[this.loginKey()];
        return usersByLogin[login] = addUser(newUserAttrs);
    })

    .loginSuccessRedirect('/sourcecontent/list')
    .registerSuccessRedirect('/');
/*
GLOBAL.models = {
    Article:mediaAmpDb.model('article', MediaAmpModels.ArticleSchema),
    SourceContent:mediaAmpDb.model('source_content', MediaAmpModels.SourceContentSchema),
    Tweet:mediaAmpDb.model('tweet', MediaAmpModels.TweeterSchema),
    Tweeter:mediaAmpDb.model('tweeter', MediaAmpModels.TweeterSchema)
}*/

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
app.all(/^\/(tweeters|articles|publications|sourcecontent|)\/.*/,function(req,res, next){
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
var sourceContent = require('./routes/sourceContent')
var publications = require('./routes/publications')
var expertises = require('./routes/expertises')


app.get('/expertises/list', expertises.expertisesList);
app.get('/expertises/show/:id', expertises.expertisesShow);
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


app.get('/publications/list', publications.publicationsList);
app.get('/publications/show/:id', publications.publicationShow);
app.get('/publications/create', publications.publicationNew);
app.get('/publications/edit/:id', publications.publicationEdit);
app.post('/publications/save', publications.publicationSave);


app.get('/', index.index);


app.listen(3000);