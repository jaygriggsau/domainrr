import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Domainrr — Find your next domain",
  description:
    "Search, register, and manage domains. Build your next dream, one domain at a time.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteHeader
          user={session ? { email: session.email, name: session.name } : null}
        />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-border py-6 text-center text-sm text-muted">
          © {new Date().getFullYear()} Domainrr · Powered by name.com
        </footer>
      </body>
    </html>
  );
}
