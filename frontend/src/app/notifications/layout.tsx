import * as React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
