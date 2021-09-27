import { getController, get, post } from '../core';
import { isUserAdmin } from '../utils/auth.js';

const RolesController = getController('Roles');

get('/admin/users/roles', isUserAdmin, RolesController.getRoles);
post('/roles/edit', isUserAdmin, RolesController.postEditRole);
post('/roles/new', isUserAdmin, RolesController.postNewRole);
get('/roles/delete/:id', isUserAdmin, RolesController.getDeleteRole);