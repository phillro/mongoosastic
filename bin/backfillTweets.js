/**
 * Loads the last N tweets for every profile, saves to mongo, mirrors to elasticsearch
 * todo: Add command line options for specifying by screen name or twitter id, number of statuses to fetch
 */
var async = require('async')
var ElasticSearchClient = require('elasticsearchclient')
var mongoose = require('mongoose')
var TwitterClient = require('ntwitter');
conf = require('../etc/conf').development

logger = conf.twitterBackFillLogger

var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
var Tweeter = mediaAmpDb.model('tweeter', mediaAmpDbConnectionString.TweeterSchema)
var Tweet = mediaAmpDb.model('tweets', mediaAmpDbConnectionString.TweetSchema)

var elasticSearchClient = new ElasticSearchClient(conf.es_conf.mediaamp)

//Elastic search index to use, move to conf
var indexName = 'ma_prototype_data'
//Object name for the tweets
var objName = 'tweets'
//Past tweets to get
var tweetsToGet = 10


var cli = require('cli')

cli.parse({
    verbose:['v', 'Print response']
});


var twit = new TwitterClient({
    consumer_key:conf.twitter.consumer_key,
    consumer_secret:conf.twitter.consumer_secret,
    access_token_key:conf.twitter.access_token,
    access_token_secret:conf.twitter.access_token_secret
})


var indexTweets = function (tweets, callback) {
    var commands = []
    for (var t = 0; t < tweets.length; t++) {
        commands.push({ "index":{ "_index":indexName, "_type":objName, "_id":tweets[t].id   } })
        commands.push(tweets[t])
    }
    elasticSearchClient.bulk(commands, {})
        .on('data', function (data) {
            logger.log('info', 'bulk commands completed')
            if (typeof callback == 'function')
                callback(undefined, commands.length)
        })
        .on('error', function (error) {
            logger.log('error', 'bulk error')
            logger.log('error', error);
            if (typeof callback == 'function')
                callback(error)
        })
        .exec();
}


var saveTweets = function (tweets, profile, saveTweetsCallback) {
    //save the tweets in mongo
    async.forEachSeries(tweets, function (rawTweet, saveTweetCallback) {
        Tweet.findOne({tweet_id:rawTweet.id}, function (err, exists) {
            if (exists) {
                saveTweetCallback()
            } else {
                var tweet = new Tweet({profile_id:profile._id, twitter_author_id:profile.twitter_id, tweet_id:rawTweet.id})
                rawTweet.profile_id = profile._id
                rawTweet.twitter_author_id = profile.twitter_id
                for (var tweetField in rawTweet) {
                    tweet._doc[tweetField] = rawTweet[tweetField]
                    tweet.markModified(tweetField)
                }
                tweet.save(function (err, result) {
                    if (err) {
                        logger.log('error', err)
                    }
                    logger.log('info',profile.screen_name + ' saved tweetid '+result._id)
                    saveTweetCallback()
                })
            }
        })
    }, function (err) {
        if (err) {
            logger.log('error', err)
        }
        //synch to elasticsearch
        indexTweets(tweets, saveTweetsCallback)
    })

}

var searchTweets = function (profile, callback) {
    twit.getUserTimeline({user_id:profile.twitter_id.valueOf(), count:tweetsToGet, include_entities:1, exclude_replies:1}, function (error, tweets) {
        if (error) {
            logger.log('error', error)
            callback()
        }
        if (tweets) {
            logger.log('info', 'Indexing ' + tweets.length + ' for ' + profile.screen_name)
            saveTweets(tweets, profile, function (error, indexed) {
                //Slight delay for twitter.
                async.nextTick(function () {
                    //unreliable attempt to put in a delay, could be 5s, could be 10s, could be 1.
                    setTimeout(async.nextTick(callback), 5000);
                })
            })
        }

    })
}

//Get all profiles with a twitter id
Tweeter.find({twitter_id:{$exists:true}})
    .sort('screen_name', 'descending')
    .execFind(function (error, profiles) {
        if (error) {
            logger.log('error', error)
        } else {
            //Synchronous because twitter's API request limits are a bitch
            async.forEachSeries(profiles, searchTweets, function (err) {
                if (err) {
                    logger.log('error', 'Asynch error getting tweets: ' + err)
                }
                process.exit(0)
            })


        }
    });