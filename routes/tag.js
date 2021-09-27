import { getController, get } from '../core';
const TagsController = getController('Tags');

get('/blog/tags/:slug', TagsController.getPosts);