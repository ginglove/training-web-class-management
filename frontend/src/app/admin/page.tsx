'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { fetchApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, Settings, Activity } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = React.useState<any>(null);
  const [usersList, setUsersList] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    Promise.all([
      fetchApi('/api/admin/stats'),
      fetchApi('/api/admin/users')
    ])
    .then(([statsRes, usersRes]) => {
      setStats(statsRes);
      setUsersList(usersRes);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [user, router]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading admin data...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-12 h-12 neu-pressed rounded-full flex items-center justify-center text-primary">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
          <p className="text-slate-500 mt-1">System-wide settings and user management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold border-b pb-3 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-slate-400" />
              <span>System Activity</span>
            </h3>
            <div className="mt-4 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Total Bookings</span>
                <span className="font-bold text-foreground text-lg">{stats?.bookings?.total || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Pending Approvals</span>
                <span className="font-bold text-amber-500 text-lg">{stats?.bookings?.pending_approval || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Active Users</span>
                <span className="font-bold text-emerald-500 text-lg">{usersList.length}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Users className="w-5 h-5 text-slate-400" />
                <span>User Management</span>
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 font-semibold text-slate-600">User</th>
                    <th className="p-4 font-semibold text-slate-600">Role</th>
                    <th className="p-4 font-semibold text-slate-600">Department</th>
                    <th className="p-4 font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-foreground">{u.full_name}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{u.email}</p>
                      </td>
                      <td className="p-4 font-medium text-slate-600">{u.role}</td>
                      <td className="p-4 text-slate-600">{u.department || '-'}</td>
                      <td className="p-4">
                        <Badge variant={u.is_active ? 'success' : 'danger'}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
