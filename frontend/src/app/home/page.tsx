'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { fetchApi } from '@/lib/api';
import { safeFormat } from '@/lib/date-utils';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  PlusCircle, 
  History,
  Sparkles,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Users,
  LayoutGrid,
  Command,
  ChevronRight,
  Layers,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  course_name?: string;
  purpose?: string;
  class_name: string;
  date: string;
  slot_name: string;
  status: string;
}

interface Stats {
  draft?: number;
  processing?: number;
  approved?: number;
  total?: number;
  pending?: number;
  in_review?: number;
  processed_today?: number;
  approved_today?: number;
  rejected_today?: number;
  pending_review?: number;
  pending_approval?: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsData, bookingsData] = await Promise.all([
          fetchApi('/api/bookings/stats'),
          fetchApi('/api/bookings?limit=5')
        ]);
        setStats(statsData);
        setRecentBookings(bookingsData.data || []);
      } catch (err: unknown) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) loadDashboard();
  }, [user]);

  const getStatCards = () => {
    const role = user?.role;
    if (role === 'CREATOR') {
      return [
        { title: 'Bản nháp', value: stats?.draft || 0, icon: Clock, color: 'slate' },
        { title: 'Đang xử lý', value: stats?.processing || 0, icon: Clock, color: 'amber' },
        { title: 'Đã phê duyệt', value: stats?.approved || 0, icon: CheckCircle2, color: 'emerald' },
        { title: 'Tổng cộng', value: stats?.total || 0, icon: Activity, color: 'primary' },
      ];
    }
    if (role === 'REVIEWER') {
      return [
        { title: 'Chờ xem xét', value: stats?.pending || 0, icon: Layers, color: 'amber' },
        { title: 'Đang xem xét', value: stats?.in_review || 0, icon: Activity, color: 'blue' },
        { title: 'Xong hôm nay', value: stats?.processed_today || 0, icon: CheckCircle2, color: 'emerald' },
        { title: 'Tổng cộng', value: stats?.total || 0, icon: Layers, color: 'primary' },
      ];
    }
    if (role === 'APPROVER') {
      return [
        { title: 'Chờ phê duyệt', value: stats?.pending || 0, icon: Layers, color: 'amber' },
        { title: 'Duyệt hôm nay', value: stats?.approved_today || 0, icon: CheckCircle2, color: 'emerald' },
        { title: 'Từ chối hôm nay', value: stats?.rejected_today || 0, icon: XCircle, color: 'rose' },
        { title: 'Tổng cộng', value: stats?.total || 0, icon: ShieldCheck, color: 'primary' },
      ];
    }
    return [
      { title: 'Chờ xem xét', value: stats?.pending_review || 0, icon: Clock, color: 'amber' },
      { title: 'Chờ phê duyệt', value: stats?.pending_approval || 0, icon: Clock, color: 'orange' },
      { title: 'Đã phê duyệt', value: stats?.approved || 0, icon: CheckCircle2, color: 'emerald' },
      { title: 'Tổng cộng', value: stats?.total || 0, icon: Activity, color: 'primary' },
    ];
  };

  const statCards = getStatCards();

  const getQuickActions = () => {
    const role = user?.role;
    if (role === 'CREATOR') {
      return [
        { label: 'Tạo booking mới', href: '/bookings/new', icon: PlusCircle, primary: true },
        { label: 'Lịch phòng học', href: '/rooms', icon: Calendar },
        { label: 'Lịch sử của tôi', href: '/my-bookings', icon: Clock },
      ];
    }
    if (role === 'REVIEWER') {
      return [
        { label: 'Hàng đợi xem xét', href: '/reviewer/pending', icon: Layers, primary: true },
        { label: 'Lịch sử xử lý', href: '/reviewer/history', icon: History },
      ];
    }
    if (role === 'APPROVER') {
      return [
        { label: 'Hàng đợi phê duyệt', href: '/approver/queue', icon: Layers, primary: true },
        { label: 'Lịch sử phê duyệt', href: '/approver/history', icon: History },
      ];
    }
    return [
      { label: 'Quản lý User', href: '/admin/users', icon: Users, primary: true },
      { label: 'Cấu hình hệ thống', href: '/admin/config', icon: Command },
      { label: 'Xem Audit Log', href: '/admin/audit', icon: ShieldCheck },
    ];
  };

  const quickActions = getQuickActions();

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[1.2rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xl shadow-primary/5">
                <LayoutGrid className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                   <Sparkles className="w-3 h-3" />
                   <span>Tổng quan hệ thống</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-800">Xin chào, {user?.full_name?.split(' ')[0] || 'User'}! 👋</h1>
             </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">Chào mừng trở lại. Dưới đây là tóm tắt nhanh về các hoạt động đào tạo và trạng thái phê duyệt của bạn.</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md px-8 py-4 rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/30 flex items-center gap-4 group">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary border border-slate-100 group-hover:bg-primary group-hover:text-white transition-colors duration-500">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Hôm nay</p>
            <p className="text-xl font-black text-slate-800 tracking-tight mt-1">{safeFormat(new Date(), 'EEEE, dd/MM/yyyy')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-[2.5rem] animate-pulse border border-slate-100 shadow-sm" />)
        ) : statCards.map((stat, i) => (
          <div key={i} className="group relative bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-200/20 hover:shadow-primary/10 transition-all overflow-hidden">
            <div className={cn("absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 group-hover:opacity-[0.05] transition-all", `text-${stat.color}-500`)}>
              <stat.icon className="w-20 h-20" />
            </div>
            <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.title}</p>
              <div className={cn("text-5xl font-black tracking-tight", `text-${stat.color}-600`)}>{stat.value}</div>
              <div className={cn("w-12 h-1.5 rounded-full", `bg-${stat.color}-500/20`)} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex justify-between items-center px-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                <History className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Booking gần đây</h2>
            </div>
            <Link href={user?.role === 'ADMIN' ? '/admin/bookings' : (user?.role === 'CREATOR' ? '/my-bookings' : '/bookings')} className="group flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:translate-x-1 transition-all">
              <span>Xem tất cả</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden">
            {loading ? (
              <div className="p-12 space-y-6">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)}
              </div>
            ) : recentBookings.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {recentBookings.map((b) => (
                  <Link href={`/bookings/${b.id}`} key={b.id} className="group flex items-center justify-between p-8 hover:bg-slate-50/50 transition-all border-l-4 border-l-transparent hover:border-l-primary">
                    <div className="flex items-center gap-8">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500 shadow-sm">
                        <Calendar className="w-7 h-7" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="font-black text-slate-800 text-xl tracking-tight group-hover:text-primary transition-colors">{b.course_name || b.purpose}</p>
                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span>{b.class_name}</span>
                          <span className="text-slate-200 mx-1">•</span>
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>{safeFormat(b.date, 'dd/MM/yyyy')} • {b.slot_name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <Badge className={cn("px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border shadow-sm", 
                         b.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                         b.status === 'REJECTED' || b.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                         b.status === 'DRAFT' ? 'bg-slate-50 text-slate-500 border-slate-100' :
                         'bg-amber-50 text-amber-600 border-amber-100'
                       )}>
                         {b.status.replace('_', ' ')}
                       </Badge>
                       <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/10 transition-all">
                         <ChevronRight className="w-6 h-6" />
                       </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-24 text-center space-y-6">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto border border-slate-100 shadow-inner">
                  <Calendar className="w-10 h-10 text-slate-200" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Chưa có dữ liệu</h3>
                  <p className="text-slate-400 font-medium">Lịch sử booking gần đây của bạn sẽ xuất hiện tại đây.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-12">
          <div className="space-y-8">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase px-4">Thao tác nhanh</h2>
            <div className="grid grid-cols-1 gap-6">
              {quickActions.map((action, i) => (
                <Link key={i} href={action.href}>
                  <button className={cn(
                    "w-full p-6 rounded-[2.5rem] flex items-center justify-between transition-all active:scale-[0.97] group border shadow-2xl overflow-hidden relative",
                    action.primary ? "bg-primary border-primary shadow-primary/30 text-white hover:bg-primary-dark" : "bg-white border-slate-100 shadow-slate-200/20 text-slate-600 hover:border-primary/30"
                  )}>
                    <div className="flex items-center gap-6 relative z-10">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500", action.primary ? "bg-white/20 group-hover:rotate-12" : "bg-slate-50 group-hover:bg-primary/5 group-hover:rotate-12")}>
                        <action.icon className={cn("w-7 h-7", action.primary ? "text-white" : "text-primary")} />
                      </div>
                      <span className="font-black text-sm uppercase tracking-[0.2em]">{action.label}</span>
                    </div>
                    <ChevronRight className={cn("w-5 h-5 relative z-10 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all", action.primary ? "text-white" : "text-primary")} />
                    {action.primary && <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />}
                  </button>
                </Link>
              ))}
            </div>
          </div>
          <Card className="p-10 rounded-[3rem] bg-slate-900 border-none relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity"><ShieldCheck className="w-40 h-40 text-white" /></div>
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-3 text-primary"><Zap className="w-5 h-5 fill-primary" /><h3 className="font-black text-sm uppercase tracking-[0.2em]">Trung tâm trợ giúp</h3></div>
              <p className="text-xs text-slate-400 font-bold leading-relaxed">Hệ thống Class Booking v4.0 được thiết kế để tối ưu hóa quy trình quản lý phòng học. Nếu gặp khó khăn, vui lòng xem hướng dẫn chi tiết hoặc liên hệ bộ phận hỗ trợ IT.</p>
              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 group/btn"><span>Xem tài liệu hướng dẫn</span><ChevronRight className="w-4 h-4 opacity-30 group-hover/btn:translate-x-1 group-hover/btn:opacity-100 transition-all" /></button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
