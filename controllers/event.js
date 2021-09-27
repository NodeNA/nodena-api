
const App = require('widget-cms');
const Events = App.getCollection('Events');
const nodeEvent = App.getModel('Event');
const moment = require('moment');
const TwitBot = require('../bots/twit');
const catchAsync = require('../utils/catchAsync');

const EventsController = App.Controller.extend({


  index: function (req, res, next) {
    let events = new Events();

    res.locals._page = 'events';

    let page = parseInt(req.query.p, 10);
    let query = {};
    let currentpage = page || 1;
    let limit = 2;
    let month = req.query.month || '';
    let monthObj;

    query.limit = limit;
    query.month = month;

    if (currentpage < 1) {
      res.redirect('/events');
    }

    let fetchQuery = {
      limit: limit,
      order: 'desc',
      page: currentpage
    };

    events.fetchBy('dt', fetchQuery, {
      columns: ['slug', 'title', 'url', 'city', 'short_desc', 'dt', 'start_time', 'address']
    })
    .then(function (collection) {
      res.render('events/events', {
        title: 'Node.js events in South Africa',
        pagination: events.pages,
        myEvents: collection.toJSON(),
        query: query,
        description: 'Find all upcoming Node.js events in South Africa',
        page: 'events'
      });
    })
    .catch(function (error) {
      req.flash('errors', {'msg': 'Database error. Could not fetch events.'});
      res.redirect('/');
    });
  },


  show: function (req, res, next) {
    let slug = req.params.slug;
    let event = new nodeEvent({slug: slug});
    let settings = App.getConfig('events');

    event.fetch()
    .then(function (event) {
      res.render('events/event', {
        config: settings,
        title: event.get('title'),
        parseDate: event.parseDate(),
        parseTime: event.parseTime(),
        myEvent: event.toJSON(),
        description: event.get('title'),
        page: 'events'
      });

      return event.viewed();
    })
    .catch(function (error) {
      req.flash('errors', {'msg': error.message});
      next(error);
    });
  },


  create: async function (req, res) {
    req.assert('title', 'Title must be at least 4 characters long').len(4);
    req.assert('markdown', 'Full description must be at least 12 characters long').len(12);
    req.assert('date', 'Date cannot be blank').notEmpty();
    req.assert('start_time', 'Starting cannot be blank').notEmpty();
    req.assert('email', 'Starting cannot be blank').isEmail();

    let errors = req.validationErrors();
    let eventData = {};
    let cleanDate = (req.body.date).split('/').join(' ');

    if (errors) {
      req.flash('errors', errors);
      return res.redirect('/events/new');
    }

    try {
      eventData.user_id = req.user.get('id');
      eventData.title = req.body.title;
      eventData.short_desc = req.body.short_desc;
      eventData.markdown = req.body.markdown;
      eventData.dt = moment(cleanDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
      eventData.start_time = moment(req.body.start_time, 'HH:mm').format('HH:mm:ss');

      if(req.body.finish_time) {
        eventData.finish_time = moment(req.body.finish_time, 'HH:mm').format('HH:mm:ss');
      }
      else {
        eventData.finish_time = null;
      }

      eventData.province = req.body.administrative_area_level_1 || '';
      eventData.city = req.body.locality || '';
      eventData.town = req.body.sublocality || '';
      eventData.address = req.body.formatted_address || '';
      eventData.website = req.body.webpage;
      eventData.url = req.body.url;
      eventData.lng = req.body.lng;
      eventData.lat = req.body.lat;
      eventData.email = req.body.email;
      eventData.number = req.body.number;

      let event = new nodeEvent(eventData);

      event = await event.save(null, {context: {user_id: req.user.get('id')}});

      TwitBot.tweet('event', {
        id: event.get('id'),
        city: event.get('city'),
        title: event.get('title'),
        body: 'https://nodeza.co.za/events/' + event.get('slug')
      });

      req.flash('success', { msg: 'Event successfully created!' });
      res.redirect('back');
    }
    catch (error) {
      console.error(error.stack);
      req.flash('errors', {'msg': 'Database error. Event not created.'});
      res.redirect('/events/new');
    }
  },


  update: function (req, res) {
    req.assert('title', 'Title must be at least 4 characters long').len(4);
    req.assert('markdown', 'Full description must be at least 12 characters long').len(12);
    req.assert('date', 'Date cannot be blank').notEmpty();
    req.assert('start_time', 'Starting cannot be blank').notEmpty();
    req.assert('email', 'Starting cannot be blank').isEmail();

    let errors = req.validationErrors();
    let eventData = {};
    let user = req.user;
    let cleanDate = (req.body.date).split('/').join(' ');

    if (errors) {
      req.flash('errors', errors);
      return res.redirect('back');
    }

    eventData.id = req.body.event_id;
    eventData.title = req.body.title;
    eventData.short_desc = req.body.short_desc;
    eventData.markdown = req.body.markdown;
    eventData.dt = moment(cleanDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
    eventData.start_time = moment(req.body.start_time, 'h:mm A').format('HH:mm:ss');

    if(req.body.finish_time) {
      eventData.finish_time = moment(req.body.finish_time, 'h:mm A').format('HH:mm:ss');
    }
    else {
      eventData.finish_time = null;
    }

    eventData.province = req.body.administrative_area_level_1 || '';
    eventData.city = req.body.locality || '';
    eventData.town = req.body.sublocality || '';
    eventData.address = req.body.formatted_address || req.body.geocomplete || '';
    eventData.website = req.body.webpage;
    eventData.url = req.body.url;
    eventData.lng = req.body.lng;
    eventData.lat = req.body.lat;
    eventData.email = req.body.email;
    eventData.number = req.body.number;

    let event = new nodeEvent({id: eventData.id});

    event.fetch()
    .then(function (model) {
      model.save(eventData, {method: 'update'})
      .then(function () {
        req.flash('success', { msg: 'Event successfully updated!' });
        res.redirect('back');
      })
      .catch(function (error) {
        req.flash('errors', {'msg': 'Restricted access, event not updated.'});
        res.redirect('back');
      });
    });
  },


  delete: function(req, res) {
    let event = new nodeEvent({id: req.params.id});

    event.fetch()
    .then(function (event) {
      event.destroy()
      .then(function () {
        req.flash('success', {msg: 'Event successfully deleted.'});
        res.redirect('back');
      })
      .catch(function () {
        req.flash('error', {msg: 'Restricted access, event not deleted.'});
        res.redirect('back');
      });
    })
    .catch(function () {
      req.flash('error', {msg: 'Event not found'});
      res.redirect('back');
    });
  }
});

module.exports = App.addController('Events', EventsController);
