/**
 * Creates a new profile record for every line on the provided CSV
 */
var mongoose = require('mongoose')

var csv = require('csv');
var cli = require('cli')
var hash = require('mhash').hash
conf = require('../etc/conf').development


var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
var MediaAmpModels = require('mediaamp-models/index.js')
var Tweeter = mediaAmpDb.model('tweeter',MediaAmpModels.TweeterSchema)
//var Profile = mediaAmpDb.model('profiles', require('../models/profiles'))


cli.parse({
    verbose:['v', 'Print response']
});

var loadSeedProfiles = function (file, callback) {

    var self = this
    var csvFilePath = file// __dirname + '/../data/bars.csv'
    console.log('Loading ' + csvFilePath + ' to mongo.')
    self.tweeters = []
    csv()
        .fromPath(csvFilePath)
        .on('end', function (count) {

            self.count = count;
            csv()
                .fromPath(csvFilePath)
                .transform(function (data) {
                    var Tweeter = {
                        screen_name:data[0].replace(/\@/,''),
                        newsOrg:data[5],
                        type:data[6],
                        locaton:data[7],
                        password:hash("md5", data[9])
                    }
                    return Tweeter
                })
                .on('data', function (data, index) {
                    //skip header row
                    if (index > 0) {
                        self.tweeters.push(data)
                    }
                })
                .on('end', function (count) {
                    console.log('done loading ' + count)
                    var savedCount = 0;
                    for (var i = 0; i < self.tweeters.length; i++) {
                        var tweeterObj = new Tweeter(self.tweeters[i])
                        tweeterObj.save(function (err, result) {
                            if (err) {
                                console.log(err)
                            }
                            savedCount++
                            if (savedCount == self.tweeters.length)
                                callback(savedCount)
                        })
                    }
                });
        });
}


    loadSeedProfiles(cli.args.shift(), function (savedCount) {
        console.log(savedCount + ' profiles loaded.')
        process.exit(0)
    });

