'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Bell, CheckCheck, Trash2, Info, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'APPROVED':   return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case 'REJECTED':   return <XCircle className="w-5 h-5 text-red-500" />;
    case 'PENDING':    return <Clock className="w-5 h-5 text-amber-500" />;
    case 'WARNING':    return <AlertCircle className="w-5 h-5 text-orange-500" />;
    default:           return <Info className="w-5 h-5 text-primary" />;
  }
};

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thông báo 🔔</h1>
          <p className="text-slate-500 mt-1">
            Bạn có <span className="font-bold text-primary">{unreadCount}</span> thông báo chưa đọc.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter tabs */}
          <div className="flex items-center neu-pressed rounded-2xl p-1 gap-1">
            {(['all', 'unread'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                  filter === f
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                {f === 'all' ? 'Tất cả' : `Chưa đọc ${unreadCount > 0 ? `(${unreadCount})` : ''}`}
              </button>
            ))}
          </div>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="flex items-center gap-2 px-4 py-2 neu-flat rounded-2xl text-xs font-bold text-primary hover:neu-pressed transition-all active:scale-95"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Đọc hết</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <Card className="p-20 flex flex-col items-center justify-center text-center space-y-4 border-none">
            <div className="w-20 h-20 neu-pressed rounded-full flex items-center justify-center text-slate-200">
              <Bell className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">
                {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                {filter === 'unread'
                  ? 'Tất cả thông báo đã được đọc.'
                  : 'Các thông báo về booking của bạn sẽ xuất hiện ở đây.'}
              </p>
            </div>
          </Card>
        ) : (
          displayed.map((n) => (
            <div
              key={n.id}
              onClick={() => { if (!n.is_read) markAsRead(n.id); }}
              className={cn(
                'relative flex items-start gap-5 p-5 rounded-3xl transition-all cursor-pointer group',
                n.is_read
                  ? 'neu-flat bg-white/40'
                  : 'neu-flat bg-white border-l-4 border-primary shadow-sm hover:shadow-md'
              )}
            >
              {/* Icon */}
              <div className={cn(
                'w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center',
                n.is_read ? 'neu-pressed' : 'bg-primary/5 neu-pressed'
              )}>
                {getNotifIcon(n.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className={cn(
                    'font-bold text-sm leading-snug',
                    n.is_read ? 'text-slate-500' : 'text-slate-800'
                  )}>
                    {n.title}
                  </p>
                  <span className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap flex-shrink-0">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: vi })}
                  </span>
                </div>
                <p className={cn(
                  'text-sm mt-1 leading-relaxed',
                  n.is_read ? 'text-slate-400' : 'text-slate-600'
                )}>
                  {n.message}
                </p>
              </div>

              {/* Unread dot */}
              {!n.is_read && (
                <span className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      {displayed.length > 0 && (
        <p className="text-center text-xs text-slate-400 py-4">
          Hiển thị {displayed.length} thông báo • Click vào thông báo để đánh dấu đã đọc
        </p>
      )}
    </div>
  );
}
