// src/trpc/routers/index.ts

import getTrpc from '..';

// Routers
import { authorRouter } from './author';
import { postRouter } from './post';

const t = getTrpc();

export const trpcRouter = t.router({
	author: authorRouter,
	post: postRouter,
});

export type AppRouter = typeof trpcRouter;
