'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Calendar, CalendarDays, Settings, LogOut, Bell } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [unreadCount, setUnreadCount] = React.useState(0);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Bookings', href: '/bookings', icon: Calendar },
    { label: 'Classrooms', href: '/rooms', icon: CalendarDays },
  ];

  if (user?.role === 'ADMIN') {
    navItems.push({ label: 'Admin Panel', href: '/admin', icon: Settings });
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 neu-flat m-4 rounded-3xl flex flex-col z-10 hidden md:flex">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 neu-pressed rounded-full flex items-center justify-center text-primary">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">BookingSys</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                    isActive ? "neu-pressed text-primary font-semibold" : "hover:neu-flat text-slate-500 hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="neu-pressed rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 neu-flat rounded-full flex items-center justify-center font-bold text-primary text-xl uppercase">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-semibold text-sm">{user?.full_name || 'User'}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
            <button
              onClick={() => { logout(); window.location.href = '/'; }}
              className="mt-2 w-full flex items-center justify-center space-x-2 text-danger hover:text-red-700 transition-colors text-sm font-medium p-2 rounded-xl hover:neu-flat"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 md:px-12 py-4 z-10">
          <h2 className="text-2xl font-bold capitalize tracking-tight">
            {pathname.split('/')[1] || 'Dashboard'}
          </h2>

          <div className="flex items-center space-x-6">
            <button className="relative w-12 h-12 neu-flat rounded-full flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-danger rounded-full border-2 border-background" />
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
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
