import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { NotificationProvider } from '@/components/providers/NotificationProvider';

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
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
