import bookshelf from "./base";
import _ from 'lodash';

let Meetup;
let Meetups;

Meetup =  bookshelf.Model.extend({
  tableName: 'meetups',

  saving: function (model, attr, options) {

    if (this.get('updated_by') && options.context && options.context.user_id) {
      this.set('updated_by', options.context.user_id);
    }
    // if is new or slug has changed and has slug field - generate new slug
    if (!this.get('slug') || this.hasChanged('slug')) {
        return this.generateSlug(this.get('slug') || this.get('name') || this.get('title'))
        .then( (slug) => {
          this.set({slug: slug});
        })
        .catch(function (err) {
          console.error(err);
        });
    }
  },


  viewed: function () {
    let views = this.get('views') || 0;

    return this.save({'views': views + 1}, {patch: true});
  }

});

Meetups = bookshelf.Collection.extend({
  model: Meetup
})

export default Meetup = bookshelf.model('Meetup', Meetup);
export default Meetups = bookshelf.collection('Meetups', Meetups);