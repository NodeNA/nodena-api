import nodenaBookshelf from './base';
let UserEvent;

UserEvent = nodenaBookshelf.Model.extend({
  tableName = "user_events",
});

export default nodenaBookshelf.model('UserEvent', UserEvent);
