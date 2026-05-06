'use client';

import * as React from 'react';
import { fetchApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { safeFormat } from '@/lib/date-utils';
import { 
  History, User, Calendar, MapPin, 
  ClipboardEdit, Forward, 
  Sparkles, Layers, ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: string;
  course_name?: string;
  purpose?: string;
  class_name?: string;
  date: string;
  slot_name: string;
  creator_name: string;
  updated_at: string;
}

export default function ReviewerInReviewPage() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadBookings = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/api/bookings?status=IN_REVIEW');
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-xl shadow-indigo-500/5">
              <ClipboardEdit className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
                <Sparkles className="w-3 h-3" />
                <span>Thẩm định viên</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-800">Đang Thực Hiện 📝</h1>
            </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl">Danh sách các yêu cầu bạn đang trực tiếp thẩm định. Vui lòng hoàn tất sớm để gửi phê duyệt.</p>
        </div>

        <div className="flex bg-slate-100/80 backdrop-blur-md p-2 rounded-[1.5rem] border border-slate-200/50 shadow-inner">
          <Link href="/reviewer/pending" className="px-8 py-3 rounded-2xl text-[10px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all">
            CHỜ XỬ LÝ
          </Link>
          <button className="px-8 py-3 bg-white shadow-xl shadow-slate-200/50 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest transition-all">
            ĐANG THỰC HIỆN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="h-48 rounded-[2.5rem] bg-slate-100 animate-pulse border border-slate-200/50" />
          ))
        ) : bookings.length > 0 ? (
          bookings.map((b) => (
            <div key={b.id} className="group relative bg-white rounded-[2.5rem] p-1.5 border border-slate-200/50 shadow-2xl shadow-slate-200/20 hover:shadow-primary/10 hover:border-primary/30 transition-all duration-500 overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 p-8 lg:p-12 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-indigo-50 text-indigo-500 border border-indigo-100 px-4 py-1.5 text-[9px] font-black tracking-[0.15em] uppercase rounded-xl">ĐANG XỬ LÝ</Badge>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                          Bắt đầu: {safeFormat(b.updated_at, 'HH:mm • dd/MM')}
                        </span>
                      </div>
                      <h3 className="text-3xl font-black text-slate-800 group-hover:text-primary transition-colors leading-tight">{b.course_name || b.purpose}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="flex items-center gap-5 text-slate-600">
                      <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                        <MapPin className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Vị trí</p>
                        <p className="font-black text-slate-700">{b.class_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 text-slate-600">
                      <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                        <Calendar className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Ngày học</p>
                        <p className="font-black text-slate-700">{safeFormat(b.date, 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 text-slate-600">
                      <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                        <User className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Giảng viên</p>
                        <p className="font-black text-slate-700">{b.creator_name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:w-96 bg-primary/5 rounded-[2.2rem] m-2.5 p-10 flex flex-col justify-between items-center text-center gap-8 border border-primary/10 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none">
                    <Layers className="w-40 h-40" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Tiết học</p>
                    <p className="text-2xl font-black text-slate-800">{b.slot_name}</p>
                    <p className="text-xs text-slate-500 font-bold italic bg-white/50 px-4 py-1.5 rounded-xl border border-primary/5">Cần hoàn thành thẩm định sớm</p>
                  </div>
                  <div className="w-full space-y-4 relative z-10">
                    <Link href={`/reviewer/evaluate/${b.id}`} className="block">
                      <button className="w-full py-5 bg-primary text-white font-black text-[11px] uppercase tracking-[0.25em] rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3">
                        <Forward className="w-5 h-5 fill-white" />
                        <span>Tiếp tục Xử lý</span>
                      </button>
                    </Link>
                    <Link href={`/bookings/${b.id}`} className="inline-flex items-center gap-2.5 text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-[0.2em] transition-all group/link">
                      <span>Xem chi tiết hồ sơ</span>
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
              <History className="w-16 h-16 text-slate-200" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-800">Không có hồ sơ đang xử lý 🧊</h3>
              <p className="text-slate-500 font-medium max-sm mx-auto leading-relaxed">Bạn chưa tiếp nhận hồ sơ nào hoặc đã hoàn tất toàn bộ danh sách cá nhân.</p>
            </div>
            <Link href="/reviewer/pending">
              <button className="px-12 py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] text-[10px] font-black text-primary hover:border-primary hover:bg-primary/5 hover:scale-105 transition-all uppercase tracking-[0.2em]">
                Đến hàng đợi Xem xét
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
