'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { fetchApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Input as CustomInput } from '@/components/ui/Input';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  ShieldCheck, 
  ArrowRight, 
  User, 
  Calendar, 
  MapPin, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  FileCheck,
  Sparkles,
  ExternalLink,
  Building,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function ApproverHistoryPage() {
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  const loadBookings = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/api/bookings');
      // For Approver history, we show bookings that were approved or rejected
      const historyItems = res.data.filter((b: any) => 
        ['APPROVED', 'REJECTED'].includes(b.status)
      );
      setBookings(historyItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filteredBookings = bookings.filter(b => 
    (b.course_name || b.purpose || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.creator_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.class_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[1.2rem] bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100 shadow-xl shadow-emerald-500/5">
                <ShieldCheck className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                  <Sparkles className="w-3 h-3" />
                  <span>Approver Dashboard</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-800">Lịch sử Phê duyệt 🛡️</h1>
             </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">Toàn bộ hồ sơ các quyết định phê duyệt và từ chối cấp trường của Ban Giám Hiệu.</p>
        </div>

        <div className="relative w-full lg:w-80 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
          <CustomInput 
            placeholder="Tìm theo giảng viên, phòng học..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 h-14 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-primary/30 transition-all shadow-xl shadow-slate-200/20 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden relative min-h-[600px]">
        {loading ? (
          <div className="p-20 space-y-10 text-center">
             <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
             <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Đang truy xuất dữ liệu phê duyệt...</p>
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Khóa học & Giảng viên</span>
                  </th>
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Phòng học</span>
                  </th>
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Thời gian học</span>
                  </th>
                  <th className="p-8 text-center">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Quyết định</span>
                  </th>
                  <th className="p-8 text-right">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Xem lại</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBookings.map((b, i) => (
                  <tr key={b.id || i} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="p-8">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-14 h-14 rounded-[1.2rem] flex items-center justify-center font-black text-lg border shadow-sm group-hover:scale-110 transition-transform",
                          b.status === 'APPROVED' ? "bg-emerald-50 text-emerald-500 border-emerald-100" : "bg-rose-50 text-rose-500 border-rose-100"
                        )}>
                          {b.course_name?.charAt(0) || b.purpose?.charAt(0) || 'B'}
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-slate-800 text-lg tracking-tight leading-none group-hover:text-primary transition-colors">
                            {b.course_name || b.purpose}
                          </p>
                          <div className="flex items-center gap-2">
                             <User className="w-3 h-3 text-slate-300" />
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{b.creator_name}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                          <Building className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                           <p className="text-sm font-black text-slate-700 tracking-tight leading-none">{b.class_name}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{b.class_location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                             <Calendar className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5">
                             <p className="text-sm font-black text-slate-700 tracking-tight leading-none">
                               {format(new Date(b.date), 'dd/MM/yyyy')}
                             </p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{b.slot_name}</p>
                          </div>
                       </div>
                    </td>
                    <td className="p-8 text-center">
                       <Badge className={cn(
                         "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border shadow-sm inline-flex",
                         b.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                         b.status === 'REJECTED' ? "bg-rose-50 text-rose-600 border-rose-100" :
                         "bg-amber-50 text-amber-600 border-amber-100"
                       )}>
                         {b.status}
                       </Badge>
                    </td>
                    <td className="p-8 text-right">
                       <Link href={`/bookings/${b.id}`}>
                         <button className="p-4 bg-white border border-slate-100 rounded-[1.2rem] text-slate-300 hover:text-primary hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10 transition-all opacity-0 group-hover:opacity-100 active:scale-90">
                            <ExternalLink className="w-5 h-5" />
                         </button>
                       </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-32 text-center space-y-8 bg-white">
            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto border border-slate-100">
              <ShieldCheck className="w-12 h-12 text-slate-200" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Lịch sử trống</h3>
              <p className="text-slate-400 font-bold max-w-md mx-auto italic">Bạn chưa thực hiện bất kỳ quyết định phê duyệt cấp trường nào.</p>
            </div>
            <Link href="/approver/pending">
              <button className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-slate-900/20">
                Xem yêu cầu chờ phê duyệt
              </button>
            </Link>
          </div>
        )}
      </div>

      <div className="bg-emerald-900 rounded-[3.5rem] p-12 lg:p-16 text-white relative overflow-hidden group">
         <div className="absolute -right-12 -top-12 opacity-10 group-hover:scale-110 transition-transform">
            <Activity className="w-64 h-64" />
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
            <div className="space-y-8">
               <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center border border-white/10">
                  <FileCheck className="w-8 h-8 text-white" />
               </div>
               <div className="space-y-4">
                  <h3 className="text-3xl font-black uppercase tracking-tight leading-none">Quyết định Chính xác</h3>
                  <p className="text-emerald-200 font-medium text-lg leading-relaxed">
                     Lịch sử này cung cấp cái nhìn tổng quan về các tiêu chuẩn phê duyệt đã được áp dụng, giúp duy trì sự nhất quán trong quản lý tài nguyên nhà trường.
                  </p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
               <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                  <p className="text-4xl font-black tracking-tighter">{bookings.filter(b => b.status === 'APPROVED').length}</p>
                  <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Đã Phê Duyệt</p>
               </div>
               <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                  <p className="text-4xl font-black tracking-tighter">{bookings.filter(b => b.status === 'REJECTED').length}</p>
                  <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Đã Từ Chối</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
