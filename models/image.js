import bookshelf from "./base";

let Image;

Image = bookshelf.Model.extend({
  tableName: 'images',
  hasTimestamps: true,

  saving: function (model, attr, options) {
    // if is new or slug has changed and has slug field - generate new slug
    if (!this.get('slug') || this.hasChanged('slug')) {
      return this.generateSlug(this.get('title'))
      .then( (slug) => {
        this.set({slug: slug});
      })
      .catch(function (err) {
        console.error(err);
      });
    }
  }

});

export default Image = bookshelf.model('Image', Image);

