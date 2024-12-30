import { initTRPC } from '@trpc/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';

import type { NextRequest } from 'next/server';

// Routers
import { authorRouter } from './author';
import { postRouter } from './post';

export const trpcServer = initTRPC.create({
	transformer: superjson,
});

export const trpcRouter = trpcServer.router({
	author: authorRouter,
	post: postRouter,
});

export const trpcHandler = (req: NextRequest) => {
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req,
		router: trpcRouter,
		createContext: () => ({}),
	});
};

export type AppRouter = typeof trpcRouter;
