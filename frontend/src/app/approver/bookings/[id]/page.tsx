'use client';

import * as React from 'react';
import { fetchApi } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ChevronLeft, MapPin, Users, Calendar, Clock, Info, CheckCircle,
  XCircle, Lock, ShieldCheck, User, ArrowLeft, Zap, Sparkles,
  List
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';

const REJECT_REASONS = [
  'Vượt ngân sách/hạn mức',
  'Không phù hợp chính sách',
  'Thông tin chưa đầy đủ',
  'Phòng không đáp ứng yêu cầu',
  'Thời điểm không phù hợp',
  'Khác',
];

interface Log {
  actor_name: string;
  to_status: string;
  created_at: string;
  comment?: string;
}

interface Booking {
  id: string;
  course_name?: string;
  purpose?: string;
  class_name: string;
  attendee_count: number;
  date: string;
  slot_name: string;
  start_time: string;
  status: string;
  forwarded_at?: string;
  description?: string;
  creator_name: string;
  creator_department?: string;
  creator_email: string;
  reviewer_name: string;
  reviewer_note?: string;
  reviewer_note_internal?: boolean;
  class_capacity?: number;
  approver_note?: string;
  rejection_reason?: string;
  logs: Log[];
}

export default function ApproverEvaluatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();

  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);

  // Decision Panel
  const [note, setNote] = React.useState('');

  // Dialogs
  const [approveOpen, setApproveOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  
  // Reject state
  const [rejectReason, setRejectReason] = React.useState('');
  const [rejectDetail, setRejectDetail] = React.useState('');
  const [rejectSuggest, setRejectSuggest] = React.useState(false);

  React.useEffect(() => {
    fetchApi(`/api/bookings/${id}`)
      .then(setBooking)
      .catch(() => toast.error('Không tải được booking'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await fetchApi(`/api/bookings/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ note: note.trim() || undefined }),
      });
      toast.success('Đã phê duyệt booking thành công!');
      setBooking((b: Booking | null) => b ? ({ ...b, status: 'APPROVED' }) : null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi approve';
      toast.error(msg);
    }
    finally { setProcessing(false); setApproveOpen(false); }
  };

  const handleReject = async () => {
    if (!rejectReason) { toast.error('Vui lòng chọn lý do chính'); return; }
    if (rejectDetail.trim().length < 20) { toast.error('Chi tiết lý do phải ít nhất 20 ký tự'); return; }
    setProcessing(true);
    try {
      await fetchApi(`/api/bookings/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          reason: `${rejectReason}: ${rejectDetail.trim()}`, 
          suggest_resubmit: rejectSuggest 
        }),
      });
      toast.success('Đã từ chối booking');
      setBooking((b: Booking | null) => b ? ({ ...b, status: 'REJECTED' }) : null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi reject';
      toast.error(msg);
    }
    finally { setProcessing(false); setRejectOpen(false); }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-slate-900 border-t-emerald-500 rounded-full animate-spin shadow-2xl" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Đang nạp hồ sơ phê duyệt...</p>
    </div>
  );

  if (!booking) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
       <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 border border-rose-100 shadow-xl shadow-rose-500/10">
          <XCircle className="w-10 h-10" />
       </div>
       <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800">Hồ sơ không tồn tại</h2>
          <p className="text-slate-400 font-bold italic">Có lỗi xảy ra khi truy xuất dữ liệu từ hệ thống.</p>
       </div>
       <button onClick={() => router.push('/approver/queue')} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Quay lại hàng đợi</button>
    </div>
  );

  const statusColor: Record<string, string> = {
    PENDING_APPROVAL: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    APPROVED: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    REJECTED: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const isPending = booking.status === 'PENDING_APPROVAL';

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 pb-24">
      {/* Header — Brutalist & Informative */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 group-hover:opacity-[0.05] transition-all pointer-events-none">
           <ShieldCheck className="w-48 h-48" />
        </div>
        
        <div className="flex items-center gap-6 relative z-10">
          <button 
            onClick={() => router.push('/approver/queue')} 
            className="w-14 h-14 rounded-2xl border-2 border-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-900 hover:scale-110 active:scale-95 transition-all bg-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Cơ chế Phê Duyệt</span>
               </div>
               {booking.forwarded_at && (
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Chờ: {format(parseISO(booking.forwarded_at), 'HH:mm dd/MM')}</span>
                 </div>
               )}
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{booking.course_name || booking.purpose}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
           <div className={cn('px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] border-2 shadow-xl shadow-slate-200/20', statusColor[booking.status] || 'bg-slate-50 text-slate-400 border-slate-100')}>
              {booking.status === 'PENDING_APPROVAL' ? 'Đang chờ duyệt' : 
               booking.status === 'APPROVED' ? 'Đã phê duyệt' : 
               booking.status === 'REJECTED' ? 'Đã từ chối' : booking.status}
           </div>
        </div>
      </div>

      {/* 3-Column EVALUATION HUB Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Column 1: CORE BOOKING INTEL (5/12 cols) */}
        <div className="lg:col-span-5 space-y-8">
          <section className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/40 p-10 space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-bl-[4rem] -mr-8 -mt-8 -z-0" />
            
            <div className="flex items-center justify-between relative z-10">
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Dữ liệu từ người đặt
              </h2>
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Hồ sơ gốc</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 relative z-10">
              {[
                { icon: <MapPin className="w-5 h-5" />, label: 'Phòng học yêu cầu', value: booking.class_name, color: 'indigo' },
                { icon: <Users className="w-5 h-5" />, label: 'Số lượng học viên', value: `${booking.attendee_count} người`, color: 'amber' },
                { icon: <Calendar className="w-5 h-5" />, label: 'Ngày học dự kiến', value: booking.date ? format(parseISO(booking.date), 'dd/MM/yyyy') : '—', color: 'emerald' },
                { icon: <Clock className="w-5 h-5" />, label: 'Ca học & Bắt đầu', value: `${booking.slot_name} · ${booking.start_time}`, color: 'rose' },
              ].map(({ icon, label, value, color }) => {
                const colors = {
                  indigo: 'bg-indigo-50 text-indigo-500 border-indigo-100',
                  amber: 'bg-amber-50 text-amber-500 border-amber-100',
                  emerald: 'bg-emerald-50 text-emerald-500 border-emerald-100',
                  rose: 'bg-rose-50 text-rose-500 border-rose-100'
                }[color as 'indigo' | 'amber' | 'emerald' | 'rose'];
                
                return (
                  <div key={label} className="group flex items-start gap-4 p-4 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all duration-300">
                    <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500", colors)}>{icon}</div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-black text-slate-800 tracking-tight">{value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl relative group overflow-hidden">
              <div className="absolute -right-4 -bottom-4 p-4 opacity-5 text-white group-hover:scale-125 transition-transform duration-1000">
                 <Zap className="w-24 h-24" />
              </div>
              <div className="relative z-10 space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Mô tả & Mục đích đào tạo
                </p>
                <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
                  &quot;{booking.description || booking.purpose || 'Không có mô tả chi tiết cho yêu cầu này.'}&quot;
                </p>
              </div>
            </div>

            {/* Creator Profile Card */}
            <div className="flex items-center gap-5 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group">
              <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center text-slate-900 font-black text-2xl group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform">
                {booking.creator_name?.charAt(0)}
              </div>
              <div className="space-y-1">
                <p className="text-lg font-black text-slate-800 tracking-tight">{booking.creator_name}</p>
                <div className="flex items-center gap-2">
                   <Badge className="bg-slate-900 text-white text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-lg border-none">Creator</Badge>
                   <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase italic">{booking.creator_department || 'Department N/A'}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Audit Trail Section */}
          <div className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/40 p-10 space-y-8">
             <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
                <List className="w-4 h-4" />
                Lịch sử hành trình hệ thống
             </h3>
             <div className="space-y-6">
                {(booking.logs || []).map((log: Log, i: number) => (
                  <div key={i} className="flex gap-6 relative group">
                    {i < (booking.logs?.length - 1) && (
                      <div className="absolute left-[23px] top-6 bottom-0 w-1 bg-slate-100 rounded-full group-hover:bg-primary/20 transition-colors" />
                    )}
                    <div className="relative z-10 w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center group-hover:border-primary transition-colors shadow-sm">
                       <div className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-primary transition-colors" />
                    </div>
                    <div className="pb-8 space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                         <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{log.to_status}</p>
                         <p className="text-[10px] font-black text-slate-300 uppercase">{log.created_at ? format(parseISO(log.created_at), 'HH:mm dd/MM') : ''}</p>
                      </div>
                      <p className="text-xs font-bold text-slate-500">Thực hiện bởi: <strong className="text-slate-800">{log.actor_name}</strong></p>
                      {log.comment && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 italic leading-relaxed">
                           &quot;{log.comment}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Column 2: REVIEWER'S VERDICT (3/12 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <section className="bg-emerald-600 rounded-[3rem] border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 p-10 space-y-8 relative overflow-hidden text-white group">
            <div className="absolute -right-4 -top-4 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            
            <div className="space-y-2 relative z-10">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                  <ShieldCheck className="w-6 h-6" />
               </div>
               <h3 className="text-[11px] font-black uppercase tracking-[0.25em] pt-2">Thẩm định hồ sơ</h3>
            </div>

            <div className="flex items-center gap-4 relative z-10 bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center text-slate-900 font-black text-xl">
                {booking.reviewer_name?.charAt(0) || <User className="w-5 h-5" />}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-black tracking-tight">{booking.reviewer_name}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-200">Reviewer · QA</p>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
               <div className="relative">
                  {booking.reviewer_note_internal && (
                    <div className="absolute -top-3 -right-2 bg-slate-900 text-white text-[8px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1.5 shadow-xl">
                      <Lock className="w-2.5 h-2.5 text-primary" />
                      <span>Thông tin nội bộ</span>
                    </div>
                  )}
                  <div className="bg-white rounded-[2rem] p-8 shadow-2xl border-4 border-slate-900 text-slate-800 relative group/note">
                    <div className="absolute -left-2 -top-2 w-6 h-6 bg-primary rotate-45 group-hover/note:scale-150 transition-transform" />
                    <p className="text-sm font-black leading-relaxed italic">
                      &quot;{booking.reviewer_note || 'Đã kiểm tra và chuyển tiếp không có nhận xét bổ sung.'}&quot;
                    </p>
                  </div>
               </div>
            </div>

            <div className="pt-6 space-y-4 relative z-10">
               <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-100 border-b border-emerald-400/30 pb-2">Dữ liệu đối soát sức chứa</p>
               <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white/10 p-3 rounded-xl border border-white/10">
                     <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Yêu cầu</span>
                     <span className="text-lg font-black">{booking.attendee_count}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/10 p-3 rounded-xl border border-white/10">
                     <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Sức chứa</span>
                     <span className="text-lg font-black">{booking.class_capacity || '?'}</span>
                  </div>
                  <div className="h-2 w-full bg-emerald-900/50 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (booking.attendee_count / (booking.class_capacity || 1)) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn("h-full", (booking.attendee_count > (booking.class_capacity || 0)) ? "bg-rose-500" : "bg-white")} 
                     />
                  </div>
               </div>
            </div>
          </section>
        </div>

        {/* Column 3: FINAL DECISION PANEL (4/12 cols, sticky) */}
        <div className="lg:col-span-4">
          <div className="sticky top-8 space-y-6">
            <section className={cn('rounded-[3rem] border-4 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden transition-all duration-700 bg-white', 
              booking.status === 'APPROVED' ? 'border-emerald-600 shadow-emerald-500/10' : 
              booking.status === 'REJECTED' ? 'border-rose-600 shadow-rose-500/10' : 
              'border-slate-900 shadow-slate-200/40'
            )}>
              {/* Decision Header */}
              <div className={cn('px-8 py-5 border-b-4 flex items-center justify-between', 
                isPending ? 'bg-amber-50 border-amber-200' : 
                booking.status === 'APPROVED' ? 'bg-emerald-600 border-emerald-600 text-white' : 
                'bg-rose-600 border-rose-600 text-white'
              )}>
                <div className="flex items-center gap-3">
                   {isPending && <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />}
                   <p className={cn('text-xs font-black uppercase tracking-[0.2em]', isPending ? 'text-amber-800' : 'text-white')}>
                      {isPending ? 'Pending Final Verdict' : booking.status}
                   </p>
                </div>
                {!isPending && (
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                     {booking.status === 'APPROVED' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                )}
              </div>

              <div className="p-10 space-y-10">
                <div className="text-center space-y-4">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{booking.class_name}</span>
                   </div>
                   <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                      {booking.date ? format(parseISO(booking.date), 'dd MMMM, yyyy', { locale: vi }) : '—'}
                   </h2>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Slot: {booking.slot_name}</p>
                </div>

                {isPending ? (
                  <>
                    <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 group-focus-within:border-primary transition-all">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Ghi chú Phê duyệt</label>
                        <span className="text-[10px] font-bold text-slate-300 tracking-widest">{note.length}/500</span>
                      </div>
                      <textarea 
                        value={note} 
                        onChange={e => setNote(e.target.value.slice(0, 500))}
                        placeholder="Nhập nhận xét của bạn về hồ sơ này (Người tạo sẽ thấy)..." 
                        rows={4}
                        className="w-full p-4 text-sm font-black text-slate-700 bg-white rounded-2xl border-2 border-transparent focus:border-slate-900 outline-none transition-all placeholder:text-slate-300 placeholder:italic placeholder:font-bold resize-none" 
                      />
                    </div>

                    <div className="space-y-4 pt-4">
                      <button 
                        onClick={() => setApproveOpen(true)}
                        disabled={processing}
                        className="w-full h-16 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-black hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4 group"
                      >
                        <CheckCircle className="w-6 h-6 text-emerald-500 group-hover:rotate-12 transition-transform" />
                        <span>Chấp thuận yêu cầu</span>
                      </button>
                      <button 
                        onClick={() => setRejectOpen(true)}
                        disabled={processing}
                        className="w-full h-14 bg-white border-4 border-rose-600 text-rose-600 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-50 hover:shadow-xl hover:shadow-rose-600/10 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Từ chối hồ sơ</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="p-8 bg-slate-50 rounded-[2rem] border-2 border-slate-100 relative group/res">
                       <div className="absolute -top-3 -left-2 bg-slate-900 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg">Lý do/Ghi chú</div>
                       <p className="text-sm font-black text-slate-700 leading-relaxed italic text-center">
                          &quot;{booking.approver_note || booking.rejection_reason || 'Hoàn tất quá trình phê duyệt hệ thống.'}&quot;
                       </p>
                    </div>
                    <button 
                      onClick={() => router.push('/approver/queue')}
                      className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-4 group shadow-xl shadow-slate-900/10"
                    >
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
                      <span>Về hàng đợi</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Quick Action Hints */}
            {isPending && (
              <div className="bg-amber-50/50 p-6 rounded-[2rem] border-2 border-dashed border-amber-200">
                 <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <Zap className="w-3.5 h-3.5" /> Mẹo phê duyệt
                 </p>
                 <ul className="space-y-2 text-[11px] font-bold text-slate-500 italic">
                    <li>• Kiểm tra kỹ mục đích nếu sức chứa vượt ngưỡng.</li>
                    <li>• Sử dụng &quot;Duyệt nhanh&quot; nếu lịch trình đã ổn định.</li>
                    <li>• Từ chối kèm lý do chi tiết giúp Creator cải thiện.</li>
                 </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS — Keeping standard design but refined for Brutalist look */}
      {/* Approve Confirm Dialog */}
      <AnimatePresence>
        {approveOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setApproveOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, rotate: -2 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[3rem] p-10 w-full max-w-md text-center space-y-8 shadow-2xl border-4 border-slate-900 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[1.5rem] flex items-center justify-center mx-auto border-2 border-emerald-100 shadow-xl shadow-emerald-500/10 animate-bounce">
                 <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Xác nhận Phê Duyệt?</h3>
                <p className="text-sm text-slate-500 font-bold leading-relaxed italic">Quyết định này sẽ gửi thông báo phê duyệt chính thức tới người đặt. Bạn có chắc chắn?</p>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setApproveOpen(false)} disabled={processing} className="flex-1 h-14 rounded-2xl bg-slate-50 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors">Hủy bỏ</button>
                <button onClick={handleApprove} disabled={processing} className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black shadow-xl shadow-slate-900/20 transition-all active:scale-95">
                  {processing ? 'Đang xử lý...' : 'Duyệt ngay'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Dialog */}
      <AnimatePresence>
        {rejectOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setRejectOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, rotate: 2 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[3rem] overflow-hidden w-full max-w-lg shadow-2xl border-4 border-slate-900">
              <div className="bg-rose-600 p-8 text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10">
                   <XCircle className="w-32 h-32" />
                </div>
                <h3 className="font-black text-2xl flex items-center gap-3 relative z-10 uppercase tracking-tight"><XCircle className="w-7 h-7" /> Từ chối phê duyệt</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-100 mt-2 relative z-10 opacity-80">Hành động này không thể hoàn tác sau khi xác nhận.</p>
              </div>
              <div className="p-10 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Lý do chính yếu *</label>
                  <select value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full h-14 px-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-black text-slate-700 outline-none focus:border-rose-500 focus:bg-white appearance-none transition-all shadow-sm">
                    <option value="">— Vui lòng chọn lý do —</option>
                    {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Chi tiết lý do từ chối *</label>
                    <span className={cn('text-[10px] font-black tracking-widest', rejectDetail.length >= 20 ? 'text-emerald-500' : 'text-rose-500')}>{rejectDetail.length}/500</span>
                  </div>
                  <textarea 
                    value={rejectDetail} 
                    onChange={e => setRejectDetail(e.target.value.slice(0, 500))} 
                    placeholder="Nhập ít nhất 20 ký tự giải trình lý do từ chối. Creator sẽ nhận được thông tin này..." 
                    rows={4} 
                    className="w-full p-6 text-sm font-black text-slate-700 rounded-3xl border-2 border-slate-100 bg-slate-50 focus:bg-white outline-none focus:border-rose-500 resize-none transition-all placeholder:text-slate-300 placeholder:italic" 
                  />
                </div>
                <label className="flex items-center gap-4 cursor-pointer p-5 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-900 transition-all group">
                  <input type="checkbox" checked={rejectSuggest} onChange={e => setRejectSuggest(e.target.checked)} className="rounded-lg text-rose-600 w-6 h-6 border-2 border-slate-200 focus:ring-rose-500" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Gợi ý tạo lại hồ sơ</p>
                    <p className="text-[10px] font-bold text-slate-400 italic leading-none">Cho phép Creator nộp lại yêu cầu sau khi đã điều chỉnh.</p>
                  </div>
                </label>
              </div>
              <div className="p-8 bg-slate-50 border-t-2 border-slate-100 flex justify-end gap-4">
                <button onClick={() => setRejectOpen(false)} disabled={processing} className="h-14 px-8 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Quay lại</button>
                <button 
                  onClick={handleReject} 
                  disabled={processing || !rejectReason || rejectDetail.length < 20} 
                  className="h-14 px-10 rounded-2xl bg-rose-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-700 disabled:opacity-50 disabled:grayscale transition-all shadow-xl shadow-rose-600/20 active:scale-95"
                >
                  {processing ? '...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
