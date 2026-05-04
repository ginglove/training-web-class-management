'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getErrorMessage } from '@/lib/errorTranslations';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Clock, CheckCircle2, XCircle, 
  AlertCircle, MapPin, Users, FileText, Calendar as CalendarIcon,
  Copy, ChevronRight, History, ShieldCheck, Zap,
  Activity, Sparkles, User, Info, ArrowUpRight,
  Trash2, ExternalLink, Calendar, CheckCircle
} from 'lucide-react';

export default function MyBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [booking, setBooking] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const loadBooking = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/bookings/${id}`);
      setBooking(res.data);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Không thể tải thông tin chi tiết'));
      router.push('/my-bookings');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  React.useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const handleAction = async (action: string) => {
    if (action === 'CANCEL') {
      if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu này?')) return;
      try {
        await fetchApi(`/api/bookings/${booking.id}/cancel`, { method: 'PATCH' });
        toast.success('Đã hủy booking thành công');
        loadBooking();
      } catch (err: any) {
        toast.error(getErrorMessage(err, 'Hủy thất bại'));
      }
    } else if (action === 'CLONE') {
      router.push(`/bookings/new?cloneFrom=${booking.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 space-y-8">
        <div className="relative">
           <div className="w-24 h-24 border-[6px] border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
           <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-8 h-8 text-indigo-200 animate-pulse" />
           </div>
        </div>
        <div className="space-y-2 text-center">
           <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Loading Details</p>
           <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">Đang truy xuất dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const now = new Date();
  const isPastApproved = booking.status === 'APPROVED' && new Date(booking.date) < now;
  
  const getStatusConfig = (status: string) => {
    if (isPastApproved) return { color: 'bg-slate-100 text-slate-800 border-slate-200', icon: CheckCircle2, label: 'Đã hoàn thành' };
    
    switch (status) {
      case 'DRAFT': return { color: 'bg-slate-50 text-slate-500 border-slate-200', icon: FileText, label: 'Bản nháp' };
      case 'PENDING_REVIEW': return { color: 'bg-sky-50 text-sky-600 border-sky-100', icon: Clock, label: 'Chờ Review' };
      case 'IN_REVIEW': return { color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Activity, label: 'Đang Review' };
      case 'PENDING_APPROVAL': return { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: ShieldCheck, label: 'Chờ Duyệt' };
      case 'APPROVED': return { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle, label: 'Đã phê duyệt' };
      case 'REJECTED': return { color: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircle, label: 'Bị từ chối' };
      case 'CANCELLED': return { color: 'bg-slate-50 text-slate-400 border-slate-100', icon: AlertCircle, label: 'Đã hủy' };
      default: return { color: 'bg-slate-100 text-slate-800', icon: Clock, label: status };
    }
  };

  const status = getStatusConfig(booking.status);
  const StatusIcon = status.icon;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4 sm:px-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 pt-8">
        <div className="space-y-6">
          <button 
            onClick={() => router.push('/my-bookings')}
            className="group flex items-center gap-3 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-100 shadow-sm transition-all">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quay lại danh sách</span>
          </button>
          
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.8rem] bg-indigo-900 flex items-center justify-center text-primary shadow-2xl shadow-indigo-900/20 rotate-3 transform">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Badge className={cn("px-4 py-1.5 rounded-[0.8rem] border shadow-sm text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2", status.color)}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </Badge>
                <div className="flex items-center gap-2 text-slate-400">
                   <Clock className="w-3.5 h-3.5" />
                   <span className="text-[10px] font-black uppercase tracking-wider italic">
                      {['APPROVED', 'REJECTED'].includes(booking.status) && booking.updated_at
                        ? `Đã hoàn tất lúc ${format(new Date(booking.updated_at), 'HH:mm dd/MM')}`
                        : booking.created_at ? `Đã gửi ${Math.max(1, Math.floor((new Date().getTime() - new Date(booking.created_at).getTime()) / (1000 * 60 * 60 * 24)))} ngày trước` : 'N/A'}
                   </span>
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-none">Hồ sơ #{booking.id.slice(0,8).toUpperCase()}</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <Button 
            onClick={() => handleAction('CLONE')}
            className="flex-1 lg:flex-none h-16 px-8 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 shadow-xl shadow-slate-200/20 font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-4 hover:border-indigo-500/20 hover:bg-slate-50 transition-all active:scale-95"
          >
            <Copy className="w-5 h-5 text-indigo-500" />
            <span>Sao chép</span>
          </Button>
          
          {['PENDING_REVIEW', 'PENDING_APPROVAL', 'DRAFT'].includes(booking.status) && (
            <Button 
              onClick={() => handleAction('CANCEL')}
              className="flex-1 lg:flex-none h-16 px-8 rounded-2xl bg-rose-50 border-2 border-rose-100 text-rose-600 shadow-xl shadow-rose-200/20 font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-4 hover:bg-rose-100 transition-all active:scale-95"
            >
              <Trash2 className="w-5 h-5" />
              <span>Hủy yêu cầu</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Main Information */}
        <div className="xl:col-span-2 space-y-12">
          <AnimatePresence mode="wait">
            {booking.status === 'REJECTED' && (
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
                     <XCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                     <p className="text-[11px] font-black uppercase tracking-[0.3em]">Critical Feedback</p>
                     <h4 className="text-2xl font-black tracking-tight leading-none">Hồ sơ đã bị từ chối</h4>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 border-2 border-rose-100/50 relative z-10">
                   <p className="text-rose-900 font-bold leading-relaxed text-xl italic">
                     "{booking.approver_note || booking.reviewer_note || 'Hồ sơ bị từ chối do không phù hợp với quy định sử dụng phòng hoặc trùng lịch. Vui lòng kiểm tra lại thông tin.'}"
                   </p>
                </div>
                <div className="flex items-center gap-3 text-rose-400 font-black text-[10px] uppercase tracking-widest px-4">
                   <Info className="w-4 h-4" />
                   <span>Bạn có thể chỉnh sửa và gửi lại hồ sơ mới nếu cần thiết.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="p-10 sm:p-14 rounded-[3.5rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/30 space-y-12 bg-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
               <Sparkles className="w-64 h-64" />
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center gap-3 text-indigo-500">
                  <Activity className="w-5 h-5" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em]">Nội dung đào tạo</span>
               </div>
               <h2 className="text-4xl font-black text-slate-800 leading-[1.1] tracking-tight">
                 {booking.course_name || booking.purpose}
               </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 space-y-6 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all group/item">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200 group-hover/item:rotate-6 transition-transform shadow-lg shadow-indigo-500/10">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phòng & Địa điểm</p>
                  <p className="text-2xl font-black text-slate-800 leading-tight">{booking.class_name}</p>
                  <p className="text-xs text-slate-500 font-bold italic">{booking.class_location}</p>
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 space-y-6 hover:bg-white hover:shadow-xl hover:border-emerald-100 transition-all group/item">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200 group-hover/item:rotate-6 transition-transform shadow-lg shadow-emerald-500/10">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian đào tạo</p>
                  <p className="text-2xl font-black text-slate-800 leading-tight">
                    {format(new Date(booking.date), 'dd MMMM, yyyy', { locale: vi })}
                  </p>
                  <p className="text-xs text-slate-500 font-bold italic">
                    Ca học: {booking.slot_name} ({booking.start_time} - {booking.end_time})
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 space-y-6 hover:bg-white hover:shadow-xl hover:border-amber-100 transition-all group/item">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-200 group-hover/item:rotate-6 transition-transform shadow-lg shadow-amber-500/10">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số lượng học viên</p>
                  <p className="text-2xl font-black text-slate-800 leading-tight">{booking.attendee_count} thành viên</p>
                  <p className="text-xs text-slate-500 font-bold italic">Dự kiến tham gia trực tiếp</p>
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 space-y-6 hover:bg-white hover:shadow-xl hover:border-sky-100 transition-all group/item">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 border border-sky-200 group-hover/item:rotate-6 transition-transform shadow-lg shadow-sky-500/10">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mục tiêu sử dụng</p>
                  <p className="text-2xl font-black text-slate-800 leading-tight line-clamp-1">{booking.reason || 'N/A'}</p>
                  <p className="text-xs text-slate-500 font-bold italic">Lý do đăng ký phòng</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Feedback Card (Standard) */}
          {booking.status !== 'REJECTED' && (
            <Card className="p-10 sm:p-14 rounded-[3.5rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/30 space-y-8 bg-white transition-all">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800">Ghi chú & Phản hồi</h3>
                    <p className="text-sm text-slate-400 font-bold italic">Thông tin từ bộ phận thẩm định và quản lý phòng</p>
                </div>
                <div className="w-12 h-12 rounded-2xl border bg-slate-50 border-slate-100 text-slate-400 flex items-center justify-center">
                    <Info className="w-6 h-6" />
                </div>
              </div>
              
              <div className="p-8 rounded-[2rem] border bg-slate-50 border-slate-100 min-h-[120px] relative">
                <div className="absolute top-6 right-6">
                    <Sparkles className="w-5 h-5 text-indigo-200" />
                </div>
                <p className="font-bold leading-relaxed whitespace-pre-wrap italic text-slate-600">
                  {booking.reviewer_note || booking.approver_note || 'Hiện chưa có phản hồi nào cho yêu cầu này.'}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar / Timeline */}
        <div className="space-y-12">
          {/* 15.3.3 Timeline & Lịch phòng */}
          <Card className="p-10 rounded-[3rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/30 bg-white space-y-10">
            <div className="space-y-2">
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Hành trình hồ sơ</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Theo dõi tiến độ xử lý</p>
            </div>

            <div className="space-y-12 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-1 before:bg-slate-50 before:rounded-full">
              {[
                { 
                  label: 'Khởi tạo hồ sơ', 
                  time: booking.created_at, 
                  icon: FileText, 
                  active: true,
                  color: 'slate'
                },
                { 
                  label: 'Thẩm định nội dung', 
                  time: booking.updated_at, 
                  icon: Activity, 
                  active: ['IN_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(booking.status),
                  color: 'indigo'
                },
                { 
                  label: booking.status === 'REJECTED' ? 'Từ chối hồ sơ' : booking.status === 'CANCELLED' ? 'Đã hủy hồ sơ' : 'Kết quả phê duyệt', 
                  time: booking.updated_at, 
                  icon: booking.status === 'REJECTED' ? XCircle : booking.status === 'CANCELLED' ? AlertCircle : ShieldCheck, 
                  active: ['APPROVED', 'REJECTED', 'CANCELLED'].includes(booking.status),
                  color: booking.status === 'REJECTED' ? 'rose' : booking.status === 'CANCELLED' ? 'slate' : 'emerald'
                }
              ].map((step, i, arr) => {
                const isLastActive = step.active && (i === arr.length - 1 || !arr[i+1].active);
                return (
                  <div key={i} className={cn("relative flex gap-8 transition-all", step.active ? "opacity-100" : "opacity-30 grayscale")}>
                    <div className={cn(
                      "relative z-10 w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-500",
                      step.active ? `bg-${step.color}-50 border-${step.color}-200 text-${step.color}-600 shadow-lg shadow-${step.color}-500/10 scale-110` : "bg-white border-slate-100 text-slate-300"
                    )}>
                      <step.icon className={cn("w-5 h-5", isLastActive && "animate-pulse")} />
                    </div>
                    <div className="space-y-1 py-1">
                      <p className="font-black text-slate-800 leading-none">{step.label}</p>
                      <p className="text-[10px] font-bold text-slate-400 italic">
                        {step.active ? format(new Date(step.time), 'HH:mm, dd/MM/yyyy') : 'Chờ xử lý...'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Phòng Info Context (15.3.3) */}
          <Card className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-6">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                   <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                   <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Thông tin phòng</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Bố cục mặc định</p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Thiết bị</p>
                   <p className="text-xs font-black text-slate-800">Projector, Mic</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Sức chứa</p>
                   <p className="text-xs font-black text-slate-800">45-60 Chỗ</p>
                </div>
             </div>
             <button className="w-full py-3 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors">
                Xem lịch phòng chi tiết
             </button>
          </Card>

          <Card className="p-10 rounded-[3rem] bg-slate-900 border-2 border-slate-900 shadow-2xl shadow-slate-900/20 space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
               <Zap className="w-32 h-32 text-indigo-400" />
            </div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Hỗ trợ khẩn cấp?</h3>
              <p className="text-slate-400 text-sm font-bold leading-relaxed">
                Nếu bạn cần thay đổi lịch trình gấp hoặc có yêu cầu đặc biệt về kỹ thuật, vui lòng liên hệ ngay hotline phòng Đào Tạo.
              </p>
              <button className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-50 hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3">
                <User className="w-4 h-4" />
                <span>Liên hệ quản trị</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
