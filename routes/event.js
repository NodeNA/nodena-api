import { getController, get, post } from '../core';
import { isAuthenticated } from '../utils/auth.js';

const EventsController = getController('Events');

get('/admin/events', isAuthenticated, EventsController.getAdmin);
get('/events/new', isAuthenticated, EventsController.getNew);
post('/events/new', isAuthenticated, EventsController.postNew);
get('/events/delete/:id', isAuthenticated, EventsController.getDelete);
post('/events/edit', isAuthenticated, EventsController.postEdit);

// public
get('/events', EventsController.getEvents);
get('/events/city/:city', EventsController.getEventsByCity);
get('/events/:slug', EventsController.getEvent);