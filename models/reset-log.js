import bookshelf from "./base";
let ResetLog;

ResetLog = bookshelf.Model.extend({
  tableName = "reset_logs",

  hasTimestamps: true,
});


export default bookshelf.model('ResetLog', ResetLog);