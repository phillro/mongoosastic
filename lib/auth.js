/**
 * User: philliprosen
 * Date: 4/3/12
 * Time: 3:10 PM
 */

module.exports = function () {
    var usersById = {};
    var nextUserId = 0;
    var self=this
    self.addUser = function(source, sourceUser) {
        var user;
        if (arguments.length === 1) { // password-based
            user = sourceUser = source;
            user.id = ++nextUserId;
            return usersById[nextUserId] = user;
        } else { // non-password-based
            user = usersById[++nextUserId] = {id:nextUserId};
            user[source] = sourceUser;
        }
        return user;
    }

    self.findUserById = function(id, callback) {
        callback(null, usersById[id]);
    }

    self.usersByLogin = {
        'mediaamp':addUser({ login:'mediaamp', password:'mediaampsys'})
    };

    return self

}