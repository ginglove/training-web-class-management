import * as React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function MyBookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
