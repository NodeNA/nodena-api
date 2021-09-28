import nodenaBookshelf from "./base";

import { genSalt, hash as _hash, compare } from "bcrypt-nodejs";
import { createHash } from "crypto";
import Promise, { resolve as _resolve } from "bluebird";

const activeStates = ["active", "warn-1", "warn-2", "warn-3", "warn-4"];

/**
 * inactive: owner user before blog setup, suspended users
 * locked user: imported users, they get a random password
 */
const inactiveStates = ["inactive", "locked"];

const allStates = activeStates.concat(inactiveStates);
let User;
let Users;

User = nodenaBookshelf.Model.extend({
  tableName: "users",

  defaults: function defaults() {
    return {
      password: security.identifier.uid(50),
      visibility: "public",
      status: "active",
    };
  },

  format(options) {
    if (
      !_.isEmpty(options.website) &&
      !validator.isURL(options.website, {
        require_protocol: true,
        protocols: ["http", "https"],
      })
    ) {
      options.website = "http://" + options.website;
    }

    const attrs = nodenaBookshelf.Model.prototype.format.call(this, options);

    ["profile_image", "cover_image"].forEach((attr) => {
      if (attrs[attr]) {
        attrs[attr] = urlUtils.toTransformReady(attrs[attr]);
      }
    });

    return attrs;
  },

  parse() {
    const attrs = nodenaBookshelf.Model.prototype.parse.apply(this, arguments);

    ["profile_image", "cover_image"].forEach((attr) => {
      if (attrs[attr]) {
        attrs[attr] = urlUtils.transformReadyToAbsolute(attrs[attr]);
      }
    });

    return attrs;
  },

  emitChange: function emitChange(event, options) {
    const eventToTrigger = "user" + "." + event;
    nodenaBookshelf.Model.prototype.emitChange.bind(this)(
      this,
      eventToTrigger,
      options
    );
  },

  /**
   * @TODO:
   *
   * The user model does not use bookshelf-relations yet.
   * Therefore we have to remove the relations manually.
   */
  onDestroying(model, options) {
    nodenaBookshelf.Model.prototype.onDestroying.apply(this, arguments);

    return (options.transacting || nodenaBookshelf.knex)("roles_users")
      .where("user_id", model.id)
      .del();
  },

  onDestroyed: function onDestroyed(model, options) {
    nodenaBookshelf.Model.prototype.onDestroyed.apply(this, arguments);

    if (_.includes(activeStates, model.previous("status"))) {
      model.emitChange("deactivated", options);
    }

    model.emitChange("deleted", options);
  },

  onCreated: function onCreated(model, options) {
    nodenaBookshelf.Model.prototype.onCreated.apply(this, arguments);

    model.emitChange("added", options);

    // active is the default state, so if status isn't provided, this will be an active user
    if (!model.get("status") || _.includes(activeStates, model.get("status"))) {
      model.emitChange("activated", options);
    }
  },

  onUpdated: function onUpdated(model, options) {
    nodenaBookshelf.Model.prototype.onUpdated.apply(this, arguments);

    model.statusChanging = model.get("status") !== model.previous("status");
    model.isActive = _.includes(activeStates, model.get("status"));

    if (model.statusChanging) {
      model.emitChange(model.isActive ? "activated" : "deactivated", options);
    } else {
      if (model.isActive) {
        model.emitChange("activated.edited", options);
      }
    }

    model.emitChange("edited", options);
  },

  isActive: function isActive() {
    return activeStates.indexOf(this.get("status")) !== -1;
  },

  isLocked: function isLocked() {
    return this.get("status") === "locked";
  },

  isInactive: function isInactive() {
    return this.get("status") === "inactive";
  },

  /**
   * Lookup Gravatar if email changes to update image url
   * Generating a slug requires a db call to look for conflicting slugs
   */
  onSaving: function onSaving(newPage, attr, options) {
    const self = this;
    const tasks = [];
    let passwordValidation = {};

    nodenaBookshelf.Model.prototype.onSaving.apply(this, arguments);

    /**
     * Bookshelf call order:
     *   - onSaving
     *   - onValidate (validates the model against the schema)
     *
     * Before we can generate a slug, we have to ensure that the name is not blank.
     */
    if (!this.get("name")) {
      throw new errors.ValidationError({
        message: i18n.t("notices.data.validation.index.valueCannotBeBlank", {
          tableName: this.tableName,
          columnKey: "name",
        }),
      });
    }

    // If the user's email is set & has changed & we are not importing
    if (self.hasChanged("email") && self.get("email") && !options.importing) {
      tasks.gravatar = (function lookUpGravatar() {
        return gravatar
          .lookup({
            email: self.get("email"),
          })
          .then(function (response) {
            if (response && response.image) {
              self.set("profile_image", response.image);
            }
          });
      })();
    }

    if (this.hasChanged("slug") || !this.get("slug")) {
      tasks.slug = (function generateSlug() {
        return nodenaBookshelf.Model.generateSlug(
          User,
          self.get("slug") || self.get("name"),
          {
            status: "all",
            transacting: options.transacting,
            shortSlug: !self.get("slug"),
          }
        ).then(function then(slug) {
          self.set({ slug: slug });
        });
      })();
    }

    /**
     * CASE: add model, hash password
     * CASE: update model, hash password
     *
     * Important:
     *   - Password hashing happens when we import a database
     *   - we do some pre-validation checks, because onValidate is called AFTER onSaving
     *   - when importing, we set the password to a random uid and don't validate, just hash it and lock the user
     *   - when importing with `importPersistUser` we check if the password is a bcrypt hash already and fall back to
     *     normal behaviour if not (set random password, lock user, and hash password)
     *   - no validations should run, when importing
     */
    if (self.hasChanged("password")) {
      this.set("password", String(this.get("password")));

      // CASE: import with `importPersistUser` should always be an bcrypt password already,
      // and won't re-hash or overwrite it.
      // In case the password is not bcrypt hashed we fall back to the standard behaviour.
      if (
        options.importPersistUser &&
        this.get("password").match(/^\$2[ayb]\$.{56}$/i)
      ) {
        return;
      }

      if (options.importing) {
        // always set password to a random uid when importing
        this.set("password", security.identifier.uid(50));

        // lock users so they have to follow the password reset flow
        if (this.get("status") !== "inactive") {
          this.set("status", "locked");
        }
      } else {
        // CASE: we're not importing data, validate the data
        passwordValidation = validatePassword(
          this.get("password"),
          this.get("email")
        );

        if (!passwordValidation.isValid) {
          return Promise.reject(
            new errors.ValidationError({
              message: passwordValidation.message,
            })
          );
        }
      }

      tasks.hashPassword = (function hashPassword() {
        return security.password
          .hash(self.get("password"))
          .then(function (hash) {
            self.set("password", hash);
          });
      })();
    }

    return Promise.props(tasks);
  },

  toJSON: function toJSON(unfilteredOptions) {
    const options = User.filterOptions(unfilteredOptions, "toJSON");
    const attrs = nodenaBookshelf.Model.prototype.toJSON.call(this, options);

    // remove password hash for security reasons
    delete attrs.password;

    return attrs;
  },

  tokens: function () {
    return this.hasMany("Token");
  },

  role: function () {
    return this.belongsTo("Role");
  },

  permissions: function permissionsFn() {
    return this.belongsToMany("Permission");
  },

  Users: function () {
    return this.hasMany("Users");
  },

  posts: function () {
    return this.hasMany("Posts");
  },

  hasRole: function hasRole(roleName) {
    const roles = this.related("roles");

    return roles.some(function getRole(role) {
      return role.get("name") === roleName;
    });
  },

  updateLastSeen: function updateLastSeen() {
    this.set({ last_seen: new Date() });
    return this.save();
  },

  generatePasswordHash: function (password) {
    return new Promise(function (resolve, reject) {
      genSalt(5, function (err, salt) {
        if (err) {
          return reject(err);
        }

        _hash(password, salt, null, function (err, hash) {
          if (err) {
            return reject(err);
          }

          resolve(hash);
        });
      });
    });
  },

  comparePassword: function (candidatePassword) {
    let password = this.get("password");

    return new Promise(function (resolve, reject) {
      compare(candidatePassword, password, function (err, isMatch) {
        if (err) {
          reject(err);
        } else {
          resolve(isMatch);
        }
      });
    });
  },

  gravatar: function (size, defaults) {
    size = size || 32;
    defaults = defaults || "retro";

    if (!this.get("email")) {
      return `https://gravatar.com/avatar/?s=${size}&d=${defaults}`;
    }

    let md5 = createHash("md5").update(this.get("email"));

    return `https://gravatar.com/avatar/${md5
      .digest("hex")
      .toString()}?s=${size}&d=${defaults}`;
  },

  twitterHandle: function () {
    let handle = false;
    let twitter_url = this.get("twitter_url");

    if (twitter_url) {
      handle = twitter_url.substring(twitter_url.lastIndexOf("/") + 1);
    }

    return handle;
  },

  creating: function (newObj, attr, options) {
    return this.generatePasswordHash(this.get("password"))
      .then((hash) => {
        this.set({ password: hash });
      })
      .then(() => {
        return this.generateSlug(this.get("name")).then((slug) => {
          console.log("creating", slug);
          this.set({ slug: slug });
        });
      });
  },

  saving: function (newObj, attr, options) {
    return this.generatePasswordHash(this.get("password"))
      .then((hash) => {
        if (this.hasChanged("password")) {
          this.set({ password: hash });
        }
      })
      .then(() => {
        if (this.hasChanged("name")) {
          return this.generateSlug(this.get("name")).then((slug) => {
            this.set({ slug: slug });
          });
        }
      });
  },

  /*
   * delete post
   **/
  deleteAccount: function (userId) {
    let user = new User({ id: userId });

    return user
      .fetch({ withRelated: ["tokens"], require: true })
      .then(function (model) {
        let tokens = model.related("tokens");

        if (tokens.length > 0) {
          return tokens.invokeThen("destroy").then(function () {
            return model.destroy();
          });
        } else {
          return model.destroy();
        }
      });
  },

  /**
   * Returns an array of keys permitted in a method's `options` hash, depending on the current method.
   * @param {String} methodName The name of the method to check valid options for.
   * @return {Array} Keys allowed in the `options` hash of the model's method.
   */
  permittedOptions: function permittedOptions(methodName, options) {
    let permittedOptionsToReturn = nodenaBookshelf.Model.permittedOptions.call(
      this,
      methodName
    );

    // whitelists for the `options` hash argument on methods, by method name.
    // these are the only options that can be passed to Bookshelf / Knex.
    const validOptions = {
      findOne: ["withRelated", "status"],
      setup: ["id"],
      edit: ["withRelated", "importPersistUser"],
      add: ["importPersistUser"],
      findPage: ["status"],
      findAll: ["filter"],
    };

    if (validOptions[methodName]) {
      permittedOptionsToReturn = permittedOptionsToReturn.concat(
        validOptions[methodName]
      );
    }

    if (options && options.context && options.context.public) {
      if (options.withRelated && options.withRelated.indexOf("roles") !== -1) {
        options.withRelated.splice(options.withRelated.indexOf("roles"), 1);
      }
    }

    return permittedOptionsToReturn;
  },

  /**
   * ### Find One
   *
   * We have to clone the data, because we remove values from this object.
   * This is not expected from outside!
   *
   * @TODO: use base class
   *
   * @extends nodenaBookshelf.Model.findOne to include roles
   * **See:** [nodenaBookshelf.Model.findOne](base.js.html#Find%20One)
   */
  findOne: function findOne(dataToClone, unfilteredOptions) {
    const options = this.filterOptions(unfilteredOptions, "findOne");
    let query;
    let status;
    let data = _.cloneDeep(dataToClone);
    const lookupRole = data.role;

    // Ensure only valid fields/columns are added to query
    if (options.columns) {
      options.columns = _.intersection(
        options.columns,
        this.prototype.permittedAttributes()
      );
    }

    delete data.role;
    data = _.defaults(data || {}, {
      status: "all",
    });

    status = data.status;
    delete data.status;

    data = this.filterData(data);

    // Support finding by role
    if (lookupRole) {
      options.withRelated = _.union(options.withRelated, ["roles"]);
      query = this.forge(data);

      query.query(
        "join",
        "roles_users",
        "users.id",
        "=",
        "roles_users.user_id"
      );
      query.query("join", "roles", "roles_users.role_id", "=", "roles.id");
      query.query("where", "roles.name", "=", lookupRole);
    } else {
      query = this.forge(data);
    }

    if (status === "active") {
      query.query("whereIn", "status", activeStates);
    } else if (status !== "all") {
      query.query("where", { status: status });
    }

    return query.fetch(options);
  },

  /**
   * ### Edit
   *
   * Note: In case of login the last_seen attribute gets updated.
   *
   * @extends bookshelf.Model.edit to handle returning the full object
   * **See:** [bookshelf.Model.edit](base.js.html#edit)
   */
  edit: function edit(data, unfilteredOptions) {
    const options = this.filterOptions(unfilteredOptions, "edit");
    const self = this;
    const ops = [];

    if (data.roles && data.roles.length > 1) {
      return Promise.reject(
        new errors.ValidationError({
          message: i18n.t("errors.models.user.onlyOneRolePerUserSupported"),
        })
      );
    }

    if (data.email) {
      ops.push(function checkForDuplicateEmail() {
        return self.getByEmail(data.email, options).then(function then(user) {
          if (user && user.id !== options.id) {
            return Promise.reject(
              new errors.ValidationError({
                message: i18n.t(
                  "errors.models.user.userUpdateError.emailIsAlreadyInUse"
                ),
              })
            );
          }
        });
      });
    }

    ops.push(function update() {
      return nodenaBookshelf.Model.edit
        .call(self, data, options)
        .then((user) => {
          let roleId;

          if (!data.roles) {
            return user;
          }

          roleId = data.roles[0].id || data.roles[0];

          return user
            .roles()
            .fetch()
            .then((roles) => {
              // return if the role is already assigned
              if (roles.models[0].id === roleId) {
                return;
              }
              return nodenaBookshelf.model("Role").findOne({ id: roleId });
            })
            .then((roleToAssign) => {
              if (roleToAssign && roleToAssign.get("name") === "Owner") {
                return Promise.reject(
                  new errors.ValidationError({
                    message: i18n.t(
                      "errors.models.user.methodDoesNotSupportOwnerRole"
                    ),
                  })
                );
              } else {
                // assign all other roles
                return user.roles().updatePivot({ role_id: roleId });
              }
            })
            .then(() => {
              options.status = "all";
              return self.findOne({ id: user.id }, options);
            })
            .then((model) => {
              model._changed = user._changed;
              return model;
            });
        });
    });

    return pipeline(ops);
  },

  /**
   * ## Add
   * Naive user add
   * Hashes the password provided before saving to the database.
   *
   * We have to clone the data, because we remove values from this object.
   * This is not expected from outside!
   *
   * @param {object} dataToClone
   * @param {object} unfilteredOptions
   * @extends nodenaBookshelf.Model.add to manage all aspects of user signup
   * **See:** [nodenaBookshelf.Model.add](base.js.html#Add)
   */
  add: function add(dataToClone, unfilteredOptions) {
    const options = this.filterOptions(unfilteredOptions, "add");
    const self = this;
    const data = _.cloneDeep(dataToClone);
    let userData = this.filterData(data);
    let roles;

    // check for too many roles
    if (data.roles && data.roles.length > 1) {
      return Promise.reject(
        new errors.ValidationError({
          message: i18n.t("errors.models.user.onlyOneRolePerUserSupported"),
        })
      );
    }

    function getAuthorRole() {
      return nodenaBookshelf
        .model("Role")
        .findOne({ name: "Author" }, _.pick(options, "transacting"))
        .then(function then(authorRole) {
          return [authorRole.get("id")];
        });
    }

    /**
     * We need this default author role because of the following NodeNA feature:
     * You setup your blog and you can invite people instantly, but without choosing a role.
     * roles: [] -> no default role (used for owner creation, see fixtures.json)
     * roles: undefined -> default role
     */
    roles = data.roles;
    delete data.roles;

    return nodenaBookshelf.Model.add
      .call(self, userData, options)
      .then(function then(addedUser) {
        // Assign the userData to our created user so we can pass it back
        userData = addedUser;
      })
      .then(function () {
        if (!roles) {
          return getAuthorRole();
        }

        return Promise.resolve(roles);
      })
      .then(function (_roles) {
        roles = _roles;

        // CASE: it is possible to add roles by name, by id or by object
        if (_.isString(roles[0]) && !ObjectId.isValid(roles[0])) {
          return Promise.map(roles, function (roleName) {
            return nodenaBookshelf.model("Role").findOne(
              {
                name: roleName,
              },
              options
            );
          }).then(function (roleModels) {
            roles = [];

            _.each(roleModels, function (roleModel) {
              roles.push(roleModel.id);
            });
          });
        }

        return Promise.resolve();
      })
      .then(function () {
        return baseUtils.attach(User, userData.id, "roles", roles, options);
      })
      .then(function then() {
        // find and return the added user
        return self.findOne({ id: userData.id, status: "all" }, options);
      });
  },

  destroy: function destroy(unfilteredOptions) {
    const options = this.filterOptions(unfilteredOptions, "destroy", {
      extraAllowedProperties: ["id"],
    });

    const destroyUser = () => {
      return nodenaBookshelf.Model.destroy.call(this, options);
    };

    if (!options.transacting) {
      return nodenaBookshelf.transaction((transacting) => {
        options.transacting = transacting;
        return destroyUser();
      });
    }

    return destroyUser();
  },

  // Finds the user by email, and checks the password
  // @TODO: shorten this function and rename...
  check: function check(object) {
    const self = this;

    return this.getByEmail(object.email)
      .then((user) => {
        if (!user) {
          throw new errors.NotFoundError({
            message: i18n.t("errors.models.user.noUserWithEnteredEmailAddr"),
          });
        }

        if (user.isLocked()) {
          throw new errors.PasswordResetRequiredError();
        }

        if (user.isInactive()) {
          throw new errors.NoPermissionError({
            message: i18n.t("errors.models.user.accountSuspended"),
          });
        }

        return self
          .isPasswordCorrect({
            plainPassword: object.password,
            hashedPassword: user.get("password"),
          })
          .then(() => {
            return user.updateLastSeen();
          })
          .then(() => {
            user.set({ status: "active" });
            return user.save();
          });
      })
      .catch((err) => {
        if (err.message === "NotFound" || err.message === "EmptyResponse") {
          throw new errors.NotFoundError({
            message: i18n.t("errors.models.user.noUserWithEnteredEmailAddr"),
          });
        }

        throw err;
      });
  },

  isPasswordCorrect: function isPasswordCorrect(object) {
    const plainPassword = object.plainPassword;
    const hashedPassword = object.hashedPassword;

    if (!plainPassword || !hashedPassword) {
      return Promise.reject(
        new errors.ValidationError({
          message: i18n.t("errors.models.user.passwordRequiredForOperation"),
        })
      );
    }

    return security.password
      .compare(plainPassword, hashedPassword)
      .then(function (matched) {
        if (matched) {
          return;
        }

        return Promise.reject(
          new errors.ValidationError({
            context: i18n.t("errors.models.user.incorrectPassword"),
            message: i18n.t("errors.models.user.incorrectPassword"),
            help: i18n.t("errors.models.user.userUpdateError.help"),
            code: "PASSWORD_INCORRECT",
          })
        );
      });
  },

  /**
   * Naive change password method
   * @param {Object} object
   * @param {Object} unfilteredOptions
   */
  changePassword: async function changePassword(object, unfilteredOptions) {
    const options = this.filterOptions(unfilteredOptions, "changePassword");
    const newPassword = object.newPassword;
    const userId = object.user_id;
    const oldPassword = object.oldPassword;
    const isLoggedInUser = userId === options.context.user;
    const skipSessionID = unfilteredOptions.skipSessionID;

    options.require = true;
    options.withRelated = ["sessions"];

    const user = await this.forge({ id: userId }).fetch(options);

    if (isLoggedInUser) {
      await this.isPasswordCorrect({
        plainPassword: oldPassword,
        hashedPassword: user.get("password"),
      });
    }

    const updatedUser = await user.save({ password: newPassword });

    const sessions = user.related("sessions");
    for (const session of sessions) {
      if (session.get("session_id") !== skipSessionID) {
        await session.destroy(options);
      }
    }

    return updatedUser;
  },

  // Get the user by email address, enforces case insensitivity rejects if the user is not found
  // When multi-user support is added, email addresses must be deduplicated with case insensitivity, so that
  // joe@bloggs.com and JOE@BLOGGS.COM cannot be created as two separate users.
  getByEmail: function getByEmail(email, unfilteredOptions) {
    const options = nodenaBookshelf.Model.filterOptions(
      unfilteredOptions,
      "getByEmail"
    );

    // We fetch all users and process them in JS as there is no easy way to make this query across all DBs
    // Although they all support `lower()`, sqlite can't case transform unicode characters
    // This is somewhat mute, as validator.isEmail() also doesn't support unicode, but this is much easier / more
    // likely to be fixed in the near future.
    options.require = true;

    return Users.forge()
      .fetch(options)
      .then(function then(users) {
        const userWithEmail = users.find(function findUser(user) {
          return user.get("email").toLowerCase() === email.toLowerCase();
        });

        if (userWithEmail) {
          return userWithEmail;
        }
      });
  },
  inactiveStates: inactiveStates,
});

Users = nodenaBookshelf.Collection.extend({
  model: User,
});

export const User = nodenaBookshelf.model("User", User);
export const Users = nodenaBookshelf.collection("Users", Users);
