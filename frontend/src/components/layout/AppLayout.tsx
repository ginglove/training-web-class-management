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
  Check
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  
  const [isUserDropdownOpen, setIsUserDropdownOpen] = React.useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = React.useState(false);

  // 3.1.1 Header Menu Items
  const headerMenuItems = [
    { label: 'Trang chủ', href: '/home', badge: 0 },
    { label: 'Đặt lớp', href: '/bookings/new', badge: 0 },
    { label: 'Lịch', href: '/schedule', badge: 0 },
    { label: 'Thông báo', href: '/notifications', badge: unreadCount },
    { label: 'Hồ sơ', href: '/profile', badge: 0 },
  ];

  // 3.1.2 Sidebar Items per Role
  const getSidebarItems = () => {
    const role = user?.role;
    
    if (role === 'ADMIN') {
      return [
        { label: 'Trang chủ', href: '/home', icon: LayoutDashboard },
        { label: 'Quản lý User', href: '/admin/users', icon: Users },
        { label: 'Quản lý Phòng học', href: '/admin/rooms', icon: CalendarDays },
        { label: 'Tất cả Booking', href: '/admin/bookings', icon: ClipboardCheck },
        { label: 'Cấu hình', href: '/admin/config', icon: Settings },
        { label: 'Audit Log', href: '/admin/audit', icon: Database },
      ];
    }
    
    if (role === 'CREATOR') {
      return [
        { label: 'Booking của tôi', href: '/bookings', icon: Calendar },
        { label: 'Tạo booking mới', href: '/bookings/new', icon: PlusCircle },
        { label: 'Lịch phòng học', href: '/rooms', icon: CalendarDays },
      ];
    }
    
    if (role === 'REVIEWER') {
      return [
        { label: 'Chờ xem xét', href: '/reviewer/pending', icon: ClipboardCheck },
        { label: 'Đang xem xét', href: '/reviewer/in-review', icon: History },
        { label: 'Lịch sử xem xét', href: '/reviewer/history', icon: History },
      ];
    }
    
    if (role === 'APPROVER') {
      return [
        { label: 'Chờ phê duyệt', href: '/approver/pending', icon: ClipboardCheck },
        { label: 'Lịch sử phê duyệt', href: '/approver/history', icon: History },
      ];
    }
    
    return [];
  };

  const sidebarItems = getSidebarItems();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* 3.1.2 Sidebar */}
      <aside className="w-64 flex-shrink-0 neu-flat m-4 rounded-3xl flex flex-col z-20 hidden md:flex">
        <div className="p-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-4">Menu</div>
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                      isActive ? "neu-pressed text-primary font-semibold" : "hover:neu-flat text-slate-500 hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="neu-pressed rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
             <div className="text-xs font-semibold text-slate-400 uppercase">Role: {user?.role}</div>
             <div className="w-full h-px bg-slate-200/50" />
             <p className="text-[10px] text-slate-400">Class Booking System v3.0</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* 3.1.1 Header cố định */}
        <header className="h-20 flex-shrink-0 flex items-center justify-between px-8 py-4 z-30 bg-background/80 backdrop-blur-md">
          {/* Logo + Tên hệ thống (Góc trái) */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 neu-flat rounded-xl flex items-center justify-center text-primary">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-xl tracking-tight leading-none text-slate-800">Class Booking</h1>
              <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Management</p>
            </div>
          </div>

          {/* Menu điều hướng (Header Menu) */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/50 p-1.5 rounded-2xl neu-pressed">
            {headerMenuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link key={item.href} href={item.href}>
                  <span className={cn(
                    "relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                    isActive ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-foreground hover:bg-white/50"
                  )}>
                    {item.label}
                    {item.badge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-danger text-white rounded-full leading-none">
                        {item.badge > 999 ? '999+' : item.badge}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Notifications & Profile */}
          <div className="flex items-center space-x-4">
            {/* Icon 🔔 Thông báo */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className={cn(
                  "relative w-12 h-12 neu-flat rounded-full flex items-center justify-center transition-all active:scale-95",
                  isNotifDropdownOpen ? "neu-pressed text-primary" : "text-slate-500 hover:text-primary"
                )}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 bg-danger text-[10px] text-white font-bold rounded-full border-2 border-background flex items-center justify-center">
                    {unreadCount > 999 ? '999+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 md:w-96 neu-flat rounded-3xl p-2 z-50 overflow-hidden"
                    >
                      <div className="p-4 flex justify-between items-center border-b border-slate-100 mb-2">
                        <h3 className="font-bold text-sm">Thông báo</h3>
                        <button 
                          onClick={() => markAllAsRead()}
                          className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                        >
                          Đánh dấu đã đọc hết
                        </button>
                      </div>
                      
                      <div className="max-h-[400px] overflow-y-auto space-y-1 custom-scrollbar">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 10).map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => { if(!n.is_read) markAsRead(n.id); setIsNotifDropdownOpen(false); }}
                              className={cn(
                                "p-4 rounded-2xl transition-all cursor-pointer group relative",
                                n.is_read ? "opacity-60 grayscale-[0.5]" : "bg-primary/5 hover:bg-primary/10"
                              )}
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1">
                                  <p className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">{n.title}</p>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: vi })}
                                  </p>
                                </div>
                                {!n.is_read && <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-12 text-center text-slate-400">
                            <Bell className="w-10 h-10 mx-auto opacity-20 mb-3" />
                            <p className="text-xs">Chưa có thông báo nào.</p>
                          </div>
                        )}
                      </div>
                      
                      <Link href="/notifications" onClick={() => setIsNotifDropdownOpen(false)}>
                        <span className="block w-full p-4 text-center text-xs font-bold text-primary hover:bg-slate-50 transition-colors border-t border-slate-100">
                          Xem tất cả thông báo
                        </span>
                      </Link>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar + Tên + Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className={cn(
                  "flex items-center space-x-3 pl-2 pr-4 py-2 neu-flat rounded-2xl hover:neu-flat transition-all active:scale-95",
                  isUserDropdownOpen && "neu-pressed"
                )}
              >
                <div className="w-9 h-9 neu-pressed rounded-full flex items-center justify-center font-bold text-primary text-sm uppercase">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="font-bold text-xs leading-none">{user?.full_name || 'User'}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{user?.department || 'Member'}</p>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isUserDropdownOpen && "rotate-180")} />
              </button>

              <AnimatePresence>
                {isUserDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsUserDropdownOpen(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 neu-flat rounded-3xl p-2 z-50 overflow-hidden"
                    >
                      <Link href="/profile" onClick={() => setIsUserDropdownOpen(false)}>
                        <span className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>Hồ sơ cá nhân</span>
                        </span>
                      </Link>
                      <Link href="/change-password" onClick={() => setIsUserDropdownOpen(false)}>
                        <span className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors">
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span>Đổi mật khẩu</span>
                        </span>
                      </Link>
                      <div className="h-px bg-slate-100 my-1 mx-2" />
                      <button 
                        onClick={() => { logout(); window.location.href = '/'; }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-50 text-danger text-sm font-bold transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-6xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
