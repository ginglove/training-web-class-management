'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatDistanceToNow, isAfter, subDays, subMonths, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  CheckCheck, Trash2, 
  CheckCircle2, Sparkles, 
  ChevronRight, Home, Search,
  Check, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'APPROVED': return <span className="text-2xl">🎉</span>;
    case 'REJECTED': return <span className="text-2xl">❌</span>;
    case 'PENDING':  return <span className="text-2xl">⏳</span>;
    case 'WARNING':  return <span className="text-2xl">⚠️</span>;
    case 'SECURITY': return <span className="text-2xl">🔒</span>;
    default:         return <span className="text-2xl">🔔</span>;
  }
};

type StatusFilter = 'all' | 'unread' | 'read';
type TypeFilter = 'all' | 'booking' | 'system' | 'security';
type TimeFilter = 'all' | 'today' | '7days' | '30days';

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearReadNotifications,
    loading 
  } = useNotificationStore();

  // Filters State
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = React.useState<TypeFilter>('all');
  const [timeFilter, setTimeFilter] = React.useState<TimeFilter>('all');
  const [pageSize, setPageSize] = React.useState(10);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const filterNotifications = () => {
    return notifications.filter(n => {
      if (statusFilter === 'unread' && n.is_read) return false;
      if (statusFilter === 'read' && !n.is_read) return false;
      if (typeFilter !== 'all') {
        if (typeFilter === 'booking' && !['APPROVED', 'REJECTED', 'PENDING'].includes(n.type)) return false;
        if (typeFilter === 'security' && n.type !== 'SECURITY') return false;
        if (typeFilter === 'system' && ['APPROVED', 'REJECTED', 'PENDING', 'SECURITY'].includes(n.type)) return false;
      }
      if (timeFilter !== 'all') {
        const date = new Date(n.created_at);
        if (timeFilter === 'today' && !isAfter(date, startOfDay(new Date()))) return false;
        if (timeFilter === '7days' && !isAfter(date, subDays(new Date(), 7))) return false;
        if (timeFilter === '30days' && !isAfter(date, subMonths(new Date(), 1))) return false;
      }
      return true;
    });
  };

  const filtered = filterNotifications();
  const displayed = filtered.slice(0, pageSize);
  const hasMore = filtered.length > pageSize;

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    if (!confirm(`Đánh dấu tất cả ${unreadCount} thông báo là đã đọc?`)) return;
    try {
      await markAllAsRead();
      toast.success(`Đã đánh dấu ${unreadCount} thông báo đã đọc`);
    } catch {
      toast.error('Cập nhật thất bại');
    }
  };

  const handleClearRead = async () => {
    const readCount = notifications.length - unreadCount;
    if (readCount === 0) {
      toast.error('Không có thông báo nào đã đọc để xóa');
      return;
    }
    if (!confirm(`Xóa tất cả ${readCount} thông báo đã đọc? Hành động này không thể hoàn tác.`)) return;
    try {
      await clearReadNotifications();
      toast.success(`Đã xóa ${readCount} thông báo`);
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      toast.success('Đã xóa thông báo');
      setDeletingId(null);
    } catch {
      toast.error('Xóa thất bại');
    }
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsRead(id);
    } catch {
      toast.error('Cập nhật thất bại');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays > 7) {
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-32 px-4 sm:px-6 pt-10">
      <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-100/50 w-fit px-4 py-2 rounded-full border border-slate-100">
        <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <Home className="w-3 h-3" />
          <span>Trang chủ</span>
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-600">Thông báo</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-6xl font-black tracking-tighter text-slate-900 uppercase">Thông báo</h1>
            {unreadCount > 0 && (
              <span className="px-4 py-1.5 bg-primary text-white text-xl font-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] border-2 border-slate-900">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-slate-500 font-bold text-lg max-w-xl italic leading-relaxed">
            Theo dõi các cập nhật mới nhất từ hệ thống phê duyệt booking và bảo mật tài khoản.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-95 disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
          >
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
          <button
            onClick={handleClearRead}
            className="flex items-center gap-2 px-6 py-3 bg-rose-50 border-2 border-rose-900 rounded-2xl text-[10px] font-black text-rose-900 uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(159,18,57,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa đã đọc</span>
          </button>
        </div>
      </div>

      <Card className="p-8 bg-slate-900 border-2 border-slate-900 rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(15,23,42,0.1)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Trạng thái</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3 text-white text-sm font-bold focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="all">Tất cả thông báo</option>
              <option value="unread">Chưa đọc</option>
              <option value="read">Đã đọc</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Loại</label>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3 text-white text-sm font-bold focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="all">Tất cả loại</option>
              <option value="booking">Booking & Phê duyệt</option>
              <option value="system">Hệ thống & Cập nhật</option>
              <option value="security">Bảo mật tài khoản</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Thời gian</label>
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3 text-white text-sm font-bold focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="all">Mọi thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {displayed.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="empty">
              <Card className="p-20 flex flex-col items-center justify-center text-center space-y-6 bg-white border-4 border-dashed border-slate-200 rounded-[3rem]">
                <Search className="w-12 h-12 text-slate-200" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase">Không tìm thấy thông báo</h3>
                  <p className="text-slate-400 font-bold italic">Hãy thử thay đổi bộ lọc hoặc quay lại sau.</p>
                </div>
              </Card>
            </motion.div>
          ) : (
            displayed.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50, height: 0, marginBottom: 0, padding: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                layout
                onClick={() => { if (!n.is_read) markAsRead(n.id); }}
                className={cn(
                  'group relative flex items-center gap-6 p-6 sm:p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer overflow-hidden',
                  n.is_read ? 'bg-white border-slate-200 opacity-80' : 'bg-[#EBF3FB] border-[#2E75B6] shadow-[8px_8px_0px_0px_rgba(46,117,182,0.1)]'
                )}
              >
                {!n.is_read && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 rounded-full bg-[#2E75B6]" />
                  </div>
                )}

                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-slate-900 bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] group-hover:rotate-3 transition-transform">
                  {getNotifIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className={cn('text-xl tracking-tight leading-none', n.is_read ? 'font-bold text-slate-600' : 'font-black text-slate-900')}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      {formatTime(n.created_at)}
                    </span>
                  </div>
                  <p className={cn('text-base leading-relaxed line-clamp-2', n.is_read ? 'font-medium text-slate-400' : 'font-bold text-slate-600')}>
                    {n.message}
                  </p>
                </div>

                {/* Hover Actions with Inline Confirmation */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-4 border-l-2 border-slate-200/50">
                  {deletingId === n.id ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">Xóa?</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); confirmDelete(n.id); }}
                        className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-black uppercase rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        Xóa
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                        className="px-3 py-1.5 bg-white text-slate-600 text-[10px] font-black uppercase rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <>
                      {!n.is_read && (
                        <button 
                          onClick={(e) => handleMarkRead(n.id, e)}
                          className="p-3 bg-emerald-500 text-white rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all active:scale-90"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeletingId(n.id); }}
                        className="p-3 bg-rose-500 text-white rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all active:scale-90"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-8">
          <button
            onClick={() => setPageSize(prev => prev + 10)}
            disabled={loading}
            className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[2rem] border-2 border-slate-900 text-sm font-black uppercase tracking-[0.2em] shadow-[10px_10px_0px_0px_rgba(15,23,42,0.1)] hover:bg-slate-800 hover:scale-105 transition-all disabled:opacity-50 group"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            <span>Xem thêm thông báo</span>
          </button>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-16 text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Hiển thị {displayed.length} / {filtered.length} kết quả</span>
          </div>
          <div className="hidden sm:block w-2 h-2 rounded-full bg-slate-200" />
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Tự động làm mới mỗi 30s</span>
          </div>
        </div>
      )}
    </div>
  );
}
