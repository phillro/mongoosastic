/**
 * User: philliprosen
 * Date: 4/29/12
 * Time: 11:47 PM
 */


module.exports = function (conf) {
    var self = this


    sourceParsers = {
        'reuters.com':'reuters.js'
    }

    /**
     *
     * @param host
     * todo: Make this regexy, db driven and handle remote sources
     */
    self.getSourceParserJob = function(host){
        if(sourceParsers[host]){
            return sourceParsers[host]
        }else{
            return false
        }
    }



    return self
}