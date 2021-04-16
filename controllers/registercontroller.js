const { body, validationResult } = require('express-validator');
const bcrypt = require("bcrypt");
let User = require('../models/user');
let UserProfile = require('../models/user_profile');
let saltRounds = 10;

exports.register_get = function(req, res, next) {
    res.render('register', {title: 'Register', messages: null});
};

exports.register_post = [
    // Validate and sanitize form data
    body('email').isEmail().normalizeEmail(),
    body('password').trim().isStrongPassword(),
    // Custom Validation for password matching
    body('password_confirm').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords didn\'t match');
        } else {
            // Indicates the success of this synchronous custom validator
            return true;
        }
    }),

    function(req, res, next) {
        // save validation errors to objects
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // Errors
            console.log(JSON.stringify(errors));
            res.render('register', {title: 'Register', messages: errors.array()});
        } else {
            bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
                // Create User from Model
                let new_user = new User({
                    email: req.body.email,
                    password: hash
                })

                // Create UserProfile from Model
                let user_profile = new UserProfile({
                    user: new_user
                })

                // Save new user
                new_user.save(function (err) {
                    if (err) { return next(err);}
                    
                    // If User save is succesfull save Profile
                    user_profile.save(function (err) {
                        if (err) { return next(err);}
                        // If Profile Save is succesfull redirect
                        res.redirect('/login');
                    });
                })
            });
        }
}];