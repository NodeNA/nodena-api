import bookshelf from "./base";

let Category;
let Categories;

const Category =  bookshelf.Model.extend({

  tableName: 'categories',

  saving: function (model, attr, options) {
    // if is new or slug has changed and has slug field - generate new slug
    if (!this.get('slug') || this.hasChanged('slug')) {
      return this.generateSlug(this.get('slug') || this.get('name') || this.get('title'))
        .then( (slug) => {
          this.set({slug: slug});
        });
    }

    return App.Model.prototype.saving.apply(this, _.toArray(arguments));
  },


  hasTimestamps: true,


  posts: function () {
    return this.hasMany('Posts', 'category_id');
  }
});

Categories = bookshelf.Collection.extend({
  model: Category
})

export const Category = bookshelf.model('Category', Category);
export const Categories = bookshelf.collection('Categories', Categories);