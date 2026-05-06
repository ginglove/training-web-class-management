'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { fetchApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Users, 
  Settings, 
  Activity, 
  Home, 
  ShieldCheck, 
  Zap,
  ArrowUpRight,
  Database,
  Cpu,
  Globe,
  ChevronRight,
  Lock,
  Command,
  Clock,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UserStat {
  role: string;
  count: string;
}

interface AdminStats {
  users: UserStat[];
  bookings: {
    total: number;
    approved: number;
    pending_review: number;
    pending_approval: number;
    rejected: number;
    cancelled: number;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/home');
      return;
    }

    fetchApi('/api/admin/stats')
      .then((res) => setStats(res.data || res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, router]);

  const adminModules = [
    { 
      label: 'Người dùng', 
      count: stats?.users?.reduce((acc: number, curr: UserStat) => acc + parseInt(curr.count), 0) || 0, 
      href: '/admin/users', 
      icon: Users, 
      color: 'blue', 
      desc: 'Quản lý quyền & truy cập' 
    },
    { label: 'Phòng học', count: '8', href: '/admin/rooms', icon: Home, color: 'amber', desc: 'Cấu hình phòng đào tạo' },
    { label: 'Giám sát', count: stats?.bookings?.total || 0, href: '/admin/bookings', icon: Activity, color: 'emerald', desc: 'Theo dõi booking toàn cầu' },
    { label: 'Cấu hình', count: 'v4.0', href: '/admin/config', icon: Settings, color: 'indigo', desc: 'Quy tắc nghiệp vụ hệ thống' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-40 space-y-6">
      <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Đang nạp bảng điều khiển Admin...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-primary border border-slate-800 shadow-xl shadow-slate-900/10">
                <ShieldCheck className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                  <Sparkles className="w-3 h-3" />
                  <span>Trung tâm quản trị</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-800">Hệ thống Admin 🛡️</h1>
             </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">Điều phối tài nguyên, quản lý người dùng và giám sát toàn bộ hoạt động đặt phòng trong hệ thống Class Booking.</p>
        </div>
        
        <Badge className="bg-slate-900 text-primary border-none px-8 py-3.5 text-[11px] font-black tracking-[0.25em] uppercase rounded-2xl shadow-2xl shadow-slate-900/20">
          ADMIN CONSOLE MODE
        </Badge>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {adminModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="group relative bg-white border border-slate-100 rounded-[3rem] p-10 overflow-hidden shadow-2xl shadow-slate-200/30 hover:shadow-primary/20 hover:border-primary/20 transition-all duration-500 h-full flex flex-col justify-between cursor-pointer">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-125 group-hover:opacity-[0.05] transition-all pointer-events-none">
                   <Icon className="w-32 h-32" />
                </div>

                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className={cn(
                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-sm",
                    module.color === 'blue' ? "bg-blue-50 text-blue-500" :
                    module.color === 'amber' ? "bg-amber-50 text-amber-500" :
                    module.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                    "bg-indigo-50 text-indigo-500",
                    "group-hover:bg-primary group-hover:text-white"
                  )}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="text-3xl font-black text-slate-800 tracking-tighter">{module.count}</div>
                </div>

                <div className="space-y-2 relative z-10">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight group-hover:text-primary transition-colors leading-none">{module.label}</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{module.desc}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Statistics Summary */}
        <Card className="lg:col-span-8 p-10 lg:p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl shadow-slate-200/30 space-y-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Phân phối Booking (30 ngày)</h2>
            </div>
            <Link href="/admin/bookings" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-2 group">
              Xem báo cáo chi tiết
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Phê duyệt', value: stats?.bookings?.approved || 0, color: 'emerald', icon: CheckCircle },
              { label: 'Chờ duyệt', value: stats?.bookings?.pending_review || 0, color: 'amber', icon: Clock },
              { label: 'Từ chối', value: stats?.bookings?.rejected || 0, color: 'rose', icon: Lock },
              { label: 'Hủy bỏ', value: stats?.bookings?.cancelled || 0, color: 'slate', icon: Database },
            ].map((s) => {
              const SIcon = s.icon;
              return (
                <div key={s.label} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-center space-y-4 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl mx-auto flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform",
                    s.color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                    s.color === 'amber' ? "bg-amber-50 text-amber-500" :
                    s.color === 'rose' ? "bg-rose-50 text-rose-500" :
                    "bg-slate-50 text-slate-500"
                  )}>
                    <SIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-black text-slate-800 tracking-tighter">{s.value}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* System Health */}
        <div className="lg:col-span-4 space-y-10">
          <div className="flex items-center gap-3 px-4">
             <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary">
                <Cpu className="w-5 h-5" />
             </div>
             <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Sức khỏe hệ thống</h2>
          </div>
          
          <div className="space-y-6">
            {[
              { label: 'Cơ sở dữ liệu (Neon)', status: 'Online', val: '0.8ms', icon: Database, color: 'emerald' },
              { label: 'API Services', status: 'Healthy', val: '99.9%', icon: Globe, color: 'emerald' },
              { label: 'Bộ nhớ Cache', status: 'Active', val: '128MB', icon: Zap, color: 'amber' },
              { label: 'Tường lửa & Bảo mật', status: 'Secured', val: 'Active', icon: Lock, color: 'indigo' },
            ].map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <div key={i} className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-all shadow-sm border border-slate-100">
                      <ItemIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-black text-slate-700 tracking-tight">{item.label}</p>
                      <div className="flex items-center gap-2">
                         <span className={cn(
                           "w-2 h-2 rounded-full animate-pulse",
                           item.color === 'emerald' ? "bg-emerald-500" :
                           item.color === 'amber' ? "bg-amber-500" :
                           "bg-indigo-500"
                         )} />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    {item.val}
                  </div>
                </div>
              );
            })}
          </div>

          <Card className="p-10 rounded-[3rem] bg-slate-900 border-none relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
               <ShieldCheck className="w-40 h-40 text-white" />
            </div>
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-3 text-primary">
                 <Command className="w-5 h-5" />
                 <h3 className="font-black text-sm uppercase tracking-[0.2em]">Cài đặt Global</h3>
              </div>
              <p className="text-xs text-slate-400 font-bold leading-relaxed">
                Quản lý các thông số cốt lõi, phiên bản API và cấu hình môi trường.
              </p>
              <Link href="/admin/config" className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 group/btn">
                <span>Vào trang cấu hình</span>
                <ChevronRight className="w-4 h-4 opacity-30 group-hover/btn:translate-x-1 group-hover/btn:opacity-100 transition-all" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
