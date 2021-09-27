import { getController, get, post } from '../core';
import { isUserAdmin, isAuthenticated } from '../utils/auth.js';

const UsersController = getController('Users');

get('/admin/users', isUserAdmin, UsersController.getUsers);
post('/users/new', isUserAdmin, UsersController.postUser);
post('/users/edit', isUserAdmin, UsersController.postEditUser);
get('/users/delete/:id', isAuthenticated, UsersController.getDeleteUser);
post('/users/upload-image', isAuthenticated, UsersController.uploadImage);
get('/devs/:slug', isAuthenticated, UsersController.getProfile);
get('/devs', isAuthenticated, UsersController.getDevs);
get('/users/unsubscribe/:id', UsersController.getUnsubscribe);
post('/users/unsubscribe', UsersController.postUnsubscribe);
get('/users/subscribed/link', isAuthenticated, UsersController.getSubscribeLink);
get('/users/unsubscribed/link', isAuthenticated, UsersController.getUnsubscribeLink);