import { result } from "lodash";
import { _base as _debug } from "@tryghost/debug";
const debug = _debug("ghost-query");

const addHasPostsWhere = (tableName, config) => {
  const comparisonField = `${tableName}.id`;

  return function (qb) {
    return qb.whereIn(comparisonField, function () {
      const innerQb = this.distinct(`${config.joinTable}.${config.joinTo}`)
        .select()
        .from(config.joinTable)
        .whereRaw(`${config.joinTable}.${config.joinTo} = ${comparisonField}`)
        .join("posts", "posts.id", `${config.joinTable}.post_id`)
        .andWhere("posts.status", "=", "published");

      debug(`QUERY has posts: ${innerQb.toSQL().sql}`);

      return innerQb;
    });
  };
};

/**
 * @param {import('bookshelf')} Bookshelf
 */
const hasPosts = function hasPosts(Bookshelf) {
  const modelPrototype = Bookshelf.Model.prototype;

  Bookshelf.Model = Bookshelf.Model.extend({
    initialize: function () {
      return modelPrototype.initialize.apply(this, arguments);
    },

    fetch: function () {
      if (this.shouldHavePosts) {
        this.query(
          addHasPostsWhere(result(this, "tableName"), this.shouldHavePosts)
        );
      }

      if (_debug.enabled("ghost-query")) {
        debug("QUERY", this.query().toQuery());
      }

      return modelPrototype.fetch.apply(this, arguments);
    },

    fetchAll: function () {
      if (this.shouldHavePosts) {
        this.query(
          addHasPostsWhere(result(this, "tableName"), this.shouldHavePosts)
        );
      }

      if (_debug.enabled("ghost-query")) {
        debug("QUERY", this.query().toQuery());
      }

      return modelPrototype.fetchAll.apply(this, arguments);
    },
  });
};

export default hasPosts;
const _addHasPostsWhere = addHasPostsWhere;
export { _addHasPostsWhere as addHasPostsWhere };
