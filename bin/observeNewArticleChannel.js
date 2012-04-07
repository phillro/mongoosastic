/**
 * User: philliprosen
 * Date: 4/7/12
 * Time: 1:44 PM
 * Will just observe and report article publish events
 */


var async = require('async')
var cli = require('cli')
cli.parse({
    verbose:['v', 'Print response']
});

var env = cli.args.shift() || 'development'
conf = require('../etc/conf')[env]



var articlePublishingWrapper = new require('../lib/ArticlePublishingWrapper')(conf)

articlePublishingWrapper.subscribePublishArticleEvents(function(artcileId){
    console.log('Received publish article event '+artcileId)
})