// src/db/migrate.ts

import { Author, Post } from '@/models';
import sequelize from './sequelize';

import type { T_PostCreate } from '@/zod/post';
import type { T_AuthorCreate } from '@/zod/author';

(async () => {
	await sequelize.drop({
		cascade: true,
	});

	await Author.sync({ force: true, alter: true });
	await Post.sync({ force: true, alter: true });

	const authors: T_AuthorCreate[] = [
		{
			name: 'Jay',
			email: 'jay@example.com',
			bio: 'I am a software engineer.',
			website: 'https://blog.designly.biz',
		},
	];

	await Author.bulkCreate(authors);

	const author = await Author.findOne({
		where: {
			email: 'jay@example.com',
		},
	});
	if (!author) throw new Error('Author not found.');

	const posts: T_PostCreate[] = [
		{
			title: 'Hello, World!',
			content: 'This is my first post.',
			authorId: author.id,
		},
	];

	await Post.bulkCreate(posts);

	process.exit(0);
})();
