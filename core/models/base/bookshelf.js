import _ from "lodash";
import bookshelf from "bookshelf";
import hasPosts from "../plugins/has-posts";
const Promise = require('bluebird');
const ObjectId = require('bson-objectid');

import db from "../../data/db";

// ### nodenaBookshelf
// Initializes a new Bookshelf instance called nodenaBookshelf, for reference elsewhere in NodeNA.
const nodenaBookshelf = bookshelf(db.knex);

nodenaBookshelf.plugin(hasPosts);

nodenaBookshelf.plugin(import("./plugins/generate-slug.js"));

nodenaBookshelf.plugin(import("./plugins/filtered-collection.js"));

// Manages nested updates (relationships)
nodenaBookshelf.plugin("bookshelf-relations", {
  allowedOptions: ["context", "importing", "migrating"],
  unsetRelations: true,
  extendChanged: "_changed",
  attachPreviousRelations: true,
  hooks: {
    belongsToMany: {
      after: function (existing, targets, options) {
        // reorder tags/authors
        const queryOptions = {
          query: {
            where: {},
          },
        };

        // CASE: disable after hook for specific relations
        if (
          ["permissions_roles"].indexOf(existing.relatedData.joinTableName) !==
          -1
        ) {
          return Promise.resolve();
        }

        return Promise.each(targets.models, function (target, index) {
          queryOptions.query.where[existing.relatedData.otherKey] = target.id;

          return existing.updatePivot(
            {
              sort_order: index,
            },
            _.extend({}, options, queryOptions)
          );
        });
      },
      beforeRelationCreation: function onCreatingRelation(model, data) {
        data.id = ObjectId().toHexString();
      },
    },
  },
});

module.exports = nodenaBookshelf;
