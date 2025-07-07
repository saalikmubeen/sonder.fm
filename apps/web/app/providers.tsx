'use client';

import ThemeProviderClient from '@/components/ThemeProviderClient';
import { AuthProvider } from '@/lib/auth-context';
import { JammingProvider } from '@/components/JammingProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProviderClient>
        <AuthProvider>
          {/* <JammingProvider> */}
            {children}
          {/* </JammingProvider> */}
        </AuthProvider>
      </ThemeProviderClient>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
