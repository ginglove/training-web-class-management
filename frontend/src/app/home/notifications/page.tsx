'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { useNotificationStore } from '@/stores/notificationStore';
import { Bell, CheckCircle2, History, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export default function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllAsRead, fetchNotifications } = useNotificationStore();
  const [filter, setFilter] = React.useState<'ALL' | 'UNREAD'>('ALL');

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = filter === 'ALL' 
    ? notifications 
    : notifications.filter(n => !n.is_read);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thông báo 🔔</h1>
          <p className="text-slate-500 mt-2">Cập nhật những thay đổi mới nhất về booking của bạn.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => markAllAsRead()}
            className="flex-1 md:flex-none px-4 py-2 neu-btn rounded-xl text-sm font-bold text-slate-600 hover:text-primary transition-all flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Đọc tất cả</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6 sticky top-24">
          <Card className="p-4">
            <h3 className="font-bold text-sm mb-4 px-2 flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <span>Bộ lọc</span>
            </h3>
            <div className="space-y-1">
              <button 
                onClick={() => setFilter('ALL')}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  filter === 'ALL' ? "neu-pressed text-primary font-bold" : "hover:bg-slate-50 text-slate-500"
                )}
              >
                Tất cả thông báo
              </button>
              <button 
                onClick={() => setFilter('UNREAD')}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  filter === 'UNREAD' ? "neu-pressed text-primary font-bold" : "hover:bg-slate-50 text-slate-500"
                )}
              >
                Chưa đọc
              </button>
            </div>
          </Card>

          <Card className="p-4 bg-primary/5 border-none">
            <h4 className="font-bold text-xs text-primary uppercase tracking-widest mb-2">Mẹo nhỏ</h4>
            <p className="text-xs text-primary/70 leading-relaxed">
              Bạn có thể click vào từng thông báo để xem chi tiết booking liên quan.
            </p>
          </Card>
        </div>

        {/* Notifications List */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            [1,2,3,4,5].map(i => <Card key={i} className="h-24 animate-pulse bg-slate-50" />)
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((n) => (
                <Card 
                  key={n.id} 
                  className={cn(
                    "p-6 hover:neu-flat transition-all cursor-pointer group relative overflow-hidden",
                    !n.is_read && "border-l-4 border-l-primary bg-primary/[0.02]"
                  )}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                >
                  <div className="flex gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                      n.is_read ? "neu-pressed text-slate-400" : "neu-flat text-primary"
                    )}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={cn(
                          "font-bold text-base transition-colors",
                          n.is_read ? "text-slate-500" : "text-foreground group-hover:text-primary"
                        )}>
                          {n.title}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap ml-4">
                          {format(new Date(n.created_at), 'HH:mm • dd/MM/yyyy', { locale: vi })}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm leading-relaxed",
                        n.is_read ? "text-slate-400" : "text-slate-600"
                      )}>
                        {n.message}
                      </p>
                      
                      <div className="mt-4 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <Badge variant="default" className="text-[10px] px-2 py-0.5">
                             {n.type.replace('_', ' ')}
                           </Badge>
                           {n.booking_id && (
                             <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                               <Calendar className="w-3 h-3" />
                               <span>Xem booking</span>
                             </button>
                           )}
                         </div>
                         {!n.is_read && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                             className="text-[10px] font-bold text-slate-400 hover:text-primary uppercase tracking-widest"
                           >
                             Đánh dấu đã đọc
                           </button>
                         )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-20 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 neu-pressed rounded-full flex items-center justify-center text-slate-200">
                <History className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Không có thông báo nào</h3>
                <p className="text-slate-400 text-sm mt-1">Hộp thư của bạn hiện đang trống.</p>
              </div>
              <button 
                onClick={() => setFilter('ALL')}
                className="mt-4 px-6 py-2 neu-flat rounded-xl text-sm font-bold text-primary hover:neu-pressed transition-all"
              >
                Xem tất cả
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
