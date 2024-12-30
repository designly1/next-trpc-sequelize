import { z } from 'zod';
import { trpcServer as t } from '.';
import { handlerGetAuthor } from '../handlers';

export const authorRouter = t.router({
	get: t.procedure.input(z.string()).query(handlerGetAuthor),
});
