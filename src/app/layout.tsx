import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ThemeToggle } from "../components/ThemeToggle";

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
      <body className={`${roboto.className} min-h-full flex flex-col bg-white dark:bg-gray-950`}>
        <header className="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <span className="text-xl font-bold text-gray-900 dark:text-white">CareerHub</span>
            <ThemeToggle />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
