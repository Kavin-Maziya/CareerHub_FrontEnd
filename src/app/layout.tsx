import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "../components/ThemeToggle";
import Providers from "./providers"; // Import provider wrapper
import Link from "next/link";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareerHub App",
  description: "Browse and Apply for Job Listings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className={`${roboto.className} min-h-full flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50`}>
        <header className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            {/* Brand converted from plain span to a Link */}
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              CareerHub
            </Link>

            {/* Semantic Navigation Element adjacent to ThemeToggle */}
            <div className="flex items-center space-x-6">
              <nav className="flex items-center space-x-4 text-sm font-medium">
                <Link 
                  href="/jobs" 
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  Jobs
                </Link>
                <Link 
                  href="/dashboard/listings" 
                  className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  Dashboard
                </Link>
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

