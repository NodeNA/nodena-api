import bookshelf from './base';
let PostsMeta;
import { toTransformReady, transformReadyToAbsolute } from '../../shared/url-utils';

PostsMeta = bookshelf.Model.extend({
    tableName: 'posts_meta',

    defaults: function defaults() {
        return {
            email_only: false
        };
    },

    formatOnWrite(attrs) {
        ['og_image', 'twitter_image'].forEach((attr) => {
            if (attrs[attr]) {
                attrs[attr] = toTransformReady(attrs[attr]);
            }
        });

        return attrs;
    },

    parse() {
        const attrs = bookshelf.Model.prototype.parse.apply(this, arguments);

        ['og_image', 'twitter_image'].forEach((attr) => {
            if (attrs[attr]) {
                attrs[attr] = transformReadyToAbsolute(attrs[attr]);
            }
        });

        return attrs;
    }
}, {
    post() {
        return this.belongsTo('Post');
    }
});

export const PostsMeta = bookshelf.model('PostsMeta', PostsMeta);