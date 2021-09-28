import nodenaBookshelf from './base';
let Token;

Token = nodenaBookshelf.Model.extend({

  tableName: 'tokens',

  /*
   * delete post
  **/
  remove: function(id) {
    return Token.forge({id: id})
    .fetch()
    .then(function(model) {
      return model.destroy();
    });
  }

});


export default nodenaBookshelf.model('Token', Token);