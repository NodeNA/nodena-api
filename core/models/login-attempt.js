import bookshelf from "./base";

let LoginAttempt;

LoginAttempt =  bookshelf.Model.extend({

  tableName: 'login_attempts',

  hasTimestamps: true,

});

export default bookshelf.model('LoginAttempt', LoginAttempt);