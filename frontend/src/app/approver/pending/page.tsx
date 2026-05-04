'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { fetchApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  ShieldCheck, ArrowRight, User, Calendar, MapPin, 
  CheckCircle2, XCircle, Info, MessageCircle, Clock, 
  CheckCircle, Sparkles, Gavel, ArrowUpRight, RefreshCcw
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function ApproverPendingPage() {
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadBookings = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/api/bookings?status=PENDING_APPROVAL');
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
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
                <span>Ban Giám Hiệu</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-800">Chờ Phê Duyệt 🛡️</h1>
            </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl">Quyết định cuối cùng cho các yêu cầu đã qua thẩm định từ Reviewer.</p>
        </div>
      </div>

      {/* Main List */}
      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="h-48 rounded-[2.5rem] bg-slate-100 animate-pulse border border-slate-200/50" />
          ))
        ) : bookings.length > 0 ? (
          bookings.map((b) => (
            <div key={b.id} className="group relative bg-white rounded-[2.5rem] p-1.5 border border-slate-200/50 shadow-2xl shadow-slate-200/20 hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all duration-500 overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 p-8 lg:p-12 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-50 text-emerald-500 border border-emerald-100 px-4 py-1.5 text-[9px] font-black tracking-[0.15em] uppercase rounded-xl">ĐÃ THẨM ĐỊNH</Badge>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">ID: #{b.id.substring(0, 8)}</span>
                      </div>
                      <h3 className="text-3xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors leading-tight">{b.course_name || b.purpose}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="flex items-center gap-5 text-slate-600">
                      <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all">
                        <MapPin className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Địa điểm</p>
                        <p className="font-black text-slate-700">{b.class_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 text-slate-600">
                      <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all">
                        <User className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Reviewer phụ trách</p>
                        <p className="font-black text-slate-700">{b.reviewer_name || 'Hệ thống'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {b.reviewer_note && (
                    <div className="relative p-8 rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group-hover:bg-emerald-50/30 group-hover:border-emerald-100 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ghi chú từ thẩm định viên</p>
                          <p className="text-sm text-slate-600 font-bold italic leading-relaxed">
                            "{b.reviewer_note}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:w-96 bg-emerald-50/30 rounded-[2.2rem] m-2.5 p-10 flex flex-col justify-between items-center text-center gap-8 border border-emerald-100/50 group-hover:bg-emerald-50 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none">
                    <Gavel className="w-40 h-40" />
                  </div>

                  <div className="space-y-2 relative z-10">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Lịch trình dự kiến</p>
                    <p className="text-2xl font-black text-slate-800">{b.slot_name}</p>
                    <p className="text-xs text-slate-600 font-black bg-white px-4 py-1.5 rounded-xl border border-emerald-100 shadow-sm">
                      {format(new Date(b.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                    </p>
                  </div>
                  
                  <div className="w-full space-y-4 relative z-10">
                    <Link href={`/approver/evaluate/${b.id}`} className="block">
                      <button className="w-full py-5 bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.25em] rounded-[1.5rem] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3">
                        <CheckCircle className="w-5 h-5 fill-white" />
                        <span>Phê duyệt hồ sơ</span>
                      </button>
                    </Link>
                    
                    <Link href={`/bookings/${b.id}`} className="inline-flex items-center gap-2.5 text-[10px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-[0.2em] transition-all group/link">
                      <span>Kiểm tra toàn diện</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-32 text-center space-y-8 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20">
            <div className="w-40 h-40 bg-slate-50 rounded-[3.5rem] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-16 h-16 text-slate-200" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-800">Không có yêu cầu chờ duyệt 🧊</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">Tất cả yêu cầu đã được phê duyệt hoặc chưa có hồ sơ mới từ Reviewer.</p>
            </div>
            <button 
              onClick={() => loadBookings()}
              className="px-12 py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] text-[10px] font-black text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 hover:scale-105 transition-all uppercase tracking-[0.2em] flex items-center gap-3 mx-auto"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Làm mới hàng đợi</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
