/**
 * User: philliprosen
 * Date: 4/23/12
 * Time: 6:41 PM
 */

var mongoose = require('mongoose')

var csv = require('csv');
var cli = require('cli')
var hash = require('mhash').hash
cli.parse({
    verbose:['v', 'Print response']
});

var fileName = cli.args.shift()
var env = cli.args.shift() || 'development'

var conf = require('../etc/conf')[env]

var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
var MediaAmpModels = require('mediaamp-models/index.js')
var Expertise = mediaAmpDb.model('expertise', MediaAmpModels.ExpertiseSchema)

var child1 = new Expertise({name:'child1'})
child1.save()

var expertise = new Expertise({name:'Philltest2'})
expertise.children.push(child)
var child = new Expertise({name:'child'})
expertise.children.push(child)
var child = new Expertise({name:'child'})
expertise.children.push(child)



expertise.save(function (err, result) {
    console.log(result)
})