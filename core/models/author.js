import nodenaBookshelf from './base';
import { User } from './user';

const Author = User.extend({
    shouldHavePosts: {
        joinTo: 'author_id',
        joinTable: 'posts_authors'
    }
});

const Authors = nodenaBookshelf.Collection.extend({
    model: Author
});

export const Author = nodenaBookshelf.model('Author', Author);
export const Authors = nodenaBookshelf.collection('Authors', Authors);