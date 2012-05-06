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
    var shouldBeDead=false
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

        if(typeof callback=='function'&&(!shouldBeDead)){
            shouldBeDead=true
            callback(code)
        }

    });

    setTimeout(function(){
        console.log('Checking processTweetsData proc')
        if(processTweetsData&&(!shouldBeDead)){
            shouldBeDead=true
            console.log('killing child')
            processTweetsData.kill()
            callback('SIGTERM SENT')
        }
    },30000)
}

var processTweetsComplete = function(code){
    logger.log('info','Exited with code '+code)
    setTimeout(processTweets(processTweetsComplete),15000)
}

processTweets(processTweetsComplete)


var processSourceContents = function (callback) {
    var processSourceContentsData = child_proc.spawn('node', ['processSourceContents.js',env]);

    processSourceContentsData.stdout.on('data', function (data) {
        logger.log('info', data)
    });


    processSourceContentsData.stderr.on('data', function (chunk) {
        logger.log('info', chunk);
    })

    processSourceContentsData.on('exit', function (code) {
        if (code !== 0) {
            logger.log('error', 'processSourceContentsData Exited with code: ' + code)
        } else {
            logger.log('info', 'processSourceContentsData Complete')
        }
        if(typeof callback=='function')
            callback(code)
    });

}

var processSourceContentsComplete = function(code){
    logger.log('info','Exited with code '+code)
    setTimeout(processSourceContents(processSourceContentsComplete),15000)
}

processSourceContents(processSourceContentsComplete)


