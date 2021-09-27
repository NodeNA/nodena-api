

const LoginAttempt =  App.Model.extend({

  tableName: 'login_attempts',

  hasTimestamps: true,

});

export default App.addModel('LoginAttempt', LoginAttempt);