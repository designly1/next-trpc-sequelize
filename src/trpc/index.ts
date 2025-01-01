// src/trpc/index.ts

import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

export default function getTrpc() {
	return initTRPC.create({
		transformer: superjson,
	});
}
