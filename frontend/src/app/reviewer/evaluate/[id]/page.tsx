'use client';

import * as React from 'react';
import { fetchApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ChevronLeft, MapPin, Users, Calendar, Clock, Info,
  Forward, XCircle, RotateCcw, CheckCircle,
  Lock, Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';

const REJECT_REASONS = [
  'Thông tin không đầy đủ',
  'Phòng không phù hợp',
  'Thời gian không hợp lệ',
  'Vi phạm quy định',
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
  class_location?: string;
  class_capacity?: number;
  attendee_count: number;
  date: string;
  slot_name: string;
  start_time: string;
  end_time: string;
  creator_name: string;
  creator_email: string;
  description?: string;
  status: string;
  reviewer_id?: string;
  reviewer_name?: string;
  claimed_at?: string;
  logs: Log[];
}

export default function ReviewerEvaluatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { user } = useAuthStore();

  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);

  // Forward state
  const [note, setNote] = React.useState('');
  const [isInternal, setIsInternal] = React.useState(false);

  // Reject dialog
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');
  const [rejectDetail, setRejectDetail] = React.useState('');
  const [rejectSuggest, setRejectSuggest] = React.useState(false);

  React.useEffect(() => {
    fetchApi(`/api/bookings/${id}`)
      .then(setBooking)
      .catch(() => toast.error('Không tải được booking'))
      .finally(() => setLoading(false));
  }, [id]);

  // Determine panel state
  const panelState = !booking ? null
    : booking.status === 'PENDING_REVIEW' ? 'A'
    : booking.status === 'IN_REVIEW' && booking.reviewer_id === user?.id ? 'B'
    : booking.status === 'IN_REVIEW' ? 'C'
    : 'DONE';

  const handleClaim = async () => {
    setProcessing(true);
    try {
      await fetchApi(`/api/bookings/${id}/claim`, { method: 'PATCH' });
      toast.success('Đã nhận xem xét');
      setBooking((b: Booking | null) => b ? ({ ...b, status: 'IN_REVIEW', reviewer_id: user?.id, reviewer_name: user?.full_name }) : null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi claim';
      toast.error(msg);
    }
    finally { setProcessing(false); }
  };

  const handleUnclaim = async () => {
    setProcessing(true);
    try {
      await fetchApi(`/api/bookings/${id}/unclaim`, { method: 'PATCH' });
      toast.success('Đã trả về hàng đợi');
      router.push('/reviewer/pending');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi unclaim';
      toast.error(msg);
    }
    finally { setProcessing(false); }
  };

  const handleForward = async () => {
    if (note.trim().length < 10) { toast.error('Nhận xét phải ít nhất 10 ký tự'); return; }
    setProcessing(true);
    try {
      await fetchApi(`/api/bookings/${id}/forward`, {
        method: 'PATCH',
        body: JSON.stringify({ note: note.trim(), is_internal: isInternal }),
      });
      toast.success('Đã chuyển lên Approver');
      router.push('/reviewer/pending');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi forward';
      toast.error(msg);
    }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!rejectReason) { toast.error('Vui lòng chọn lý do'); return; }
    if (rejectDetail.trim().length < 20) { toast.error('Chi tiết phải ít nhất 20 ký tự'); return; }
    setProcessing(true);
    try {
      await fetchApi(`/api/bookings/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: `${rejectReason}: ${rejectDetail.trim()}`, suggest_resubmit: rejectSuggest }),
      });
      toast.success('Đã từ chối booking');
      router.push('/reviewer/pending');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi reject';
      toast.error(msg);
    }
    finally { setProcessing(false); setRejectOpen(false); }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!booking) return (
    <div className="min-h-[60vh] flex items-center justify-center text-slate-400 font-bold">
      Booking không tồn tại
    </div>
  );

  const statusColor: Record<string, string> = {
    PENDING_REVIEW: 'bg-amber-100 text-amber-700',
    IN_REVIEW: 'bg-blue-100 text-blue-700',
    PENDING_APPROVAL: 'bg-orange-100 text-orange-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Thẩm định chi tiết</p>
          <h1 className="text-xl font-black text-slate-800 truncate">{booking.course_name || booking.purpose}</h1>
        </div>
        <Badge className={cn('text-xs font-black px-3 py-1 border-none', statusColor[booking.status] || 'bg-slate-100 text-slate-600')}>
          {booking.status}
        </Badge>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Col 1 — Booking info (50%) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <h2 className="text-base font-black text-slate-700 border-b border-slate-100 pb-3">Thông tin booking</h2>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <MapPin className="w-4 h-4" />, label: 'Phòng học', value: `${booking.class_name}${booking.class_location ? ` · ${booking.class_location}` : ''}` },
                { icon: <Users className="w-4 h-4" />, label: 'Số người', value: `${booking.attendee_count} / ${booking.class_capacity || '?'} người` },
                { icon: <Calendar className="w-4 h-4" />, label: 'Ngày học', value: booking.date ? format(parseISO(booking.date), 'EEEE, dd/MM/yyyy', { locale: vi }) : '—' },
                { icon: <Clock className="w-4 h-4" />, label: 'Ca học', value: `${booking.slot_name} · ${booking.start_time}–${booking.end_time}` },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">{icon}</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{label}</p>
                    <p className="text-sm font-bold text-slate-700">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Creator */}
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-sm">
                {booking.creator_name?.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-black text-slate-700">{booking.creator_name}</p>
                <p className="text-[11px] text-slate-400">{booking.creator_email}</p>
              </div>
            </div>

            {/* Purpose */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><Info className="w-3 h-3" />Mục đích</p>
              <p className="text-sm text-slate-600 leading-relaxed">{booking.description || booking.purpose || '—'}</p>
            </div>
          </div>

          {/* Activity timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-black text-slate-700">Lịch sử trạng thái</h3>
            </div>
            <div className="space-y-4">
              {(booking.logs || []).map((log: Log, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    {i < (booking.logs?.length - 1) && <div className="w-px flex-1 bg-slate-100 my-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-black text-slate-700">{log.to_status} <span className="font-medium text-slate-400">bởi {log.actor_name}</span></p>
                    <p className="text-[11px] text-slate-400">{log.created_at ? format(parseISO(log.created_at), 'HH:mm dd/MM/yyyy') : ''}</p>
                    {log.comment && <p className="text-[11px] text-slate-500 mt-0.5 italic">&quot;{log.comment}&quot;</p>}
                  </div>
                </div>
              ))}
              {(!booking.logs || booking.logs.length === 0) && (
                <p className="text-xs text-slate-400 italic">Chưa có lịch sử</p>
              )}
            </div>
          </div>
        </div>

        {/* Col 2 — Creator info (25%) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-black text-slate-700">Thông tin Creator</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black text-lg">
                {booking.creator_name?.charAt(0)}
              </div>
              <div>
                <p className="font-black text-slate-800 text-sm">{booking.creator_name}</p>
                <p className="text-[11px] text-slate-400">{booking.creator_email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3 — Action Panel (25%, sticky) */}
        <div className="lg:col-span-3">
          <div className="sticky top-6 space-y-4">

            {/* Panel A — PENDING_REVIEW */}
            {panelState === 'A' && (
              <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
                <div className="bg-amber-50 px-5 py-3 border-b border-amber-100">
                  <p className="text-xs font-black text-amber-700">⚠️ Booking chưa được nhận xem xét</p>
                </div>
                <div className="p-5 space-y-3">
                  <button onClick={handleClaim} disabled={processing}
                    className="w-full h-11 bg-indigo-600 text-white font-black text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    🙋 Nhận xem xét ngay
                  </button>
                  <p className="text-[11px] text-slate-400 text-center">Bạn có thể đọc thông tin bên trái mà không cần claim</p>
                </div>
              </div>
            )}

            {/* Panel B — IN_REVIEW by me */}
            {panelState === 'B' && (
              <div className="bg-white rounded-2xl border border-blue-200 shadow-sm overflow-hidden">
                <div className="bg-blue-50 px-5 py-3 border-b border-blue-100">
                  <p className="text-xs font-black text-blue-700">✅ Bạn đang xem xét booking này</p>
                  {booking.claimed_at && (
                    <p className="text-[11px] text-blue-500 mt-0.5">Nhận lúc {format(parseISO(booking.claimed_at), 'HH:mm dd/MM')}</p>
                  )}
                </div>
                <div className="p-5 space-y-4">
                  {/* Note textarea */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-black text-slate-500 uppercase">Nhận xét *</label>
                      <span className={cn('text-[10px] font-bold', note.length >= 10 ? 'text-indigo-500' : 'text-slate-300')}>
                        {note.length}/1000
                      </span>
                    </div>
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value.slice(0, 1000))}
                      placeholder="Nhập nhận xét (tối thiểu 10 ký tự)..."
                      rows={4}
                      className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:border-indigo-400 focus:bg-white outline-none resize-none transition-colors"
                    />
                  </div>

                  {/* Internal checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)}
                      className="rounded text-indigo-500" />
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Nhận xét nội bộ (Creator không thấy)
                    </span>
                  </label>

                  {/* Actions */}
                  <button onClick={handleForward} disabled={processing || note.trim().length < 10}
                    className="w-full h-11 bg-green-600 text-white font-black text-sm rounded-xl hover:bg-green-700 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                    <Forward className="w-4 h-4" /> Chuyển lên Approver
                  </button>
                  <button onClick={() => setRejectOpen(true)} disabled={processing}
                    className="w-full h-11 border-2 border-rose-200 text-rose-600 font-black text-sm rounded-xl hover:bg-rose-50 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> Từ chối
                  </button>
                  <button onClick={handleUnclaim} disabled={processing}
                    className="w-full h-9 text-slate-400 font-bold text-xs rounded-xl hover:text-rose-500 transition-all flex items-center justify-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" /> Unclaim — trả lại hàng đợi
                  </button>
                </div>
              </div>
            )}

            {/* Panel C — IN_REVIEW by other */}
            {panelState === 'C' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-600">
                    🔒 Reviewer <span className="text-indigo-600">{booking.reviewer_name}</span> đang xử lý
                  </p>
                  {booking.claimed_at && <p className="text-[11px] text-slate-400 mt-0.5">Nhận lúc {format(parseISO(booking.claimed_at), 'HH:mm dd/MM')}</p>}
                </div>
                <div className="p-5 text-xs text-slate-500 space-y-2">
                  <p>Bạn chỉ có thể đọc thông tin. Không thể tương tác khi Reviewer khác đang xử lý.</p>
                </div>
              </div>
            )}

            {/* DONE state */}
            {panelState === 'DONE' && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                <p className="text-sm font-black text-slate-700">Booking đã được xử lý</p>
                <p className="text-xs text-slate-400">Trạng thái: {booking.status}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <AnimatePresence>
        {rejectOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setRejectOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-md overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-rose-600 text-white">
                <h3 className="font-black flex items-center gap-2"><XCircle className="w-5 h-5" /> Từ chối yêu cầu đặt lớp</h3>
                <p className="text-xs text-rose-100 mt-1">Hành động này không thể hoàn tác. Creator sẽ nhận thông báo.</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500 uppercase">Lý do từ chối *</label>
                  <select value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-rose-400 bg-white">
                    <option value="">— Chọn lý do —</option>
                    {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[11px] font-black text-slate-500 uppercase">Chi tiết lý do *</label>
                    <span className={cn('text-[10px] font-bold', rejectDetail.length >= 20 ? 'text-rose-500' : 'text-slate-300')}>{rejectDetail.length}/500</span>
                  </div>
                  <textarea value={rejectDetail} onChange={e => setRejectDetail(e.target.value.slice(0, 500))}
                    placeholder="Mô tả chi tiết lý do từ chối (tối thiểu 20 ký tự)..."
                    rows={3}
                    className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:border-rose-400 outline-none resize-none" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rejectSuggest} onChange={e => setRejectSuggest(e.target.checked)} className="rounded text-rose-500" />
                  <span className="text-xs text-slate-600 font-medium">Gợi ý Creator nên thực hiện lại với thông tin đã điều chỉnh</span>
                </label>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
                <button onClick={() => setRejectOpen(false)} className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-100">Hủy</button>
                <button onClick={handleReject} disabled={processing || !rejectReason || rejectDetail.length < 20}
                  className="h-9 px-5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-40 transition-all">
                  Xác nhận từ chối
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
