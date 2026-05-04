'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  ShieldCheck, 
  ArrowLeft, 
  User, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  XCircle, 
  MessageSquare,
  Forward,
  Clock,
  Info,
  AlertTriangle,
  Search,
  Sparkles,
  Layers,
  CheckCircle,
  FileText,
  Activity,
  ChevronLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/errorTranslations';
import { cn } from '@/lib/utils';

export default function ReviewerEvaluatePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const router = useRouter();
  const [booking, setBooking] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);
  const [note, setNote] = React.useState('');

  React.useEffect(() => {
    fetchApi(`/api/bookings/${unwrappedParams.id}`)
      .then(setBooking)
      .catch(err => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [unwrappedParams.id]);

  const handleForward = async () => {
    setProcessing(true);
    try {
      await fetchApi(`/api/bookings/${unwrappedParams.id}/forward`, {
        method: 'PATCH',
        body: JSON.stringify({ note }),
      });
      toast.success('Đã chuyển tiếp tới Approver thành công!');
      router.push('/reviewer/pending');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Thao tác thất bại'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!note) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setProcessing(true);
    try {
      await fetchApi(`/api/bookings/${unwrappedParams.id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: note }),
      });
      toast.success('Đã từ chối booking!');
      router.push('/reviewer/pending');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Thao tác thất bại'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-black animate-pulse uppercase tracking-[0.2em] text-[10px]">Đang tải hồ sơ thẩm định...</p>
      </div>
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="p-12 text-center space-y-6 max-w-md bg-white rounded-[3rem] shadow-2xl border-none">
        <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-10 h-10 text-rose-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Hồ sơ không tồn tại</h2>
          <p className="text-slate-500 font-medium">Booking này có thể đã được xử lý hoặc không hợp lệ.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/reviewer/pending')}
          className="rounded-2xl px-10 py-6 border-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50"
        >
          Quay lại danh sách
        </Button>
      </Card>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="group p-4 bg-white shadow-xl shadow-slate-200/50 border border-slate-100 rounded-[1.2rem] hover:bg-primary hover:border-primary transition-all active:scale-90"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
            </button>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
                <Search className="w-3 h-3" />
                <span>Thẩm định chi tiết</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-800">Review Hồ Sơ 🔍</h1>
            </div>
          </div>
        </div>

        <Badge className="bg-amber-50 text-amber-600 border border-amber-100 px-6 py-2.5 text-[10px] font-black tracking-[0.25em] uppercase rounded-2xl shadow-sm shadow-amber-500/5">
          ĐANG XEM XÉT
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Main Info Card */}
          <div className="relative bg-white rounded-[3rem] p-12 border border-slate-200/50 shadow-2xl shadow-slate-200/20 overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12">
              <FileText className="w-64 h-64" />
            </div>

            <div className="space-y-12 relative z-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Course / Purpose</span>
                </div>
                <h2 className="text-5xl font-black text-slate-800 leading-[1.1] tracking-tight">
                  {booking.course_name || booking.purpose}
                </h2>
                
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 pl-2 pr-5 py-2 rounded-2xl">
                    <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-500/20">
                      {booking.creator_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Giảng viên</p>
                      <p className="text-xs font-black text-slate-700">{booking.creator_name}</p>
                    </div>
                  </div>
                  <div className="h-6 w-px bg-slate-200 mx-1" />
                  <div className="text-xs font-bold text-slate-400">{booking.creator_email}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm shadow-slate-100/50">
                      <MapPin className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa điểm tổ chức</p>
                      <p className="text-xl font-black text-slate-800 leading-tight">{booking.class_name}</p>
                      <p className="text-xs font-bold text-slate-500">{booking.class_location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm shadow-slate-100/50">
                      <Calendar className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lịch học</p>
                      <p className="text-xl font-black text-slate-800 leading-tight">
                        {format(new Date(booking.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        {booking.slot_name} • {booking.start_time} - {booking.end_time}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm shadow-slate-100/50">
                      <Users className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sĩ số dự kiến</p>
                      <p className="text-xl font-black text-slate-800 leading-tight">{booking.attendee_count} học viên</p>
                      <p className="text-xs font-bold text-slate-500 italic">Sức chứa phòng: {booking.class_capacity || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm shadow-slate-100/50">
                      <Clock className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gửi yêu cầu lúc</p>
                      <p className="text-xl font-black text-slate-800 leading-tight">
                        {format(new Date(booking.submitted_at || booking.created_at), 'HH:mm • dd/MM')}
                      </p>
                      <p className="text-xs font-bold text-slate-500">Hệ thống ghi nhận trực tuyến</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <Info className="w-3 h-3" />
                  <span>Mục đích & Nội dung chi tiết</span>
                </div>
                <p className="text-slate-600 text-xl font-bold leading-relaxed italic">
                  "{booking.description || 'Không có mô tả chi tiết từ người đặt.'}"
                </p>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="bg-slate-100/50 rounded-[3rem] p-12 border border-slate-200/30 space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[1rem] bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Tiến trình hồ sơ</h3>
            </div>
            
            <div className="space-y-12">
              <div className="relative pl-12">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-indigo-200 dashed" />
                <div className="absolute -left-[1.25rem] top-0 w-10 h-10 rounded-2xl bg-indigo-50 border-4 border-white flex items-center justify-center text-indigo-500 shadow-xl shadow-indigo-500/10 z-10">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-black text-slate-800 leading-none">Khởi tạo & Tiếp nhận</p>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{format(new Date(booking.submitted_at || booking.created_at), 'HH:mm • dd/MM/yyyy')}</p>
                  <p className="text-sm text-slate-500 font-bold max-w-lg leading-relaxed">
                    Hồ sơ được gửi bởi {booking.creator_name} và được hệ thống phân loại vào hàng chờ Thẩm định.
                  </p>
                </div>
              </div>

              <div className="relative pl-12">
                <div className="absolute -left-[1.25rem] top-0 w-10 h-10 rounded-2xl bg-white border-4 border-slate-100 flex items-center justify-center text-slate-300 z-10">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-2 opacity-50">
                  <p className="text-lg font-black text-slate-400 leading-none italic">Đang trong quá trình thẩm định...</p>
                  <p className="text-sm text-slate-400 font-bold">Chờ thao tác từ Reviewer</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="sticky top-12 space-y-8">
            <Card className="p-10 border border-slate-200 shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500" />
              
              <div className="space-y-10">
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Kết Luận</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Decision Dashboard</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ghi chú Thẩm định</label>
                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-md", note.length > 0 ? "bg-indigo-50 text-indigo-500" : "bg-slate-50 text-slate-300")}>
                      {note.length} ký tự
                    </span>
                  </div>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nhập nhận xét hoặc lý do..."
                    className="w-full h-48 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500/30 focus:bg-white focus:shadow-xl focus:shadow-indigo-500/5 transition-all text-sm font-black focus:outline-none resize-none placeholder:text-slate-300 placeholder:italic"
                  />
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={handleForward}
                    disabled={processing}
                    className="w-full py-6 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
                  >
                    {processing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                      <>
                        <Forward className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <span>Duyệt & Chuyển Tiếp</span>
                      </>
                    )}
                  </button>

                  <button 
                    onClick={handleReject}
                    disabled={processing}
                    className="w-full py-5 bg-white text-rose-500 font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] border-2 border-slate-100 hover:border-rose-500 hover:bg-rose-50 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Từ chối yêu cầu</span>
                  </button>
                </div>
              </div>
            </Card>

            <div className="p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100 flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Trách nhiệm</p>
                <p className="text-xs text-indigo-500/80 font-black leading-relaxed">
                  Đảm bảo mọi thông tin hợp lệ trước khi chuyển tiếp. Quyết định của bạn sẽ ảnh hưởng tới lịch giảng dạy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
