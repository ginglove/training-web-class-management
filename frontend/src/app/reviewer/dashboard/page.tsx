'use client';

import * as React from 'react';
import { fetchApi } from '@/lib/api';
import { format, parseISO, differenceInHours } from 'date-fns';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  course_name?: string;
  purpose?: string;
  creator_name: string;
  class_name: string;
  submitted_at: string;
}

interface Stats {
  pending?: number;
  in_review?: number;
  processed_today?: number;
}

function KpiCard({ label, value, sub, color }: { label: string; value: number | string | undefined; sub?: string; color: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border shadow-sm p-5 space-y-2', color)}>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-black text-slate-800">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function ReviewerDashboard() {
  const [stats, setStats] = React.useState<Stats>({});
  const [oldest, setOldest] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetchApi('/api/reviewer/stats'),
      fetchApi('/api/reviewer/queue?sort=oldest&limit=5'),
    ]).then(([s, q]) => {
      setStats(s || {});
      setOldest(q.data || []);
    }).catch((err: unknown) => {
      console.error(err);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Reviewer</p>
          <h1 className="text-2xl font-black text-slate-800">Dashboard</h1>
        </div>
        <Link href="/reviewer/pending"
          className="h-10 px-5 bg-indigo-600 text-white rounded-xl text-sm font-black hover:bg-indigo-700 transition-all flex items-center gap-2">
          Xem hàng đợi ngay <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Chờ xem xét" value={stats.pending} sub="PENDING_REVIEW" color="border-amber-100" />
        <KpiCard label="Đang xem xét" value={stats.in_review} sub="IN_REVIEW · của tôi" color="border-blue-100" />
        <KpiCard label="Đã xử lý hôm nay" value={stats.processed_today} sub="Forward + Reject" color="border-green-100" />
        <KpiCard label="Trung bình xử lý" value="—" sub="Đang tính..." color="border-slate-100" />
      </div>

      {/* Oldest pending */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <h2 className="font-black text-slate-700 text-sm">Chờ xử lý lâu nhất (Top 5)</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {oldest.length === 0 && (
            <p className="text-center py-8 text-slate-400 text-sm">Hàng đợi trống 🎉</p>
          )}
          {oldest.map(b => {
            const hours = b.submitted_at ? differenceInHours(new Date(), parseISO(b.submitted_at)) : 0;
            return (
              <div key={b.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', hours > 48 ? 'bg-rose-500' : hours > 24 ? 'bg-orange-400' : 'bg-emerald-400')} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{b.course_name || b.purpose}</p>
                  <p className="text-xs text-slate-400">{b.creator_name} · {b.class_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={cn('text-xs font-black', hours > 48 ? 'text-rose-600' : hours > 24 ? 'text-orange-500' : 'text-emerald-600')}>
                    {hours}h
                    {hours > 48 && ' ⚠️'}
                  </p>
                  <p className="text-[11px] text-slate-400">{b.submitted_at ? format(parseISO(b.submitted_at), 'HH:mm dd/MM') : ''}</p>
                </div>
                <Link href={`/reviewer/evaluate/${b.id}`} className="text-indigo-500 hover:text-indigo-700 flex-shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick legend */}
      <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />{'< 24h — Bình thường'}</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400" />24–48h — Cần chú ý</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />{'>'}48h — Quá hạn</span>
      </div>
    </div>
  );
}
