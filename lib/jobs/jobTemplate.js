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

    var methods = {
        input:function (start, num, callback) {

        },
        run:function (locationObject) {

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