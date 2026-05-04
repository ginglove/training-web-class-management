'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { fetchApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
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
      await fetchApi(\`/api/bookings/\${id}/claim\`, { method: 'PATCH' });
      toast.success('Đã nhận hồ sơ thành công!');
      loadBookings();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể nhận booking'));
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[1.2rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xl shadow-primary/5">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                <Sparkles className="w-3 h-3" />
                <span>Thẩm định viên</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-800">Hàng đợi Xem xét 📋</h1>
            </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl">Phân loại và thẩm định các yêu cầu đặt phòng mới từ giảng viên để đảm bảo đúng mục tiêu đào tạo.</p>
        </div>

        <div className="flex bg-slate-100/80 backdrop-blur-md p-2 rounded-[1.5rem] border border-slate-200/50 shadow-inner">
          <button className="px-8 py-3 bg-white shadow-xl shadow-slate-200/50 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest transition-all">
            CHỜ XỬ LÝ
          </button>
          <Link href="/reviewer/in-review" className="px-8 py-3 rounded-2xl text-[10px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all">
            ĐANG THỰC HIỆN
          </Link>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-l-4 border-l-primary flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng số chờ</p>
            <p className="text-2xl font-black text-slate-800">{bookings.length}</p>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-amber-500 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Độ ưu tiên cao</p>
            <p className="text-2xl font-black text-slate-800">
              {bookings.filter(b => b.attendee_count > 50).length}
            </p>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-emerald-500 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng học viên</p>
            <p className="text-2xl font-black text-slate-800">
              {bookings.reduce((acc, b) => acc + (b.attendee_count || 0), 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Main List */}
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
                        <Badge className="bg-amber-50 text-amber-500 border border-amber-100 px-4 py-1.5 text-[9px] font-black tracking-[0.15em] uppercase rounded-xl">MỚI GỬI</Badge>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">ID: #{b.id.substring(0, 8)}</span>
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
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Phòng đào tạo</p>
                        <p className="font-black text-slate-700">{b.class_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 text-slate-600">
                      <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                        <Users className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Sĩ số dự kiến</p>
                        <p className="font-black text-slate-700">{b.attendee_count} học viên</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 text-slate-600">
                      <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                        <User className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Giảng viên đăng ký</p>
                        <p className="font-black text-slate-700">{b.creator_name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:w-96 bg-slate-50/50 rounded-[2.2rem] m-2.5 p-10 flex flex-col justify-between items-center text-center gap-8 border border-slate-100 group-hover:bg-primary/5 group-hover:border-primary/10 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none">
                    <Calendar className="w-40 h-40" />
                  </div>

                  <div className="space-y-2 relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thời gian đào tạo</p>
                    <p className="text-2xl font-black text-slate-800">{b.slot_name}</p>
                    <p className="text-xs text-slate-500 font-bold bg-white px-4 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                      {format(new Date(b.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                    </p>
                  </div>
                  
                  <div className="w-full space-y-4 relative z-10">
                    <button 
                      onClick={() => handleClaim(b.id)}
                      className="w-full py-5 bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.25em] rounded-[1.5rem] shadow-2xl shadow-slate-300 hover:bg-black hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <Zap className="w-5 h-5 fill-white" />
                      <span>Nhận thẩm định</span>
                    </button>
                    
                    <Link href={\`/bookings/\${b.id}\`} className="inline-flex items-center gap-2.5 text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-[0.2em] transition-all group/link">
                      <span>Xem hồ sơ gốc</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-32 text-center space-y-8 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20">
            <div className="w-40 h-40 bg-slate-50 rounded-[3.5rem] flex items-center justify-center mx-auto shadow-inner relative">
              <div className="absolute inset-0 bg-primary/5 rounded-[3.5rem] animate-pulse" />
              <ClipboardCheck className="w-16 h-16 text-slate-200 relative z-10" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-800">Hàng đợi đang trống 🧊</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">Tất cả yêu cầu đã được xử lý hoặc chưa có yêu cầu mới nào từ giảng viên.</p>
            </div>
            <button 
              onClick={() => loadBookings()}
              className="px-12 py-5 bg-white border-2 border-slate-100 rounded-[1.5rem] text-[10px] font-black text-slate-400 hover:border-primary hover:text-primary hover:bg-primary/5 hover:scale-105 transition-all uppercase tracking-[0.2em] flex items-center gap-3 mx-auto"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Làm mới danh sách</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
