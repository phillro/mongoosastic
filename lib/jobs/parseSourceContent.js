/**
 * User: philliprosen
 * Date: 4/27/12
 * Time: 2:40 PM
 */


var nodeio = require('node.io');
var YahooClient = require('node-geocode').Client;
var async = require('async')
var extend = require('node.extend')


module.exports = function (conf, params, jobOptions) {


    params = params || {}
    var defaultParams = {}
    params = extend(params, defaultParams)

    var defaultOptions = {
        take:1
    }
    jobOptions = extend(jobOptions, defaultOptions)

    var logger = conf.logger || new (winston.Logger)({
        transports:[
            consoleLogger
        ]
    })

    var sourceParserService = new require('../SourceParserService')(conf)


    var methods = {
        input:function (start, num, callback) {

        },
        run:function (sourceContent) {
            var url = Helpers.removeQueryStringAndHashesFromUrl(sourceContent.url)
            var hostName = Helpers.extractHostNameFromUrl(url)
            async.waterfall([
                function (stepOneCallback) {
                    Publication.findOne({host_name:hostName}, function (pubFindError, publication) {
                        if (pubFindError) {
                            logger.log('error', 'Error finding publication for ' + host_name)
                        }
                        stepOneCallback(pubFindError, publication)
                    })
                },
                function (publication, stepTwoCallback) {
                    if (publication) {
                        var sourceParserPath = sourceParserService.getSourceParserJob(hostName)
                        if (sourceParserPath) {
                            //Should handle missing job file, syntax error
                            var sourceParserJob = require('./sources/' + sourceParserPath)(conf)
                            nodeio.start(sourceParserJob, {}, function (err, results) {
                                if(err)
                                    logger.log('error','Error runing parseSourceContent for '+sourceContent._id+' '+err)
                                else{

                                }
                            })
                        }
                    } else {
                        logger.log('info', 'Publication not found for: ' + hostName)
                        stepTwoCallback(false)
                    }
                }
            ], function (error, results) {

            })
        },
        output:function (results) {

        },
        complete:function (callback) {
            if (results instanceof Array) {
                for (var i = 0; i < results.length; i++) {

                }
            } else {

            }
        }

    }

    return new nodeio.Job(defaultOptions, methods)

}