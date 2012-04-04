var async = require('async')
var cli = require('cli')
cli.parse({
    verbose:['v', 'Print response']
});

var env = cli.args.shift() || 'development'
conf = require('../etc/conf')[env]
logger = conf.logger
var schedule = require('node-schedule');
var child_proc = require('child_process');



var processTweets = function (callback) {
    var processTweetsData = child_proc.spawn('node', ['processTweets.js',env]);

    processTweetsData.stdout.on('data', function (data) {
        logger.log('info', data)
    });


    processTweetsData.stderr.on('data', function (chunk) {
        logger.log('info', chunk);
    })

    processTweetsData.on('exit', function (code) {
        if (code !== 0) {
            logger.log('error', 'processTweetsData Exited with code: ' + code)
        } else {
            logger.log('info', 'processTweetsData Complete')
        }
        if(typeof callback=='function')
            callback(code)
    });
}

var processTweetsComplete = function(code){
    logger.log('info','Exited with code '+code)
    setTimeout(processTweets(processTweetsComplete),15000)
}

processTweets(processTweetsComplete)

    /*
var processTweetsSchedule = schedule.scheduleJob('0,10 * * * *', function () {
    logger.log('info', 'Exeucting scrapeLinkedData')
    processTweets()
});*/
