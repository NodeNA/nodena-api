import { Strategy as GitHubStrategy } from 'passport-github';
import { passport as _passport, getModel, getCollection, getConfig } from '../core';


const passport = _passport;
const User = getModel('User');
const Tokens = getCollection('Tokens');
const Token = getModel('Token');
const config = getConfig('github');
const githubConfig = getConfig('github');


passport.deserializeUser(async function(id, done) {
  try {
    let user = await User.forge({id: id}).fetch({withRelated: ['role', 'tokens','unreadmessages'],require: true});

    done(false, user);
  }
  catch (error) {
    done(error);
  }
});

passport.serializeUser(function(user, done) {
  done(null, user.get('id'));
});


passport.use(new GitHubStrategy(githubConfig, async function (req, accessToken, refreshToken, profile, done) {
  console.log(profile);

  // if the user is already logged in
  if (req.user) {
    req.user.save({
      github: profile.id,
      name: req.user.get('name') || profile.displayName,
      image_url: req.user.get('image_url') || profile._json.avatar_url,
      location: req.user.get('location') || profile._json.location,
      website: req.user.get('website') || profile._json.blog || profile._json.profileUrl,
      role_id: req.user.get('role_id') || 1,
      about: req.user.get('about') || profile._json.bio
    })
    .then(function () {
      return Token.forge({
        user_id: req.user.get('id'),
        kind: 'github',
        accessToken: accessToken
      })
      .save();
    })
    .then(function (model) {
      req.flash('info', { msg: 'GitHub account has been linked.' });
      done(false, model);
    })
    .catch(function (error) {
      console.error(error)
      req.flash('errors', { msg: 'Database error. Failed to link GitHub account'});
      done(error);
    });
  }

  // if the user is not logged in
  else {
    let isNewAccount = false;

    User.forge({github: profile.id})
    .fetch()
    .then(function (existingUser) {
      if (existingUser) {
        return done(null, existingUser);
      }

      return User.forge({email: profile._json.email})
      .fetch()
      .then(function (existingEmailUser) {
        var user, roleid;

        if (existingEmailUser) {
          user = existingEmailUser;
          roleid = user.get('role_id');
        } else {
          isNewAccount = true;
          user = new User();
          roleid = 1;
        }

        user.set({
          email: user.get('email') || profile._json.email,
          github: profile.id,
          name: user.get('name') || profile.displayName,
          image_url: user.get('image_url') || profile._json.avatar_url,
          location: user.get('location') || profile._json.location,
          website: user.get('website') || profile._json.blog,
          about: user.get('about') || profile._json.bio,
          role_id: roleid
        });

        return user.save()
        .then(function (model) {
          Token.forge({
            user_id: model.get('id'),
            kind: 'github',
            accessToken: accessToken
          })
          .save()
          .then(function () {
            if (isNewAccount) {
              req.flash('info', { msg: 'Account successfully created! You can may also set your password to activate email login.' });
            }
            else {
              req.flash('info', { msg: 'GitHub account has been linked.' });
            }

            req.session.isNewAccount = isNewAccount;

            done(false, model);
          })
          .catch(function (error) {
            req.flash('errors', { msg: 'Database error. Failed to save token'});
            done(false, model);
          });
        })
        .catch(function(err) {
          done(err);
        });
      });
    })
    .catch(function (err) {
      req.flash('errors', { msg: 'Database error. Failed to access'});
      done({'errors': {msg: 'Database error. Failed to access'}}, user);
    });
  }
}));


// Login Required middleware.
export function isAuthenticated (req, res, next) {
  if (req.isAuthenticated()) return next();

  req.flash('errors',  { msg: 'You need to log in first.'});

  res.redirect('/login');
}


export function isNotAuthenticated (req, res, next) {
  if (!req.isAuthenticated()) return next();

  res.redirect('/');
}


/*
 * Authorization Required middleware.
**/
export function isAuthorized (req, res, next) {
  let provider = req.path.split('/').slice(-1)[0];
  let tokens = req.user.related('tokens');

  if (tokens.findWhere({kind: 'github'})) {
    next();
  }
  else {
    res.redirect('/auth/' + provider);
  }
}


export function isUserAdmin (req, res, next) {
  if (req.user && req.user.related('role').get('name') === 'Super Administrator') {
    next();
  }
  else {
    req.flash('errors', { msg: 'You are not authorized to perform that action' });
    res.redirect('back');
  }
}