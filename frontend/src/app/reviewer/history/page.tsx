'use client';

import * as React from 'react';
import { fetchApi } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { History, CheckCircle2, XCircle, Search, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Booking {
  id: string;
  course_name?: string;
  purpose?: string;
  creator_name: string;
  class_name: string;
  status: string;
  processed_at?: string;
  reviewer_note?: string;
}

function exportCsv(rows: Booking[]) {
  const header = ['Tiêu đề', 'Người tạo', 'Phòng', 'Hành động', 'Ngày xử lý', 'Kết quả cuối', 'Nhận xét'];
  const lines = [header, ...rows.map(b => [
    b.course_name || b.purpose,
    b.creator_name,
    b.class_name,
    ['PENDING_APPROVAL', 'APPROVED'].includes(b.status) ? 'FORWARDED' : 'REJECTED',
    b.processed_at ? format(parseISO(b.processed_at), 'dd/MM/yyyy HH:mm') : '',
    b.status,
    (b.reviewer_note || '').replace(/,/g, ';'),
  ])];
  const csv = lines.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'lich-su-reviewer.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function ReviewerHistoryPage() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<'ALL' | 'FORWARDED' | 'REJECTED'>('ALL');
  const [search, setSearch] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab !== 'ALL') params.set('action', tab);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      const res = await fetchApi(`/api/reviewer/history?${params}`);

      setBookings(res.data || []);
    } catch (err: unknown) { 
      console.error(err); 
    }
    finally { setLoading(false); }
  }, [tab, dateFrom, dateTo]);

  React.useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter(b =>
    (b.course_name || b.purpose || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.creator_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const actionOf = (b: Booking) => ['PENDING_APPROVAL', 'APPROVED'].includes(b.status) ? 'FORWARDED' : 'REJECTED';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Breadcrumb */}
      <nav className="text-sm font-medium text-slate-400">
        <Link href="/home" className="hover:text-indigo-600">Trang chủ</Link>
        <span className="mx-2">›</span>
        <Link href="/reviewer/pending" className="hover:text-indigo-600">Hàng đợi</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-700">Lịch sử đã xử lý</span>
      </nav>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            <History className="w-5 h-5 text-slate-500" />
          </div>
          <h1 className="text-xl font-black text-slate-800">Lịch sử đã xử lý</h1>
        </div>
        <button onClick={() => exportCsv(filtered)}
          className="h-9 px-4 flex items-center gap-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-black transition-all">
          <Download className="w-3.5 h-3.5" /> Xuất CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['ALL', 'FORWARDED', 'REJECTED'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 rounded-lg text-xs font-black transition-all', tab === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-700')}>
            {t === 'ALL' ? 'Tất cả' : t === 'FORWARDED' ? '✅ Đã chuyển tiếp' : '❌ Đã từ chối'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Tìm tiêu đề, người đặt..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 text-sm rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" />
        </div>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="h-9 px-3 text-sm rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="h-9 px-3 text-sm rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Tiêu đề', 'Người tạo', 'Phòng', 'Hành động', 'Ngày xử lý', 'Kết quả cuối', 'Nhận xét', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-slate-100 animate-pulse rounded" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400 font-bold">Không có dữ liệu</td></tr>
              ) : filtered.map(b => {
                const action = actionOf(b);
                return (
                  <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800 max-w-[180px] truncate">{b.course_name || b.purpose}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{b.creator_name}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{b.class_name}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black',
                        action === 'FORWARDED' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700')}>
                        {action === 'FORWARDED' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {b.processed_at ? format(parseISO(b.processed_at), 'HH:mm dd/MM/yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-black',
                        b.status === 'APPROVED' ? 'bg-green-100 text-green-700'
                          : b.status === 'REJECTED' ? 'bg-rose-100 text-rose-700'
                          : 'bg-orange-100 text-orange-700')}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[160px] truncate" title={b.reviewer_note}>
                      {b.reviewer_note || <span className="italic text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/reviewer/evaluate/${b.id}`} className="text-indigo-500 hover:text-indigo-700 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
