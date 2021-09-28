import _ from "lodash";
import bookshelf from "./base";
import Promise from "bluebird";
import i18n from "../../shared/i18n";
import errors from "@tryghost/errors";
let Role;
let Roles;

Role = bookshelf.Model.extend(
  {
    tableName: "roles",

    relationships: ["permissions"],

    relationshipBelongsTo: {
      permissions: "permissions",
    },

    users: function users() {
      return this.belongsToMany("User");
    },

    permissions: function permissions() {
      return this.belongsToMany("Permission");
    },
  },
  {
    /**
     * Returns an array of keys permitted in a method's `options` hash, depending on the current method.
     * @param {String} methodName The name of the method to check valid options for.
     * @return {Array} Keys allowed in the `options` hash of the model's method.
     */
    permittedOptions: function permittedOptions(methodName) {
      let options = bookshelf.Model.permittedOptions.call(this, methodName);

      // whitelists for the `options` hash argument on methods, by method name.
      // these are the only options that can be passed to Bookshelf / Knex.
      const validOptions = {
        findOne: ["withRelated"],
        findAll: ["withRelated"],
      };

      if (validOptions[methodName]) {
        options = options.concat(validOptions[methodName]);
      }

      return options;
    },

    permissible: function permissible(
      roleModelOrId,
      action,
      context,
      unsafeAttrs,
      loadedPermissions,
      hasUserPermission,
      hasApiKeyPermission
    ) {
      // If we passed in an id instead of a model, get the model
      // then check the permissions
      if (_.isNumber(roleModelOrId) || _.isString(roleModelOrId)) {
        // Get the actual role model
        return this.findOne({ id: roleModelOrId, status: "all" }).then(
          (foundRoleModel) => {
            if (!foundRoleModel) {
              throw new errors.NotFoundError({
                message: i18n.t("errors.models.role.roleNotFound"),
              });
            }

            // Grab the original args without the first one
            const origArgs = _.toArray(arguments).slice(1);

            return this.permissible(foundRoleModel, ...origArgs);
          }
        );
      }

      const roleModel = roleModelOrId;

      if (action === "assign" && loadedPermissions.user) {
        let checkAgainst;
        if (_.some(loadedPermissions.user.roles, { name: "Owner" })) {
          checkAgainst = [
            "Owner",
            "Administrator",
            "Editor",
            "Author",
            "Contributor",
          ];
        } else if (
          _.some(loadedPermissions.user.roles, { name: "Administrator" })
        ) {
          checkAgainst = ["Administrator", "Editor", "Author", "Contributor"];
        } else if (_.some(loadedPermissions.user.roles, { name: "Editor" })) {
          checkAgainst = ["Author", "Contributor"];
        }

        // Role in the list of permissible roles
        hasUserPermission =
          roleModelOrId && _.includes(checkAgainst, roleModel.get("name"));
      }

      if (hasUserPermission && hasApiKeyPermission) {
        return Promise.resolve();
      }

      return Promise.reject(
        new errors.NoPermissionError({
          message: i18n.t("errors.models.role.notEnoughPermission"),
        })
      );
    },
  }
);

Roles = bookshelf.Collection.extend({
  model: Role,
});


export const Role = bookshelf.model("Role", Role);
export const Roles =  bookshelf.collection("Roles", Roles);

