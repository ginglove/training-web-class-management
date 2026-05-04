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
  Gavel
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getErrorMessage } from '@/lib/errorTranslations';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminBookingsOversightPage() {
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
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[1.2rem] bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100 shadow-xl shadow-emerald-500/5">
                <Activity className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                  <Sparkles className="w-3 h-3" />
                  <span>Giám sát hệ thống</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-800">Quản lý Booking 🛡️</h1>
             </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">Theo dõi toàn bộ lịch trình đặt phòng trong hệ thống. Có quyền can thiệp và hủy bỏ các yêu cầu không hợp lệ.</p>
        </div>
        
        <button className="w-full sm:w-auto px-8 h-14 bg-white border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-xl shadow-slate-200/20 flex items-center justify-center gap-3 active:scale-95">
          <FileDown className="w-5 h-5" />
          <span>Xuất báo cáo Excel</span>
        </button>
      </div>

      {/* Filters Card */}
      <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-2xl shadow-slate-200/30">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
            <CustomInput 
              type="text"
              placeholder="Tìm theo tiêu đề hoặc người đặt..."
              className="w-full pl-14 h-14 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-primary/30 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 w-full lg:w-72 relative group">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors z-10" />
            <select 
              className="w-full h-14 pl-14 pr-10 bg-slate-50 border-2 border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:border-primary/30 focus:bg-white transition-all appearance-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả Trạng thái</option>
              <option value="PENDING_REVIEW">Chờ Review</option>
              <option value="APPROVED">Đã Duyệt</option>
              <option value="REJECTED">Từ Chối</option>
              <option value="CANCELLED">Đã Hủy</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        {loading ? (
          <div className="p-20 space-y-8 text-center bg-white rounded-[3rem] border border-slate-100">
             <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
             <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Đang nạp dữ liệu hệ thống...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center space-y-8 bg-white rounded-[4rem] border-4 border-dashed border-slate-50 shadow-inner">
            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto border border-slate-100">
              <Calendar className="w-12 h-12 text-slate-200" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Không tìm thấy yêu cầu</h3>
              <p className="text-slate-400 font-bold max-w-md mx-auto italic">Thử thay đổi từ khóa tìm kiếm hoặc kiểm tra lại bộ lọc trạng thái.</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 gap-6">
              {filtered.map((b, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={b.id} 
                  className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-2xl shadow-slate-200/20 hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500"
                >
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm relative overflow-hidden">
                      <Calendar className="w-7 h-7 relative z-10" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-xl text-slate-800 tracking-tight group-hover:text-primary transition-colors leading-none">
                          {b.course_name || b.purpose || 'Yêu cầu không tên'}
                        </h3>
                        <div className="h-4 w-px bg-slate-200" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{b.id.substring(0,8)}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-xs font-black text-slate-500 uppercase tracking-tight">{b.creator_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-slate-300" />
                          <span className="text-xs font-black text-slate-500 uppercase tracking-tight">{b.class_name} ({b.class_location})</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                            {b.start_datetime ? format(new Date(b.start_datetime), 'HH:mm • dd/MM/yyyy', { locale: vi }) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between lg:justify-end gap-6">
                    <Badge className={cn(
                      "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm",
                      b.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      b.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                      b.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                      'bg-slate-50 text-slate-400 border-slate-100'
                    )}>
                      {b.status}
                    </Badge>
                    
                    <div className="flex items-center gap-3">
                      {b.status !== 'CANCELLED' && b.status !== 'REJECTED' && (
                        <button 
                          onClick={() => handleCancel(b.id)}
                          className="p-4 bg-white border border-rose-100 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm active:scale-90"
                          title="Admin Cancel"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm active:scale-90">
                         <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
