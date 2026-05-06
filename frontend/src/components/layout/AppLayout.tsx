'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  CalendarDays, 
  Settings, 
  LogOut, 
  Bell, 
  User, 
  Users, 
  History, 
  ClipboardCheck, 
  PlusCircle, 
  Database,
  Lock,
  ChevronDown,
  Activity,
  Layers,
  Search,
  Command,
  ArrowRight,
  CheckCheck
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'APPROVED': return <span className="text-lg">🎉</span>;
    case 'REJECTED': return <span className="text-lg">❌</span>;
    case 'PENDING':  return <span className="text-lg">⏳</span>;
    case 'WARNING':  return <span className="text-lg">⚠️</span>;
    case 'SECURITY': return <span className="text-lg">🔒</span>;
    default:         return <span className="text-lg">🔔</span>;
  }
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotificationStore();
  
  const [isUserDropdownOpen, setIsUserDropdownOpen] = React.useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = React.useState(false);

  // Handle ESC key to close dropdowns
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserDropdownOpen(false);
        setIsNotifDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // 3.1.1 Header Menu Items
  const headerMenuItems = [
    { label: 'Trang chủ', href: '/home', badge: 0 },
    { label: 'Đặt lớp', href: '/bookings/new', badge: 0 },
    { label: 'Lịch', href: '/schedule', badge: 0 },
    { label: 'Thông báo', href: '/notifications', badge: unreadCount },
    { label: 'Hồ sơ', href: '/profile', badge: 0 },
  ];

  const getSidebarItems = () => {
    const role = user?.role;
    if (role === 'ADMIN') return [
      { label: 'Bảng điều khiển', href: '/home', icon: LayoutDashboard },
      { label: 'Quản lý User', href: '/admin/users', icon: Users },
      { label: 'Phòng học', href: '/admin/rooms', icon: CalendarDays },
      { label: 'Tất cả Booking', href: '/admin/bookings', icon: Layers },
      { label: 'Cấu hình', href: '/admin/config', icon: Settings },
      { label: 'Audit Log', href: '/admin/audit', icon: Database },
    ];
    if (role === 'CREATOR') return [
      { label: 'Booking của tôi', href: '/my-bookings', icon: Calendar },
      { label: 'Tạo booking mới', href: '/bookings/new', icon: PlusCircle },
      { label: 'Lịch phòng học', href: '/rooms', icon: CalendarDays },
    ];
    if (role === 'REVIEWER') return [
      { label: 'Chờ xem xét', href: '/reviewer/pending', icon: ClipboardCheck },
      { label: 'Đang xem xét', href: '/reviewer/in-review', icon: Activity },
      { label: 'Lịch sử xử lý', href: '/reviewer/history', icon: History },
    ];
    if (role === 'APPROVER') return [
      { label: 'Bảng điều khiển', href: '/approver/dashboard', icon: LayoutDashboard },
      { label: 'Chờ phê duyệt', href: '/approver/queue', icon: ClipboardCheck },
      { label: 'Lịch sử phê duyệt', href: '/approver/history', icon: History },
    ];
    return [];
  };

  const sidebarItems = getSidebarItems();

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <aside className="w-72 flex-shrink-0 bg-white m-6 mr-0 rounded-[2.5rem] border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col z-20 hidden md:flex overflow-hidden">
        <div className="p-8 space-y-10 flex flex-col h-full">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.href = '/home'}>
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
              <Command className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none text-slate-900">Training Web</h1>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">Management System</p>
            </div>
          </div>
          <div className="flex-1 space-y-10 overflow-y-auto no-scrollbar">
            <div className="space-y-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-4 flex items-center gap-2">
                <Layers className="w-3 h-3" />
                <span>Hệ thống chính</span>
              </div>
              <nav className="space-y-3">
                {sidebarItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href}>
                      <span className={cn("flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 border-2 group", isActive ? "bg-slate-900 border-slate-900 text-white shadow-[4px_4px_0px_0px_rgba(13,148,136,0.4)] scale-[1.02]" : "bg-transparent border-transparent text-slate-500 hover:border-slate-100 hover:bg-slate-50 hover:text-slate-900")}>
                        <div className="flex items-center gap-4">
                          <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-slate-400")} />
                          <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
          <div className="pt-6 border-t-2 border-slate-50">
             <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center text-center space-y-2">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Current Role</div>
                <div className="px-4 py-1.5 bg-primary text-white text-[10px] font-black rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] uppercase">
                  {user?.role}
                </div>
             </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-24 flex-shrink-0 flex items-center justify-between px-10 z-30">
          <div className="hidden lg:flex items-center gap-6">
             <div className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <Search className="w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Tìm kiếm nhanh..." className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 placeholder:text-slate-300 w-48" />
             </div>
          </div>

          <nav className="hidden xl:flex items-center bg-white border-2 border-slate-900 p-1.5 rounded-[1.5rem] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            {headerMenuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <span className={cn("relative px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3", isActive ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50")}>
                    {item.label}
                    {item.badge > 0 && <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[9px] font-black bg-primary text-white rounded-lg border border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">{item.badge}</span>}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-6">
            <div className="relative">
              <button onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)} className={cn("relative w-14 h-14 bg-white border-2 border-slate-900 rounded-2xl flex items-center justify-center transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none", isNotifDropdownOpen ? "bg-slate-50" : "hover:bg-slate-50")}>
                <Bell className={cn("w-6 h-6 transition-transform", unreadCount > 0 && "animate-tada")} />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-primary text-[9px] text-white font-black rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center">{unreadCount}</span>}
              </button>

              <AnimatePresence>
                {isNotifDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifDropdownOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="absolute right-0 mt-6 w-96 bg-white border-2 border-slate-900 rounded-[2rem] shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] p-2 z-50 overflow-hidden flex flex-col">
                      <div className="p-6 flex justify-between items-center border-b-2 border-slate-100">
                        <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">
                          Thông báo {unreadCount > 0 && `(${unreadCount} chưa đọc)`}
                        </h3>
                        <Link href="/notifications" onClick={() => setIsNotifDropdownOpen(false)} className="text-[9px] font-black text-slate-400 hover:text-primary uppercase tracking-widest flex items-center gap-1">
                          Xem tất cả <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                      
                      <div className="max-h-[450px] overflow-y-auto space-y-1 no-scrollbar p-2">
                        {loading ? (
                          [1, 2, 3].map(i => (
                            <div key={i} className="p-5 rounded-2xl bg-slate-50/50 animate-pulse flex items-start gap-4">
                              <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 rounded w-1/2" />
                                <div className="h-3 bg-slate-200 rounded w-full" />
                              </div>
                            </div>
                          ))
                        ) : notifications.length > 0 ? (
                          notifications.slice(0, 10).map((n) => (
                            <div key={n.id} onClick={() => { if(!n.is_read) markAsRead(n.id); setIsNotifDropdownOpen(false); }} className={cn("p-5 rounded-2xl transition-all cursor-pointer group relative flex items-start gap-4 hover:bg-slate-50", !n.is_read && "bg-indigo-50/30")}>
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border-2 border-slate-900 group-hover:rotate-3 transition-transform">
                                {getNotifIcon(n.type)}
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className={cn("font-black text-[13px] leading-tight truncate", !n.is_read ? "text-slate-900" : "text-slate-500")}>{n.title}</p>
                                <p className="text-xs font-bold text-slate-400 line-clamp-2 leading-relaxed">{n.message.substring(0, 60)}{n.message.length > 60 ? '...' : ''}</p>
                                <p className="text-[9px] font-black text-slate-300 mt-1 uppercase tracking-widest">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: vi })}</p>
                              </div>
                              {!n.is_read && <div className="w-2.5 h-2.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />}
                            </div>
                          ))
                        ) : (
                          <div className="p-16 text-center text-slate-300 space-y-4">
                            <Bell className="w-12 h-12 mx-auto opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest italic">Không có thông báo mới</p>
                          </div>
                        )}
                      </div>
                      
                      <button onClick={(e) => { e.preventDefault(); markAllAsRead(); }} className="w-full p-5 flex items-center justify-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:bg-slate-50 transition-colors border-t-2 border-slate-100 disabled:opacity-30" disabled={unreadCount === 0}>
                        <CheckCheck className="w-4 h-4 text-emerald-500" />
                        <span>Đánh dấu tất cả đã đọc</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} className={cn("flex items-center gap-4 pl-3 pr-6 py-2.5 bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none", isUserDropdownOpen && "bg-slate-50")}>
                <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black text-base border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="font-black text-xs leading-none text-slate-900 uppercase tracking-wider">{user?.full_name?.split(' ')[0] || 'User'}</p>
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">{user?.role}</p>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", isUserDropdownOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {isUserDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserDropdownOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="absolute right-0 mt-6 w-64 bg-white border-2 border-slate-900 rounded-[2rem] shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] p-2 z-50 overflow-hidden">
                      <Link href="/profile" onClick={() => setIsUserDropdownOpen(false)}><span className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-slate-50 text-slate-900 transition-all group"><User className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" /><span className="text-[10px] font-black uppercase tracking-widest">Hồ sơ cá nhân</span></span></Link>
                      <Link href="/profile/change-password" onClick={() => setIsUserDropdownOpen(false)}><span className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-slate-50 text-slate-900 transition-all group"><Lock className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" /><span className="text-[10px] font-black uppercase tracking-widest">Đổi mật khẩu</span></span></Link>
                      <div className="h-px bg-slate-100 my-2 mx-4" />
                      <button onClick={() => { logout(); window.location.href = '/'; }} className="w-full flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-rose-50 text-rose-500 transition-all group"><LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest">Đăng xuất</span></button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="max-w-7xl mx-auto">
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
