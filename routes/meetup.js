import { getController, get, post } from '../core';
import { isAuthenticated, isUserAdmin } from '../utils/auth.js';

const MeetupsController = getController('Meetups');

get('/admin/meetups', isAuthenticated, MeetupsController.getAdmin);
get('/admin/meetups/settings', isUserAdmin, MeetupsController.getSettings);

get('/meetups', MeetupsController.getMeetups);
get('/meetups/:slug', MeetupsController.getMeetup);


post('/meetups/new', isAuthenticated, MeetupsController.postNew);
post('/meetups/edit', isAuthenticated, MeetupsController.postEdit);
