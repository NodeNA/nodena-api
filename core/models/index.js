 import { extend } from 'lodash';

 // enable event listeners
 import './base/listeners';
 
 /**
  * Expose all models
  */
 exports = module.exports;
 
 const models = [
     'permission',
     'post',
     'post-meta',
     'role',
     'tag',
     'user',
     'author',
     'meetup',
     'event',
     'token',
     'reset-log',
     'user-event',
     'login-attempt',
     'image', 
     'album',
 ];
 
 function init() {
     exports.Base = require('./base');
 
     models.forEach(function (name) {
         extend(exports, require('./' + name));
     });
 }
 
 /**
  * Expose `init`
  */
 
 const _init = init;
export { _init as init };