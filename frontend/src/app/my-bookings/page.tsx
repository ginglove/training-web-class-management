'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  Calendar, Clock, MapPin, Search, Filter, 
  MoreVertical, CheckCircle2, XCircle, AlertCircle, 
  LayoutGrid, List, Copy, ChevronRight, ArrowRight,
  Plus, History, ShieldCheck, Zap,
  Activity, Layers, Sparkles, User, RefreshCcw,
  ArrowUpRight, FileText, CheckCircle, ChevronLeft
} from 'lucide-react';
import { getErrorMessage } from '@/lib/errorTranslations';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function MyBookingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'card' | 'table'>('card');
  const [activeTab, setActiveTab] = React.useState('ALL');

  React.useEffect(() => {
    if (user) {
      loadMyBookings();
    }
  }, [user]);

  const loadMyBookings = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/bookings/my-bookings`);
      setBookings(res.data || []);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Lỗi khi tải danh sách booking'));
    } finally {
      setLoading(false);
    }
  };

  const kpis = {
    total: bookings.length,
    pending: bookings.filter(b => ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL'].includes(b.status)).length,
    approved: bookings.filter(b => b.status === 'APPROVED').length,
    rejected: bookings.filter(b => b.status === 'REJECTED' || b.status === 'CANCELLED').length,
  };

  const now = new Date();
  
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UPCOMING') return new Date(b.date) >= now;
    if (activeTab === 'PAST') return new Date(b.date) < now;
    if (activeTab === 'PENDING') return ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL'].includes(b.status);
    return b.status === activeTab;
  });

  const getStatusConfig = (booking: any) => {
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

  const handleAction = async (booking: any, action: string) => {
    if (action === 'CANCEL') {
      try {
        await fetchApi(`/api/bookings/${booking.id}/cancel`, { method: 'PATCH' });
        toast.success('Đã hủy booking');
        loadMyBookings();
      } catch (err: any) {
        toast.error(getErrorMessage(err, 'Hủy thất bại'));
      }
    } else if (action === 'CLONE') {
      router.push(`/bookings/new?cloneFrom=${booking.id}`);
    } else if (action === 'VIEW') {
      router.push(`/bookings/${booking.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[1.2rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xl shadow-primary/5">
              <History className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                <Sparkles className="w-3 h-3" />
                <span>Trung tâm yêu cầu</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-800">Lịch sử Đặt lớp 📅</h1>
            </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">Quản lý và theo dõi trạng thái các yêu cầu đào tạo của bạn trong thời gian thực.</p>
        </div>
        
        <div className="flex items-center gap-6 w-full md:w-auto bg-white/50 backdrop-blur-md p-2 rounded-[1.8rem] border border-slate-100 shadow-xl shadow-slate-200/20">
          <div className="flex p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50">
            <button 
              onClick={() => setViewMode('card')}
              className={cn(
                "p-3 rounded-xl transition-all",
                viewMode === 'card' ? "bg-white shadow-xl text-primary" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={cn(
                "p-3 rounded-xl transition-all",
                viewMode === 'table' ? "bg-white shadow-xl text-primary" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          
          <Button 
            onClick={() => router.push('/bookings/new')}
            className="flex-1 md:flex-none h-14 px-10 rounded-2xl bg-primary shadow-2xl shadow-primary/30 font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-[1.03] active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5 fill-white" />
            <span>Đặt phòng mới</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Tổng số yêu cầu', val: kpis.total, color: 'slate', icon: Layers },
          { label: 'Đang xử lý', val: kpis.pending, color: 'blue', icon: Clock },
          { label: 'Đã phê duyệt', val: kpis.approved, color: 'emerald', icon: ShieldCheck },
          { label: 'Từ chối / Hủy', val: kpis.rejected, color: 'rose', icon: XCircle },
        ].map((kpi, i) => (
          <div key={i} className="group relative bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-200/20 hover:shadow-primary/10 transition-all overflow-hidden">
            <div className={cn("absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 group-hover:opacity-[0.05] transition-all", `text-${kpi.color}-500`)}>
              <kpi.icon className="w-24 h-24" />
            </div>
            <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{kpi.label}</p>
              <div className={cn("text-5xl font-black tracking-tight", `text-${kpi.color}-600`)}>{kpi.val}</div>
              <div className={cn("w-12 h-1.5 rounded-full", `bg-${kpi.color}-500/20`)} />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex gap-2 p-1.5 bg-slate-100/50 backdrop-blur-md rounded-[2rem] border border-slate-200/50 overflow-x-auto no-scrollbar w-full md:w-auto">
          {['ALL', 'UPCOMING', 'PAST', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 text-[10px] font-black uppercase tracking-[0.15em] rounded-[1.5rem] whitespace-nowrap transition-all",
                activeTab === tab 
                  ? 'bg-primary text-white shadow-2xl shadow-primary/30 scale-[1.05]' 
                  : 'text-slate-400 hover:bg-white hover:text-slate-800'
              )}
            >
              {tab === 'ALL' ? 'Tất cả' : 
               tab === 'UPCOMING' ? 'Sắp tới' : 
               tab === 'PAST' ? 'Đã qua' : 
               tab === 'PENDING' ? 'Đang xử lý' :
               getStatusConfig({ status: tab }).label}
            </button>
          ))}
        </div>
        
        <button 
          onClick={loadMyBookings}
          className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-widest transition-colors group"
        >
          <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-48 space-y-6">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-2xl" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Đang đồng bộ hóa dữ liệu...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="py-40 text-center flex flex-col items-center justify-center space-y-8 bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/20">
          <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 border border-slate-100 shadow-inner">
            <Calendar className="w-10 h-10" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Không tìm thấy yêu cầu</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">Danh mục này hiện đang trống. Hãy bắt đầu bằng cách tạo một yêu cầu mới.</p>
          </div>
          <Button 
            onClick={() => router.push('/bookings/new')} 
            className="rounded-2xl px-12 py-6 bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            Đặt phòng học ngay
          </Button>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredBookings.map(booking => {
            const status = getStatusConfig(booking);
            const StatusIcon = status.icon;
            
            return (
              <div key={booking.id} className="group relative bg-white rounded-[3rem] border border-slate-200/50 shadow-2xl shadow-slate-200/20 hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500 overflow-hidden flex flex-col">
                <div className="p-8 space-y-8 flex-1">
                  <div className="flex justify-between items-start">
                    <Badge className={cn("px-4 py-1.5 rounded-xl border shadow-sm text-[9px] font-black uppercase tracking-[0.15em]", status.color)}>
                      <StatusIcon className="w-3 h-3 mr-2" />
                      {status.label}
                    </Badge>
                    <span className="text-[10px] font-black text-slate-300 group-hover:text-primary transition-colors tracking-widest">
                      #{booking.id.slice(0,8).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-black text-2xl text-slate-800 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{booking.course_name || booking.purpose}</h3>
                    <div className="flex items-center text-slate-500 font-bold text-xs uppercase tracking-tight">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center mr-3 border border-slate-100 group-hover:bg-primary/5 transition-colors">
                        <MapPin className="w-4 h-4 text-primary" /> 
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-slate-800 leading-none">{booking.class_name}</p>
                        <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">{booking.class_location}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-8 border-t border-slate-50 grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        <span>Thời gian</span>
                      </div>
                      <div className="font-black text-slate-800 text-sm">
                        {booking.slot_name}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />
                        <span>Ngày tháng</span>
                      </div>
                      <div className="font-black text-slate-800 text-sm">
                        {format(new Date(booking.date), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50/50 p-6 px-8 flex items-center justify-between border-t border-slate-100 group-hover:bg-primary/5 transition-colors">
                  <div className="flex gap-4">
                    {['REJECTED', 'CANCELLED', 'APPROVED'].includes(booking.status) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAction(booking, 'CLONE'); }}
                        className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary rounded-xl transition-all flex items-center justify-center shadow-sm"
                        title="Sao chép yêu cầu"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    {['PENDING_REVIEW', 'DRAFT'].includes(booking.status) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAction(booking, 'CANCEL'); }}
                        className="w-10 h-10 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-500 rounded-xl transition-all flex items-center justify-center shadow-sm"
                        title="Hủy yêu cầu"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleAction(booking, 'VIEW')}
                    className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:translate-x-1 transition-all"
                  >
                    <span>Chi tiết</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] overflow-hidden border border-slate-200/50 shadow-2xl shadow-slate-200/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ID</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Khóa học / Mục đích</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Phòng học</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lịch trình</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
                  <th className="px-10 py-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBookings.map(booking => {
                  const status = getStatusConfig(booking);
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => handleAction(booking, 'VIEW')}>
                      <td className="px-10 py-8 font-mono text-[10px] font-black text-slate-300">
                        #{booking.id.slice(0,8).toUpperCase()}
                      </td>
                      <td className="px-10 py-8">
                        <div className="font-black text-slate-800 text-base tracking-tight group-hover:text-primary transition-colors">{booking.course_name || booking.purpose}</div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3 font-bold text-slate-500 text-xs">
                          <MapPin className="w-4 h-4 text-primary" />
                          <div className="space-y-0.5">
                            <p className="text-slate-700 leading-none">{booking.class_name}</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest">{booking.class_location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="font-black text-slate-800 text-sm tracking-tight">{format(new Date(booking.date), 'dd/MM/yyyy')}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">
                          {booking.slot_name}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <Badge className={cn("px-4 py-1.5 rounded-xl border shadow-sm text-[9px] font-black uppercase tracking-[0.15em]", status.color)}>
                          <StatusIcon className="w-3.5 h-3.5 mr-2" />
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="w-12 h-12 bg-slate-50 text-slate-300 group-hover:bg-primary group-hover:text-white rounded-2xl transition-all flex items-center justify-center ml-auto border border-slate-100 shadow-sm">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
