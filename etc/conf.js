var winston = require('winston')
var consoleLogger =  new (winston.transports.Console)()
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
                new (winston.transports.Loggly)({level:'info', subdomain:'phillrodev',inputToken:'68cda19a-e962-4927-926c-c801ab3b7ec8'})
            ]
        }),
        twitterClientLogger:new (winston.Logger)({
            transports:[
                consoleLogger,
                new (winston.transports.Loggly)({level:'info', subdomain:'phillrodev',inputToken:'50d81abc-67db-42a5-9cfc-510fe80b96c9'})
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
            dbName:'mediaamp-proto',
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

    }

}