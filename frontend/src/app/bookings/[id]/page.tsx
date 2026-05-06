'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { fetchApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { 
  X, Send, UserCheck, 
  Clock, MapPin, Users, Calendar, ClipboardList, MessageSquare,
  Laptop, Info, Hash, ShieldCheck, Zap,
  CheckCircle, Activity, 
  ChevronLeft, Command, Fingerprint
} from 'lucide-react';
import { getErrorMessage } from '@/lib/errorTranslations';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Log {
  id: string;
  actor_name: string;
  actor_role: string;
  from_status: string;
  to_status: string;
  comment?: string;
  created_at: string;
}

interface Booking {
  id: string;
  course_name: string;
  purpose: string;
  class_name: string;
  class_location: string;
  date: string;
  slot_name: string;
  attendee_count: number;
  status: string;
  creator_name: string;
  created_at: string;
  reviewer_id?: string;
  logs: Log[];
}

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuthStore();
  
  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadBooking = React.useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetchApi(`/api/bookings/${id}`);
      setBooking(res.data || res); 
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Lỗi khi tải chi tiết booking'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const handleAction = async (action: string, payload: Record<string, unknown> = {}) => {
    if (!booking) return;
    try {
      setActionLoading(true);
      setError('');
      await fetchApi(`/api/bookings/${booking.id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      toast.success('Thao tác thành công!');
      await loadBooking();
    } catch (err: unknown) {
      const msg = getErrorMessage(err, `Lỗi khi thực hiện thao tác ${action}`);
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="relative">
          <div className="w-24 h-24 border-[8px] border-slate-100 border-t-primary rounded-full animate-spin shadow-inner" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Command className="w-8 h-8 text-primary/30 animate-pulse" />
          </div>
        </div>
        <div className="mt-8 space-y-2 text-center">
          <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Đang nạp hồ sơ</p>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">Vui lòng đợi trong giây lát...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <Card className="p-16 text-center space-y-8 max-w-md bg-white rounded-[3.5rem] shadow-2xl border-none">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-rose-100 rotate-12">
            <X className="w-12 h-12" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">{error}</h2>
            <p className="text-slate-500 font-bold italic leading-relaxed">Hồ sơ có thể đã bị xóa hoặc bạn không có quyền truy cập vào tài nguyên này.</p>
          </div>
          <Button 
            onClick={() => router.back()} 
            className="w-full py-6 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs hover:bg-black transition-all"
          >
            Quay lại trang trước
          </Button>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
         <p className="text-slate-400 font-black uppercase tracking-[0.4em] italic text-xl">Hồ sơ không tồn tại 🧊</p>
      </div>
    );
  }

  const role = user?.role;
  const status = booking.status;

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string, label: string }> = {
      'DRAFT': { color: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Bản nháp' },
      'PENDING_REVIEW': { color: 'bg-sky-50 text-sky-600 border-sky-100', label: 'Chờ Thẩm định' },
      'IN_REVIEW': { color: 'bg-indigo-50 text-indigo-600 border-indigo-100', label: 'Đang Thẩm định' },
      'PENDING_APPROVAL': { color: 'bg-amber-50 text-amber-600 border-amber-100', label: 'Chờ Phê duyệt' },
      'APPROVED': { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Đã phê duyệt' },
      'REJECTED': { color: 'bg-rose-50 text-rose-600 border-rose-100', label: 'Bị từ chối' },
      'CANCELLED': { color: 'bg-slate-50 text-slate-400 border-slate-100', label: 'Đã hủy' },
    };
    return configs[status] || { color: 'bg-slate-100 text-slate-600', label: status };
  };

  const statusConfig = getStatusConfig(status);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32 px-4 sm:px-6">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 pt-12">
        <div className="flex flex-col sm:flex-row items-start gap-8">
          <button 
            onClick={() => router.back()}
            className="w-16 h-16 bg-white border-2 border-slate-100 rounded-[1.5rem] flex items-center justify-center hover:bg-slate-900 hover:border-slate-900 hover:text-white transition-all group shrink-0 shadow-2xl shadow-slate-200/50 active:scale-90"
          >
            <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-5">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-3 px-5 py-2 bg-slate-900 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest shadow-xl shadow-slate-900/20">
                <Hash className="w-4 h-4 text-primary" />
                ID: {booking.id.substring(0,8).toUpperCase()}
              </span>
              <Badge className={cn("px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] border-2 shadow-sm", statusConfig.color)}>
                {statusConfig.label}
              </Badge>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-slate-900 leading-none">Chi tiết Hồ sơ 📄</h1>
            <div className="flex items-center gap-8 text-slate-500 font-bold flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Khởi tạo: {formatDate(booking.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Người tạo: {booking.creator_name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
           {status === 'DRAFT' && role === 'CREATOR' && (
             <Button 
               onClick={() => handleAction('submit')}
               disabled={actionLoading}
               className="h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
             >
               <Send className="w-5 h-5" />
               Gửi thẩm định ngay
             </Button>
           )}
           {status === 'PENDING_REVIEW' && (role === 'REVIEWER' || role === 'ADMIN') && (
              <Button 
                onClick={() => router.push(`/reviewer/evaluate/${booking.id}`)}
                className="h-16 px-10 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest shadow-2xl shadow-indigo-200 flex items-center gap-3 hover:bg-indigo-700 transition-all"
              >
                <UserCheck className="w-5 h-5" />
                Thẩm định hồ sơ
              </Button>
           )}
           {status === 'PENDING_APPROVAL' && (role === 'APPROVER' || role === 'ADMIN') && (
              <Button 
                onClick={() => router.push(`/approver/bookings/${booking.id}`)}
                className="h-16 px-10 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest shadow-2xl shadow-emerald-200 flex items-center gap-3 hover:bg-emerald-700 transition-all"
              >
                <CheckCircle className="w-5 h-5" />
                Phê duyệt hồ sơ
              </Button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          {/* Main Info Card */}
          <Card className="p-10 lg:p-14 rounded-[4rem] bg-white border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none">
              <ClipboardList className="w-64 h-64" />
            </div>
            
            <div className="relative space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex items-center gap-4 text-primary font-black text-[11px] uppercase tracking-[0.3em]">
                    <Clock className="w-5 h-5" />
                    <span>Lịch đào tạo</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <Calendar className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ngày đào tạo</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tight">{formatDate(booking.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <Clock className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ca học</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tight">{booking.slot_name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4 text-primary font-black text-[11px] uppercase tracking-[0.3em]">
                    <MapPin className="w-5 h-5" />
                    <span>Địa điểm & Quy mô</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <MapPin className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Phòng học</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tight">{booking.class_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{booking.class_location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <Users className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Số lượng SV</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tight">{booking.attendee_count} sinh viên</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-12 border-t border-slate-100 space-y-6">
                <div className="flex items-center gap-4 text-primary font-black text-[11px] uppercase tracking-[0.3em]">
                  <Laptop className="w-5 h-5" />
                  <span>Nội dung khóa học</span>
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-tight">{booking.course_name}</h3>
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 relative group">
                    <MessageSquare className="absolute top-6 right-6 w-8 h-8 text-slate-200 opacity-50" />
                    <p className="text-slate-600 font-medium leading-relaxed text-lg italic">&quot;{booking.purpose}&quot;</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <AnimatePresence mode="wait">
            {status === 'REJECTED' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 rounded-[3rem] bg-rose-50 border-4 border-rose-200 shadow-2xl shadow-rose-200/40 space-y-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <ShieldCheck className="w-32 h-32 text-rose-600" />
                </div>
                <div className="flex items-center gap-4 text-rose-600 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                      <X className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                      <p className="text-[11px] font-black uppercase tracking-[0.3em]">Critical Feedback</p>
                      <h4 className="text-2xl font-black tracking-tight leading-none">Hồ sơ đã bị từ chối</h4>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 border-2 border-rose-100/50 relative z-10">
                    <p className="text-rose-900 font-bold leading-relaxed text-xl italic">
                      &quot;{booking.logs?.find((l: Log) => l.to_status === 'REJECTED')?.comment || 'Không có lý do chi tiết được cung cấp. Vui lòng liên hệ quản trị viên.'}&quot;
                    </p>
                </div>
                <div className="flex items-center gap-3 text-rose-400 font-black text-[10px] uppercase tracking-widest px-4">
                    <Info className="w-4 h-4" />
                    <span>Bạn có thể chỉnh sửa và gửi lại hồ sơ mới nếu cần thiết.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 border-2 border-indigo-100 shadow-xl shadow-indigo-500/5 rotate-6">
                <ClipboardList className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Nhật ký Audit 📜</h2>
            </div>
            
            <div className="relative space-y-6 before:absolute before:left-8 before:top-2 before:bottom-2 before:w-1 before:bg-slate-100 before:rounded-full">
              {booking.logs?.map((log, i) => (
                <div key={log.id} className="relative pl-24 group">
                  <div className={cn(
                    "absolute left-5 top-1 w-7 h-7 rounded-full border-4 border-white shadow-lg z-10 transition-transform group-hover:scale-125",
                    i === 0 ? "bg-primary" : "bg-slate-300"
                  )} />
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 space-y-3 group-hover:border-primary/20 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{log.actor_name}</span>
                          <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-black uppercase tracking-widest px-3">{log.actor_role}</Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formatDate(log.created_at)}</p>
                      </div>
                      <Badge className="bg-indigo-50 text-indigo-600 border-none text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl">
                        {log.to_status}
                      </Badge>
                    </div>
                    {log.comment && (
                      <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500 font-medium italic">
                        &quot;{log.comment}&quot;
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
          <div className="sticky top-12 space-y-10">
              {/* Context Summary */}
              <div className="p-10 rounded-[3.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-150 transition-transform duration-700">
                    <Zap className="w-40 h-40 fill-white" />
                  </div>
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4 text-indigo-200 font-black text-[11px] uppercase tracking-[0.4em]">
                       <Activity className="w-5 h-5" />
                       <span>Tóm lược trạng thái</span>
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-3xl font-black tracking-tight leading-none">Vận hành Đào tạo</h3>
                       <p className="text-indigo-100 font-bold text-sm leading-relaxed opacity-80 uppercase tracking-wider">Hồ sơ này đang ở bước <span className="text-white underline decoration-wavy underline-offset-4">{statusConfig.label}</span> trong quy trình nghiệp vụ.</p>
                    </div>
                    <div className="space-y-4 pt-4">
                       <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors">
                          <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Trang thiết bị</p>
                          <p className="text-lg font-black text-white">Projector, High-speed Wifi, Mic</p>
                       </div>
                    </div>
                    <Button 
                      onClick={() => router.push('/schedule')}
                      className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black text-[12px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3"
                    >
                       <Calendar className="w-5 h-5" />
                       <span>Xem Lịch Phòng Toàn Cục</span>
                    </Button>
                  </div>
              </div>

              {/* Security Context */}
              <div className="p-10 bg-slate-900 rounded-[3.5rem] border-2 border-slate-800 space-y-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-15 transition-opacity duration-1000 rotate-12 group-hover:rotate-0">
                   <Fingerprint className="w-48 h-48 text-white" />
                </div>
                <div className="flex items-center gap-4 text-indigo-400 font-black text-[11px] uppercase tracking-[0.4em]">
                  <ShieldCheck className="w-6 h-6" />
                  <span>Identity Integrity</span>
                </div>
                <p className="text-sm text-slate-400 font-bold leading-relaxed relative z-10 italic">
                  Hệ thống đảm bảo tính toàn vẹn của hồ sơ thông qua chữ ký số và nhật ký audit bất biến. Mọi thao tác đều được truy vết thời gian thực.
                </p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
