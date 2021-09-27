import { getController, get, post } from '../core';
import { isNotAuthenticated, isUserAdmin, isAuthenticated, dontCache } from '../utils/auth.js';

const AuthController = getController('Auth');

/*
 * Auth Routes
 * passing 'auth.isNotAuthenticated' middle to avoid logged in users from viewing some pages
**/

get('/login', isNotAuthenticated, AuthController.getLogin);
get('/loginas/:id', isUserAdmin, AuthController.getLoginAs);
get('/restoreadmin', isAuthenticated, AuthController.restoreAdmin);
post('/login', dontCache, AuthController.login);


post('/signup', isNotAuthenticated, AuthController.signup);
post('/forgot-password', isNotAuthenticated, AuthController.forgotPassword);
post('/reset-password/:token', isNotAuthenticated, AuthController.resetPassword);

get('/logout', isAuthenticated, AuthController.logout);
get('/admin/account', isAuthenticated, AuthController.getAccount);
post('/account', isAuthenticated, AuthController.postAccount);
get('/admin/account/linked', isAuthenticated, AuthController.getLinkedAccounts);
post('/account/password', isAuthenticated, AuthController.postPassword);
post('/account/delete', isAuthenticated, AuthController.postDeleteAccount);
get('/account/unlink/:provider', isAuthenticated, AuthController.getOauthUnlink);