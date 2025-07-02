import '../styles/tailwind.css';
import Providers from './providers';

export const metadata = {
  title: 'Sonder.fm',
  description: 'Show the world what your heart sounds like.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
