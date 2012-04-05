var async = require('async')
var cli = require('cli')
cli.parse({
    verbose:['v', 'Print response']
});

var env = cli.args.shift()||'development'
conf = require('../etc/conf')[env]

var nodeio = require('node.io')
var mongoose = require('mongoose')
var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
var MediaAmpModels = require('mediaamp-models/index.js')
//Don't want to load the publications on every job, but this should also be contained in the job somehow. hrm.

var createArticlesFromSourceContentJob = new require('../lib/jobs/createArticlesFromSourceContentJob')(conf)

var startProcessCreateArticlesFromSourceContentJob = function(){
    nodeio.start(createArticlesFromSourceContentJob,{},function(err,results){
        console.log('processed')
        process.exit(0)
    })
}

startProcessCreateArticlesFromSourceContentJob()

