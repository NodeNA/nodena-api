"use strict"

import { createClient } from 'redis';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { handlebars } from 'hbs';
import { sendEmail, subscribe as _subscribe, confirmSubscription as _confirmSubscription } from '../lib/mailgun';

const Queue = createClient();
const client = createClient();

const MailQueue = 'mailQueue';

let workerBusy =  false;
let activeMessage = null;


// templates
let newMessageTmpl = readFileSync(resolve(__dirname, '../views/email/message.hbs'), 'utf8');
let newRegistrationTmpl = readFileSync(resolve(__dirname, '../views/email/welcome.hbs'), 'utf8');
let resetPasswordTmpl = readFileSync(resolve(__dirname, '../views/email/reset.hbs'), 'utf8');
let passwordChangedTmpl = readFileSync(resolve(__dirname, '../views/email/password_changed.hbs'), 'utf8');
let subscribeTmpl = readFileSync(resolve(__dirname, '../views/email/subscribe.hbs'), 'utf8');



// push all new actionz to MailQueue
Queue.on('message', function(channel, payload) {
  try {
    client.rpush(MailQueue, payload);
    mailWorker();
  }
  catch (e) {
    console.error(e)
  }
});


Queue.subscribe('email');


function mailWorker() {
  if (workerBusy) {
    return console.log(`> ${new Date().toISOString()} - Worker is busy`);
  }

  console.log(`> ${new Date().toISOString()} - Worker task called...`);

  client.lpop(MailQueue, async function(error, data) {
    try {
      if (error) {
         throw error;
         return false;
      }

      if (!data) {
        console.log(`> ${new Date().toISOString()} - Queue is empty`);
        return false;
      }

      workerBusy = true;

      activeMessage = data;

      let payload = JSON.parse(data);

      switch (payload.type) {
        case 'message':
          await sendMessage(payload);
        break;
        case 'registration':
          await newRegistration(payload)
        break;
        case 'reset':
          await resetPassword(payload)
        break;
        case 'password-changed':
          await passwordChanged(payload)
        break;
        case 'subscribe':
          await subscribe(payload)
        break;
        case 'subscription-confirm':
          await confirmSubscription(payload)
        break;
      }

      console.log(`> ${new Date().toISOString()} - Worker task complete`);

      workerBusy = false;

      mailWorker(); // queue has completed job, get next item in queue
    }
    catch (error) {
      workerBusy = false;
      console.error(error,activeMessage);
      mailWorker();
    }
  });
}


function sendMessage(data) {
  let template = handlebars.compile(newMessageTmpl);

  return sendEmail({
    to: data.to.email,
    from: data.from.email,
    subject: `${data.from.name} has sent you a message on NodeNA`,
    body: template(data)
  });
}


function newRegistration (data) {
  let template = handlebars.compile(newRegistrationTmpl);

  return sendEmail({
    to: data.to.email,
    subject: 'Welcome to NodeNA',
    body: template(data)
  });
}


function resetPassword (data) {
  let template = handlebars.compile(resetPasswordTmpl);

  return sendEmail({
    to: data.to.email,
    subject: 'Reset your password on NodeNA',
    body: template(data)
  });
}


function passwordChanged (data) {
  let template = handlebars.compile(passwordChangedTmpl);

  return sendEmail({
    to: data.to.email,
    subject: 'Your NodeNA password has been changed',
    body: template(data)
  });
}


function subscribe (data) {
  let template = handlebars.compile(subscribeTmpl);

  return _subscribe({
    to: data.to,
    subject: 'Confirm Subscription',
    body: template(data)
  });
}


function confirmSubscription (data) {
  return _confirmSubscription(data);
}

mailWorker();

console.log(`> ${new Date().toISOString()} - Mail worker now active is listening to email channel`);
