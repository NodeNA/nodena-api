// # Base Model
// This is the model from which all other NodeNA models extend. The model is based on Bookshelf.Model, and provides
// several basic behaviours such as UUIDs, as well as a set of Data methods for accessing information from the database.
//
// The models are internal to NodeNA, only the API and some internal functions such as migration and import/export
// accesses the models directly.

// All other parts of NodeNA, including the frontend & admin UI are only allowed to access data via the API.
import moment from 'moment';
import { tables } from '../../data/schema';

import nodenaBookshelf from './bookshelf';

// Cache an instance of the base model prototype
const proto = Model.prototype;

// ## nodenaBookshelf.Model
// The Base Model which other NodeNA objects will inherit from,
// including some convenience functions as static properties on the model.
nodenaBookshelf.Model = Model.extend({
    // Bookshelf `hasTimestamps` - handles created_at and updated_at properties
    hasTimestamps: true,

    requireFetch: false,

    // https://github.com/bookshelf/bookshelf/commit/a55db61feb8ad5911adb4f8c3b3d2a97a45bd6db
    parsedIdAttribute: function () {
        return false;
    },

    // NodeNA ordering handling, allows to order by permitted attributes by default and can be overriden on specific model level
    orderAttributes: function orderAttributes() {
        return Object.keys(tables[this.tableName])
            .map(key => `${this.tableName}.${key}`)
            .filter(key => key.indexOf('@@') === -1);
    },

    // Bookshelf `initialize` - declare a constructor-like method for model creation
    initialize: function initialize() {
        this.initializeEvents();

        // @NOTE: Please keep here. If we don't initialize the parent, bookshelf-relations won't work.
        proto.initialize.call(this);
    },

    hasDateChanged: function (attr) {
        return moment(this.get(attr)).diff(moment(this.previous(attr))) !== 0;
    },

    wasChanged() {
        /**
         * @NOTE:
         * Not every model & interaction is currently set up to handle "._changed".
         * e.g. we trigger a manual event for "tag.attached", where as "._changed" is undefined.
         *
         * Keep "true" till we are sure that "._changed" is always a thing.
         */
        if (!this._changed) {
            return true;
        }

        if (!Object.keys(this._changed).length) {
            return false;
        }

        return true;
    }
}, {
    /**
     * @template T
     * @param {(transaction: import('knex').Transaction) => Promise<T>} fn
     *
     * @returns {Promise<T>}
     */
    transaction(fn) {
        return nodenaBookshelf.transaction(fn);
    }
});

// Export nodenaBookshelf for use elsewhere
export default nodenaBookshelf;