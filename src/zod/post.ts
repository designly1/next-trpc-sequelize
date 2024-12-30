import { z } from 'zod';

import { authorSchema } from './author';

export const postConstraints = {
	title: {
		min: 3,
		max: 200,
	},
	slug: {
		min: 3,
		max: 255,
	},
	content: {
		min: 3,
		max: 10000,
	},
};

export const postSchema = z.object({
	id: z.string().uuid(),
	title: z.string().min(postConstraints.title.min).max(postConstraints.title.max),
	slug: z.string().min(postConstraints.slug.min).max(postConstraints.slug.max),
	content: z.string().min(postConstraints.content.min).max(postConstraints.content.max),
	authorId: z.string().uuid(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type T_Post = z.infer<typeof postSchema>;

export const postCreateSchema = postSchema.omit({
	id: true,
	slug: true,
	createdAt: true,
	updatedAt: true,
});

export type T_PostCreate = z.infer<typeof postCreateSchema>;

export const postExtendedSchema = postSchema.extend({
	author: authorSchema,
});

export type T_PostExtended = z.infer<typeof postExtendedSchema>;
