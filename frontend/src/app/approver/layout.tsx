import * as React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ApproverLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
