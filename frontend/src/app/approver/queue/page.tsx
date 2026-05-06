'use client';

import * as React from 'react';
import { fetchApi } from '@/lib/api';
import { format, parseISO, differenceInHours, addDays } from 'date-fns';
import {
  ShieldCheck, Search, CheckCircle, Eye, AlertTriangle, User
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Booking {
  id: string;
  course_name?: string;
  purpose?: string;
  creator_name: string;
  class_name: string;
  date: string;
  slot_name: string;
  forwarded_at: string;
  reviewer_name: string;
  reviewer_note?: string;
  status: string;
}

export default function ApproverQueuePage() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  // Filters
  const [search, setSearch] = React.useState('');
  const [sort, setSort] = React.useState('urgent');

  // Quick Approve Dialog
  const [approveConfirm, setApproveConfirm] = React.useState<Booking | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/approver/queue?sort=${sort}`);
      let data = res.data || [];
      if (search) {
        data = data.filter((b: Booking) => 
          (b.course_name || b.purpose || '').toLowerCase().includes(search.toLowerCase()) ||
          (b.creator_name || '').toLowerCase().includes(search.toLowerCase())
        );
      }
      setBookings(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [sort, search]);

  React.useEffect(() => {
    const timer = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const handleQuickApprove = async () => {
    if (!approveConfirm) return;
    setProcessingId(approveConfirm.id);
    try {
      await fetchApi(`/api/bookings/${approveConfirm.id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ note: 'Phê duyệt nhanh từ hàng đợi' }),
      });
      toast.success('Đã phê duyệt booking!');
      setBookings(prev => prev.map(b => b.id === approveConfirm.id ? { ...b, status: 'APPROVED' } : b));
      setTimeout(() => {
        setBookings(prev => prev.filter(b => b.id !== approveConfirm.id));
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi phê duyệt';
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
      setApproveConfirm(null);
    }
  };

  const handleUnclaim = async (id: string) => {
    try {
      await fetchApi(`/api/bookings/${id}/unclaim`, { method: 'PATCH' });
      toast.success('Đã trả lại booking về hàng đợi Reviewer');
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      toast.error('Lỗi khi trả lại booking');
    }
  };

  const getWaitBadge = (forwardedAt: string) => {
    if (!forwardedAt) return null;
    const hours = differenceInHours(new Date(), parseISO(forwardedAt));
    if (hours > 48) return <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-[10px] font-black border border-rose-200"><AlertTriangle className="w-3 h-3" /> KHẨN ({hours}h)</span>;
    if (hours > 24) return <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md text-[10px] font-black border border-orange-200">⏳ {hours}h chờ</span>;
    return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] font-black border border-emerald-200">🟢 {hours}h</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Approver</p>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            Hàng đợi phê duyệt <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </h1>
        </div>
        
        {/* Filters */}
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Tìm booking, người đặt..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-400" />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 outline-none focus:border-emerald-400 appearance-none pr-8 relative">
            <option value="urgent">🚨 Khẩn cấp nhất</option>
            <option value="nearest_date">📅 Ngày học gần nhất</option>
            <option value="newest">✨ Mới chuyển lên</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Ưu tiên</th>
                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Tiêu đề / Người tạo</th>
                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Phòng / Ngày học</th>
                <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase">Thẩm định viên</th>
                <th className="px-5 py-3 text-right text-[10px] font-black text-slate-400 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-12 bg-slate-50 animate-pulse rounded-xl" /></td></tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ShieldCheck className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-bold">Không có booking nào chờ phê duyệt 🎉</p>
                  </td>
                </tr>
              ) : bookings.map(b => {
                const isUrgentDate = b.date && new Date(b.date) <= addDays(new Date(), 3);
                const isApproved = b.status === 'APPROVED';

                return (
                  <motion.tr key={b.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={cn('group transition-colors', isApproved ? 'bg-emerald-50' : 'hover:bg-slate-50')}>
                    
                    {/* Urgency */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getWaitBadge(b.forwarded_at)}
                    </td>

                    {/* Title & Creator */}
                    <td className="px-5 py-4">
                      <Link href={`/approver/bookings/${b.id}`} className="font-black text-slate-800 hover:text-emerald-600 block truncate max-w-[250px]">
                        {b.course_name || b.purpose}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                        <User className="w-3 h-3" /> {b.creator_name}
                      </div>
                    </td>

                    {/* Room & Date */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-700">{b.class_name}</p>
                      <p className={cn('text-xs font-medium mt-0.5', isUrgentDate ? 'text-rose-500 font-bold' : 'text-slate-500')}>
                        {b.date ? format(parseISO(b.date), 'dd/MM/yyyy') : '—'} · {b.slot_name}
                      </p>
                    </td>

                    {/* Reviewer Summary */}
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-slate-700">{b.reviewer_name}</p>
                      <p className="text-[11px] text-slate-500 max-w-[200px] truncate italic" title={b.reviewer_note}>
                        &quot;{b.reviewer_note || 'Đã chuyển tiếp'}&quot;
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-black text-xs bg-emerald-100 px-3 py-1 rounded-full">
                          <CheckCircle className="w-4 h-4" /> ĐÃ DUYỆT
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setApproveConfirm(b)} disabled={processingId === b.id}
                            className="h-8 px-3 bg-emerald-50 text-emerald-600 font-black text-xs rounded-lg hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1 border border-emerald-200 hover:border-emerald-600">
                            <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                          </button>
                          <Link href={`/approver/bookings/${b.id}`}
                            className="h-8 px-3 bg-white text-slate-600 font-bold text-xs rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1 border border-slate-200">
                            <Eye className="w-3.5 h-3.5" /> Chi tiết
                          </Link>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Approve Confirm Dialog */}
      <AnimatePresence>
        {approveConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setApproveConfirm(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Xác nhận phê duyệt?</h3>
                <div className="text-sm text-slate-500 mt-2">
                  Bạn đang duyệt nhanh yêu cầu <br/>
                  <span className="font-bold text-slate-700">&quot;{approveConfirm.course_name || approveConfirm.purpose}&quot;</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setApproveConfirm(null)} disabled={!!processingId}
                  className="flex-1 h-10 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200">Hủy</button>
                <button onClick={handleQuickApprove} disabled={!!processingId}
                  className="flex-1 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 flex items-center justify-center gap-2">
                  {processingId ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Xác nhận'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
