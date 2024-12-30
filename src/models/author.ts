import { DataTypes, Model } from 'sequelize';
import sequelize from '@/db/sequelize';

import { authorConstraints } from '@/zod/author';
import type { T_Author, T_AuthorCreate } from '@/zod/author';

export default class Author extends Model<T_Author, T_AuthorCreate> implements T_Author {
	declare id: T_Author['id'];
	declare name: T_Author['name'];
	declare email: T_Author['email'];
	declare bio: T_Author['bio'];
	declare website: T_Author['website'];
	declare createdAt: T_Author['createdAt'];
	declare updatedAt: T_Author['updatedAt'];
}

Author.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [authorConstraints.name.min, authorConstraints.name.max],
			},
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				isEmail: true,
				len: [authorConstraints.email.min, authorConstraints.email.max],
			},
		},
		bio: {
			type: DataTypes.STRING,
			allowNull: true,
			validate: {
				len: [authorConstraints.bio.min, authorConstraints.bio.max],
			},
		},
		website: {
			type: DataTypes.STRING,
			allowNull: true,
			validate: {
				isUrl: true,
				len: [authorConstraints.website.min, authorConstraints.website.max],
			},
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
		modelName: 'Author',
		tableName: 'authors',
		timestamps: true,
		underscored: true,
		indexes: [
			{
				unique: true,
				fields: ['email'],
			},
		],
	},
);
