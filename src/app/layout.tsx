import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ClientRootLayout } from "./ClientRootLayout";
import { WorkspaceProvider } from "@/lib/workspaceContext";
import { ToastProvider } from "@/app/components/ToastProvider";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Square Flooring Pro Suite",
  description: "Vertical operating system for flooring businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body className={`${inter.variable} ${robotoMono.variable} antialiased app-body`}>
        <ToastProvider>
          <ErrorBoundary>
            <WorkspaceProvider>
              <ClientRootLayout>{children}</ClientRootLayout>
            </WorkspaceProvider>
          </ErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  );
}
