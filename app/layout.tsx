import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "./components/currency/currency-context";
import { AppShell } from "./components/layout/app-shell";
import { MobileTopBar } from "./components/layout/mobile-top-bar";
import { Sidebar } from "./components/layout/sidebar";
import { SidebarBackdrop } from "./components/layout/sidebar-backdrop";
import { SidebarProvider } from "./components/layout/sidebar-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ImpactSphere | Project Discovery",
  description:
    "Explore high-impact initiatives awaiting your partnership. Connect funding with meaningful change.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-surface text-on-surface">
        <CurrencyProvider>
          <SidebarProvider>
            <Sidebar />
            <SidebarBackdrop />
            <MobileTopBar />
            <AppShell>{children}</AppShell>
          </SidebarProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
