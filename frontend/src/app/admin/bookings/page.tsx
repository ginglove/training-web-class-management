'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input as CustomInput } from '@/components/ui/Input';
import { fetchApi } from '@/lib/api';
import { 
  Search, 
  Filter, 
  XCircle, 
  FileDown, 
  Calendar, 
  User, 
  Home,
  Sparkles,
  Activity,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  Building,
  Clock,
  MoreVertical,
  Gavel,
  Zap,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { getErrorMessage } from '@/lib/errorTranslations';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminBookingsOversightPage() {
  const router = useRouter();
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');

  const loadBookings = async () => {
    try {
      const url = statusFilter === 'ALL' ? '/api/bookings' : `/api/bookings?status=${statusFilter}`;
      const res = await fetchApi(url);
      setBookings(res.data);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Lỗi khi tải danh sách booking'));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const handleCancel = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đặt phòng này với tư cách Admin?')) return;
    try {
      await fetchApi(`/api/admin/bookings/${id}/cancel`, { method: 'POST' });
      toast.success('Đã hủy đặt phòng thành công');
      loadBookings();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Hủy thất bại'));
    }
  };

  const filtered = bookings.filter(b => 
    (b.course_name || b.purpose || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.creator_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[2rem] bg-slate-900 flex items-center justify-center text-primary shadow-[6px_6px_0px_0px_rgba(30,58,138,0.2)] rotate-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-black text-primary uppercase tracking-[0.3em]">
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Authority Hub</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">Giám sát Booking 🛡️</h1>
            </div>
          </div>
          <p className="text-slate-500 font-bold text-lg max-w-2xl leading-relaxed italic">
            Quyền năng tối cao: Theo dõi, can thiệp và điều phối toàn bộ tài nguyên đào tạo trong hệ thống.
          </p>
        </div>
        
        <button 
          onClick={() => toast('Tính năng xuất báo cáo Excel đang được phát triển... 🛠️')}
          className="h-16 px-10 bg-white border-2 border-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-900 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-3 active:scale-95 group"
        >
          <FileDown className="w-6 h-6 group-hover:bounce transition-transform" />
          <span>Xuất báo cáo Excel</span>
        </button>
      </div>

      {/* Advanced Control Panel */}
      <Card className="p-10 rounded-[3rem] bg-white border-2 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-primary transition-colors" />
            <CustomInput 
              type="text"
              placeholder="Tìm theo khóa học, người đặt, mã hồ sơ..."
              className="w-full pl-16 h-16 bg-slate-50 border-2 border-transparent rounded-[2rem] font-black text-slate-700 focus:bg-white focus:border-slate-900 transition-all outline-none text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 w-full lg:w-96 relative group">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors z-10" />
            <select 
              className="w-full h-16 pl-16 pr-10 bg-slate-900 border-2 border-slate-900 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] text-white focus:outline-none appearance-none cursor-pointer hover:bg-black transition-colors"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Mọi Trạng Thái</option>
              <option value="PENDING_REVIEW">Chờ Review</option>
              <option value="APPROVED">Đã Phê Duyệt</option>
              <option value="REJECTED">Bị Từ Chối</option>
              <option value="CANCELLED">Đã Hủy Bỏ</option>
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 group-hover:text-white transition-colors">
               <ChevronRight className="w-6 h-6 rotate-90" />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Data Feed */}
      <div className="space-y-8">
        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center space-y-10 bg-white border-2 border-slate-100 rounded-[4rem] shadow-2xl shadow-slate-200/40">
             <div className="w-24 h-24 border-[8px] border-slate-100 border-t-primary rounded-full animate-spin shadow-2xl" />
             <div className="space-y-2 text-center">
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing System Logs...</p>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">Vui lòng đợi trong giây lát</p>
             </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center space-y-10 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner">
            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto border border-slate-100 shadow-xl rotate-6 group hover:rotate-0 transition-transform duration-700">
              <Calendar className="w-12 h-12 text-slate-200 group-hover:text-primary transition-colors" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Không có dữ liệu khớp</h3>
              <p className="text-slate-400 font-bold max-w-md mx-auto italic text-lg leading-relaxed">Bộ lọc hiện tại không trả về kết quả nào. Hãy thử nới lỏng các tiêu chí tìm kiếm.</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 gap-10">
              {filtered.map((b, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={b.id} 
                  className="group relative bg-white border-2 border-slate-100 rounded-[3.5rem] p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10 shadow-2xl shadow-slate-200/20 hover:border-slate-900 hover:shadow-[16px_16px_0px_0px_rgba(15,23,42,1)] transition-all duration-700 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-2 h-full bg-slate-50 group-hover:bg-primary transition-colors" />
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-10 relative z-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-700 shadow-sm relative overflow-hidden group/icon">
                      <Calendar className="w-8 h-8 relative z-10 group-hover/icon:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-primary/20 scale-0 group-hover/icon:scale-100 transition-transform duration-1000 rounded-full" />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <Badge className={cn(
                          "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 shadow-sm transition-all group-hover:scale-105",
                          b.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          b.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                          b.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          'bg-slate-50 text-slate-400 border-slate-100'
                        )}>
                          {b.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">#{b.id.substring(0,10).toUpperCase()}</span>
                      </div>
                      
                      <h3 className="font-black text-3xl text-slate-900 tracking-tighter group-hover:text-primary transition-colors leading-none line-clamp-1">
                        {b.course_name || b.purpose || 'Hồ sơ chưa đặt tên'}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-x-10 gap-y-4 pt-2">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg">
                              {b.creator_name?.charAt(0)}
                           </div>
                           <div className="space-y-0.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Chủ hồ sơ</p>
                              <p className="text-sm font-black text-slate-700 leading-none">{b.creator_name}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50/50 px-6 py-3 rounded-2xl border border-slate-100">
                          <Building className="w-5 h-5 text-primary" />
                          <div className="space-y-0.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Địa điểm</p>
                              <p className="text-sm font-black text-slate-700 leading-none">{b.class_name} • {b.class_location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 shadow-lg shadow-primary/5">
                          <Clock className="w-5 h-5 text-primary" />
                          <div className="space-y-0.5">
                              <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest leading-none">Thời gian</p>
                              <p className="text-sm font-black text-primary leading-none uppercase">
                                {b.start_datetime ? format(new Date(b.start_datetime), 'HH:mm • dd/MM/yyyy', { locale: vi }) : 'N/A'}
                              </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-8 relative z-10">
                    <div className="flex items-center gap-4">
                      {b.status !== 'CANCELLED' && b.status !== 'REJECTED' && (
                        <button 
                          onClick={() => handleCancel(b.id)}
                          className="h-16 px-8 bg-white border-2 border-rose-100 rounded-[1.5rem] text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-xl shadow-rose-200/20 active:scale-95 flex items-center gap-3 group/cancel"
                          title="Hủy khẩn cấp"
                        >
                          <XCircle className="w-6 h-6 group-hover/cancel:rotate-90 transition-transform duration-500" />
                          <span className="font-black text-[11px] uppercase tracking-widest hidden sm:inline">Hủy bỏ</span>
                        </button>
                      )}
                      <button 
                        onClick={() => router.push(`/bookings/${b.id}`)}
                        className="w-16 h-16 bg-slate-900 border-2 border-slate-900 rounded-[1.5rem] text-white flex items-center justify-center hover:bg-black hover:scale-110 active:scale-90 transition-all shadow-2xl shadow-slate-900/40 group/view"
                      >
                         <ChevronRight className="w-8 h-8 group-hover/view:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Admin Meta Footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-12 border-t-2 border-slate-100">
         <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 space-y-2 group hover:bg-white hover:border-slate-900 transition-all duration-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Tải trọng hệ thống</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">98.2%</p>
         </div>
         <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 space-y-2 group hover:bg-white hover:border-slate-900 transition-all duration-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Thời gian phản hồi</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">124ms</p>
         </div>
         <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 space-y-2 group hover:bg-white hover:border-slate-900 transition-all duration-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Xung đột lịch</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">0</p>
         </div>
         <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex items-center justify-between shadow-2xl shadow-slate-900/30">
            <div className="space-y-1">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng hồ sơ</p>
               <p className="text-4xl font-black tracking-tighter">{bookings.length}</p>
            </div>
            <Zap className="w-10 h-10 text-primary opacity-50" />
         </div>
      </div>
    </div>
  );
}
