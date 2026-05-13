'use client';

import * as React from 'react';
import { fetchApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { safeFormat } from '@/lib/date-utils';
import {
  Inbox, Clock, Users, MapPin, Zap, Search, RefreshCcw,
  ChevronRight, X, ClipboardCheck, AlertTriangle, ArrowRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, parseISO, differenceInHours } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface Booking {
  id: string;
  course_name?: string;
  purpose?: string;
  class_name?: string;
  date: string;
  slot_name: string;
  creator_name: string;
  submitted_at: string | null;
  attendee_count?: number;
  description?: string;
  claimed_at?: string;
}

// Waiting time helper
function WaitBadge({ submittedAt }: { submittedAt: string | null }) {
  if (!submittedAt) return <span className="text-slate-300 text-xs font-bold">—</span>;
  const hours = differenceInHours(new Date(), parseISO(submittedAt));
  const label = formatDistanceToNow(parseISO(submittedAt), { addSuffix: false, locale: vi });
  const color = hours > 48 ? 'text-rose-600 bg-rose-50 border-rose-200'
    : hours > 24 ? 'text-orange-600 bg-orange-50 border-orange-200'
    : 'text-emerald-600 bg-emerald-50 border-emerald-200';
  const title = `Gửi lúc ${safeFormat(submittedAt, 'HH:mm dd/MM/yyyy')}`;
  return (
    <span title={title} className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold', color)}>
      <Clock className="w-3 h-3" />{label}
      {hours > 48 && <AlertTriangle className="w-3 h-3 ml-0.5" />}
    </span>
  );
}

export default function ReviewerQueuePage() {
  const router = useRouter();
  const [pending, setPending] = React.useState<Booking[]>([]);
  const [inReview, setInReview] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<'pending' | 'mine'>('pending');
  const [search, setSearch] = React.useState('');
  const [sort, setSort] = React.useState('oldest');
  const [preview, setPreview] = React.useState<Booking | null>(null);
  const [unclaimId, setUnclaimId] = React.useState<string | null>(null);
  const [unclaimProcessing, setUnclaimProcessing] = React.useState(false);
  const [stats, setStats] = React.useState<any>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, mRes, sRes] = await Promise.all([
        fetchApi(`/api/reviewer/queue?sort=${sort}&booker=${encodeURIComponent(search)}`),
        fetchApi('/api/reviewer/in-progress'),
        fetchApi('/api/bookings/stats')
      ]);
      setPending(pRes.data || []);
      setInReview(mRes.data || []);
      setStats(sRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sort, search]);

  React.useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const handleClaim = async (id: string) => {
    try {
      await fetchApi(`/api/bookings/${id}/claim`, { method: 'PATCH' });
      toast.success('Đã nhận xem xét — đang chuyển đến trang chi tiết...');
      router.push(`/reviewer/evaluate/${id}`);
    } catch (err) {
      toast.error((err as Error).message || 'Lỗi khi nhận xem xét');
    }
  };

  const handleUnclaim = async () => {
    if (!unclaimId) return;
    setUnclaimProcessing(true);
    try {
      await fetchApi(`/api/bookings/${unclaimId}/unclaim`, { method: 'PATCH', body: JSON.stringify({ reason: 'Trả lại hàng đợi' }) });
      toast.success('Đã trả booking về hàng đợi chung');
      setUnclaimId(null);
      load();
    } catch (err) {
      toast.error((err as Error).message || 'Lỗi unclaim');
    } finally {
      setUnclaimProcessing(false);
    }
  };

  const list = tab === 'pending' ? pending : inReview;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">

      {/* Breadcrumb */}
      <nav className="text-sm font-medium text-slate-400">
        <Link href="/home" className="hover:text-indigo-600 transition-colors">Trang chủ</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-700">Xem xét yêu cầu</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Hàng đợi xem xét
            </h1>
            <p className="text-xs text-slate-400 font-medium">Bảng điều khiển Reviewer · SRS 10.1</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="h-9 px-3 flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-bold transition-all">
            <RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Làm mới
          </button>
          <Link href="/reviewer/history" className="h-9 px-4 flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 text-xs font-bold transition-all">
            Lịch sử đã xử lý <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Dashboard Stats SRS 10.1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
            <Badge className="bg-amber-100 text-amber-700 border-none">Đang chờ</Badge>
          </div>
          <div>
            <div className="text-4xl font-black text-slate-800">{stats?.counts?.pending || 0}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Yêu cầu chưa xử lý</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <Badge className="bg-indigo-100 text-indigo-700 border-none">Chờ phê duyệt</Badge>
          </div>
          <div>
            <div className="text-4xl font-black text-slate-800">{stats?.counts?.forwarded || 0}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Đã trình Approver</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
              <Zap className="w-5 h-5" />
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 border-none">24h qua</Badge>
          </div>
          <div>
            <div className="text-4xl font-black text-slate-800">{stats?.counts?.approved_24h || 0}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Yêu cầu đã thông qua</div>
          </div>
        </div>
      </div>

      {/* Trends and Ratio Charts SRS 10.1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Xu hướng booking (14 ngày)</h3>
            <span className="text-[10px] font-bold text-slate-400">Đơn vị: Yêu cầu / Ngày</span>
          </div>
          <div className="h-40 flex items-end justify-between gap-1">
            {stats?.trend?.map((t: { count: number; day: string }, i: number) => {
              const max = Math.max(...stats.trend.map((x: { count: number }) => x.count), 1);
              const height = (t.count / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {t.count}
                  </div>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    className="w-full bg-slate-100 group-hover:bg-indigo-500 transition-colors rounded-t-lg min-h-[4px]" 
                  />
                  <div className="text-[8px] font-black text-slate-300 uppercase rotate-45 mt-4">{safeFormat(t.day, 'dd/MM')}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tỷ lệ xử lý (30 ngày)</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase">
                <span className="text-emerald-500">Approved</span>
                <span className="text-slate-800">{stats?.ratio?.approved || 0}</span>
              </div>
              <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${(stats?.ratio?.approved / ((stats?.ratio?.approved + stats?.ratio?.rejected) || 1)) * 100}%` }} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase">
                <span className="text-rose-500">Rejected</span>
                <span className="text-slate-800">{stats?.ratio?.rejected || 0}</span>
              </div>
              <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full" 
                  style={{ width: `${(stats?.ratio?.rejected / ((stats?.ratio?.approved + stats?.ratio?.rejected) || 1)) * 100}%` }} 
                />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-50">
              <p className="text-[10px] text-slate-400 font-medium italic">
                * Tỷ lệ phê duyệt hiện tại: {Math.round((stats?.ratio?.approved / ((stats?.ratio?.approved + stats?.ratio?.rejected) || 1)) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setTab('pending')}
          className={cn('px-6 py-2.5 rounded-xl text-xs font-black transition-all', tab === 'pending' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-700')}
        >
          Hàng đợi chung <span className={cn('ml-1 px-1.5 py-0.5 rounded-md text-[10px]', tab === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500')}>{pending.length}</span>
        </button>
        <button
          onClick={() => setTab('mine')}
          className={cn('px-6 py-2.5 rounded-xl text-xs font-black transition-all', tab === 'mine' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-700')}
        >
          Đang xử lý <span className={cn('ml-1 px-1.5 py-0.5 rounded-md text-[10px]', tab === 'mine' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500')}>{inReview.length}</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, người đặt..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400 transition-colors"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="h-9 px-3 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400"
        >
          <option value="oldest">⏰ Chờ lâu nhất</option>
          <option value="newest">🆕 Mới nhất</option>
          <option value="date_asc">📅 Ngày học gần nhất</option>
          <option value="attendees">👥 Số người nhiều nhất</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center">
            <ClipboardCheck className="w-9 h-9 text-slate-300" />
          </div>
          <h3 className="text-lg font-black text-slate-600">
            {tab === 'pending' ? 'Hàng đợi trống 🧊' : 'Bạn chưa nhận booking nào'}
          </h3>
          <p className="text-slate-400 text-sm">
            {tab === 'pending' ? 'Hiện không có yêu cầu nào chờ xem xét.' : 'Nhận một booking từ tab "Chờ xem xét" để bắt đầu.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(b => {
            const hours = b.submitted_at ? differenceInHours(new Date(), parseISO(b.submitted_at)) : 0;
            const isOverdue = tab === 'mine' && hours > 24;
            return (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden',
                  isOverdue ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'
                )}
              >
                <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Left: info */}
                  <div className="flex-1 space-y-1 min-w-0">
                    {isOverdue && (
                      <div className="flex items-center gap-1 text-[11px] font-black text-rose-600 mb-1">
                        <AlertTriangle className="w-3 h-3" /> Cần xử lý sớm — đã cầm {hours}h
                      </div>
                    )}
                    <Link href={`/reviewer/evaluate/${b.id}`} className="font-black text-slate-800 hover:text-indigo-600 transition-colors text-base leading-tight truncate block">
                      {b.course_name || b.purpose}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.class_name}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{b.attendee_count} người</span>
                      <span>{b.creator_name}</span>
                      <span className="flex items-center gap-1 text-slate-400">📅 {safeFormat(b.date, 'EEE dd/MM/yyyy', { locale: vi })}</span>
                    </div>
                  </div>

                  {/* Center: wait badge */}
                  <div className="flex-shrink-0">
                    <WaitBadge submittedAt={b.submitted_at} />
                    {tab === 'mine' && b.claimed_at && (
                      <p className="text-[10px] text-slate-400 mt-1">Nhận lúc {safeFormat(b.claimed_at, 'HH:mm dd/MM')}</p>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {tab === 'pending' && (
                      <>
                        <button
                          onClick={() => setPreview(b)}
                          className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all"
                        >
                          Xem nhanh
                        </button>
                        <button
                          onClick={() => handleClaim(b.id)}
                          className="h-9 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" /> Nhận xem xét
                        </button>
                      </>
                    )}
                    {tab === 'mine' && (
                      <>
                        <button
                          onClick={() => setUnclaimId(b.id)}
                          className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-all"
                        >
                          ↩ Unclaim
                        </button>
                        <Link
                          href={`/reviewer/evaluate/${b.id}`}
                          className="h-9 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1.5"
                        >
                          Tiếp tục <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick Preview Panel */}
      <AnimatePresence>
        {preview && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
              onClick={() => setPreview(null)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="font-black text-slate-800">Xem nhanh</h3>
                <button onClick={() => setPreview(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">Tiêu đề</p>
                  <p className="font-black text-slate-800 text-lg leading-tight">{preview.course_name || preview.purpose}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[11px] font-black text-slate-400 uppercase">Phòng</p><p className="font-bold text-slate-700">{preview.class_name}</p></div>
                  <div><p className="text-[11px] font-black text-slate-400 uppercase">Số người</p><p className="font-bold text-slate-700">{preview.attendee_count}</p></div>
                  <div><p className="text-[11px] font-black text-slate-400 uppercase">Ngày học</p><p className="font-bold text-slate-700">{safeFormat(preview.date, 'dd/MM/yyyy')}</p></div>
                  <div><p className="text-[11px] font-black text-slate-400 uppercase">Ca học</p><p className="font-bold text-slate-700">{preview.slot_name}</p></div>
                </div>
                {preview.description && (
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase mb-1">Mục đích</p>
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">{preview.description}</p>
                  </div>
                )}
                <div><p className="text-[11px] font-black text-slate-400 uppercase mb-1">Thời gian chờ</p><WaitBadge submittedAt={preview.submitted_at} /></div>
              </div>
              <div className="p-5 border-t border-slate-100 space-y-2 sticky bottom-0 bg-white">
                <button
                  onClick={() => { setPreview(null); handleClaim(preview.id); }}
                  className="w-full h-11 bg-indigo-600 text-white font-black text-sm rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" /> Nhận xem xét ngay
                </button>
                <Link
                  href={`/reviewer/evaluate/${preview.id}`}
                  className="w-full h-9 border border-slate-200 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Xem chi tiết (không claim)
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unclaim Confirm Dialog */}
      <AnimatePresence>
        {unclaimId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setUnclaimId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm space-y-4">
              <h3 className="font-black text-slate-800">↩ Trả lại hàng đợi?</h3>
              <p className="text-sm text-slate-500">Booking sẽ quay lại hàng đợi chung và có thể được Reviewer khác nhận.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setUnclaimId(null)} className="h-9 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50">Hủy</button>
                <button onClick={handleUnclaim} disabled={unclaimProcessing}
                  className="h-9 px-5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50">
                  {unclaimProcessing ? 'Đang xử lý...' : 'Xác nhận trả'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
