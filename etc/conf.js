var winston = require('winston')
var consoleLogger = new (winston.transports.Console)()
module.exports = {
    development:{
        logger:new (winston.Logger)({
            transports:[
                consoleLogger,
            ]
        }),
        scrapeLogger:new (winston.Logger)({
            transports:[
                consoleLogger,
                new (winston.transports.Loggly)({level:'info', subdomain:'phillrodev', inputToken:'68cda19a-e962-4927-926c-c801ab3b7ec8'})
            ]
        }),
        twitterClientLogger:new (winston.Logger)({
            transports:[
                consoleLogger,
                new (winston.transports.Loggly)({level:'info', subdomain:'phillrodev', inputToken:'50d81abc-67db-42a5-9cfc-510fe80b96c9'})
            ]
        }),
        articlePublisherLogger:new (winston.Logger)({
            transports:[
                consoleLogger,
                new (winston.transports.Loggly)({level:'info', subdomain:'phillrodev', inputToken:'4938-62a6-4121-8350-2ece60709390'})
            ]
        }),
        twitter:{
            consumer_key:'hHQTSRyQLBbM3lKtoBjOmw',
            consumer_secret:'z2WUz36kD8HfbQAvBnVLLsQCc4CcCgLiG0LgJyJbU',
            request_token_url:'https://api.twitter.com/oauth/request_token',
            authorize_url:'https://api.twitter.com/oauth/authorize',
            access_token_url:'https://api.twitter.com/oauth/access_token',
            callback_url:'http://www.memeit.me/tw_callback',
            access_token:'15524191-W6ePR9UKL1WI1IxGOARoTdLAkVNiHz0Wh0xADgIBA',
            access_token_secret:'nsT27hCzUvAaUDLkp8wHwdMouIfg9oCWqTItzrhnN44'
        },
        redis:{
            port:6379,
            host:'localhost',
            db:'mediaamp'
        },

        mongo:{
            dbName:'mediaamp2',
            port:27017,
            host:'localhost',
            user:'devuser',
            password:'devuser'
        },
        baseUrl:'http://localhost',
        port:3000,
        socketPort:3000,
        socketOptions:{
            debugLevel:0,
            minifyJs:false
        },
        sessionSecret:'testsessionsecret',
        aws:{
            s3:{
                key:'0QT5A1MF9HPPBTVCY3R2',
                secret:'wQqVSquK4ZnS1TYGsCf/UzcvV6tXxcELDuR7E0Xu',
                bucket:'trollmeme'
            }
        },
        socketPort:3000,
        socketOptions:{
            debugLevel:0,
            minifyJs:false
        },
        es_conf:{
            mediaamp:{
                host:'esnodes-844625410.us-east-1.elb.amazonaws.com',
                port:9200,
                secure:false,
            }
        },
    },

    test:{

    },

    production:{
        logger:new (winston.Logger)({
            transports:[
                consoleLogger,
            ]
        }),
        scrapeLogger:new (winston.Logger)({
            transports:[
                consoleLogger,
                new (winston.transports.Loggly)({level:'info', subdomain:'mediaamp', inputToken:'00ed2a87-714f-4a33-b967-b9ccd96e6af3'})
            ]
        }),
        twitterClientLogger:new (winston.Logger)({
            transports:[
                consoleLogger,
                new (winston.transports.Loggly)({level:'info', subdomain:'mediaamp', inputToken:'43503314-ebc4-4b07-ae6f-892d881930b1'})
            ]
        }),
        articlePublisherLogger:new (winston.Logger)({
            transports:[
                consoleLogger,
                new (winston.transports.Loggly)({level:'info', subdomain:'mediaamp', inputToken:'546cde43-3c38-46f2-808a-3472ccde2c87'})
            ]
        }),
        twitter:{
            consumer_key:'hHQTSRyQLBbM3lKtoBjOmw',
            consumer_secret:'z2WUz36kD8HfbQAvBnVLLsQCc4CcCgLiG0LgJyJbU',
            request_token_url:'https://api.twitter.com/oauth/request_token',
            authorize_url:'https://api.twitter.com/oauth/authorize',
            access_token_url:'https://api.twitter.com/oauth/access_token',
            callback_url:'http://www.memeit.me/tw_callback',
            access_token:'15524191-W6ePR9UKL1WI1IxGOARoTdLAkVNiHz0Wh0xADgIBA',
            access_token_secret:'nsT27hCzUvAaUDLkp8wHwdMouIfg9oCWqTItzrhnN44'
        },
        redis:{
            port:6379,
            host:'domU-12-31-38-07-4D-36.compute-1.internal',
            db:'mediaamp'
        },

        mongo:{
            dbName:'ma1',
            port:31177,
            host:'ds031177.mongolab.com',
            user:'ma1_data',
            password:'mediaampsys'
        },
        baseUrl:'http://localhost',
        port:3000,
        socketPort:3000,
        socketOptions:{
            debugLevel:0,
            minifyJs:false
        },
        sessionSecret:'testsessionsecret',
        socketPort:3000,
        socketOptions:{
            debugLevel:0,
            minifyJs:false
        },
        es_conf:{
            mediaamp:{
                host:'esnodes-844625410.us-east-1.elb.amazonaws.com',
                port:9200,
                secure:false,
            }
        },
    },

}