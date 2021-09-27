

const UserEvent = App.Model.extend({
  tableName = "user_events",


  hasTimestamps: true,
});


export default App.addModel('UserEvent', UserEvent);