import "../styles/tailwind.css";
import ThemeProviderClient from "@/components/ThemeProviderClient";
import { AuthProvider } from "@/lib/auth-context";

export const metadata = {
  title: "Sonder.fm",
  description: "Show the world what your heart sounds like."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
        <ThemeProviderClient>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProviderClient>
      </body>
    </html>
  );
}