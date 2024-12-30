import Post from './post';
import Author from './author';

Post.belongsTo(Author, {
	foreignKey: 'authorId',
	as: 'author',
});

Author.hasMany(Post, {
	foreignKey: 'authorId',
	as: 'posts',
});

export { Post, Author };
