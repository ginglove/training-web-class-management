'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input as CustomInput } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { fetchApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { 
  Plus, 
  Filter, 
  Search, 
  LayoutGrid, 
  List, 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Activity, 
  Sparkles,
  ArrowUpRight,
  MoreVertical,
  Layers,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function BookingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('table');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  React.useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'ALL' ? '/api/bookings' : `/api/bookings?status=${statusFilter}`;
      const res = await fetchApi(url);
      setBookings(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = bookings.filter(b => 
    (b.course_name || b.purpose || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.class_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'PENDING_REVIEW': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'DRAFT': return 'bg-slate-50 text-slate-400 border-slate-100';
      default: return 'bg-sky-50 text-sky-600 border-sky-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shadow-xl shadow-primary/5 rotate-3">
              <Layers className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-black text-primary uppercase tracking-[0.3em]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Danh mục đặt lớp</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">Danh sách Booking 📅</h1>
            </div>
          </div>
          <p className="text-slate-500 font-bold text-lg max-w-2xl leading-relaxed italic">
            Theo dõi và quản lý toàn bộ các yêu cầu đặt phòng học trong hệ thống.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex bg-white border-2 border-slate-900 p-1.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <button 
              onClick={() => setViewMode('table')}
              className={cn("p-3 rounded-xl transition-all", viewMode === 'table' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-900")}
            >
              <List className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-3 rounded-xl transition-all", viewMode === 'grid' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-900")}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
          {(user?.role === 'CREATOR' || user?.role === 'ADMIN') && (
            <Button 
              onClick={() => router.push('/bookings/new')}
              className="h-16 px-8 bg-primary border-2 border-slate-900 text-white rounded-2xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-3 active:scale-95 group"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
              <span className="font-black text-sm uppercase tracking-widest">Tạo mới</span>
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-8 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-primary transition-colors" />
          <CustomInput 
            type="text"
            placeholder="Tìm theo khóa học, mục đích, phòng học..."
            className="w-full pl-16 h-16 bg-white border-2 border-slate-900 rounded-[2rem] font-black text-slate-700 shadow-[8px_8px_0px_0px_rgba(15,23,42,0.05)] focus:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] transition-all outline-none text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="lg:col-span-4 relative group">
          <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors z-10" />
          <select 
            className="w-full h-16 pl-16 pr-10 bg-white border-2 border-slate-900 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 focus:outline-none shadow-[8px_8px_0px_0px_rgba(15,23,42,0.05)] focus:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] transition-all appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="PENDING_REVIEW">Chờ Review</option>
            <option value="APPROVED">Đã Duyệt</option>
            <option value="REJECTED">Từ Chối</option>
          </select>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-slate-900 transition-colors">
             <ChevronRight className="w-6 h-6 rotate-90" />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-8 bg-white border-2 border-slate-100 rounded-[4rem] shadow-2xl shadow-slate-200/40">
             <div className="w-20 h-20 border-[6px] border-slate-100 border-t-primary rounded-full animate-spin shadow-xl" />
             <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Đang nạp dữ liệu hệ thống...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center space-y-10 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner">
            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto border border-slate-100 shadow-xl rotate-6">
              <Calendar className="w-12 h-12 text-slate-200" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Không tìm thấy dữ liệu</h3>
              <p className="text-slate-400 font-bold max-w-md mx-auto italic text-lg leading-relaxed">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để khám phá các yêu cầu khác.
              </p>
            </div>
            <Button onClick={() => {setSearch(''); setStatusFilter('ALL');}} variant="ghost" className="h-14 px-8 rounded-2xl border-2 border-slate-900 font-black text-[10px] uppercase tracking-widest active:scale-95">
               Xóa tất cả bộ lọc
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {filtered.map((b, i) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    key={b.id}
                    className="group bg-white border-2 border-slate-100 rounded-[3rem] p-10 shadow-2xl shadow-slate-200/20 hover:border-slate-900 hover:shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col h-full"
                    onClick={() => router.push(`/bookings/${b.id}`)}
                  >
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                      <Zap className="w-48 h-48" />
                    </div>
                    
                    <div className="flex-1 space-y-8 relative z-10">
                      <div className="flex justify-between items-start">
                        <Badge className={cn("px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm", getStatusColor(b.status))}>
                          {b.status.replace('_', ' ')}
                        </Badge>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all">
                          <MoreVertical className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{b.id.substring(0,8)}</p>
                        <h3 className="text-3xl font-black text-slate-900 leading-[1.1] tracking-tighter group-hover:text-primary transition-colors line-clamp-2">
                          {b.course_name || b.purpose}
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-slate-500 font-bold">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-primary/20 transition-colors">
                              <MapPin className="w-5 h-5 text-primary" />
                           </div>
                           <span className="text-lg tracking-tight">{b.class_name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 font-bold">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:border-primary/20 transition-colors">
                              <Clock className="w-5 h-5 text-primary" />
                           </div>
                           <span className="text-lg tracking-tight uppercase">{b.slot_name} • {format(new Date(b.date), 'dd/MM/yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 pt-8 border-t-2 border-slate-50 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-[10px] border-2 border-white shadow-xl">
                            {b.creator_name?.charAt(0) || 'U'}
                         </div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{b.creator_name}</p>
                      </div>
                      <div className="w-12 h-12 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 group-hover:border-slate-900 group-hover:text-slate-900 transition-all shadow-sm">
                         <ChevronRight className="w-6 h-6" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-slate-900 rounded-[3rem] shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b-2 border-slate-900">
                      <tr>
                        <th className="p-8 text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Mã hồ sơ</th>
                        <th className="p-8 text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Thông tin đào tạo</th>
                        <th className="p-8 text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Phòng học</th>
                        <th className="p-8 text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Thời gian</th>
                        <th className="p-8 text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Trạng thái</th>
                        <th className="p-8 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-50 font-bold">
                      {filtered.map((b) => (
                        <tr 
                          key={b.id} 
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                          onClick={() => router.push(`/bookings/${b.id}`)}
                        >
                          <td className="p-8 font-black text-slate-300 text-xs uppercase tracking-widest">#{b.id.substring(0,8)}</td>
                          <td className="p-8">
                            <p className="text-xl font-black text-slate-900 leading-tight group-hover:text-primary transition-colors">{b.course_name || b.purpose}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Đăng bởi: {b.creator_name}</p>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center gap-3 text-slate-700">
                               <MapPin className="w-4 h-4 text-primary" />
                               <span className="text-lg font-black tracking-tight">{b.class_name}</span>
                            </div>
                          </td>
                          <td className="p-8">
                            <div className="space-y-1">
                               <p className="text-lg font-black text-slate-700 tracking-tight leading-none italic">{b.slot_name}</p>
                               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{format(new Date(b.date), 'dd/MM/yyyy')}</p>
                            </div>
                          </td>
                          <td className="p-8">
                            <Badge className={cn("px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm", getStatusColor(b.status))}>
                              {b.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-8 text-right">
                             <div className="w-12 h-12 bg-white border-2 border-slate-100 rounded-2xl inline-flex items-center justify-center text-slate-300 group-hover:border-slate-900 group-hover:text-slate-900 transition-all shadow-sm">
                                <ChevronRight className="w-6 h-6" />
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Stats Footer for context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t-2 border-slate-100">
         <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex items-center justify-between shadow-2xl shadow-slate-900/20">
            <div className="space-y-1">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tổng số lượng</p>
               <h4 className="text-4xl font-black tracking-tighter">{bookings.length}</h4>
            </div>
            <Activity className="w-10 h-10 text-primary opacity-50" />
         </div>
         <div className="p-8 bg-white border-2 border-slate-900 rounded-[2.5rem] flex items-center justify-between shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
            <div className="space-y-1">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hôm nay</p>
               <h4 className="text-4xl font-black tracking-tighter text-slate-900">
                  {bookings.filter(b => format(new Date(b.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length}
               </h4>
            </div>
            <Clock className="w-10 h-10 text-primary" />
         </div>
         <div className="p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] flex items-center justify-between shadow-2xl shadow-emerald-500/10">
            <div className="space-y-1">
               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Đã duyệt</p>
               <h4 className="text-4xl font-black tracking-tighter text-emerald-600">
                  {bookings.filter(b => b.status === 'APPROVED').length}
               </h4>
            </div>
            <Sparkles className="w-10 h-10 text-emerald-500" />
         </div>
      </div>
    </div>
  );
}
