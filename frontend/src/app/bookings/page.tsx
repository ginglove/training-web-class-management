'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { fetchApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, Filter } from 'lucide-react';

export default function BookingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/api/bookings');
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'PENDING_REVIEW': return 'warning';
      case 'IN_REVIEW': return 'info';
      case 'PENDING_APPROVAL': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'danger';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-slate-500 mt-1">Manage class reservations and approvals</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </Button>
          {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && (
            <Button className="space-x-2" onClick={() => router.push('/bookings/new')}>
              <Plus className="w-4 h-4" />
              <span>New Booking</span>
            </Button>
          )}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-600">ID</th>
                <th className="p-4 font-semibold text-slate-600">Purpose / Course</th>
                <th className="p-4 font-semibold text-slate-600">Room</th>
                <th className="p-4 font-semibold text-slate-600">Date & Slot</th>
                <th className="p-4 font-semibold text-slate-600">Status</th>
                <th className="p-4 font-semibold text-slate-600">Requester</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr 
                    key={b.id} 
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/bookings/${b.id}`)}
                  >
                    <td className="p-4 font-mono text-xs text-slate-500">
                      #{b.id.substring(0, 8)}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{b.course_name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{b.purpose}</p>
                    </td>
                    <td className="p-4 font-medium">{b.class_name}</td>
                    <td className="p-4 text-slate-600">
                      {formatDate(b.date)}<br/>
                      <span className="text-xs">{b.slot_name}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusBadgeVariant(b.status)}>
                        {b.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-600">
                      {b.creator_name}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
