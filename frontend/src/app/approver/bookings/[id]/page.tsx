'use client';

import * as React from 'react';
import { fetchApi } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import {
  ChevronLeft, MapPin, Users, Calendar, Clock, Info, CheckCircle,
  XCircle, Lock, ShieldCheck, User, ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
      toast.success('Đã phê duyệt booking');
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
        body: JSON.stringify({ reason: `${rejectReason}: ${rejectDetail.trim()}`, suggest_resubmit: rejectSuggest }),
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
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-[60vh] flex items-center justify-center text-slate-400 font-bold">
      Booking không tồn tại
    </div>
  );

  const statusColor: Record<string, string> = {
    PENDING_APPROVAL: 'bg-emerald-100 text-emerald-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-rose-100 text-rose-700',
  };

  const isPending = booking.status === 'PENDING_APPROVAL';

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button onClick={() => router.push('/approver/queue')} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Approver Panel</span>
            {booking.forwarded_at && <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">Forwarded: {format(parseISO(booking.forwarded_at), 'HH:mm dd/MM')}</span>}
          </div>
          <h1 className="text-xl font-black text-slate-800 truncate">{booking.course_name || booking.purpose}</h1>
        </div>
        <div className={cn('px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider', statusColor[booking.status] || 'bg-slate-100 text-slate-600')}>
          {booking.status}
        </div>
      </div>

      {/* 3-region layout (45% - 25% - 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Vùng 1: Booking Info (45% ~ 5/12 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="text-sm font-black text-slate-700 border-b border-slate-100 pb-3 uppercase tracking-wider">Thông tin từ Creator</h2>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <MapPin className="w-4 h-4" />, label: 'Phòng học', value: `${booking.class_name}` },
                { icon: <Users className="w-4 h-4" />, label: 'Số người', value: `${booking.attendee_count} người` },
                { icon: <Calendar className="w-4 h-4" />, label: 'Ngày học', value: booking.date ? format(parseISO(booking.date), 'dd/MM/yyyy') : '—' },
                { icon: <Clock className="w-4 h-4" />, label: 'Ca học', value: `${booking.slot_name} · ${booking.start_time}` },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">{icon}</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-bold text-slate-700">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Info className="w-3 h-3" /> Mục đích chi tiết</p>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{booking.description || booking.purpose || '—'}</p>
            </div>

            {/* Creator info */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white font-black text-lg">
                {booking.creator_name?.charAt(0)}
              </div>
              <div>
                <p className="font-black text-slate-800 text-sm">{booking.creator_name}</p>
                <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">{booking.creator_department || 'Nhân viên'}</p>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Timeline hệ thống</p>
              <div className="space-y-3">
                {(booking.logs || []).map((log: Log, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center"><CheckCircle className="w-3 h-3 text-slate-400" /></div>
                      {i < (booking.logs?.length - 1) && <div className="w-px flex-1 bg-slate-100 my-1" />}
                    </div>
                    <div className="pb-2">
                      <p className="text-xs font-black text-slate-700">{log.to_status}</p>
                      <p className="text-[10px] font-medium text-slate-400">{log.actor_name} · {log.created_at ? format(parseISO(log.created_at), 'HH:mm dd/MM/yyyy') : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vùng 2: Reviewer Summary (25% ~ 3/12 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 shadow-sm p-6 space-y-5">
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-emerald-100 pb-2">
              <ShieldCheck className="w-4 h-4" /> Báo cáo thẩm định
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-black">
                {booking.reviewer_name?.charAt(0) || <User className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">{booking.reviewer_name}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reviewer</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100/50 relative">
              {booking.reviewer_note_internal && (
                <span className="absolute -top-2 -right-2 bg-slate-800 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Nội bộ
                </span>
              )}
              <p className="text-sm text-slate-700 font-bold leading-relaxed">
                &quot;{booking.reviewer_note || 'Đã kiểm tra và chuyển tiếp không có nhận xét bổ sung.'}&quot;
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Sức chứa phòng</p>
              <div className="flex items-center justify-between text-sm bg-white px-3 py-2 rounded-lg border border-emerald-100/50">
                <span className="font-medium text-slate-600">Yêu cầu: <strong className="text-slate-800">{booking.attendee_count}</strong></span>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-600">Sức chứa: <strong className="text-slate-800">{booking.class_capacity || '?'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Vùng 3: Decision Panel (30% ~ 4/12 cols, sticky) */}
        <div className="lg:col-span-4">
          <div className="sticky top-6">
            <div className={cn('rounded-2xl border shadow-sm overflow-hidden transition-colors duration-500', 
              booking.status === 'APPROVED' ? 'bg-green-50 border-green-200' : 
              booking.status === 'REJECTED' ? 'bg-rose-50 border-rose-200' : 
              'bg-white border-slate-200'
            )}>
              {/* Banner */}
              {isPending ? (
                <div className="bg-orange-50 px-5 py-3 border-b border-orange-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <p className="text-xs font-black text-orange-700 uppercase tracking-widest">Chờ quyết định cuối cùng</p>
                </div>
              ) : (
                <div className={cn('px-5 py-3 border-b flex items-center justify-center gap-2',
                  booking.status === 'APPROVED' ? 'bg-green-100 border-green-200 text-green-800' : 'bg-rose-100 border-rose-200 text-rose-800')}>
                  {booking.status === 'APPROVED' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  <p className="text-sm font-black uppercase tracking-widest">{booking.status}</p>
                </div>
              )}

              <div className="p-6 space-y-6">
                {/* Summary */}
                <div className="text-center space-y-1">
                  <p className="font-black text-slate-800 text-lg">{booking.class_name}</p>
                  <p className="text-xs font-bold text-slate-500">{booking.date ? format(parseISO(booking.date), 'dd/MM/yyyy') : ''} · {booking.slot_name}</p>
                </div>

                {isPending ? (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nhận xét phê duyệt</label>
                        <span className="text-[10px] font-bold text-slate-400">{note.length}/500</span>
                      </div>
                      <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 500))}
                        placeholder="Nhập ghi chú cho quyết định (không bắt buộc nếu Duyệt)..." rows={3}
                        className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-emerald-400 resize-none transition-colors" />
                    </div>

                    <div className="space-y-3 pt-2">
                      <button onClick={() => setApproveOpen(true)}
                        className="w-full h-12 bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" /> PHÊ DUYỆT NGAY
                      </button>
                      <button onClick={() => setRejectOpen(true)}
                        className="w-full h-10 border-2 border-rose-200 text-rose-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2">
                        <XCircle className="w-4 h-4" /> TỪ CHỐI
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-sm font-bold text-slate-600 italic">&quot;{booking.approver_note || booking.rejection_reason || 'Không có nhận xét'}&quot;</p>
                    <button onClick={() => router.push('/approver/queue')}
                      className="h-10 px-6 mx-auto rounded-xl bg-slate-800 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2">
                      <ArrowLeft className="w-4 h-4" /> Về hàng đợi
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Confirm Dialog */}
      <AnimatePresence>
        {approveOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setApproveOpen(false)} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative bg-white rounded-2xl p-6 w-full max-w-sm text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="w-8 h-8" /></div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Xác nhận Phê Duyệt?</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Quyết định này là cuối cùng và hệ thống sẽ thông báo ngay cho người tạo.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setApproveOpen(false)} disabled={processing} className="flex-1 h-10 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors">Hủy</button>
                <button onClick={handleApprove} disabled={processing} className="flex-1 h-10 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-colors">
                  {processing ? 'Đang xử lý...' : 'Xác nhận duyệt'}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setRejectOpen(false)} />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative bg-white rounded-2xl overflow-hidden w-full max-w-md shadow-2xl">
              <div className="bg-rose-600 p-5 text-white">
                <h3 className="font-black text-lg flex items-center gap-2"><XCircle className="w-5 h-5" /> Từ chối phê duyệt</h3>
                <p className="text-xs font-medium text-rose-100 mt-1">Hành động này KHÔNG THỂ hoàn tác.</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lý do chính *</label>
                  <select value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-rose-400 font-medium">
                    <option value="">— Chọn lý do —</option>
                    {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chi tiết lý do *</label>
                    <span className={cn('text-[10px] font-bold', rejectDetail.length >= 20 ? 'text-rose-500' : 'text-slate-300')}>{rejectDetail.length}/500</span>
                  </div>
                  <textarea value={rejectDetail} onChange={e => setRejectDetail(e.target.value.slice(0, 500))} placeholder="Nhập ít nhất 20 ký tự (Creator sẽ thấy)..." rows={3} className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-rose-400 resize-none transition-colors" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <input type="checkbox" checked={rejectSuggest} onChange={e => setRejectSuggest(e.target.checked)} className="rounded text-rose-500 w-4 h-4" />
                  <span className="text-xs font-bold text-slate-700">Gợi ý Creator tạo lại yêu cầu với điều chỉnh</span>
                </label>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setRejectOpen(false)} disabled={processing} className="h-10 px-5 rounded-xl text-slate-500 font-bold hover:bg-slate-200 text-sm">Hủy</button>
                <button onClick={handleReject} disabled={processing || !rejectReason || rejectDetail.length < 20} className="h-10 px-6 rounded-xl bg-rose-600 text-white font-black text-sm uppercase tracking-wider hover:bg-rose-700 disabled:opacity-50 transition-colors">
                  {processing ? '...' : 'Từ chối'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
