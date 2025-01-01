'use client';

import React from 'react';

import { trpc } from '@/trpc/provider';

export default function HomeView() {
	const { data } = trpc.post.getBySlug.useQuery('hello-world');

	return (
		<div>
			<h1>Welcome to your Next.js app!</h1>
			<pre>{JSON.stringify(data, null, 4)}</pre>
		</div>
	);
}
