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
  class_name: string;
  date: string;
  slot_name: string;
  processed_at: string;
  status: string;
  creator_name: string;
  reviewer_name?: string;
  approver_note?: string;
  rejection_reason?: string;
}

function exportCsv(rows: Booking[]) {
  const header = ['Tiêu đề', 'Phòng', 'Ca học', 'Ngày quyết định', 'Quyết định', 'Người tạo', 'Thẩm định viên', 'Nhận xét phê duyệt'];
  const lines = [header, ...rows.map(b => [
    b.course_name || b.purpose,
    b.class_name,
    `${b.date ? format(parseISO(b.date), 'dd/MM/yyyy') : ''} ${b.slot_name}`,
    b.processed_at ? format(parseISO(b.processed_at), 'dd/MM/yyyy HH:mm') : '',
    b.status,
    b.creator_name,
    b.reviewer_name || 'N/A',
    (b.approver_note || b.rejection_reason || '').replace(/,/g, ';'),
  ])];
  const csv = lines.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'lich-su-approver.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function ApproverHistoryPage() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState<'ALL' | 'APPROVED' | 'REJECTED'>('ALL');
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
      const res = await fetchApi(`/api/approver/history?${params}`);
      setBookings(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tab, dateFrom, dateTo]);

  React.useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter(b =>
    (b.course_name || b.purpose || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.creator_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Approver</p>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            Lịch sử Quyết định <History className="w-6 h-6 text-slate-400" />
          </h1>
        </div>
        <button onClick={() => exportCsv(filtered)}
          className="h-10 px-5 flex items-center gap-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
          <Download className="w-4 h-4" /> Xuất Excel
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        {/* Tabs */}
        <div className="flex w-full lg:w-auto bg-slate-50 p-1 rounded-xl">
          {(['ALL', 'APPROVED', 'REJECTED'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('flex-1 lg:flex-none px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all', 
                tab === t 
                  ? t === 'APPROVED' ? 'bg-white shadow-sm text-emerald-600' : t === 'REJECTED' ? 'bg-white shadow-sm text-rose-600' : 'bg-white shadow-sm text-slate-800' 
                  : 'text-slate-400 hover:text-slate-600')}>
              {t === 'ALL' ? 'Tất cả' : t === 'APPROVED' ? '✅ Phê duyệt' : '❌ Từ chối'}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex w-full lg:w-auto gap-2">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Tìm booking..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-emerald-400" />
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-emerald-400" title="Từ ngày" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:bg-white focus:border-emerald-400" title="Đến ngày" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Tiêu đề', 'Phòng', 'Ngày quyết định', 'Quyết định', 'Người tạo / Reviewer', 'Nhận xét', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-10 bg-slate-50 animate-pulse rounded-xl" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-20 text-slate-400 font-bold">Không tìm thấy lịch sử phù hợp</td></tr>
              ) : filtered.map(b => (
                <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 max-w-[200px]">
                    <p className="font-black text-slate-800 truncate" title={b.course_name || b.purpose}>{b.course_name || b.purpose}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{b.slot_name}</p>
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-700 whitespace-nowrap">{b.class_name}</td>
                  <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                    {b.processed_at ? format(parseISO(b.processed_at), 'HH:mm dd/MM/yyyy') : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
                      b.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700')}>
                      {b.status === 'APPROVED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {b.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="text-xs font-bold text-slate-700">C: {b.creator_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">R: {b.reviewer_name}</p>
                  </td>
                  <td className="px-5 py-4 max-w-[200px]">
                    <p className="text-xs text-slate-500 italic truncate" title={b.approver_note || b.rejection_reason}>
                      &quot;{b.approver_note || b.rejection_reason || 'Không có'}&quot;
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/approver/bookings/${b.id}`} className="inline-flex p-2 bg-slate-50 text-slate-500 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
