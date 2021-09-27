
import { getController, get, post } from '../core';
import { isAuthenticated, isUserAdmin } from '../utils/auth.js';

const PostsController = getController('Posts');

//private
get('/admin/blog', isAuthenticated, PostsController.getAdmin);
get('/admin/blog/settings', isUserAdmin, PostsController.getSettings);

get('/blog/publish/:id', isAuthenticated, PostsController.getPublish);
get('/blog/featured/:id', isAuthenticated, PostsController.isFeatured);
get('/blog/delete/:id', isAuthenticated, PostsController.getDelete);
post('/blog/new', isAuthenticated, PostsController.postNew);
post('/blog/edit', isAuthenticated, PostsController.postEdit);

// public
get('/blog', PostsController.getBlog);
get('/blog/:slug', PostsController.getPost);
get('/blog/category/:slug', PostsController.getBlogCategory);