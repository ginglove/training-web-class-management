'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { fetchApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Input as CustomInput } from '@/components/ui/Input';
import { safeFormat } from '@/lib/date-utils';
import { 
  History, 
  ArrowRight, 
  User, 
  Calendar, 
  MapPin, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ChevronRight,
  Sparkles,
  ExternalLink,
  Users,
  Building,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ReviewerHistoryPage() {
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState('ALL');

  React.useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetchApi('/api/bookings/reviewer-history');
        setBookings(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = (b.course_name || b.purpose || '').toLowerCase().includes(search.toLowerCase()) ||
                         (b.class_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || b.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-xl shadow-indigo-500/5">
                <History className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
                  <Sparkles className="w-3 h-3" />
                  <span>Reviewer Profile</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-800">Lịch sử Thẩm định 📜</h1>
             </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl">Lưu trữ toàn bộ các yêu cầu đã được bạn thẩm định và xử lý trong hệ thống.</p>
        </div>

        <div className="flex bg-slate-100/80 backdrop-blur-md p-2 rounded-[1.5rem] border border-slate-200/50 shadow-inner">
          <Link href="/reviewer/pending" className="px-8 py-3 rounded-2xl text-[10px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all">
            HÀNG ĐỢI
          </Link>
          <button className="px-8 py-3 bg-white shadow-xl shadow-slate-200/50 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest transition-all">
            LỊCH SỬ
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Tìm kiếm theo tên khóa học, phòng học..."
            className="w-full pl-14 pr-6 py-5 bg-white rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium text-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 w-full md:w-auto overflow-x-auto">
          {['ALL', 'APPROVED', 'REJECTED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                filter === f 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              {f === 'ALL' ? 'Tất cả' : f === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-[2.5rem] animate-pulse border border-slate-100 shadow-sm" />)
        ) : filteredBookings.length > 0 ? (
          filteredBookings.map((b) => (
            <div key={b.id} className="group relative bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-2xl shadow-slate-200/20 hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500">
               <div className="flex flex-col lg:flex-row lg:items-center gap-10">
                  <div className="flex-1 space-y-6">
                     <div className="flex items-center gap-4">
                        <Badge className={cn("px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border", 
                          b.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                        )}>
                          {b.status === 'APPROVED' ? 'THẨM ĐỊNH ĐẠT' : 'KHÔNG ĐẠT'}
                        </Badge>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{b.id.substring(0, 8)}</span>
                     </div>
                     
                     <div className="space-y-1">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors">{b.course_name || b.purpose}</h3>
                        <div className="flex flex-wrap items-center gap-6 text-slate-400">
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{b.class_name}</span>
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{safeFormat(b.date, 'dd/MM/yyyy')}</span>
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{b.slot_name}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-12 border-l border-slate-100 pl-12">
                     <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Xử lý lúc</p>
                        <p className="text-sm font-black text-slate-700">{safeFormat(b.updated_at, 'HH:mm • dd/MM/yyyy')}</p>
                     </div>
                     <Link href={`/bookings/${b.id}`}>
                        <button className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-xl group-hover:shadow-primary/20 transition-all duration-500">
                           <ArrowUpRight className="w-6 h-6" />
                        </button>
                     </Link>
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="py-40 text-center space-y-8 bg-white rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/20">
            <div className="w-40 h-40 bg-slate-50 rounded-[3.5rem] flex items-center justify-center mx-auto shadow-inner">
               <History className="w-16 h-16 text-slate-200" />
            </div>
            <div className="space-y-3">
               <h3 className="text-3xl font-black text-slate-800 tracking-tight">CHƯA CÓ LỊCH SỬ 🧊</h3>
               <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">Bạn chưa hoàn thành thẩm định cho yêu cầu nào. Hãy bắt đầu từ hàng đợi!</p>
            </div>
            <Link href="/reviewer/pending">
               <button className="px-12 py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] text-[10px] font-black text-primary hover:border-primary hover:bg-primary/5 hover:scale-105 transition-all uppercase tracking-[0.2em]">
                 BẮT ĐẦU REVIEW NGAY
               </button>
            </Link>
          </div>
        )}
      </div>

      {/* Pro Tip */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/40">
         <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
            <Building className="w-64 h-64" />
         </div>
         <div className="max-w-2xl space-y-8 relative z-10">
            <div className="space-y-8">
               <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center border border-white/10">
                  <ShieldCheck className="w-8 h-8 text-primary" />
               </div>
               <div className="space-y-4">
                  <h3 className="text-3xl font-black uppercase tracking-tight leading-none">Trung tâm lưu trữ an toàn</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">Toàn bộ hồ sơ bạn đã thẩm định đều được lưu vết chi tiết cho mục đích đối soát và audit. Bạn có thể xem lại bất kỳ lúc nào để tra cứu thông tin giảng viên và phòng học.</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Hệ thống bảo mật tối đa • Class Booking 4.0</p>
            </div>
         </div>
      </div>
    </div>
  );
}
