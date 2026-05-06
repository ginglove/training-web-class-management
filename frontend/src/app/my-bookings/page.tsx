'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { 
  Calendar, Clock, MapPin, Search, Filter, 
  XCircle, AlertCircle, 
  LayoutGrid, List, Copy, ChevronRight, ArrowRight,
  Plus, History, ShieldCheck, Zap,
  Activity, Layers, Sparkles, RefreshCcw,
  ArrowUpRight, FileText, CheckCircle,
  Trash2, Info, Users, CheckCircle2
} from 'lucide-react';
import { getErrorMessage } from '@/lib/errorTranslations';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Booking {
  id: string;
  course_name?: string;
  purpose?: string;
  class_name?: string;
  class_location?: string;
  date: string;
  slot_name: string;
  attendee_count: number;
  reason?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  processed_at?: string;
  reviewer_note?: string;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'card' | 'table'>('card');
  const [activeTab, setActiveTab] = React.useState('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  const loadMyBookings = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/bookings/my-bookings`);
      setBookings(res.data || []);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Lỗi khi tải danh sách booking'));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      loadMyBookings();
    }
  }, [user, loadMyBookings]);

  const kpis = {
    total: bookings.length,
    pending: bookings.filter(b => ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL'].includes(b.status)).length,
    approved: bookings.filter(b => b.status === 'APPROVED').length,
    rejected: bookings.filter(b => b.status === 'REJECTED' || b.status === 'CANCELLED').length,
  };

  const now = new Date();
  
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = (b.course_name || b.purpose || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (b.class_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UPCOMING') return new Date(b.date) >= now;
    if (activeTab === 'PAST') return new Date(b.date) < now;
    if (activeTab === 'PENDING') return ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL'].includes(b.status);
    return b.status === activeTab;
  });

  const getStatusConfig = (booking: Booking) => {
    if (booking.status === 'APPROVED' && new Date(booking.date) < now) {
      return { color: 'bg-slate-100 text-slate-800 border-slate-200', icon: CheckCircle2, label: 'Đã hoàn thành' };
    }
    
    switch (booking.status) {
      case 'DRAFT': return { color: 'bg-slate-50 text-slate-500 border-slate-200', icon: FileText, label: 'Bản nháp' };
      case 'PENDING_REVIEW': return { color: 'bg-sky-50 text-sky-600 border-sky-100', icon: Clock, label: 'Chờ Review' };
      case 'IN_REVIEW': return { color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Activity, label: 'Đang Review' };
      case 'PENDING_APPROVAL': return { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: ShieldCheck, label: 'Chờ Duyệt' };
      case 'APPROVED': return { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle, label: 'Đã phê duyệt' };
      case 'REJECTED': return { color: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircle, label: 'Bị từ chối' };
      case 'CANCELLED': return { color: 'bg-slate-50 text-slate-400 border-slate-100', icon: AlertCircle, label: 'Đã hủy' };
      default: return { color: 'bg-slate-100 text-slate-800', icon: Clock, label: booking.status };
    }
  };

  const handleAction = async (booking: Booking, action: string) => {
    if (action === 'CANCEL') {
      if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu đặt phòng này?')) return;
      try {
        await fetchApi(`/api/bookings/${booking.id}/cancel`, { method: 'PATCH' });
        toast.success('Đã hủy booking thành công');
        loadMyBookings();
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, 'Hủy thất bại'));
      }
    } else if (action === 'CLONE') {
      router.push(`/bookings/new?cloneFrom=${booking.id}`);
    } else if (action === 'VIEW') {
      router.push(`/bookings/${booking.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 px-4 sm:px-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 pt-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 border-2 border-indigo-100 shadow-xl shadow-indigo-500/5 rotate-3 hover:rotate-0 transition-transform">
              <History className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">
                <Sparkles className="w-3 h-3" />
                <span>Hoạt động cá nhân</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-none">Booking của tôi 📅</h1>
            </div>
          </div>
          <p className="text-slate-500 font-bold max-w-xl leading-relaxed text-lg italic">&quot;Duy trì tiến độ đào tạo của bạn với hệ thống quản lý lịch trình thông minh.&quot;</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto p-4 bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/40">
          <div className="flex p-1.5 bg-slate-50 rounded-2xl border border-slate-200/50">
            <button 
              onClick={() => setViewMode('card')}
              className={cn(
                "p-3 rounded-xl transition-all duration-300",
                viewMode === 'card' ? "bg-white shadow-lg text-primary scale-110" : "text-slate-400 hover:text-slate-600"
              )}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={cn(
                "p-3 rounded-xl transition-all duration-300",
                viewMode === 'table' ? "bg-white shadow-lg text-primary scale-110" : "text-slate-400 hover:text-slate-600"
              )}
              title="Xem dạng bảng"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          
          <div className="h-10 w-px bg-slate-100 hidden sm:block" />
          
          <Button 
            onClick={() => router.push('/bookings/new')}
            className="flex-1 lg:flex-none h-14 px-10 rounded-2xl bg-slate-900 text-white shadow-2xl shadow-slate-900/20 font-black text-[11px] uppercase tracking-[0.25em] flex items-center gap-4 hover:bg-black hover:scale-[1.05] active:scale-95 transition-all group"
          >
            <Plus className="w-5 h-5 text-primary group-hover:rotate-90 transition-transform" />
            <span>Tạo yêu cầu mới</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Tổng yêu cầu', val: kpis.total, color: 'indigo', icon: Layers, desc: 'Tất cả các booking' },
          { label: 'Đang xử lý', val: kpis.pending, color: 'amber', icon: Clock, desc: 'Đang chờ thẩm định/phê duyệt' },
          { label: 'Đã phê duyệt', val: kpis.approved, color: 'emerald', icon: ShieldCheck, desc: 'Lịch đã được cấp phòng' },
          { label: 'Không thành công', val: kpis.rejected, color: 'rose', icon: XCircle, desc: 'Đã bị từ chối hoặc hủy' },
        ].map((kpi, i) => {
          const cfg = {
            indigo: { text: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100', accent: 'bg-indigo-500/20' },
            amber: { text: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', accent: 'bg-amber-500/20' },
            emerald: { text: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', accent: 'bg-emerald-500/20' },
            rose: { text: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', accent: 'bg-rose-500/20' },
          }[kpi.color] || { text: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100', accent: 'bg-slate-500/20' };

          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/30 hover:border-indigo-100 hover:shadow-indigo-500/5 transition-all overflow-hidden"
            >
              <div className={cn("absolute -right-4 -bottom-4 p-8 opacity-[0.05] group-hover:scale-125 group-hover:opacity-[0.1] transition-all duration-700 rotate-12 group-hover:rotate-0", cfg.text)}>
                <kpi.icon className="w-32 h-32" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border-2", cfg.bg, cfg.border, cfg.text)}>
                    <kpi.icon className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{kpi.label}</p>
                </div>
                <div className="space-y-1">
                  <div className="text-5xl font-black tracking-tighter leading-none text-slate-800">{kpi.val}</div>
                  <p className="text-[10px] font-bold text-slate-400 italic">{kpi.desc}</p>
                </div>
                <div className={cn("w-12 h-2 rounded-full transition-all group-hover:w-full duration-500", cfg.accent)} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Control Bar & Advanced Filters */}
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-8">
          <div className="flex gap-2 p-2 bg-white rounded-[2.2rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-x-auto no-scrollbar scroll-smooth">
            {['ALL', 'UPCOMING', 'PAST', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.5rem] whitespace-nowrap transition-all duration-300",
                  activeTab === tab 
                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20 scale-[1.05]' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'
                )}
              >
                {tab === 'ALL' ? 'Tất cả' : 
                 tab === 'UPCOMING' ? 'Sắp tới' : 
                 tab === 'PAST' ? 'Đã qua' : 
                 tab === 'PENDING' ? 'Đang xử lý' :
                 getStatusConfig({ status: tab } as Booking).label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group flex-1 xl:w-80">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="Tìm nhanh hồ sơ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-6 h-16 bg-white border-2 border-slate-100 rounded-[1.8rem] font-black text-sm text-slate-700 focus:bg-white focus:border-indigo-500/20 transition-all shadow-xl shadow-slate-200/20 outline-none placeholder:text-slate-300 placeholder:italic placeholder:font-bold"
              />
            </div>
            
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={cn(
                "w-16 h-16 rounded-[1.5rem] border flex items-center justify-center transition-all shadow-xl shadow-slate-200/20 group",
                showAdvancedFilters 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-600/20" 
                  : "bg-white border-slate-100 text-slate-300 hover:text-indigo-500 hover:border-indigo-100 hover:bg-indigo-50"
              )}
              title="Bộ lọc nâng cao"
            >
              <Filter className={cn("w-6 h-6 transition-transform", showAdvancedFilters ? "scale-110" : "group-hover:scale-110")} />
            </button>

            <button 
              onClick={loadMyBookings}
              className="w-16 h-16 bg-white rounded-[1.5rem] border border-slate-100 flex items-center justify-center text-slate-300 hover:text-indigo-500 hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-xl shadow-slate-200/20 group"
              title="Làm mới dữ liệu"
            >
              <RefreshCcw className={cn("w-6 h-6 group-hover:rotate-180 transition-transform duration-700", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* 15.2.5 Bộ lọc nâng cao (Expandable Section) */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="p-10 bg-white rounded-[3rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Cơ sở đào tạo</label>
                   <select className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer">
                      <option>Tất cả cơ sở</option>
                      <option>Cơ sở Quận 1</option>
                      <option>Cơ sở Tân Bình</option>
                   </select>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Loại phòng</label>
                   <select className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer">
                      <option>Tất cả loại</option>
                      <option>Phòng Lab</option>
                      <option>Phòng Theory</option>
                      <option>Hội trường</option>
                   </select>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Thời gian</label>
                   <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="date" className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 font-bold text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer" />
                   </div>
                </div>
                <div className="flex items-end">
                   <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                      Áp dụng lọc
                   </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-48 space-y-8"
          >
            <div className="relative">
               <div className="w-24 h-24 border-[6px] border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-indigo-200 animate-pulse" />
               </div>
            </div>
            <div className="space-y-2 text-center">
               <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Synchronizing</p>
               <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">Vui lòng đợi trong giây lát...</p>
            </div>
          </motion.div>
        ) : filteredBookings.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-48 text-center flex flex-col items-center justify-center space-y-10 bg-white rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/20 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none">
               <Calendar className="w-full h-full p-24" />
            </div>
            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200 border border-slate-100 shadow-inner relative z-10">
              <Calendar className="w-14 h-14" />
            </div>
            <div className="space-y-4 relative z-10">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Kho lưu trữ trống 📭</h3>
              <p className="text-slate-400 font-bold max-w-sm mx-auto text-lg leading-relaxed">Không tìm thấy hồ sơ nào trong mục này.</p>
            </div>
            <Button 
              onClick={() => router.push('/bookings/new')} 
              className="relative z-10 rounded-[1.5rem] px-14 py-7 bg-indigo-600 text-white font-black text-[12px] uppercase tracking-[0.25em] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all flex items-center gap-4 group"
            >
              <span>Tạo yêu cầu ngay</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Button>
          </motion.div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredBookings.map((booking, i) => {
              const status = getStatusConfig(booking);
              const StatusIcon = status.icon;
              
              return (
                <motion.div 
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative bg-white rounded-[3.5rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/30 hover:shadow-indigo-500/10 hover:border-indigo-500/20 transition-all duration-500 overflow-hidden flex flex-col"
                >
                  <div className="p-10 space-y-8 flex-1">
                    <div className="flex justify-between items-start">
                      <Badge className={cn("px-5 py-2.5 rounded-[1rem] border shadow-sm text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3", status.color)}>
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </Badge>
                      <span className="text-[11px] font-black text-slate-300 group-hover:text-indigo-400 transition-colors tracking-[0.25em]">
                        #{booking.id.slice(0,8).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-6">
                      <h3 className="font-black text-3xl text-slate-800 line-clamp-2 leading-[1.1] tracking-tight group-hover:text-indigo-600 transition-colors">
                        {booking.course_name || booking.purpose}
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4 pt-2">
                        <div className="flex items-center text-slate-500 font-bold text-sm">
                          <div className="w-10 h-10 rounded-[1rem] bg-slate-50 flex items-center justify-center mr-4 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                            <MapPin className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" /> 
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-slate-800 font-black text-base leading-none tracking-tight">{booking.class_name}</p>
                            <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">{booking.class_location}</p>
                          </div>
                        </div>

                        <div className="flex items-center text-slate-500 font-bold text-sm">
                          <div className="w-10 h-10 rounded-[1rem] bg-slate-50 flex items-center justify-center mr-4 border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
                            <Calendar className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" /> 
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-slate-800 font-black text-base leading-none tracking-tight">
                              {format(new Date(booking.date), 'dd/MM/yyyy')}
                            </p>
                            <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">{booking.slot_name}</p>
                          </div>
                        </div>

                        <div className="flex items-center text-slate-500 font-bold text-sm">
                          <div className="w-10 h-10 rounded-[1rem] bg-slate-50 flex items-center justify-center mr-4 border border-slate-100 group-hover:bg-amber-50 group-hover:border-amber-100 transition-all">
                            <Users className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" /> 
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-slate-800 font-black text-base leading-none tracking-tight">
                              {booking.attendee_count} học viên
                            </p>
                            <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase italic truncate max-w-[150px]">
                              {booking.reason || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50 group-hover:border-indigo-50 transition-colors">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                             {[
                               { id: 'creator', label: 'Creator', active: true },
                               { id: 'reviewer', label: 'Reviewer', active: ['IN_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(booking.status) },
                               { id: 'approver', label: 'Approver', active: ['APPROVED', 'REJECTED'].includes(booking.status) }
                             ].map((step, idx) => (
                               <React.Fragment key={step.id}>
                                  <div className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all",
                                    step.active ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-105" : "text-slate-300"
                                  )}>
                                     <div className={cn("w-1.5 h-1.5 rounded-full", step.active ? "bg-emerald-400 animate-pulse" : "bg-slate-200")} />
                                     <span className="text-[8px] font-black uppercase tracking-widest">{step.label}</span>
                                  </div>
                                  {idx < 2 && <div className={cn("w-2 h-[2px] rounded-full", step.active && idx === 0 ? "bg-slate-900" : "bg-slate-100")} />}
                               </React.Fragment>
                             ))}
                          </div>
                          
                          <div className="flex items-center gap-2 text-slate-400">
                             <Clock className="w-3.5 h-3.5" />
                             <span className="text-[9px] font-black uppercase tracking-wider italic">
                                {['APPROVED', 'REJECTED'].includes(booking.status) && booking.updated_at
                                  ? `Đã ${booking.status === 'APPROVED' ? 'duyệt' : 'từ chối'} lúc ${(() => {
                                      try {
                                        return format(new Date(booking.updated_at), 'HH:mm dd/MM');
                                      } catch {
                                        return 'N/A';
                                      }
                                    })()}`
                                  : booking.created_at ? `Đã gửi ${Math.max(1, Math.floor((new Date().getTime() - new Date(booking.created_at).getTime()) / (1000 * 60 * 60 * 24)))} ngày trước` : 'N/A'}
                             </span>
                          </div>
                       </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50/50 p-8 px-10 flex items-center justify-between border-t-2 border-slate-50 group-hover:bg-indigo-50/30 transition-colors">
                    <div className="flex gap-4">
                      {['REJECTED', 'CANCELLED', 'APPROVED'].includes(booking.status) && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAction(booking, 'CLONE'); }}
                          className="w-12 h-12 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-500 rounded-[1.2rem] transition-all flex items-center justify-center shadow-lg shadow-slate-200/50 active:scale-90"
                          title="Sao chép booking"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      )}
                      {['PENDING_REVIEW', 'PENDING_APPROVAL', 'DRAFT'].includes(booking.status) && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAction(booking, 'CANCEL'); }}
                          className="w-12 h-12 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-500 rounded-[1.2rem] transition-all flex items-center justify-center shadow-lg shadow-slate-200/50 active:scale-90"
                          title="Hủy yêu cầu"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleAction(booking, 'VIEW')}
                      className="px-8 py-4 bg-white border border-slate-200 rounded-[1.2rem] flex items-center gap-3 text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-500/30 transition-all active:scale-95 group/btn"
                    >
                      <span>Xem chi tiết</span>
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-[4rem] overflow-hidden border-2 border-slate-100 shadow-2xl shadow-slate-200/30"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-100">
                    <th className="px-10 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Mã</th>
                    <th className="px-10 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Học phần / Nội dung</th>
                    <th className="px-10 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Phòng học</th>
                    <th className="px-10 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Thời gian</th>
                    <th className="px-10 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Trạng thái</th>
                    <th className="px-10 py-10 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((booking, i) => {
                    const status = getStatusConfig(booking);
                    const StatusIcon = status.icon;
                    
                    return (
                      <motion.tr 
                        key={booking.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer" 
                        onClick={() => handleAction(booking, 'VIEW')}
                      >
                        <td className="px-10 py-10 font-mono text-[11px] font-black text-slate-300 tracking-widest">
                          #{booking.id.slice(0,8).toUpperCase()}
                        </td>
                        <td className="px-10 py-10">
                          <div className="font-black text-slate-900 text-lg tracking-tight group-hover:text-indigo-600 transition-colors max-w-md truncate">
                            {booking.course_name || booking.purpose}
                          </div>
                        </td>
                        <td className="px-10 py-10">
                          <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-[1rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-slate-800 font-black leading-none text-base">{booking.class_name}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{booking.class_location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-10">
                          <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-[1rem] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-slate-800 font-black leading-none text-base">{format(new Date(booking.date), 'dd/MM/yyyy')}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{booking.slot_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-10">
                          <Badge className={cn("px-5 py-2.5 rounded-[1rem] border shadow-sm text-[10px] font-black uppercase tracking-[0.2em]", status.color)}>
                            <StatusIcon className="w-4 h-4 mr-3" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-10 py-10 text-right">
                          <div className="w-14 h-14 bg-white text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-2xl group-hover:shadow-indigo-500/40 group-hover:border-indigo-600 rounded-[1.2rem] transition-all flex items-center justify-center ml-auto border border-slate-100">
                            <ArrowUpRight className="w-6 h-6" />
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Support */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-8 bg-slate-900 rounded-[3.5rem] p-12 lg:p-16 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
           <Zap className="w-64 h-64 text-indigo-400" />
        </div>
        <div className="relative z-10 space-y-6 max-w-xl text-center sm:text-left">
          <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center border border-white/10 mx-auto sm:mx-0">
             <Info className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Hỗ trợ & Hướng dẫn</h3>
            <p className="text-indigo-200 font-bold text-lg leading-relaxed">
              Bạn có thắc mắc về trạng thái booking của mình? Vui lòng liên hệ Phòng Đào Tạo để được hỗ trợ thẩm định nhanh hơn.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 flex flex-col gap-4 w-full sm:w-auto">
           <button className="px-12 py-6 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20">
              Liên hệ CSKH
           </button>
           <button className="px-12 py-6 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all">
              Tài liệu hướng dẫn
           </button>
        </div>
      </div>
    </div>
  );
}
