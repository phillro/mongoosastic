var csv = require('csv');
var cli = require('cli')
var mysql = require('mysql');
var TEST_DATABASE = 'quantum_live3';
var TEST_TABLE = 'core_url_rewrite';
var client = mysql.createClient({
    user:'magento',
    password:'quantum791',
    host:'magento.c13wi58rtiju.us-east-1.rds.amazonaws.com'
});
client.query('USE ' + TEST_DATABASE);
client.query('SELECT * FROM core_url_rewrite',function selectCb(err,results,fields){
    csv()
            .from(results)
            .toStream(process.stdout, {end:false})
            .on('end', function () {
                process.exit(0)
            })

})


/*
csv()
    .fromPath('/Users/philliprosen/Documents/dev/mediaamp-proto/bin/clean301s.csv')
    .transform(function (data) {
        return data
    })
    .on('data',
    function (data, index) {
        var query = 'SELECT * FROM ' + TEST_TABLE + ' where request_path="' + data[1] + '"';
        console.log(query)
        client.query(
            query,
            function selectCb(err, results, fields) {
                if (err) {
                    throw err;
                }
                if (results.length > 0) {
                    var targetRow = results[0]

                    try {
                        var query = client.query('INSERT INTO ' + TEST_TABLE + ' ' +
                            'SET store_id = ?, id_path = ?, request_path = ?, target_path = ?,  options = ?, mig = ?',
                            [1, targetRow['id_path'], data[0], targetRow['request_path'], 'RP', 3],function(err,results){
                                if(err)
                                    console.log(err)
                            });
                    } catch (ex) {
                        console.log(ex)
                    }
                    //  console.log(query)
                }

            }
        );

    }).on('error', function (error, index) {
        console.log(error)
        //console.log(index)
    })
    .on('end', function (count) {
    })*/