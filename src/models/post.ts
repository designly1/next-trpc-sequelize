import { DataTypes, Model } from 'sequelize';
import sequelize from '@/db/sequelize';
import { kebabCase } from 'lodash-es';

import { postConstraints } from '@/zod/post';
import type { T_Post, T_PostCreate, T_PostExtended } from '@/zod/post';
import type Author from './author';

export default class Post extends Model<T_Post, T_PostCreate> implements T_Post {
	// Properties
	declare id: T_Post['id'];
	declare title: T_Post['title'];
	declare slug: T_Post['slug'];
	declare content: T_Post['content'];
	declare authorId: T_Post['authorId'];
	declare createdAt: T_Post['createdAt'];
	declare updatedAt: T_Post['updatedAt'];

	// Associations
	declare author: Author;

	// Static Methods
	static async findBySlug(slug: string): Promise<T_PostExtended | null> {
		const post = await Post.findOne({
			where: {
				slug,
			},
			include: [
				{
					association: 'author',
				},
			],
		});

		if (!post) return null;

		return post.toJSON() as T_PostExtended;
	}
}

Post.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		title: {
			type: DataTypes.STRING(postConstraints.title.max),
			allowNull: false,
			validate: {
				len: [postConstraints.title.min, postConstraints.title.max],
			},
		},
		slug: {
			type: DataTypes.STRING(postConstraints.slug.max),
			allowNull: false,
			validate: {
				len: [postConstraints.slug.min, postConstraints.slug.max],
			},
		},
		content: {
			type: DataTypes.STRING(postConstraints.content.max),
			allowNull: false,
			validate: {
				len: [postConstraints.content.min, postConstraints.content.max],
			},
		},
		authorId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		modelName: 'Post',
		tableName: 'posts',
		timestamps: true,
		paranoid: false,
		underscored: true,
		indexes: [
			{
				unique: true,
				fields: ['slug'],
			},
		],
		hooks: {
			beforeValidate: (post: Post) => {
				if (!post.slug) {
					post.slug = kebabCase(post.title);
				}
			},
			beforeBulkCreate: (posts: Post[]) => {
				posts.forEach(post => {
					if (!post.slug) {
						post.slug = kebabCase(post.title);
					}
				});
			},
		},
	},
);
