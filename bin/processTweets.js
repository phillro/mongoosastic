var async = require('async')
conf = require('../etc/conf').development

var nodeio = require('node.io')
var mongoose = require('mongoose')
var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
var MediaAmpModels = require('mediaamp-models/index.js')


var processTweetJob = new require('../lib/jobs/processTweetJob')(conf)

var startProcessTweets = function(){
    nodeio.start(processTweetJob,{},function(err,results){
        console.log('processed')
        setTimeout(startProcessTweets,30000)
      //  process.exit(0)
    })
}

startProcessTweets()


