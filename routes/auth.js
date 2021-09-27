import { passport as _passport, get } from '../core';

const passport = _passport;


function authCallback(req, res, next) {
  res.redirect(req.session.returnTo || '/');
  next();
}


get('/auth/github', passport.authenticate('github'), function(req, res, next) {
  if (res.locals.isNewAccount) return res.redirect('/admin/account/password');
  res.redirect('/admin/account');
});


get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), authCallback);