import nodenaBookshelf from './base';

let Invite;
let Invites;

Invite = nodenaBookshelf.Model.extend({

  tableName: 'invites',

  toJSON: function (unfilteredOptions) {
    const options = Invite.filterOptions(unfilteredOptions, 'toJSON');
    const attrs = nodenaBookshelf.Model.prototype.toJSON.call(this, options);

    delete attrs.token;
    return attrs;
  }
}, {
  orderDefaultOptions: function orderDefaultOptions() {
    return {};
  },

  add: function add(data, unfilteredOptions) {
    const options = Invite.filterOptions(unfilteredOptions, 'add');
    data = data || {};

    if (!options.context || !options.context.internal) {
      data.status = 'pending';
    }

    data.expires = Date.now() + constants.ONE_WEEK_MS;
    data.token = security.tokens.generateFromEmail({
      email: data.email,
      expires: data.expires,
      secret: settingsCache.get('db_hash')
    });

    return nodenaBookshelf.Model.add.call(this, data, options);
  },

  
  async permissible(inviteModel, action, context, unsafeAttrs, loadedPermissions, hasUserPermission, hasApiKeyPermission) {
    const isAdd = (action === 'add');

    if (!isAdd) {
      if (hasUserPermission && hasApiKeyPermission) {
        return Promise.resolve();
      }

      return Promise.reject(new errors.NoPermissionError({
        message: i18n.t('errors.models.invite.notEnoughPermission')
      }));
    }

    // CASE: make sure user is allowed to add a user with this role
    return nodenaBookshelf.model('Role')
      .findOne({ id: unsafeAttrs.role_id })
      .then(async (roleToInvite) => {
        if (!roleToInvite) {
          return Promise.reject(new errors.NotFoundError({
            message: i18n.t('errors.api.invites.roleNotFound')
          }));
        }

        if (roleToInvite.get('name') === 'Owner') {
          return Promise.reject(new errors.NoPermissionError({
            message: i18n.t('errors.api.invites.notAllowedToInviteOwner')
          }));
        }

        if (isAdd && limitService.isLimited('staff') && roleToInvite.get('name') !== 'Contributor') {
          // CASE: if your site is limited to a certain number of staff users
          // Inviting a new user requires we check we won't go over the limit
          await limitService.errorIfWouldGoOverLimit('staff');
        }

        let allowed = [];

        if (_.some(loadedPermissions.user.roles, { name: 'Owner' }) ||
          _.some(loadedPermissions.user.roles, { name: 'Administrator' })) {
          allowed = ['Administrator', 'Editor', 'Author', 'Contributor'];
        } else if (_.some(loadedPermissions.user.roles, { name: 'Editor' })) {
          allowed = ['Author', 'Contributor'];
        }

        if (allowed.indexOf(roleToInvite.get('name')) === -1) {
          throw new errors.NoPermissionError({
            message: i18n.t('errors.api.invites.notAllowedToInvite')
          });
        }

        if (hasUserPermission && hasApiKeyPermission) {
          return Promise.resolve();
        }

        return Promise.reject(new errors.NoPermissionError({
          message: i18n.t('errors.models.invite.notEnoughPermission')
        }));
      });
  }

});


Invites = nodenaBookshelf.Collection.extend({
  model: Invite
});

export default Invite = nodenaBookshelf.model('Invite', Invite);
export default Invites = nodenaBookshelf.collection('Invites', Invites);
