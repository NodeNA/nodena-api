import { createHash } from 'crypto';
import moment from 'moment';
import _ from 'lodash';

/**
 * parses date
**/
function parseDate(dt, fmt) {
  return moment(dt, 'YYYY-MM-DD HH:mm:ss').format(fmt || 'ddd D MMM YYYY');
}


/**
 * parses time
**/
function parseTime(ts, fmt) {
  return moment(ts, 'HH:mm:ss').format(fmt || 'HH:mm');
}

function gravatar (email, size, context) {
  size = size || 32;

  if (!email) {
    return 'https://gravatar.com/avatar/?s=' + size + '&d=retro';
  }

  let md5 = createHash('md5').update(email);

  return 'https://gravatar.com/avatar/' + md5.digest('hex').toString() + '?s=' + size + '&d=retro';
}

module.exports = {
  parseTime,
  parseDate,
  gravatar
}