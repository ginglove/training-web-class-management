'use client';

import * as React from 'react';
import { fetchApi } from '@/lib/api';
import { ShieldCheck, CheckCircle2, XCircle, Clock, ArrowRight, AlertTriangle, Calendar as CalIcon } from 'lucide-react';
import Link from 'next/link';
import { parseISO, differenceInHours } from 'date-fns';
import { motion } from 'framer-motion';

interface Booking {
  id: string;
  course_name?: string;
  purpose?: string;
  class_name: string;
  reviewer_name: string;
  forwarded_at: string;
}

interface Stats {
  pending?: number;
  approved_today?: number;
  rejected_today?: number;
  avg_hours_7d?: number;
}

export default function ApproverDashboardPage() {
  const [stats, setStats] = React.useState<Stats>({});
  const [urgent, setUrgent] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      fetchApi('/api/approver/stats'),
      fetchApi('/api/approver/queue?sort=urgent&limit=5'),
    ]).then(([s, q]) => {
      setStats(s || {});
      setUrgent((q.data || []).filter((b: Booking) => differenceInHours(new Date(), parseISO(b.forwarded_at)) > 24));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const kpis = [
    { label: 'Chờ phê duyệt', value: stats.pending || 0, sub: 'Cần quyết định', icon: <ShieldCheck className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600' },
    { label: 'Đã duyệt hôm nay', value: stats.approved_today || 0, sub: 'Booking APPROVED', icon: <CheckCircle2 className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Đã từ chối hôm nay', value: stats.rejected_today || 0, sub: 'Booking REJECTED', icon: <XCircle className="w-6 h-6" />, color: 'bg-rose-50 text-rose-600' },
    { label: 'Tốc độ xử lý TB', value: stats.avg_hours_7d ? `${stats.avg_hours_7d}h` : '—', sub: 'Trung bình 7 ngày', icon: <Clock className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard Phê Duyệt 👑</h1>
        <p className="text-slate-500 font-medium mt-2">Tổng quan hiệu suất và danh sách cần ưu tiên xử lý.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${k.color}`}>
              {k.icon}
            </div>
            <div>
              <p className="text-3xl font-black text-slate-800">{k.value}</p>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">{k.label}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">{k.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500" /> Ưu tiên xử lý ngay (&gt;24h)</h2>
            <Link href="/approver/queue" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviewer</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian chờ</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {urgent.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center text-slate-400">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="w-6 h-6" /></div>
                      <p className="font-bold">Tuyệt vời! Không có booking nào bị quá hạn xử lý.</p>
                    </td>
                  </tr>
                ) : urgent.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-800 max-w-[200px] truncate" title={b.course_name || b.purpose}>{b.course_name || b.purpose}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{b.class_name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-slate-700">{b.reviewer_name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-1 rounded font-black text-[10px] border border-rose-100">
                        ⏳ {differenceInHours(new Date(), parseISO(b.forwarded_at))}h
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/approver/bookings/${b.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Insights / Charts Placeholder */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><CalIcon className="w-5 h-5 text-blue-500" /> Insights & Tỉ lệ</h2>
          
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tỉ lệ duyệt 30 ngày qua</p>
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
                <div className="bg-emerald-500 h-full" style={{ width: '75%' }} title="75% Approved" />
                <div className="bg-rose-500 h-full" style={{ width: '25%' }} title="25% Rejected" />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 mt-2">
                <span className="text-emerald-600">75% Phê duyệt</span>
                <span className="text-rose-600">25% Từ chối</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Hoạt động tuần này (giả lập biểu đồ)</p>
              <div className="flex items-end gap-2 h-32 w-full">
                {[4, 7, 3, 8, 5, 2, 0].map((v, i) => (
                  <div key={i} className="flex-1 bg-emerald-100 rounded-t-sm relative group">
                    <div className="absolute bottom-0 w-full bg-emerald-500 rounded-t-sm transition-all duration-500" style={{ height: `${(v / 8) * 100}%` }} />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded">
                      {v}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase">
                <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoạt động gần đây</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-[11px]">
                  <p className="font-bold text-slate-800">Đã phê duyệt booking P.102</p>
                  <p className="text-slate-400">15 phút trước</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
                <div className="text-[11px]">
                  <p className="font-bold text-slate-800">Đã từ chối booking P.405</p>
                  <p className="text-slate-400">2 giờ trước</p>
                </div>
              </div>
            </div>
            <Link href="/approver/history" className="block text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors pt-2">
              Xem lịch sử đầy đủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
