const App = require('widget-cms');
const AdminController = App.getController('Admin');
const auth = require('../lib/auth');


App.get('/admin', auth.isAuthenticated, AdminController.getAdmin);
App.post('/admin/config', auth.isUserAdmin, AdminController.postConfig);
App.get('/admin/settings', auth.isUserAdmin, AdminController.getGlobalConfig);
App.get('/admin/settings/account', auth.isUserAdmin, AdminController.getAccountConfig);