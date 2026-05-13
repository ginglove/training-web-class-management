'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
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
  Command,
  CheckCheck,
  Home,
} from 'lucide-react';
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

  // SRS 7.1 — Header navigation items per role
  const headerMenuItems = React.useMemo(() => {
    const role = user?.role;
    if (role === 'ADMIN') return [
      { label: 'Trang chủ', href: '/home', badge: 0 },
      { label: 'Users', href: '/admin/users', badge: 0 },
      { label: 'System', href: '/admin/config', badge: 0 },
    ];
    if (role === 'CREATOR') return [
      { label: 'Trang chủ', href: '/home', badge: 0 },
      { label: 'Lịch phòng', href: '/rooms', badge: 0 },
    ];
    if (role === 'REVIEWER') return [
      { label: 'Dashboard', href: '/home', badge: 0 },
      { label: 'Hàng đợi', href: '/reviewer/pending', badge: 0 },
    ];
    if (role === 'APPROVER') return [
      { label: 'Dashboard', href: '/home', badge: 0 },
      { label: 'Phê duyệt', href: '/approver/queue', badge: 0 },
    ];
    return [{ label: 'Trang chủ', href: '/home', badge: 0 }];
  }, [user?.role]);

  // SRS 7.2 — Sidebar items per role
  const sidebarItems = React.useMemo(() => {
    const role = user?.role;
    if (role === 'ADMIN') return [
      { label: 'Dashboard', href: '/home', icon: LayoutDashboard },
      { label: 'Quản lý Người dùng', href: '/admin/users', icon: Users },
      { label: 'Quản lý Phòng học', href: '/admin/rooms', icon: Home },
      { label: 'Tất cả Booking', href: '/admin/bookings', icon: Layers },
      { label: 'Lịch Phòng học', href: '/rooms', icon: Calendar },
      { label: 'Cấu hình', href: '/admin/config', icon: Settings },
      { label: 'Audit Log', href: '/admin/audit', icon: Database },
    ];
    if (role === 'CREATOR') return [
      { label: 'Trang chủ', href: '/home', icon: Home },
      { label: 'Booking của tôi', href: '/my-bookings', icon: Layers },
      { label: 'Tạo booking mới', href: '/bookings/new', icon: PlusCircle },
      { label: 'Lịch Phòng học', href: '/rooms', icon: CalendarDays },
      { label: 'Hồ sơ', href: '/profile', icon: User },
      { label: 'Thông báo', href: '/home/notifications', icon: Bell },
    ];
    if (role === 'REVIEWER') return [
      { label: 'Dashboard', href: '/home', icon: LayoutDashboard },
      { label: 'Hàng đợi xem xét', href: '/reviewer/pending', icon: ClipboardCheck },
      { label: 'Đang xem xét', href: '/reviewer/in-review', icon: Activity },
      { label: 'Lịch sử', href: '/reviewer/history', icon: History },
      { label: 'Lịch Phòng học', href: '/rooms', icon: CalendarDays },
      { label: 'Hồ sơ', href: '/profile', icon: User },
      { label: 'Thông báo', href: '/home/notifications', icon: Bell },
    ];
    if (role === 'APPROVER') return [
      { label: 'Dashboard', href: '/home', icon: LayoutDashboard },
      { label: 'Hàng đợi phê duyệt', href: '/approver/queue', icon: ClipboardCheck },
      { label: 'Lịch sử phê duyệt', href: '/approver/history', icon: History },
      { label: 'Lịch Phòng học', href: '/rooms', icon: CalendarDays },
      { label: 'Hồ sơ', href: '/profile', icon: User },
      { label: 'Thông báo', href: '/home/notifications', icon: Bell },
    ];
    return [];
  }, [user?.role]);

  // Root paths that should only be active on exact match
  const exactMatchPaths = ['/home', '/reviewer/dashboard', '/approver/dashboard'];

  const isItemActive = (href: string) => {
    return exactMatchPaths.includes(href)
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    const { refreshToken } = useAuthStore.getState();
    try {
      if (refreshToken) {
        await fetchApi('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken })
        });
      }
    } catch { /* ignore */ }
    logout();
    window.location.href = '/';
  };

  const handleLogoutAll = async () => {
    try {
      await fetchApi('/api/auth/logout-all', { method: 'POST' });
    } catch { /* ignore */ }
    logout();
    window.location.href = '/';
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* ─── Header (Fixed) ─── */}
      <header className="h-24 bg-white border-b-2 border-slate-900 flex-shrink-0 flex items-center justify-between px-10 z-50 sticky top-0 shadow-sm">
        {/* Logo + System Name (Left) */}
        <div 
          className="flex items-center gap-4 group cursor-pointer"
          onClick={() => window.location.href = '/home'}
        >
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
            <Command className="w-6 h-6" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-black text-xl tracking-tight leading-none text-slate-900">Training Web</h1>
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1">Management System</p>
          </div>
        </div>

        {/* Center Menu (Role-specific + Notifs) */}
        <nav className="hidden xl:flex items-center bg-slate-50 border-2 border-slate-900 p-1 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          {headerMenuItems.map((item) => {
            const isActive = isItemActive(item.href);
            if (item.label === 'Thông báo') return null; // Notifications handled separately in Right Controls
            return (
              <Link key={item.href} href={item.href}>
                <span className={cn(
                  'px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3',
                  isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                )}>
                  {item.label}
                  {item.badge > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[9px] font-black bg-primary text-white rounded-lg border border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                      {item.badge}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
              className={cn(
                'relative w-12 h-12 sm:w-14 sm:h-14 bg-white border-2 border-slate-900 rounded-2xl flex items-center justify-center transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
                isNotifDropdownOpen ? 'bg-slate-50' : 'hover:bg-slate-50'
              )}
            >
              <Bell className={cn('w-6 h-6', unreadCount > 0 && 'animate-tada')} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-primary text-[9px] text-white font-black rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            <AnimatePresence>
              {isNotifDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="absolute right-0 mt-6 w-[400px] bg-white border-2 border-slate-900 rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] z-50 overflow-hidden flex flex-col max-h-[600px]"
                  >
                    <div className="p-6 bg-slate-50 border-b-2 border-slate-900 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-primary" />
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Thông báo</h3>
                      </div>
                      {unreadCount > 0 && (
                        <span className="px-3 py-1 bg-primary text-white text-[9px] font-black rounded-full border border-slate-900">
                          {unreadCount} Mới
                        </span>
                      )}
                    </div>

                    <div className="overflow-y-auto custom-scrollbar flex-1">
                      {loading ? (
                        [1,2,3].map(i => (
                          <div key={i} className="p-6 flex gap-4 animate-pulse">
                            <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-slate-200 rounded w-1/2" />
                              <div className="h-3 bg-slate-200 rounded w-full" />
                            </div>
                          </div>
                        ))
                      ) : notifications.length > 0 ? (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => { if (!n.is_read) markAsRead(n.id); setIsNotifDropdownOpen(false); }}
                            className={cn('p-5 rounded-2xl transition-all cursor-pointer group relative flex items-start gap-4 hover:bg-slate-50', !n.is_read && 'bg-indigo-50/30')}
                          >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border-2 border-slate-900 group-hover:rotate-3 transition-transform">
                              {getNotifIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className={cn('font-black text-[13px] leading-tight truncate', !n.is_read ? 'text-slate-900' : 'text-slate-500')}>{n.title}</p>
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

                    <button
                      onClick={(e) => { e.preventDefault(); markAllAsRead(); }}
                      className="w-full p-5 flex items-center justify-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-widest hover:bg-slate-50 transition-colors border-t-2 border-slate-100 disabled:opacity-30"
                      disabled={unreadCount === 0}
                    >
                      <CheckCheck className="w-4 h-4 text-emerald-500" />
                      <span>Đánh dấu tất cả đã đọc</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User avatar dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className={cn(
                'flex items-center gap-4 pl-3 pr-6 py-2.5 bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
                isUserDropdownOpen && 'bg-slate-50'
              )}
            >
              <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black text-base border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="font-black text-xs leading-none text-slate-900 uppercase tracking-wider">{user?.full_name?.split(' ')[0] || 'User'}</p>
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">{user?.role}</p>
              </div>
              <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform duration-300', isUserDropdownOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {isUserDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="absolute right-0 mt-6 w-64 bg-white border-2 border-slate-900 rounded-[2rem] shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] p-2 z-50 overflow-hidden"
                  >
                    {/* SRS 7.1 Avatar dropdown: Hồ sơ | Đổi MK | Đăng xuất | Đăng xuất tất cả */}
                    <Link href="/profile" onClick={() => setIsUserDropdownOpen(false)}>
                      <span className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-slate-50 text-slate-900 transition-all group">
                        <User className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Hồ sơ cá nhân</span>
                      </span>
                    </Link>
                    <Link href="/profile/change-password" onClick={() => setIsUserDropdownOpen(false)}>
                      <span className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-slate-50 text-slate-900 transition-all group">
                        <Lock className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Đổi mật khẩu</span>
                      </span>
                    </Link>
                    <div className="h-px bg-slate-100 my-2 mx-4" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-rose-50 text-rose-500 transition-all group"
                    >
                      <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Đăng xuất</span>
                    </button>
                    <button
                      onClick={handleLogoutAll}
                      className="w-full flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-rose-50 text-rose-400 transition-all group"
                    >
                      <LogOut className="w-5 h-5 opacity-70 group-hover:rotate-12 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Đăng xuất tất cả thiết bị</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Sidebar (Role-specific) ─── */}
        <aside className="w-72 flex-shrink-0 bg-white border-r-2 border-slate-900 flex-col z-20 hidden md:flex overflow-hidden">
          <div className="flex-1 overflow-y-auto py-8 px-4 custom-scrollbar space-y-2">
            {sidebarItems.map((item) => {
              const isActive = isItemActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <span className={cn(
                    'flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 group',
                    isActive
                      ? 'bg-slate-900 text-white shadow-[4px_4px_0px_0px_rgba(13,148,136,1)] translate-x-1'
                      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                  )}>
                    <item.icon className={cn('w-5 h-5 transition-transform group-hover:scale-110', isActive ? 'text-primary' : 'text-slate-300 group-hover:text-slate-900')} />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="p-6 border-t-2 border-slate-900 bg-slate-50">
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Activity className="w-5 h-5" />
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider truncate">Operational</p>
               </div>
            </div>
          </div>
        </aside>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
