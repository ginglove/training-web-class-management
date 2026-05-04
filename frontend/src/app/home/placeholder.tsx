'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';

export default function PlaceholderPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Under Construction</h1>
      <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 neu-pressed rounded-full flex items-center justify-center text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
        </div>
        <div>
          <h2 className="text-xl font-bold">Page Coming Soon</h2>
          <p className="text-slate-500">We're working hard to bring you this feature according to SRS v3.0 requirements.</p>
        </div>
      </Card>
    </div>
  );
}
