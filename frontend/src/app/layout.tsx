import * as React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from '@/components/providers/NotificationProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Class Booking System',
  description: 'Manage software testing training classes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <NotificationProvider>
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'neu-flat !rounded-2xl !bg-white !text-slate-900 !font-medium !shadow-xl',
              duration: 4000,
            }}
          />
        </NotificationProvider>
      </body>
    </html>
  );
}
