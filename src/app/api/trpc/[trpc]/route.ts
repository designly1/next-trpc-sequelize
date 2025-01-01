// src/app/api/trpc/[trpc]/route.ts

import { NextRequest } from 'next/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { trpcRouter } from '@/trpc/routers';

const t = (req: NextRequest) => {
	return fetchRequestHandler({
		endpoint: '/api/trpc',
		req,
		router: trpcRouter,
		createContext: () => ({}),
	});
};

export { t as GET, t as POST, t as PUT, t as DELETE, t as PATCH };
