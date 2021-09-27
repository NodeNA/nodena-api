import { updateConfig as _updateConfig, Controller, getConfig, addController } from '../core';


import { each, omit, extend } from 'lodash';
import { resolve } from 'path';
import { writeFile } from 'fs';
import secrets from '../config/config.json';


function updateConfig(configs) {

  let filepath = resolve(__dirname, '../config/config.json');

  each(configs, function (val, key) {
    if(secrets[key]) {
      _updateConfig(key, val);
      secrets[key] = val;
    }
  });

  let data = JSON.stringify(secrets, null, 4);

  writeFile(filepath, data, 'utf8', function (error) {
    if(error) {
      return console.log(error.message);
    }

    console.log('Config file updated');
  });
}


const AdminController = Controller.extend({

  postConfig: function (req, res) {
    let config = req.body.id;
    let configs = {};

    each(req.body, function(val, key) {
      if(req.body[key] === "yes") {
        req.body[key] = true;
      }
      if(req.body[key] === "no") {
        req.body[key] = false;
      }
    });

    let update = omit(req.body, ['id', '_csrf']);

    configs[config] = extend(getConfig(config), update);

    updateConfig(configs);

    req.flash('success', {'msg': 'Updated successfully'});
    res.redirect('back');
  }
});


export default addController('Admin', AdminController);