// src/trpc/routers/post.ts

import { z } from 'zod';
import getTrpc from '..';
import { handlerGetPost } from '../handlers';

export const t = getTrpc();

export const postRouter = t.router({
	getBySlug: t.procedure.input(z.string()).query(handlerGetPost),
});
