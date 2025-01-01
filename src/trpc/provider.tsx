// src/trpc/provider.tsx

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

import type { AppRouter } from './routers';

export const trpc = createTRPCReact<AppRouter>();

const trpcClient = trpc.createClient({
	links: [
		httpBatchLink({
			url: '/api/trpc',
		}),
	],
	transformer: superjson,
});

export default function TrpcProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<trpc.Provider client={trpcClient} queryClient={queryClient}>
				{children}
			</trpc.Provider>
		</QueryClientProvider>
	);
}
