
import moment from 'moment';
const markdown = require('markdown-it')();
import _ from 'lodash';
import bookshelf from './base';

let Event;
let Events

Event = bookshelf.Model.extend({

  tableName: 'events',

  hasTimestamps: true,


  saving: function (model, attr, options) {

    this.set('html', markdown.render(this.get('markdown')));
    this.set('title', this.get('title').trim());

    if (this.get('updated_by') && options.context && options.context.user_id) {
      this.set('updated_by', options.context.user_id);
    }
    // if is new or slug has changed and has slug field - generate new slug
    if (!this.get('slug') || this.hasChanged('title')) {
        return this.generateSlug(this.get('title'))
        .then( (slug) => {
          this.set({slug: slug});
        })
        .catch(function (err) {
          console.error(err);
        });
    }
  },


  /**
   * parses date
   */
  parseDate: function (fmt) {
  	let dt = this.get('dt');

    return moment(dt).format(fmt || 'ddd MMM D YYYY');
  },


  /**
   * parses time
   */
  parseTime: function (fmt) {
  	let ts = this.get('start_time');

    return moment(ts, 'HH:mm:ss').format(fmt || 'HH:mm');
  },


  viewed: function () {
    let views = this.get('views') || 0;

    return this.save({'views': views + 1}, {patch: true});
  }
});


const Events = bookshelf.Collection.extend({
  model: Event
});


export const Event = bookshelf.model('Event', Event);
export const Events = bookshelf.collection('Events', Events);