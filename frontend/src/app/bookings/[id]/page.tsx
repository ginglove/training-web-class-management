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
  ArrowLeft, Check, X, Send, UserCheck, FastForward, 
  Clock, MapPin, Users, Calendar, ClipboardList, MessageSquare,
  Laptop, Info, ChevronRight, Hash, ShieldCheck, Zap,
  CheckCircle, Activity, FileText, Sparkles, User, ArrowUpRight,
  ChevronLeft, Command, Fingerprint
} from 'lucide-react';
import { getErrorMessage } from '@/lib/errorTranslations';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  
  const [booking, setBooking] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState('');

  const loadBooking = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/api/bookings/${params.id}`);
      setBooking(res.data || res); // Handle both formats if necessary
    } catch (err: any) {
      setError(getErrorMessage(err, 'Lỗi khi tải chi tiết booking'));
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const handleAction = async (action: string, payload: any = {}) => {
    try {
      setActionLoading(true);
      setError('');
      await fetchApi(`/api/bookings/${booking.id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      toast.success('Thao tác thành công!');
      await loadBooking();
      setNote('');
    } catch (err: any) {
      const msg = getErrorMessage(err, `Lỗi khi thực hiện thao tác ${action}`);
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
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

  if (error && !booking) return (
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

  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
       <p className="text-slate-400 font-black uppercase tracking-[0.4em] italic text-xl">Hồ sơ không tồn tại 🧊</p>
    </div>
  );

  const role = user?.role;
  const status = booking.status;

  const getStatusConfig = (status: string) => {
    const configs: any = {
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
              <div className="flex items-center gap-3 bg-white border border-slate-100 pl-2 pr-6 py-2 rounded-2xl shadow-xl shadow-slate-200/30">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm shadow-lg shadow-primary/20">
                  {booking.creator_name?.charAt(0)}
                </div>
                <div className="space-y-0.5">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Chủ hồ sơ</p>
                   <p className="text-slate-800 text-sm font-black tracking-tight leading-none">{booking.creator_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 px-5 py-3 rounded-2xl border border-slate-100">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Khởi tạo: {formatDate(booking.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Content */}
        <div className="lg:col-span-8 space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "relative bg-white rounded-[4rem] p-12 sm:p-16 border-2 shadow-2xl transition-all",
              status === 'REJECTED' ? "border-rose-200 shadow-rose-200/20" : "border-slate-100 shadow-slate-200/40"
            )}
          >
            <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none rotate-12 group-hover:rotate-0 transition-transform duration-1000">
              <FileText className="w-80 h-80" />
            </div>

            <div className="space-y-16 relative z-10">
              {/* 15.3.4 Rejection Feedback */}
              <AnimatePresence>
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
                         "{booking.logs?.find((l: any) => l.to_status === 'REJECTED')?.comment || 'Không có lý do chi tiết được cung cấp. Vui lòng liên hệ quản trị viên.'}"
                       </p>
                    </div>
                    <div className="flex items-center gap-3 text-rose-400 font-black text-[10px] uppercase tracking-widest px-4">
                       <Info className="w-4 h-4" />
                       <span>Bạn có thể chỉnh sửa và gửi lại hồ sơ mới nếu cần thiết.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 border-2 border-indigo-100 shadow-xl shadow-indigo-500/5 rotate-6">
                  <ClipboardList className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em]">Resource allocation</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">Thông tin đào tạo</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-16 gap-x-20">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Nội dung & Khóa học</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 leading-[1.1] tracking-tight">{booking.course_name}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Phòng & Cơ sở</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-black text-slate-900 leading-[1.1] tracking-tight">{booking.class_name}</p>
                    <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 inline-block">{booking.class_location}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Ngày tổ chức</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 leading-[1.1] tracking-tight">{formatDate(booking.date)}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shadow-lg shadow-primary/5">
                      <Zap className="w-5 h-5 fill-primary" />
                    </div>
                    <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Thời gian học</p>
                  </div>
                  <p className="text-3xl font-black text-primary leading-[1.1] uppercase tracking-tighter">{booking.slot_name}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                      <Users className="w-5 h-5" />
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Quy mô học viên</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 leading-[1.1] tracking-tight">{booking.attendee_count} thành viên</p>
                </div>

                <div className="col-span-1 md:col-span-2 pt-12">
                  <div className="relative p-12 rounded-[3.5rem] bg-slate-50 border-2 border-slate-100 group overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700">
                      <MessageSquare className="w-56 h-56" />
                    </div>
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                       <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Mục đích chi tiết</p>
                    </div>
                    <p className="text-slate-700 font-bold leading-relaxed text-2xl sm:text-3xl relative z-10 italic">
                      "{booking.purpose}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>


        {/* Right: Sidebar Actions */}
        <div className="lg:col-span-4 space-y-12">
          <div className="sticky top-12 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-12 border-2 border-slate-100 shadow-2xl shadow-slate-200/50 rounded-[3.5rem] bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-3 bg-primary shadow-xl shadow-primary/20" />
                
                <div className="space-y-12">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-100 shadow-xl shadow-emerald-500/10 rotate-12">
                      <Zap className="w-6 h-6 fill-emerald-600" />
                    </div>
                    <div className="space-y-0.5">
                       <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Authority Hub</p>
                       <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Thao tác nhanh</h3>
                    </div>
                  </div>
                  
                  <div className="space-y-10">
                    {/* Creator Actions */}
                    {role === 'CREATOR' && status === 'DRAFT' && (
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between px-2">
                             <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ghi chú xử lý</label>
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{note.length}/500</span>
                          </div>
                          <textarea 
                            placeholder="Nhập ghi chú cho Reviewer (không bắt buộc)..."
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] p-8 text-sm font-black focus:border-indigo-500/30 focus:bg-white transition-all outline-none h-48 resize-none shadow-inner placeholder:italic placeholder:font-bold placeholder:text-slate-300"
                            value={note} onChange={e => setNote(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={() => handleAction('submit', { comment: note })} 
                          isLoading={actionLoading}
                          className="w-full py-7 flex justify-center items-center gap-4 rounded-[2rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/30 hover:bg-black hover:scale-[1.05] active:scale-95 transition-all group"
                        >
                          <Send className="w-6 h-6 text-primary group-hover:rotate-12 transition-transform" /> 
                          <span className="font-black text-[12px] uppercase tracking-[0.3em]">Gửi Phê Duyệt</span>
                        </Button>
                      </div>
                    )}
                    
                    {role === 'CREATOR' && ['DRAFT', 'PENDING_REVIEW'].includes(status) && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleAction('cancel', { reason: note })} 
                        isLoading={actionLoading}
                        className="w-full py-7 flex justify-center items-center gap-4 rounded-[2rem] border-2 border-slate-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm font-black text-[12px] uppercase tracking-[0.3em]"
                      >
                        <X className="w-6 h-6" /> 
                        <span>Hủy Yêu Cầu</span>
                      </Button>
                    )}

                    {/* Reviewer Actions */}
                    {role === 'REVIEWER' && status === 'PENDING_REVIEW' && (
                      <div className="space-y-10">
                        <div className="p-10 bg-indigo-50 rounded-[3rem] border-2 border-indigo-100 space-y-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-5">
                             <ShieldCheck className="w-32 h-32 text-indigo-600" />
                          </div>
                          <div className="flex items-center gap-4 text-indigo-600 relative z-10">
                            <Info className="w-6 h-6" />
                            <span className="font-black text-[11px] uppercase tracking-[0.3em]">Quyền Thẩm Định</span>
                          </div>
                          <p className="text-base text-indigo-700 font-bold leading-relaxed relative z-10 italic">
                            Bạn cần nhận hồ sơ này để thực hiện đánh giá chuyên môn và thẩm quyền.
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleAction('claim')} 
                          isLoading={actionLoading}
                          className="w-full py-7 flex justify-center items-center gap-4 rounded-[2rem] bg-indigo-600 shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-[1.05] active:scale-95 transition-all text-white font-black text-[12px] uppercase tracking-[0.3em] group"
                        >
                          <UserCheck className="w-7 h-7 group-hover:scale-110 transition-transform" /> 
                          <span>Tiếp Nhận Hồ Sơ</span>
                        </Button>
                      </div>
                    )}

                    {role === 'REVIEWER' && status === 'IN_REVIEW' && booking.reviewer_id === user?.id && (
                      <div className="space-y-8">
                        <div className="p-10 bg-amber-50 rounded-[3rem] border-2 border-amber-100 space-y-4">
                           <div className="flex items-center gap-3 text-amber-600">
                              <Activity className="w-5 h-5" />
                              <p className="text-[11px] font-black uppercase tracking-[0.3em] leading-none">Process Active</p>
                           </div>
                           <p className="text-amber-800 font-black text-2xl leading-tight tracking-tight italic">Đang thẩm định...</p>
                        </div>
                        <Button 
                          onClick={() => router.push(`/reviewer/evaluate/${booking.id}`)}
                          className="w-full py-7 flex justify-center items-center gap-4 rounded-[2rem] bg-slate-900 text-white shadow-2xl shadow-slate-900/30 hover:bg-black hover:scale-[1.05] active:scale-95 transition-all group"
                        >
                          <FileText className="w-6 h-6 text-primary" /> 
                          <span className="font-black text-[12px] uppercase tracking-[0.3em]">Mở Bảng Đánh Giá</span>
                        </Button>
                      </div>
                    )}

                    {/* Approver Actions */}
                    {role === 'APPROVER' && status === 'PENDING_APPROVAL' && (
                      <div className="space-y-8">
                        <div className="p-10 bg-emerald-50 rounded-[3rem] border-2 border-emerald-100 space-y-4">
                           <div className="flex items-center gap-3 text-emerald-600">
                              <ShieldCheck className="w-5 h-5" />
                              <p className="text-[11px] font-black uppercase tracking-[0.3em] leading-none">Final Stage</p>
                           </div>
                           <p className="text-emerald-800 font-black text-2xl leading-tight tracking-tight italic">Chờ phê duyệt cuối...</p>
                        </div>
                        <Button 
                          onClick={() => router.push(`/approver/evaluate/${booking.id}`)}
                          className="w-full py-7 flex justify-center items-center gap-4 rounded-[2rem] bg-emerald-600 shadow-2xl shadow-emerald-500/30 hover:bg-emerald-700 hover:scale-[1.05] active:scale-95 transition-all text-white font-black text-[12px] uppercase tracking-[0.3em] group"
                        >
                          <CheckCircle className="w-7 h-7 group-hover:scale-110 transition-transform" /> 
                          <span>Phê Duyệt Ngay</span>
                        </Button>
                      </div>
                    )}

                    {/* Final State */}
                    {!['DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL'].includes(status) && (
                      <div className="p-12 bg-slate-50 rounded-[4rem] text-center space-y-10 border-2 border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                           <Command className="w-32 h-32" />
                        </div>
                        <div className={cn("w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl ring-[12px] ring-offset-0 transition-all duration-700 group-hover:scale-110 group-hover:rotate-[360deg]", 
                          status === 'APPROVED' ? "bg-emerald-500 text-white ring-emerald-50" : "bg-rose-500 text-white ring-rose-50"
                        )}>
                          {status === 'APPROVED' ? <Check className="w-14 h-14" /> : <X className="w-14 h-14" />}
                        </div>
                        <div className="space-y-4 relative z-10">
                          <p className="font-black text-slate-800 text-3xl tracking-tighter leading-none uppercase">Quy trình Đã đóng</p>
                          <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.3em]">
                            Lưu trữ hồ sơ hệ thống
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* 15.3.3 Hành trình Phê duyệt (Timeline) */}
              <div className="bg-white rounded-[4rem] p-12 sm:p-14 border-2 border-slate-100 shadow-2xl shadow-slate-200/50 space-y-12 mb-12">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center text-slate-400 border-2 border-slate-100">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Decision journey</p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Hành trình Phê duyệt</h3>
                  </div>
                </div>
                
                <div className="relative pl-12 space-y-16">
                  <div className="absolute left-6 top-4 bottom-4 w-[2px] bg-slate-100 border-dashed border-l-2" />
                  
                  {booking.logs?.map((log: any, idx: number) => (
                    <div key={log.id} className="relative group/log">
                      <div className={cn(
                        "absolute -left-[54px] top-1 w-10 h-10 rounded-2xl border-[6px] border-white shadow-2xl z-10 flex items-center justify-center transition-all",
                        idx === 0 ? "bg-primary text-white ring-8 ring-primary/10" : "bg-slate-100 text-slate-400"
                      )}>
                        {idx === 0 ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="font-black text-slate-900 text-xl tracking-tight leading-none">{log.actor_name}</p>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{log.actor_role}</p>
                        </div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{formatDate(log.created_at)}</p>
                        
                        <div className="bg-slate-50/80 rounded-3xl p-6 border-2 border-slate-50 transition-all group-hover/log:bg-white group-hover/log:shadow-xl group-hover/log:border-slate-100">
                           <div className="flex items-center gap-3 text-[9px] font-black uppercase mb-4">
                              <span className="text-slate-400 line-through">{log.from_status || 'NEW'}</span>
                              <ChevronRight className="w-4 h-4 text-primary" />
                              <span className="text-primary">{log.to_status}</span>
                           </div>
                           {log.comment && (
                             <p className="text-sm text-slate-500 font-bold leading-relaxed italic border-t border-slate-100 pt-4">
                               "{log.comment}"
                             </p>
                           )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 15.3.3 Thông tin phòng (Lịch phòng) */}
              <div className="p-10 rounded-[3.5rem] bg-slate-900 border-2 border-slate-800 space-y-8 shadow-2xl relative overflow-hidden group mb-12">
                 <div className="absolute -right-8 -top-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                    <MapPin className="w-48 h-48 text-white" />
                 </div>
                 <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10">
                          <Info className="w-6 h-6" />
                       </div>
                       <div className="space-y-0.5">
                          <p className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.3em]">Facility Insight</p>
                          <h4 className="text-2xl font-black text-white tracking-tight leading-none">Thông tin phòng</h4>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                       <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors">
                          <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Sức chứa tối đa</p>
                          <p className="text-lg font-black text-white">45 - 60 Học viên</p>
                       </div>
                       <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors">
                          <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Trang thiết bị</p>
                          <p className="text-lg font-black text-white">Projector, High-speed Wifi, Mic</p>
                       </div>
                    </div>
                    <button className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black text-[12px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3">
                       <Calendar className="w-5 h-5" />
                       <span>Xem Lịch Phòng Toàn Cục</span>
                    </button>
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
          </motion.div>
        </div>
      </div>
    </div>
  </div>
  );
}
