// src/app/providers.tsx

'use client';

import React from 'react';
import TrpcProvider from '@/trpc/provider';

export default function Providers({ children }: { children: React.ReactNode }) {
	return <TrpcProvider>{children}</TrpcProvider>;
}
