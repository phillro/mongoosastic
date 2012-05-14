everyauth = require('everyauth')
var usersById = {};
var nextUserId = 0;
var md5 = require('md5')
var async = require('async')
module.exports = function (app) {


    var everyauthRoot = __dirname + '/../node_modules/everyauth';

    everyauth.everymodule
        .findUserById(function (userId, userCallback) {
        app.models.User.findById(userId, function (err, user) {
            userCallback(err, user)
        })
    });


    everyauth
        .password
        .loginWith('email')
        .getLoginPath('/login')
        .postLoginPath('/login')
        .loginView('login.jade')
        .loginLocals(function (req, res, done) {
            setTimeout(function () {
                done(null, {
                    title:'MediaAmp Admin Login'
                });
            }, 200);
        })
        .authenticate(function (login, password) {
            var errors = [];
            if (!login) errors.push('Missing login');
            if (!password) errors.push('Missing password');
            if (errors.length) return errors;
            var promise = this.Promise()

            app.models.User.findOne({email:login}, function (err, user) {
                if (err)
                    promise.fulfill([err]);
                else {

                    async.waterfall([
                        function checkUserExists(checkUserCallback) {
                            if (!user) {
                                checkUserCallback('User does not exist.')
                            } else {
                                checkUserCallback(undefined, user)
                            }
                        },
                        function checkPassword(user, checkPasswordCallback) {
                            var hashedPassword = md5.digest_s(password)
                            if (hashedPassword != user.password) {
                                checkPasswordCallback('Incorrect password.')
                            } else {
                                checkPasswordCallback(undefined, user)
                            }
                        },function checkPermissions(user, checkPermissionsCallback){
                            if(user.account_type.toString()!=app.schemas.AccountTypes.Admin.toString()){
                                checkPermissionsCallback('User is not an administrator')
                            }else{
                                checkPermissionsCallback(undefined,user)
                            }
                        }
                    ], function waterfallComplete(error, user) {
                        if(error)
                            promise.fulfill([error])
                        else
                            promise.fulfill(user)
                    })
                }

            })
            return promise
        })

        .getRegisterPath('/register')
        .postRegisterPath('/register')
        .registerView('register.jade')
        .registerLocals(function (req, res, done) {
            setTimeout(function () {
                done(null, {
                    title:'MediaAmp Register'
                });
            }, 200);
        })
        .validateRegistration(function (newUserAttrs, errors) {
            var login = newUserAttrs.login;
            if (usersByLogin[login]) errors.push('Login already taken');
            return errors;
        })
        .registerUser(function (newUserAttrs) {
            var login = newUserAttrs[this.loginKey()];
            return usersByLogin[login] = addUser(newUserAttrs);
        })
        .logoutRedirectPath('/login')
        .loginSuccessRedirect('/sourcecontent/list')
        .registerSuccessRedirect('/');

    return everyauth
}
