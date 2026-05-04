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
  CheckCircle, Activity, FileText, Sparkles, User, ArrowUpRight
} from 'lucide-react';
import { getErrorMessage } from '@/lib/errorTranslations';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  
  const [booking, setBooking] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    loadBooking();
  }, [params.id]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/api/bookings/${params.id}`);
      setBooking(res);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Lỗi khi tải chi tiết booking'));
    } finally {
      setLoading(false);
    }
  };

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
    <div className="flex flex-col items-center justify-center p-40 space-y-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Đang nạp dữ liệu hồ sơ...</p>
    </div>
  );

  if (error && !booking) return (
    <div className="p-20 text-center space-y-6 max-w-md mx-auto">
      <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-rose-100">
        <X className="w-10 h-10" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{error}</h2>
        <p className="text-slate-500 font-medium italic">Hồ sơ có thể đã bị xóa hoặc bạn không có quyền truy cập.</p>
      </div>
      <Button onClick={() => router.back()} className="px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Quay lại trang trước</Button>
    </div>
  );

  if (!booking) return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest italic">Hồ sơ không tồn tại 🧊</div>;

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
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex items-start gap-8">
          <button 
            onClick={() => router.back()}
            className="w-16 h-16 bg-white border border-slate-200 rounded-[1.5rem] flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all group shrink-0 shadow-xl shadow-slate-200/50"
          >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-slate-900/10">
                <Hash className="w-3.5 h-3.5 text-primary" />
                ID: {booking.id.substring(0,8)}
              </span>
              <Badge className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm", statusConfig.color)}>
                {statusConfig.label}
              </Badge>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-800">Chi tiết Hồ sơ</h1>
            <div className="flex items-center gap-6 text-slate-500 font-bold flex-wrap">
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xs">
                  {booking.creator_name?.charAt(0)}
                </div>
                <span className="text-slate-800 text-sm tracking-tight">{booking.creator_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm opacity-60">
                <Calendar className="w-4 h-4" />
                Khởi tạo {formatDate(booking.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Content */}
        <div className="lg:col-span-8 space-y-12">
          <div className="relative bg-white rounded-[3.5rem] p-12 border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12">
              <FileText className="w-64 h-64" />
            </div>

            <div className="space-y-16 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1.2rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xl shadow-primary/5">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Hồ sơ đào tạo</p>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Thông tin yêu cầu</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-16">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Khóa học & Chuyên môn</p>
                  </div>
                  <p className="text-2xl font-black text-slate-800 leading-tight">{booking.course_name}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Địa điểm tổ chức</p>
                  </div>
                  <p className="text-2xl font-black text-slate-800 leading-tight">{booking.class_name}</p>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 inline-block">{booking.class_location}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ngày đào tạo</p>
                  </div>
                  <p className="text-2xl font-black text-slate-800 leading-tight">{formatDate(booking.date)}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <Zap className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Khung giờ đào tạo</p>
                  </div>
                  <p className="text-2xl font-black text-primary leading-tight uppercase tracking-tight">{booking.slot_name}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                      <Users className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Học viên dự kiến</p>
                  </div>
                  <p className="text-2xl font-black text-slate-800 leading-tight">{booking.attendee_count} thành viên</p>
                </div>

                <div className="col-span-1 md:col-span-2 pt-10">
                  <div className="relative p-10 rounded-[3rem] bg-slate-50 border-2 border-slate-100 group overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                      <MessageSquare className="w-40 h-40" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 relative z-10">Mục đích & Nội dung chi tiết</p>
                    <p className="text-slate-700 font-bold leading-relaxed text-2xl relative z-10 italic">
                      "{booking.purpose}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="bg-white rounded-[3.5rem] p-12 border border-slate-200 shadow-2xl shadow-slate-200/40 space-y-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1.2rem] bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                <Activity className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Hành trình xử lý</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Nhật ký Phê duyệt</h3>
              </div>
            </div>
            
            <div className="relative pl-12 space-y-16 before:absolute before:left-4 before:top-4 before:bottom-4 before:w-px before:bg-slate-200 before:dashed">
              {booking.logs?.map((log: any, idx: number) => (
                <div key={log.id} className="relative group/log">
                  <div className={cn(
                    "absolute -left-[44px] top-1.5 w-8 h-8 rounded-2xl border-4 border-white shadow-xl z-10 flex items-center justify-center transition-all group-hover/log:scale-110",
                    idx === 0 ? "bg-primary text-white ring-8 ring-primary/5" : "bg-slate-100 text-slate-400"
                  )}>
                    {idx === 0 ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-800 font-black text-xs shadow-sm">
                          {log.actor_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-xl tracking-tight leading-none">{log.actor_name}</p>
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1.5">{log.actor_role}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100">{formatDate(log.created_at)}</span>
                    </div>
                    
                    <div className="bg-slate-50/80 rounded-[2rem] p-8 border border-slate-200/50 space-y-5 transition-all group-hover/log:bg-white group-hover/log:shadow-xl group-hover/log:shadow-slate-200/30">
                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em]">
                        {log.from_status ? (
                          <>
                            <span className="text-slate-300 line-through">{log.from_status}</span>
                            <ChevronRight className="w-4 h-4 text-primary" />
                            <span className="text-primary bg-primary/5 px-4 py-1.5 rounded-xl border border-primary/10">{log.to_status}</span>
                          </>
                        ) : (
                          <span className="text-primary flex items-center gap-3 bg-primary/5 px-4 py-1.5 rounded-xl border border-primary/10">
                            Khởi tạo <ChevronRight className="w-4 h-4" /> {log.to_status}
                          </span>
                        )}
                      </div>
                      {log.comment && (
                        <div className="pt-6 border-t border-slate-100">
                          <p className="text-lg text-slate-600 font-bold leading-relaxed italic">
                            "{log.comment}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Sidebar Actions */}
        <div className="lg:col-span-4 space-y-12">
          <div className="sticky top-12 space-y-8">
            <Card className="p-10 border border-slate-200 shadow-2xl shadow-slate-200/40 rounded-[3rem] bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary shadow-lg shadow-primary/20" />
              
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xl shadow-emerald-500/5">
                    <Zap className="w-5 h-5 fill-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Thao tác nhanh</h3>
                </div>
                
                <div className="space-y-8">
                  {/* Creator Actions */}
                  {role === 'CREATOR' && status === 'DRAFT' && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ghi chú cho Reviewer</label>
                        <textarea 
                          placeholder="Nhập thông điệp kèm theo..."
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-sm font-black focus:border-primary focus:bg-white transition-all outline-none h-40 resize-none shadow-inner"
                          value={note} onChange={e => setNote(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={() => handleAction('submit', { comment: note })} 
                        isLoading={actionLoading}
                        className="w-full py-6 flex justify-center items-center gap-4 rounded-[1.8rem] bg-primary shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all"
                      >
                        <Send className="w-5 h-5 fill-white" /> 
                        <span className="font-black text-xs uppercase tracking-[0.25em]">Gửi Phê Duyệt</span>
                      </Button>
                    </div>
                  )}
                  
                  {role === 'CREATOR' && ['DRAFT', 'PENDING_REVIEW'].includes(status) && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleAction('cancel', { reason: note })} 
                      isLoading={actionLoading}
                      className="w-full py-6 flex justify-center items-center gap-4 rounded-[1.8rem] border-2 border-slate-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm"
                    >
                      <X className="w-5 h-5" /> 
                      <span className="font-black text-xs uppercase tracking-[0.25em]">Hủy Yêu Cầu</span>
                    </Button>
                  )}

                  {/* Reviewer Actions */}
                  {role === 'REVIEWER' && status === 'PENDING_REVIEW' && (
                    <div className="space-y-8">
                      <div className="p-8 bg-sky-50 rounded-[2.5rem] border border-sky-100 space-y-4">
                        <div className="flex items-center gap-3 text-sky-600">
                          <Info className="w-5 h-5" />
                          <span className="font-black text-[10px] uppercase tracking-[0.2em]">Quyền xử lý</span>
                        </div>
                        <p className="text-sm text-sky-700 font-bold leading-relaxed">Bạn cần nhận hồ sơ này để kích hoạt bảng thẩm định chuyên môn.</p>
                      </div>
                      <Button 
                        onClick={() => handleAction('claim')} 
                        isLoading={actionLoading}
                        className="w-full py-6 flex justify-center items-center gap-4 rounded-[1.8rem] bg-indigo-600 shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-[1.03] active:scale-95 transition-all text-white"
                      >
                        <UserCheck className="w-6 h-6" /> 
                        <span className="font-black text-xs uppercase tracking-[0.25em]">Bắt đầu Xử lý</span>
                      </Button>
                    </div>
                  )}

                  {role === 'REVIEWER' && status === 'IN_REVIEW' && booking.reviewer_id === user?.id && (
                    <div className="space-y-6">
                      <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 space-y-3">
                         <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">Status</p>
                         <p className="text-amber-800 font-black text-lg leading-tight">Bạn đang thẩm định hồ sơ này</p>
                      </div>
                      <Button 
                        onClick={() => router.push(`/reviewer/evaluate/${booking.id}`)}
                        className="w-full py-6 flex justify-center items-center gap-4 rounded-[1.8rem] bg-primary shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all"
                      >
                        <FileText className="w-5 h-5 fill-white" /> 
                        <span className="font-black text-xs uppercase tracking-[0.25em]">Vào Bảng Đánh Giá</span>
                      </Button>
                    </div>
                  )}

                  {/* Approver Actions */}
                  {role === 'APPROVER' && status === 'PENDING_APPROVAL' && (
                    <div className="space-y-6">
                      <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 space-y-3">
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Authority</p>
                         <p className="text-emerald-800 font-black text-lg leading-tight">Chờ quyết định phê duyệt cuối cùng</p>
                      </div>
                      <Button 
                        onClick={() => router.push(`/approver/evaluate/${booking.id}`)}
                        className="w-full py-6 flex justify-center items-center gap-4 rounded-[1.8rem] bg-emerald-600 shadow-2xl shadow-emerald-500/30 hover:bg-emerald-700 hover:scale-[1.03] active:scale-95 transition-all text-white"
                      >
                        <CheckCircle className="w-5 h-5 fill-white" /> 
                        <span className="font-black text-xs uppercase tracking-[0.25em]">Mở Bảng Phê Duyệt</span>
                      </Button>
                    </div>
                  )}

                  {/* Final State */}
                  {!['DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL'].includes(status) && (
                    <div className="p-10 bg-slate-50 rounded-[3rem] text-center space-y-8 border border-slate-100 relative overflow-hidden group">
                      <div className={cn("w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl ring-12 ring-offset-0 transition-transform group-hover:scale-110", 
                        status === 'APPROVED' ? "bg-emerald-500 text-white ring-emerald-50" : "bg-rose-500 text-white ring-rose-50"
                      )}>
                        {status === 'APPROVED' ? <Check className="w-12 h-12" /> : <X className="w-12 h-12" />}
                      </div>
                      <div className="space-y-3">
                        <p className="font-black text-slate-800 text-2xl tracking-tight leading-none uppercase">Lưu Trữ Quy Trình</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                          Đã đóng quyền thao tác
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <div className="p-8 bg-slate-900 rounded-[3rem] border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <ShieldCheck className="w-32 h-32 text-white" />
              </div>
              <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.3em]">
                <ShieldCheck className="w-5 h-5" />
                <span>Security Enforcement</span>
              </div>
              <p className="text-xs text-slate-400 font-bold leading-relaxed relative z-10">
                Nhật ký xử lý được ghi nhận bởi hạ tầng bảo mật tập trung. 
                Các thay đổi trạng thái được xác thực thông qua định danh sinh trắc học và Token phiên làm việc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
