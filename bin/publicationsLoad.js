/**
 * User: philliprosen
 * Date: 4/5/12
 * Time: 12:14 AM
 */
var mongoose = require('mongoose')

var csv = require('csv');
var cli = require('cli')
var hash = require('mhash').hash
cli.parse({
    verbose:['v', 'Print response']
});

var fileName=cli.args.shift()
var env = cli.args.shift()||'development'

var conf = require('../etc/conf')[env]

var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
var MediaAmpModels = require('mediaamp-models/index.js')
var Publication = mediaAmpDb.model('publication', MediaAmpModels.PublicationSchema)



var loadSeedPublications = function (file, callback) {

    var self = this
    var csvFilePath = file// __dirname + '/../data/bars.csv'
    console.log('Loading ' + csvFilePath + ' to mongo.')
    self.publications = []
    csv()
        .fromPath(csvFilePath)
        .on('end', function (count) {

            self.count = count;
            csv()
                .fromPath(csvFilePath)
                .transform(function (data) {
                    var publication=false
                    var hostNameParts = data[0].split('.')
                    if (hostNameParts.length > 0) {
                        var hostName = hostNameParts[hostNameParts.length - 2] +'.'+ hostNameParts[hostNameParts.length-1]
                        publication = {
                            host_name:hostName
                        }
                        if (data.length > 1) {
                            publication.pub_name = data[1]
                        }

                    }
                    return publication
                })
                .on('data', function (data, index) {
                    //skip header row
                    if (index > 0&&data) {
                        self.publications.push(data)
                    }
                })
                .on('end', function (count) {
                    console.log('done loading ' + count)
                    var savedCount = 0;
                    for (var i = 0; i < self.publications.length; i++) {
                        var publicationObj = new Publication(self.publications[i])
                        publicationObj.save(function (err, result) {
                            if (err) {
                                console.log(err)
                            }
                            savedCount++
                            if (savedCount == self.publications.length)
                                callback(savedCount)
                        })
                    }
                });
        });
}


loadSeedPublications(fileName, function (savedCount) {
    console.log(savedCount + ' publications loaded.')
    process.exit(0)
});

