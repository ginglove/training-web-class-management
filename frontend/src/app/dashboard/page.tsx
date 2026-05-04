'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { fetchApi } from '@/lib/api';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    // In a real app, we'd fetch actual stats here. For demo, we mock it if user is creator.
    // If admin/approver, we can fetch from /admin/stats
    if (user?.role === 'ADMIN' || user?.role === 'APPROVER') {
      fetchApi('/admin/stats').then(res => setStats(res.bookings)).catch(console.error);
    } else {
      setStats({
        pending_review: 2,
        approved: 5,
        rejected: 1,
        total: 8
      });
    }
  }, [user]);

  const statCards = [
    { title: 'Pending Review', value: stats?.pending_review || 0, icon: Clock, color: 'text-amber-500' },
    { title: 'Approved', value: stats?.approved || 0, icon: CheckCircle2, color: 'text-emerald-500' },
    { title: 'Rejected', value: stats?.rejected || 0, icon: XCircle, color: 'text-red-500' },
    { title: 'Total Bookings', value: stats?.total || 0, icon: AlertCircle, color: 'text-primary' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.full_name?.split(' ')[0] || 'User'}! 👋</h1>
        <p className="text-slate-500 mt-2">Here is what is happening with your training classes today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="flex items-center space-x-4">
            <div className={`w-14 h-14 neu-pressed rounded-full flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-3xl font-bold text-foreground mt-1">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Bookings Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold">Recent Bookings</h2>
          <Card className="p-0 overflow-hidden">
            <div className="p-6 text-center text-slate-500">
              {/* Placeholder for bookings table/list */}
              <p>Booking list will be displayed here.</p>
              <div className="mt-6 space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="neu-pressed rounded-xl p-4 flex justify-between items-center">
                    <div className="text-left">
                      <p className="font-semibold text-foreground">Software Testing Basics</p>
                      <p className="text-sm text-slate-500">Room 101 • Oct {10 + item}, 2023</p>
                    </div>
                    <Badge variant={item === 1 ? 'warning' : 'success'}>
                      {item === 1 ? 'Pending Review' : 'Approved'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold">Quick Actions</h2>
          <Card className="flex flex-col space-y-4">
            <button className="neu-btn py-3 px-4 font-semibold text-primary flex items-center justify-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>New Booking</span>
            </button>
            <button className="neu-btn py-3 px-4 font-semibold text-foreground flex items-center justify-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>View Schedule</span>
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
