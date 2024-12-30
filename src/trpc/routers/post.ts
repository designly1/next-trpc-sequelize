import { z } from 'zod';
import { trpcServer as t } from '.';
import { handlerGetPost } from '../handlers';

export const postRouter = t.router({
	getBySlug: t.procedure.input(z.string()).query(handlerGetPost),
});
