import { getController, get, post } from '../core';
import { isAuthenticated, isUserAdmin } from '../utils/auth.js';
const AdminController = getController('Admin');


get('/admin', isAuthenticated, AdminController.getAdmin);
post('/admin/config', isUserAdmin, AdminController.postConfig);
get('/admin/settings', isUserAdmin, AdminController.getGlobalConfig);
get('/admin/settings/account', isUserAdmin, AdminController.getAccountConfig);