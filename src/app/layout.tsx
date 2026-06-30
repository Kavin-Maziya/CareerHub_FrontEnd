import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "../components/ThemeToggle";
import Providers from "./providers";
import Link from "next/link";
import { auth, signOut } from "@/src/auth";
import { Toaster } from "sonner";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareerHub App",
  description: "Browse and Apply for Job Listings",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user;
  const isEmployer = user?.role === "employer";
  const isCandidate = user?.role === "candidate";

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${roboto.className} min-h-full flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50`}>
        <header className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link
              href="/"
              className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              CareerHub
            </Link>

            <div className="flex items-center space-x-6">
              <nav className="flex items-center space-x-4 text-sm font-medium">
                {/* Signed out */}
                {!user && (
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                  >
                    Sign In
                  </Link>
                )}

                {/* Candidate nav */}
                {isCandidate && (
                  <>
                    <Link
                      href="/jobs"
                      className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                    >
                      Jobs
                    </Link>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {user.name}
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      candidate
                    </span>
                    <form action={handleSignOut}>
                      <button
                        type="submit"
                        className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      >
                        Sign Out
                      </button>
                    </form>
                  </>
                )}

                {/* Employer nav */}
                {isEmployer && (
                  <>
                    <Link
                      href="/dashboard/listings"
                      className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {user.name}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      employer
                    </span>
                    <form action={handleSignOut}>
                      <button
                        type="submit"
                        className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      >
                        Sign Out
                      </button>
                    </form>
                  </>
                )}
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}