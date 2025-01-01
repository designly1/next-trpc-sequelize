// src/trpc/handlers/author/get.ts

import { Author } from '@/models';

export async function handlerGetAuthor({ input }: { input: string }) {
	const author = await Author.findByPk(input);

	if (!author) {
		return null;
	}

	return author.toJSON();
}
