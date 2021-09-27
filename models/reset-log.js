

const ResetLog = App.Model.extend({
  tableName = "reset_logs",

  hasTimestamps: true,
});


export default App.addModel('ResetLog', ResetLog);