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
  MapPin,
  ClipboardCheck,
  Search
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

interface TrendData {
  day: string;
  count: number;
}

interface StatsData {
  total?: number;
  processing?: number;
  approved?: number;
  rejected?: number;
  draft?: number;
  pending?: number;
  pending_review?: number;
  pending_approval?: number;
  avg_minutes?: number;
  avg_hours?: number;
  counts?: {
    pending?: number;
    in_review?: number;
    processed_today?: number;
    approved_today?: number;
    rejected_today?: number;
    pending_review?: number;
    pending_approval?: number;
    avg_minutes?: number;
    forwarded?: number;
    approved_24h?: number;
    mine?: number;
    awaiting_approval?: number;
  };
  trend?: TrendData[];
  ratio?: Record<string, number>;
  approved_today?: number;
  rejected_today?: number;
}

interface MetaData {
  total: number;
  page: number;
  limit: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = React.useState<StatsData | null>(null);
  const [recentBookings, setRecentBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [meta, setMeta] = React.useState<MetaData>({ total: 0, page: 1, limit: 20 });
  
  // SRS 7.4 — Filter State
  const [filters, setFilters] = React.useState({
    search: '',
    status: [] as string[],
    date_from: '',
    date_to: '',
    class_id: '',
    creator_id: '',
    sort: 'newest',
    page: 1,
  });

  const [rooms, setRooms] = React.useState<{id: string, name: string, location: string}[]>([]);

  const loadDashboard = React.useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        ...filters as unknown as Record<string, string>,
        status: filters.status.join(','),
        limit: '20',
      }).toString();

      const [statsData, bookingsData] = await Promise.all([
        fetchApi('/api/bookings/stats'),
        fetchApi(`/api/bookings?${query}`)
      ]);
      setStats(statsData);
      setRecentBookings(bookingsData.data || []);
      setMeta(bookingsData.meta || { total: 0, page: 1, limit: 20 });
    } catch (err: unknown) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    if (user) {
      loadDashboard();
      // Fetch rooms for dropdown if Admin/Reviewer/Approver
      if (['ADMIN', 'REVIEWER', 'APPROVER'].includes(user.role)) {
        fetchApi('/api/rooms').then(res => setRooms(res.data || []));
      }
    }
  }, [user, loadDashboard]);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (user) loadDashboard();
    }, 300);
    return () => clearTimeout(timer);
  }, [user, loadDashboard]);

  const getStatCards = () => {
    const role = user?.role;
    if (role === 'CREATOR') {
      return [
        { title: 'Bản nháp', value: stats?.draft || 0, icon: Clock, color: 'slate' },
        { title: 'Đang xử lý', value: stats?.processing || 0, icon: Activity, color: 'amber' },
        { title: 'Đã phê duyệt', value: stats?.approved || 0, icon: CheckCircle2, color: 'emerald' },
        { title: 'Bị từ chối', value: stats?.rejected || 0, icon: XCircle, color: 'rose' },
      ];
    }
    if (role === 'REVIEWER') {
      const counts = stats?.counts || {};
      return [
        { title: 'Chờ xem xét', value: counts.pending || 0, icon: Layers, color: 'amber' },
        { title: 'Đang xem xét', value: counts.in_review || 0, icon: Activity, color: 'indigo' },
        { title: 'Xử lý hôm nay', value: counts.processed_today || 0, icon: CheckCircle2, color: 'emerald' },
        { title: 'TB Thời gian', value: `${counts.avg_minutes || 0}m`, icon: Clock, color: 'primary' },
      ];
    }
    if (role === 'APPROVER') {
      return [
        { title: 'Chờ phê duyệt', value: stats?.pending || 0, icon: Layers, color: 'amber' },
        { title: 'Duyệt hôm nay', value: stats?.approved_today || 0, icon: CheckCircle2, color: 'emerald' },
        { title: 'Từ chối hôm nay', value: stats?.rejected_today || 0, icon: XCircle, color: 'rose' },
        { title: 'TB Thời gian', value: `${stats?.avg_hours || 0}h`, icon: Clock, color: 'indigo' },
      ];
    }
    // ADMIN
    return [
      { title: 'Tổng booking', value: stats?.total || 0, icon: Layers, color: 'indigo' },
      { title: 'Đang xử lý', value: stats?.processing || 0, icon: Clock, color: 'amber' },
      { title: 'Duyệt hôm nay', value: stats?.approved_today || 0, icon: CheckCircle2, color: 'emerald' },
      { title: 'Từ chối hôm nay', value: stats?.rejected_today || 0, icon: XCircle, color: 'rose' },
    ];
  };

  const statCards = getStatCards();

  const quickActions = React.useMemo(() => {
    const role = user?.role;
    if (role === 'CREATOR') return [
      { title: 'Tạo booking mới', href: '/bookings/new', icon: PlusCircle, primary: true, desc: 'Đăng ký phòng học cho khóa mới' },
      { title: 'Booking của tôi', href: '/my-bookings', icon: Layers, desc: 'Quản lý các yêu cầu hiện tại' },
      { title: 'Xem lịch phòng', href: '/rooms', icon: Calendar, desc: 'Tra cứu trạng thái phòng học' },
    ];
    if (role === 'REVIEWER') return [
      { title: 'Hàng đợi xem xét', href: '/reviewer/pending', icon: ClipboardCheck, primary: true, desc: 'Xử lý các yêu cầu đang chờ' },
      { title: 'Đang xem xét', href: '/reviewer/in-review', icon: Activity, desc: 'Tiếp tục Review các booking đã giữ' },
      { title: 'Lịch sử xử lý', href: '/reviewer/history', icon: History, desc: 'Xem lại các quyết định trước đây' },
    ];
    if (role === 'APPROVER') return [
      { title: 'Hàng đợi phê duyệt', href: '/approver/queue', icon: ClipboardCheck, primary: true, desc: 'Phê duyệt cuối cùng các yêu cầu' },
      { title: 'Lịch sử phê duyệt', href: '/approver/history', icon: History, desc: 'Tra cứu lịch sử quyết định' },
      { title: 'Lịch phòng', href: '/rooms', icon: Calendar, desc: 'Tra cứu trạng thái phòng học' },
    ];
    // ADMIN
    return [
      { title: 'Quản lý người dùng', href: '/admin/users', icon: Users, primary: true, desc: 'Phân quyền và quản lý tài khoản' },
      { title: 'Cấu hình hệ thống', href: '/admin/config', icon: Command, desc: 'Thiết lập các thông số vận hành' },
      { title: 'Quản lý phòng', href: '/admin/rooms', icon: Calendar, desc: 'Thêm/Xóa/Sửa thông tin phòng' },
    ];
  }, [user?.role]);

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
          {/* Chart Section (Admin & Creator) */}
          {(user?.role === 'ADMIN' || user?.role === 'CREATOR') && stats?.trend && (
            <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100">
                      <Activity className="w-4 h-4" />
                   </div>
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                     {user?.role === 'ADMIN' ? 'Hoạt động toàn hệ thống' : 'Hoạt động của tôi'}
                   </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 italic">Xu hướng 14 ngày gần nhất</span>
              </div>
              <div className="h-40 flex items-end justify-between gap-1.5 px-2">
                {(stats?.trend || []).slice(-14).map((t: TrendData, i: number) => {
                  const max = Math.max(...(stats?.trend || []).map((x: TrendData) => x.count), 1);
                  const height = (t.count / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                      <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[9px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20 shadow-xl border border-white/20">
                        {t.count} booking
                      </div>
                      <div 
                        className={cn(
                          "w-full transition-all duration-700 rounded-t-xl min-h-[4px]",
                          t.count > 0 ? "bg-primary shadow-[0_-4px_12px_rgba(13,148,136,0.2)]" : "bg-slate-100"
                        )} 
                        style={{ height: `${height}%` }}
                      />
                      <div className="text-[7px] font-black text-slate-300 uppercase mt-2 hidden sm:block">{safeFormat(t.day, 'dd/MM')}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SRS 7.4 — Filter Panel */}
          <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Full-text Search */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tìm kiếm</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Tiêu đề, khóa học..."
                    value={filters.search}
                    onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Khoảng thời gian</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => setFilters(f => ({ ...f, date_from: e.target.value, page: 1 }))}
                    className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:border-primary transition-all shadow-inner uppercase"
                  />
                  <div className="w-2 h-0.5 bg-slate-200 rounded-full" />
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => setFilters(f => ({ ...f, date_to: e.target.value, page: 1 }))}
                    className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:border-primary transition-all shadow-inner uppercase"
                  />
                </div>
              </div>

              {/* Room Dropdown (Searchable-ish native) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phòng học</label>
                <select
                  value={filters.class_id}
                  onChange={(e) => setFilters(f => ({ ...f, class_id: e.target.value, page: 1 }))}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all shadow-inner appearance-none cursor-pointer"
                >
                  <option value="">Tất cả phòng</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name} - {r.location}</option>)}
                </select>
              </div>
            </div>

            {/* Status Multi-select Chips */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Trạng thái</label>
              <div className="flex flex-wrap gap-2">
                {['DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'].map((s) => {
                  const isSelected = filters.status.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        const newStatus = isSelected 
                          ? filters.status.filter(x => x !== s)
                          : [...filters.status, s];
                        setFilters(f => ({ ...f, status: newStatus, page: 1 }));
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all shadow-sm",
                        isSelected 
                          ? "bg-slate-900 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(13,148,136,1)] scale-105"
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                      )}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sorting & Stats */}
            <div className="pt-6 border-t-2 border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sắp xếp:</span>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                  {[
                    { label: 'Mới nhất', val: 'newest' },
                    { label: 'Ngày học', val: 'date_asc' },
                    { label: 'Chờ lâu', val: 'waiting' }
                  ].map(s => (
                    <button
                      key={s.val}
                      onClick={() => setFilters(f => ({ ...f, sort: s.val }))}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        filters.sort === s.val ? "bg-white text-primary shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Trang {meta.page}/{Math.ceil(meta.total / meta.limit) || 1}</span>
                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                <span className="text-primary">{meta.total} kết quả</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center px-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                <History className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Danh sách Booking</h2>
            </div>
            <Link href={user?.role === 'ADMIN' ? '/admin/bookings' : (user?.role === 'CREATOR' ? '/my-bookings' : '/bookings')} className="group flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:translate-x-1 transition-all">
              <span>Nâng cao</span>
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
                         (b.status === 'FORWARDED' || b.status === 'PENDING_APPROVAL') ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-900/5' :
                         b.status === 'IN_REVIEW' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                         'bg-amber-50 text-amber-600 border-amber-100'
                       )}>
                         {(b.status === 'FORWARDED' || b.status === 'PENDING_APPROVAL') ? 'Đã duyệt sơ bộ' : b.status.replace('_', ' ')}
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

            {/* Pagination Controls */}
            {meta.total > meta.limit && (
              <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-center gap-4">
                <button
                  disabled={filters.page === 1}
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                  className="px-6 py-2.5 rounded-xl bg-white border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] disabled:opacity-30 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  Trước
                </button>
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, Math.ceil(meta.total / meta.limit)))].map((_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => setFilters(f => ({ ...f, page: p }))}
                        className={cn(
                          "w-10 h-10 rounded-xl text-[10px] font-black border-2 transition-all",
                          filters.page === p 
                            ? "bg-slate-900 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(13,148,136,1)]" 
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                        )}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={filters.page >= Math.ceil(meta.total / meta.limit)}
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  className="px-6 py-2.5 rounded-xl bg-white border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] disabled:opacity-30 disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  Sau
                </button>
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
                      <span className="font-black text-sm uppercase tracking-[0.2em]">{action.title}</span>
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
