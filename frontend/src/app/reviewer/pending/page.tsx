'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { fetchApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { safeFormat } from '@/lib/date-utils';
import { 
  ClipboardCheck, ArrowRight, User, Calendar, 
  MapPin, Users, Zap, Search, Clock, Sparkles,
  Inbox, Filter, RefreshCcw
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/errorTranslations';
import { cn } from '@/lib/utils';

export default function ReviewerPendingPage() {
  const [bookings, setBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadBookings = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/api/bookings?status=PENDING_REVIEW');
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

  const handleClaim = async (id: string) => {
    try {
      await fetchApi(`/api/bookings/${id}/claim`, { method: 'PATCH' });
      toast.success('Đã nhận review thành công!');
      loadBookings();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Lỗi khi nhận review'));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[1.2rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xl shadow-primary/5">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                <Sparkles className="w-3 h-3" />
                <span>Reviewer</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-800">Hàng đợi Chờ duyệt 📥</h1>
            </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">
            Xem xét và xử lý các yêu cầu đặt phòng mới từ Creator để đảm bảo các tiêu chuẩn đào tạo của hệ thống.
          </p>
        </div>

        <div className="flex bg-slate-100/80 backdrop-blur-md p-2 rounded-[1.5rem] border border-slate-200/50 shadow-inner">
          <button className="px-8 py-3 bg-white shadow-xl shadow-slate-200/50 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest transition-all">
            CHỜ XỬ LÝ
          </button>
          <Link href="/reviewer/in-review" className="px-8 py-3 rounded-2xl text-[10px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all">
            ĐANG REVIEW
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 border-none bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/20 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng chờ</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{bookings.length}</p>
          </div>
        </Card>
        <Card className="p-8 border-none bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/20 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
            <Zap className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ưu tiên cao</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">
              {bookings.filter(b => b.attendee_count > 50).length}
            </p>
          </div>
        </Card>
        <Card className="p-8 border-none bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/20 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng học viên</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">
              {bookings.reduce((acc, b) => acc + (b.attendee_count || 0), 0)}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="h-56 rounded-[3rem] bg-white border border-slate-100 animate-pulse shadow-sm" />
          ))
        ) : bookings.length > 0 ? (
          bookings.map((b) => (
            <div key={b.id} className="group relative bg-white rounded-[3rem] p-2 border border-slate-100 shadow-2xl shadow-slate-200/30 hover:shadow-primary/10 hover:border-primary/20 transition-all duration-500 overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                <div className="flex-1 p-10 lg:p-12 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-amber-500 text-white border-none px-4 py-1.5 text-[9px] font-black tracking-[0.2em] uppercase rounded-xl shadow-lg shadow-amber-500/20">MỚI</Badge>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">MÃ YÊU CẦU: #{b.id.substring(0, 8)}</span>
                      </div>
                      <h3 className="text-3xl font-black text-slate-800 group-hover:text-primary transition-colors leading-tight tracking-tight">{b.course_name || b.purpose}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all shadow-sm">
                        <MapPin className="w-7 h-7 text-slate-300 group-hover:text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Phòng học</p>
                        <p className="font-black text-slate-700 tracking-tight">{b.class_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all shadow-sm">
                        <Users className="w-7 h-7 text-slate-300 group-hover:text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sức chứa</p>
                        <p className="font-black text-slate-700 tracking-tight">{b.attendee_count} người</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all shadow-sm">
                        <User className="w-7 h-7 text-slate-300 group-hover:text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Người tạo</p>
                        <p className="font-black text-slate-700 tracking-tight">{b.creator_name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:w-96 bg-slate-50/50 rounded-[2.8rem] m-2 p-10 flex flex-col justify-between items-center text-center gap-8 border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/10 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none">
                    <Calendar className="w-40 h-40" />
                  </div>
                  <div className="space-y-3 relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Lịch trình</p>
                    <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">{b.slot_name}</p>
                    <div className="bg-white px-6 py-2 rounded-2xl border border-slate-100 shadow-sm inline-block">
                       <p className="text-xs text-primary font-black uppercase tracking-widest">
                         {safeFormat(b.date, 'EEEE, dd/MM/yyyy')}
                       </p>
                    </div>
                  </div>
                  <div className="w-full space-y-4 relative z-10">
                    <button onClick={() => handleClaim(b.id)} className="w-full py-6 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[1.8rem] shadow-2xl shadow-slate-900/20 hover:bg-black hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn">
                      <Zap className="w-5 h-5 fill-primary text-primary group-hover:scale-110 transition-transform" />
                      <span>NHẬN REVIEW</span>
                    </button>
                    <Link href={`/bookings/${b.id}`} className="inline-flex items-center gap-3 text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-[0.2em] transition-all group/link">
                      <span>XEM CHI TIẾT</span>
                      <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-32 text-center space-y-8 bg-white rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/30">
            <div className="w-44 h-44 bg-slate-50 rounded-[4rem] flex items-center justify-center mx-auto shadow-inner relative group">
              <div className="absolute inset-0 bg-primary/5 rounded-[4rem] animate-pulse group-hover:scale-110 transition-transform" />
              <ClipboardCheck className="w-20 h-20 text-slate-200 relative z-10 group-hover:text-primary/20 transition-colors" />
            </div>
            <div className="space-y-3">
              <h3 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Hàng đợi trống 🧊</h3>
              <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed italic">Hiện tại không có yêu cầu nào đang chờ xử lý. Hãy quay lại sau!</p>
            </div>
            <button onClick={() => loadBookings()} className="px-12 py-6 bg-white border-2 border-slate-100 rounded-[2rem] text-[10px] font-black text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 hover:scale-105 transition-all uppercase tracking-[0.25em] flex items-center gap-4 mx-auto shadow-sm">
              <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <span>LÀM MỚI DANH SÁCH</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
