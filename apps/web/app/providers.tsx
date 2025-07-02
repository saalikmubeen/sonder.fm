'use client';

import ThemeProviderClient from '@/components/ThemeProviderClient';
import { AuthProvider } from '@/lib/auth-context';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProviderClient>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProviderClient>
  );
}
