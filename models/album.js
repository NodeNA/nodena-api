import bookshelf from "./base";

let Album;
let Albums;

Albums = bookshelf.Model.extend({

  tableName: 'ablums',

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


  images: function () {
    return this.hasMany('Image', 'image_id');
  },

});


Albums = bookshelf.Collection.extend({
  model: Album
})


export const Album = bookshelf.model('Album', Album)
export const Albums = bookshelf.Collection('Albums', Albums)