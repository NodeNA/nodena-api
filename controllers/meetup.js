
const App = require('widget-cms');
const Meetups = App.getCollection('Meetups');
const Meetup = App.getModel('Meetup');
const moment = require('moment');
const path = require('path');
const catchAsync = require('../utils/catchAsync');


const MeetupsController = App.Controller.extend({


  getAll: catchAsync(async(req, res, next)=>{

  }),


  getOne: catchAsync(async (req, res, next) => {

  }),


  deleteOne: catchAsync(async (req, res, next) => {

  }),

  createOne: function (req, res) {
    req.assert('title', 'Name must be at least 4 characters long').len(4);
    req.assert('short_desc', 'Short description must be at lest 12 characters').len(12);
    req.assert('markdown', 'Details must be at least 12 characters long').len(12);
    req.assert('email', 'Starting cannot be blank').isEmail();

    let errors = req.validationErrors();
    let meetupData = {};
    let user = req.user;
    let errMsg = 'Database error. Meetup not created.';
    let successMsg = 'Meetup successfully created!';

    if (errors) {
      req.flash('errors', errors);
      return res.redirect('back');
    }

    if (req.body.meetup_id) {
      errMsg = 'Database error. Meetup not updated.';
      successMsg = 'Meetup successfully updated!';
      meetupData.id = req.body.meetup_id;
    }

    if (req.files.length) {
      meetupData.image_url = req.files[0].filename;
    }

    meetupData.user_id = user.get('id');
    meetupData.title = req.body.title;
    meetupData.short_desc = req.body.short_desc;
    meetupData.organiser = req.body.organiser;
    meetupData.markdown = req.body.markdown;
    meetupData.province = req.body.administrative_area_level_1 || '';
    meetupData.lat = req.body.lat || '';
    meetupData.lng = req.body.lng || '';
    meetupData.city = req.body.locality || '';
    meetupData.town = req.body.sublocality || '';
    meetupData.address = req.body.formatted_address || req.body.geocomplete;
    meetupData.website = req.body.website;
    meetupData.url = req.body.url || '';
    meetupData.email = req.body.email;
    meetupData.number = req.body.number;
    meetupData.meetings = req.body.meetings;

    Meetup.forge(meetupData)
    .save(null, {
      context: {
        user_id: req.user.get('id')
      }
    })
    .then(function (model) {
      req.flash('success', { msg: successMsg});
      res.redirect('back');
    })
    .catch(function (error) {
      req.flash('errors', {'msg': error.message});
      res.redirect('back');
    });
  },

  updateOne: function (req, res, next) {

    req.assert('title', 'Title must be at least 4 characters long').len(4);
    req.assert('short_desc', 'Short description must be at lest 12 characters').len(12);
    req.assert('markdown', 'Details must be at least 12 characters long').len(12);
    req.assert('email', 'Starting cannot be blank').isEmail();

    let errors = req.validationErrors();
    let meetupData = {};

    if (errors) {
      req.flash('errors', errors);
      return res.redirect('back');
    }

    meetupData.id = req.body.meetup_id;
    meetupData.title = req.body.title;
    meetupData.short_desc = req.body.short_desc;
    meetupData.organiser = req.body.organiser;
    meetupData.markdown = req.body.markdown;
    meetupData.province = req.body.administrative_area_level_1 || '';
    meetupData.lat = req.body.lat || '';
    meetupData.lng = req.body.lng || '';
    meetupData.city = req.body.locality || '';
    meetupData.town = req.body.sublocality || '';
    meetupData.address = req.body.formatted_address || req.body.geocomplete;
    meetupData.website = req.body.website;
    meetupData.url = req.body.url || '';
    meetupData.email = req.body.email;
    meetupData.number = req.body.number;
    meetupData.meetings = req.body.meetings;

    if (req.files.length) {
      meetupData.image_url = req.files[0].filename;
    }

    let meetup = new Meetup({id: meetupData.id});

    meetup.fetch()
    .then(function (model) {
      model.save(meetupData, {method: 'update'})
      .then(function () {
        req.flash('success', { msg: 'Meetup successfully updated!'});
        res.redirect('back');
      })
      .catch(function (error) {
        req.flash('errors', {'msg': error.message});
        res.redirect('back');
      });
    })
    .catch(function (error) {
      req.flash('errors', {'msg': error.message});
      res.redirect('back');
    });
  }
});


module.exports = App.addController('Meetups', MeetupsController);
