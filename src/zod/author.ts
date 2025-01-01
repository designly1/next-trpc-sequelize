// src/zod/author.ts

import { z } from 'zod';
import { zOptional } from './helpers';

export const authorConstraints = {
	name: {
		min: 3,
		max: 50,
	},
	email: {
		min: 3,
		max: 50,
	},
	bio: {
		min: 0,
		max: 255,
	},
	website: {
		min: 0,
		max: 100,
	},
};

export const authorSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(authorConstraints.name.min).max(authorConstraints.name.max),
	email: z.string().email().min(authorConstraints.email.min).max(authorConstraints.email.max),
	bio: zOptional(z.string().min(authorConstraints.bio.min).max(authorConstraints.bio.max)),
	website: zOptional(z.string().url().min(authorConstraints.website.min).max(authorConstraints.website.max)),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export type T_Author = z.infer<typeof authorSchema>;

export const authorCreateSchema = authorSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export type T_AuthorCreate = z.infer<typeof authorCreateSchema>;
