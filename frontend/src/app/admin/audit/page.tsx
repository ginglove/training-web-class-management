'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { fetchApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Input as CustomInput } from '@/components/ui/Input';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  Database, 
  Search, 
  Filter, 
  History, 
  User, 
  Info, 
  ArrowRight, 
  Clock, 
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Activity,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuditLogPage() {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/admin/audit');
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    (l.actor_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.comment || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.to_status || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-xl shadow-indigo-500/5">
                <History className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
                  <Sparkles className="w-3 h-3" />
                  <span>Truy vết hoạt động</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-800">Nhật ký Hệ thống 📜</h1>
             </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">Ghi lại toàn bộ lịch sử thay đổi trạng thái, người thực hiện và ghi chú liên quan đến quy trình đặt phòng.</p>
        </div>

        <div className="relative w-full lg:w-80 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
          <CustomInput 
            type="text"
            placeholder="Tìm theo tiêu đề hoặc người đặt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 h-14 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-primary/30 transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden relative min-h-[600px]">
        {loading ? (
          <div className="p-20 space-y-10 text-center">
             <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
             <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Đang truy xuất dữ liệu audit...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Thời điểm</span>
                  </th>
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Người thực hiện</span>
                  </th>
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Thay đổi</span>
                  </th>
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Nội dung / Ghi chú</span>
                  </th>
                  <th className="p-8 text-right">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Chi tiết</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredLogs.map((l, i) => (
                  <tr key={l.id || i} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="p-8">
                      <div className="flex items-center gap-4 text-slate-500">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-black text-slate-700 tracking-tight leading-none">
                            {format(new Date(l.created_at), 'HH:mm:ss')}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {format(new Date(l.created_at), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 font-black text-xs">
                          {l.actor_name?.charAt(0) || 'U'}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-black text-slate-800 tracking-tight leading-none">{l.actor_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l.actor_role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-3">
                         <Badge className={cn(
                           "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-slate-100 bg-white text-slate-400"
                         )}>
                           {l.from_status || 'NULL'}
                         </Badge>
                         <ArrowRight className="w-4 h-4 text-slate-200" />
                         <Badge className={cn(
                           "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border shadow-sm",
                           l.to_status === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                           l.to_status === 'REJECTED' ? "bg-rose-50 text-rose-600 border-rose-100" :
                           l.to_status === 'CANCELLED' ? "bg-slate-50 text-slate-500 border-slate-200" :
                           "bg-amber-50 text-amber-600 border-amber-100"
                         )}>
                           {l.to_status}
                         </Badge>
                      </div>
                    </td>
                    <td className="p-8">
                      <p className="text-sm font-bold text-slate-500 italic max-w-sm line-clamp-2 leading-relaxed group-hover:text-slate-800 transition-colors">
                        "{l.comment || 'Không có ghi chú kèm theo.'}"
                      </p>
                    </td>
                    <td className="p-8 text-right">
                       <button className="p-4 bg-white border border-slate-100 rounded-[1.2rem] text-slate-300 hover:text-primary hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10 transition-all opacity-0 group-hover:opacity-100 active:scale-90">
                          <ExternalLink className="w-5 h-5" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-32 text-center space-y-8 bg-white">
            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto border border-slate-100">
              <History className="w-12 h-12 text-slate-200" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Nhật ký trống</h3>
              <p className="text-slate-400 font-bold max-w-md mx-auto italic">Chưa có bất kỳ thay đổi trạng thái nào được ghi nhận trong hệ thống.</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 p-8 bg-indigo-900 rounded-[2.5rem] text-white relative overflow-hidden group">
         <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-32 h-32" />
         </div>
         <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
            <Info className="w-7 h-7 text-primary" />
         </div>
         <div className="space-y-1 relative z-10">
            <h4 className="text-lg font-black uppercase tracking-tight leading-none">Tính toàn vẹn dữ liệu</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dữ liệu audit log là bất biến và không thể bị chỉnh sửa bởi bất kỳ ai.</p>
         </div>
      </div>
    </div>
  );
}
