let User = require('../models/user');

exports.auth_get = function(req,res, next) {
    res.render('login', {title: 'Login'});
};

exports.auth_post = function(req,res, next) {
    
    res.send('auth');
};