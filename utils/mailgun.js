import Promise from 'bluebird';
import Mailgun from 'mailgun-js';
import { mailgun as _mailgun } from '../config';
const apiKey = _mailgun.apiKey;
const domain = _mailgun.domain;
const from_who = 'NodeNA <' + _mailgun.email + '>';


function sendEmail (opts) {

  if (process.env.NODE_ENV !== 'production') {
    return console.log({
      from: from_who,
      to: opts.to,
      subject: opts.subject,
      html: opts.body
    });
  }

  return new Promise(function(resolve, reject) {
    let mailgun = new Mailgun({apiKey: apiKey, domain: domain});
    let data = {
      from: from_who,
      to: opts.to,
      bcc: 'fillipusgeraldo@gmail.com',
      subject: opts.subject,
      html: opts.body
    };

    mailgun.messages().send(data, function (error, res) {
      if (error) {
        reject(error);
      }
      else {
        resolve(res);
      }
    });
  });
}


function subscribe (opts) {
  if (!(apiKey && domain)) {
    return fn(new Error('Mailgun config not provided'))
  }

  let mailgun = new Mailgun({apiKey: apiKey, domain: domain});
  let newsletterList = mailgun.lists(_mailgun.newsletterEmail);
  let member = {
    address: opts.to.email,
    name: opts.to.name,
    subscribed: false
  };

  newsletterList.members().create(member, function() {});

  return sendEmail({
    to: opts.to.email,
    subject: opts.subject,
    body: opts.body
  });
}


function confirmSubscription (opts) {

  if (!(apiKey && domain)) {
    return fn(new Error('Mailgun config not provided'))
  }

  let mailgun = new Mailgun({apiKey: apiKey, domain: domain});
  let members = [{address: opts.email}];

  let newsletterList = mailgun.lists(_mailgun.newsletterEmail);

  return new Promise(function(resolve, reject) {
    newsletterList.members().add({members: members, subscribed: true}, function (error, res) {
      if(error) {
        reject(error)
      }
      else {
        resolve(res)
      }
    });
  });
}


const _sendEmail = sendEmail;
export { _sendEmail as sendEmail };
const _subscribe = subscribe;
export { _subscribe as subscribe };
const _confirmSubscription = confirmSubscription;
export { _confirmSubscription as confirmSubscription };