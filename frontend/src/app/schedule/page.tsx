'use client';

import * as React from 'react';
import { fetchApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { 
  ChevronLeft, ChevronRight, Clock, Users, MapPin, 
  Search, PlusCircle, Calendar as CalendarIcon, Download,
  AlertTriangle, ListFilter
} from 'lucide-react';
import { 
  format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, 
  endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  startOfDay, endOfDay
} from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

interface Room {
  id: string;
  name: string;
  capacity?: number;
  status?: string;
}

interface BookingEvent {
  id: string;
  start_datetime: string;
  end_datetime: string;
  title?: string;
  purpose?: string;
  class_name?: string;
  status?: string;
  event_type?: string;
  user_name?: string;
  color?: string;
  user_id?: string;
  room_id?: string;
  creator_id?: string;
  creator_name?: string;
  description?: string;
  class_id?: string;
  attendee_count?: number;
}

interface TimeSlot {
  slot_id?: string;
  slot_name: string;
  start_time: string;
  end_time: string;
  isAvailable: boolean;
  booking_id?: string | null;
  booked_by?: string;
}
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function SchedulePage() {
  return (
    <React.Suspense fallback={<div className="py-32 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải lịch...</div>}>
      <ScheduleContent />
    </React.Suspense>
  );
}

function ScheduleContent() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = React.useState<BookingEvent[]>([]);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = React.useState<string>('all');
  const [loading, setLoading] = React.useState(true);

  // ── 18.8.1 Advanced Filters ──────────────────────────────────
  const [showFilters, setShowFilters] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState<string[]>([]);
  const [filterBlockType, setFilterBlockType] = React.useState<string[]>([]);
  const [filterBooker, setFilterBooker] = React.useState('');

  const hasActiveFilters = filterStatus.length > 0 || filterBlockType.length > 0 || filterBooker.trim();

  const clearFilters = () => {
    setFilterStatus([]);
    setFilterBlockType([]);
    setFilterBooker('');
  };

  const toggleArrFilter = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  // Quick Booking State
  const [quickBookingModalOpen, setQuickBookingModalOpen] = React.useState(false);
  const [qbDate, setQbDate] = React.useState<string>('');
  const [qbRoom, setQbRoom] = React.useState<string>('');
  const [qbSlot, setQbSlot] = React.useState<string>('');
  const [qbTitle, setQbTitle] = React.useState('');
  const [qbAttendees, setQbAttendees] = React.useState('');
  const [qbPurpose, setQbPurpose] = React.useState('');
  const [qbSlots, setQbSlots] = React.useState<TimeSlot[]>([]);
  const [qbConflict, setQbConflict] = React.useState(false);
  const [qbSubmitting, setQbSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (quickBookingModalOpen && qbRoom && qbDate) {
      fetchApi(`/api/rooms/${qbRoom}/availability?date=${qbDate}`)
        .then(res => setQbSlots((res.slots || []).map((s: TimeSlot) => ({...s, isAvailable: !s.booking_id}))))
        .catch(console.error);
    } else {
      setQbSlots([]);
    }
  }, [quickBookingModalOpen, qbRoom, qbDate]);

  React.useEffect(() => {
    if (qbSlot && qbSlots.length > 0) {
      const slot = qbSlots.find(s => String(s.slot_id) === String(qbSlot));
      setQbConflict(slot ? !slot.isAvailable : false);
    } else {
      setQbConflict(false);
    }
  }, [qbSlot, qbSlots]);

  const openQuickBooking = (date: Date, roomId?: string) => {
    if (user?.role !== 'CREATOR') return; // Only creators can quick book
    setQbDate(format(date, 'yyyy-MM-dd'));
    if (roomId && roomId !== 'all') {
      setQbRoom(roomId);
    } else if (selectedRoom !== 'all') {
      setQbRoom(selectedRoom);
    } else {
      setQbRoom('');
    }
    setQbSlot('');
    setQbTitle('');
    setQbAttendees('');
    setQbPurpose('');
    setQuickBookingModalOpen(true);
  };

  const handleQuickCreate = async (submitImmediately: boolean) => {
    if (!qbRoom || !qbDate || !qbSlot || !qbTitle || !qbAttendees || !qbPurpose) {
      toast.error('Vui lòng điền đủ thông tin (*)');
      return;
    }
    if (qbConflict) {
      toast.error('Khung giờ này đã bị trùng. Vui lòng chọn giờ khác.');
      return;
    }

    setQbSubmitting(true);
    try {
      const payload = {
        class_id: qbRoom,
        date: qbDate,
        slot_id: qbSlot,
        course_name: qbTitle,
        attendee_count: parseInt(qbAttendees),
        purpose: qbPurpose
      };
      const res = await fetchApi('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (submitImmediately && res.id) {
        await fetchApi(`/api/bookings/${res.id}/submit`, { method: 'PATCH' });
        toast.success('Đã gửi yêu cầu phê duyệt thành công');
        setQuickBookingModalOpen(false);
        loadEvents();
      } else {
        toast.success('Đã lưu nháp thành công');
        // Need to push to edit, but we will push to my-bookings list for now
        router.push(`/my-bookings/${res.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast.error(msg);
    } finally {
      setQbSubmitting(false);
    }
  };

  // ── Admin Block State ────────────────────────────────────────────
  const [adminBlockModalOpen, setAdminBlockModalOpen] = React.useState(false);
  const [abEditingId, setAbEditingId] = React.useState<string | null>(null); // null = create
  const [abRoom, setAbRoom] = React.useState<string>('');
  const [abType, setAbType] = React.useState<'MAINTENANCE'|'HOLIDAY'|'EVENT'|'OTHER'>('MAINTENANCE');
  const [abTitle, setAbTitle] = React.useState('');
  const [abDesc, setAbDesc] = React.useState('');
  const [abStartDate, setAbStartDate] = React.useState('');
  const [abEndDate, setAbEndDate] = React.useState('');
  const [abStartTime, setAbStartTime] = React.useState('');
  const [abEndTime, setAbEndTime] = React.useState('');
  const [abNotify, setAbNotify] = React.useState(false);
  const [abSubmitting, setAbSubmitting] = React.useState(false);
  // Two-step conflict flow
  const [abStep, setAbStep] = React.useState<'form'|'conflict'>('form');
  const [abConflictData, setAbConflictData] = React.useState<BookingEvent[]>([]);
  // Delete confirm
  const [abDeleteConfirm, setAbDeleteConfirm] = React.useState<{id:string; title:string; freed:number} | null>(null);

  const resetAbForm = () => {
    setAbEditingId(null);
    setAbRoom('');
    setAbType('MAINTENANCE');
    setAbTitle('');
    setAbDesc('');
    setAbStartDate('');
    setAbEndDate('');
    setAbStartTime('');
    setAbEndTime('');
    setAbNotify(false);
    setAbStep('form');
    setAbConflictData([]);
  };

  const openAdminBlock = (date?: Date, roomId?: string) => {
    if (user?.role !== 'ADMIN') return;
    resetAbForm();
    if (date) { const d = format(date, 'yyyy-MM-dd'); setAbStartDate(d); setAbEndDate(d); }
    if (roomId && roomId !== 'all') setAbRoom(roomId);
    setAdminBlockModalOpen(true);
  };

  const openEditBlock = async (evt: BookingEvent) => {
    if (user?.role !== 'ADMIN') return;
    resetAbForm();
    setAbEditingId(evt.id);
    setAbTitle(evt.title || '');
    setAbDesc(evt.description || '');
    setAbType(evt.status as 'MAINTENANCE'|'HOLIDAY'|'EVENT'|'OTHER' || 'OTHER');
    setAbRoom(evt.class_id || '');
    if (evt.start_datetime) {
      const s = new Date(evt.start_datetime);
      setAbStartDate(format(s, 'yyyy-MM-dd'));
      setAbStartTime(format(s, 'HH:mm'));
    }
    if (evt.end_datetime) {
      const e = new Date(evt.end_datetime);
      setAbEndDate(format(e, 'yyyy-MM-dd'));
      setAbEndTime(format(e, 'HH:mm'));
    }
    setSelectedEvent(null);
    setAdminBlockModalOpen(true);
  };

  const buildBlockDates = () => {
    const isAllDay = !abStartTime || !abEndTime;
    const startDT = new Date(`${abStartDate}T${abStartTime || '00:00'}:00`);
    const endDT   = new Date(`${abEndDate}T${abEndTime || '23:59'}:00`);
    return { isAllDay, startDT, endDT };
  };

  // Step 1: preflight then show conflict step or submit directly
  const handleBlockPreflight = async () => {
    if (!abTitle || !abStartDate || !abEndDate) {
      toast.error('Vui lòng điền tiêu đề và thời gian'); return;
    }
    const { startDT, endDT } = buildBlockDates();
    if (endDT <= startDT) { toast.error('Thời gian kết thúc phải sau bắt đầu'); return; }

    setAbSubmitting(true);
    try {
      const params = new URLSearchParams({ start_datetime: startDT.toISOString(), end_datetime: endDT.toISOString() });
      if (abRoom) params.set('class_id', abRoom);
      const res = await fetchApi(`/api/calendar/admin/blocks/preflight?${params}`);
      const affected: BookingEvent[] = res.data?.bookings || [];
      if (affected.length > 0) {
        setAbConflictData(affected);
        setAbStep('conflict');
      } else {
        await submitBlock(false, false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kiểm tra';
      toast.error(msg);
    } finally {
      setAbSubmitting(false);
    }
  };

  const submitBlock = async (cancelAffected: boolean, notifyCreators: boolean) => {
    setAbSubmitting(true);
    const { isAllDay, startDT, endDT } = buildBlockDates();
    const payload = {
      class_id: abRoom || null, block_type: abType, title: abTitle,
      description: abDesc, start_datetime: startDT.toISOString(),
      end_datetime: endDT.toISOString(), is_all_day: isAllDay,
      cancel_affected: cancelAffected, notify_creators: notifyCreators
    };
    try {
      if (abEditingId) {
        await fetchApi(`/api/calendar/admin/blocks/${abEditingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Cập nhật block thành công');
      } else {
        await fetchApi('/api/calendar/admin/blocks', { method: 'POST', body: JSON.stringify(payload) });
        toast.success(cancelAffected ? `Tạo block & đã hủy ${abConflictData.length} booking bị ảnh hưởng` : 'Tạo block thủ công thành công');
      }
      setAdminBlockModalOpen(false);
      resetAbForm();
      loadEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi lưu block';
      toast.error(msg);
    } finally {
      setAbSubmitting(false);
    }
  };

  const handleDeleteBlock = async (id: string, title: string) => {
    try {
      const res = await fetchApi(`/api/calendar/admin/blocks/${id}`, { method: 'DELETE' });
      const freed: number = res.freed_approved_bookings ?? 0;
      setAbDeleteConfirm({ id, title, freed });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xóa block';
      toast.error(msg);
    }
  };

  const confirmDeleteBlock = async () => {
    if (!abDeleteConfirm) return;
    try {
      await fetchApi(`/api/calendar/admin/blocks/${abDeleteConfirm.id}`, { method: 'DELETE' });
      toast.success('Xóa block thành công');
      setAbDeleteConfirm(null);
      setSelectedEvent(null);
      loadEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xóa block';
      toast.error(msg);
    }
  };


  const [selectedEvent, setSelectedEvent] = React.useState<BookingEvent | null>(null);
  const [popoverPos, setPopoverPos] = React.useState({ x: 0, y: 0 });
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Close popover on outside click or ESC
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedEvent(null);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSelectedEvent(null);
      }
    };
    
    if (selectedEvent) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedEvent]);

  // Adjust popover position so it doesn't get cut off
  React.useEffect(() => {
    if (selectedEvent && popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      let { x, y } = popoverPos;
      
      if (x + rect.width > window.innerWidth - 20) x = window.innerWidth - rect.width - 20;
      if (y + rect.height > window.innerHeight - 20) y = window.innerHeight - rect.height - 20;
      if (y < 20) y = 20;
      if (x < 20) x = 20;
      
      popoverRef.current.style.left = `${x}px`;
      popoverRef.current.style.top = `${y}px`;
      popoverRef.current.style.opacity = '1';
    }
  }, [selectedEvent, popoverPos]);

  const handleEventClick = (e: React.MouseEvent, evt: BookingEvent) => {
    e.stopPropagation();
    setSelectedEvent(evt);
    setPopoverPos({ x: e.clientX, y: e.clientY });
  };

  // Load rooms for dropdown
  React.useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await fetchApi('/api/rooms');
        setRooms(Array.isArray(res) ? res : (res.data || []));
      } catch (err: unknown) {
        console.error('Failed to load rooms', err);
      }
    };
    loadRooms();
  }, []);

  const loadEvents = React.useCallback(async () => {
    setLoading(true);
    try {
      let start, end;
      if (view === 'month') {
        start = format(startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        end = format(endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else if (view === 'week') {
        start = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        end = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else {
        start = format(currentDate, 'yyyy-MM-dd');
        end = format(currentDate, 'yyyy-MM-dd');
      }

      const params = new URLSearchParams({ start, end });
      if (selectedRoom !== 'all') params.set('class_id', selectedRoom);
      if (filterStatus.length > 0) params.set('status', filterStatus.join(','));
      if (filterBooker) params.set('booker', filterBooker);
      const res = await fetchApi(`/api/calendar?${params}`);
      // Apply block type filter client-side (MANUAL_BLOCK events have status=block_type)
      let evts: BookingEvent[] = res.data || [];
      if (filterBlockType.length > 0) {
        evts = evts.filter(e => e.event_type !== 'MANUAL_BLOCK' || filterBlockType.includes(e.status as string));
      }
      setEvents(evts);
    } catch (err: unknown) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, view, selectedRoom, filterStatus, filterBlockType, filterBooker]);

  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const navigatePrev = React.useCallback(() => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subDays(currentDate, 7));
    else setCurrentDate(subDays(currentDate, 1));
  }, [view, currentDate]);

  const navigateNext = React.useCallback(() => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addDays(currentDate, 1));
  }, [view, currentDate]);

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const exportICal = async () => {
    try {
      let start: string;
      if (view === 'month') {
        start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      } else if (view === 'week') {
        start = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else {
        start = format(currentDate, 'yyyy-MM-dd');
      }

      // Build .ics content from current events
      const visibleEvents = events.filter(evt => evt.event_type !== 'MANUAL_BLOCK');
      let icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Class Booking System//VI',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ];
      for (const evt of visibleEvents) {
        const s = new Date(evt.start_datetime);
        const e = new Date(evt.end_datetime);
        const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace('.000', '');
        icsLines = icsLines.concat([
          'BEGIN:VEVENT',
          `UID:${evt.id}@classbooking`,
          `DTSTART:${fmt(s)}`,
          `DTEND:${fmt(e)}`,
          `SUMMARY:${(evt.title || evt.purpose || 'Booking').replace(/,/g, '\\,')}`,
          `LOCATION:${(evt.class_name || '').replace(/,/g, '\\,')}`,
          `DESCRIPTION:${(evt.title || '').replace(/,/g, '\\,')}`,
          `STATUS:${evt.status === 'APPROVED' ? 'CONFIRMED' : 'TENTATIVE'}`,
          'END:VEVENT'
        ]);
      }
      icsLines.push('END:VCALENDAR');
      const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lich-phong-hoc-${start}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Xuất iCal thành công');
    } catch (error: unknown) {
      console.error(error);
      toast.error('Lỗi xuất iCal');
    }
  };

  // ── 18.8.4 Keyboard Navigation ────────────────────────────────
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (adminBlockModalOpen || quickBookingModalOpen || abDeleteConfirm) return;
      switch (e.key) {
        case 'ArrowLeft':  navigatePrev(); break;
        case 'ArrowRight': navigateNext(); break;
        case 't': case 'T': navigateToday(); break;
        case 'm': case 'M': setView('month'); break;
        case 'w': case 'W': setView('week'); break;
        case 'd': case 'D': setView('day'); break;
        case 'Escape':
          setSelectedEvent(null);
          setAdminBlockModalOpen(false);
          setQuickBookingModalOpen(false);
          setAbDeleteConfirm(null);
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [view, currentDate, adminBlockModalOpen, quickBookingModalOpen, abDeleteConfirm, navigateNext, navigatePrev]);

  // ── 18.8.3 Room Availability Indicator data ─────────────────────
  const [roomSlots, setRoomSlots] = React.useState<TimeSlot[]>([]);
  React.useEffect(() => {
    if (selectedRoom !== 'all') {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      fetchApi(`/api/rooms/${selectedRoom}/availability?date=${dateStr}`)
        .then(res => setRoomSlots((res.slots || []).map((s: TimeSlot) => ({...s, isAvailable: !s.booking_id}))))
        .catch(() => setRoomSlots([]));
    } else {
      setRoomSlots([]);
    }
  }, [selectedRoom, currentDate, events, view]);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
  });

  const daysOfWeek = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 })
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      
      {/* Breadcrumb */}
      <nav className="text-sm font-medium text-slate-500 mb-2">
        <Link href="/home" className="hover:text-indigo-600 transition-colors">Trang chủ</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-slate-800">Lịch phòng học</span>
      </nav>

      <div className="flex items-center gap-3">
         <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-sm">
            <CalendarIcon className="w-5 h-5" />
         </div>
         <h1 className="text-2xl font-black tracking-tight text-slate-800">Lịch Phòng Học</h1>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        
        {/* Row 1 — Điều hướng thời gian */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-200">
            <button onClick={navigatePrev} className="px-3 py-2 hover:bg-white rounded-lg text-slate-500 hover:text-slate-800 font-bold text-sm shadow-sm transition-all flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Trước
            </button>
            <button onClick={navigateToday} className="px-4 py-2 text-sm font-black text-slate-700 hover:bg-white rounded-lg uppercase shadow-sm transition-all">
              Hôm nay
            </button>
            <button onClick={navigateNext} className="px-3 py-2 hover:bg-white rounded-lg text-slate-500 hover:text-slate-800 font-bold text-sm shadow-sm transition-all flex items-center gap-1">
              Tiếp <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-lg font-black text-slate-700">
            {view === 'month' && `Tháng ${format(currentDate, 'M, yyyy', { locale: vi })}`}
            {view === 'week' && `Tuần ${format(currentDate, 'w', { locale: vi })}: ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd')} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd/MM/yyyy')}`}
            {view === 'day' && format(currentDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
          </div>
        </div>

        {/* Row 2 — Thanh công cụ */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <select 
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 appearance-none hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <option value="all">Tất cả phòng ▼</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setView('month')} className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", view === 'month' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Tháng</button>
              <button onClick={() => setView('week')} className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", view === 'week' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Tuần</button>
              <button onClick={() => setView('day')} className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", view === 'day' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Ngày</button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Advanced filter toggle */}
            <button
              onClick={() => setShowFilters(f => !f)}
              className={cn(
                "h-10 px-3 flex items-center gap-1.5 rounded-xl border text-sm font-bold transition-all",
                showFilters || hasActiveFilters
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <ListFilter className="w-4 h-4" />
              Bộ lọc
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
            </button>
            <button onClick={exportICal} className="h-10 px-4 flex items-center gap-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors shadow-sm text-sm font-bold">
              <Download className="w-4 h-4" /> Xuất iCal
            </button>
            {user?.role === 'ADMIN' && (
              <button 
                onClick={() => openAdminBlock()}
                className="h-10 px-4 flex items-center gap-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm font-bold"
              >
                <PlusCircle className="w-4 h-4" /> Thêm block
              </button>
            )}
          </div>
        </div>

        {/* Row 3 — Advanced Filter Panel (18.8.1) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-slate-100 space-y-3">
                {/* Status filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black text-slate-400 uppercase w-24">Trạng thái</span>
                  {['PENDING_REVIEW','PENDING_APPROVAL','APPROVED'].map(s => (
                    <button
                      key={s}
                      onClick={() => toggleArrFilter(filterStatus, setFilterStatus, s)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold border transition-all",
                        filterStatus.includes(s)
                          ? s === 'APPROVED' ? 'bg-green-100 border-green-400 text-green-700'
                            : s === 'PENDING_APPROVAL' ? 'bg-orange-100 border-orange-400 text-orange-700'
                            : 'bg-yellow-100 border-yellow-400 text-yellow-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      )}
                    >
                      {s === 'APPROVED' ? '✅ Đã duyệt' : s === 'PENDING_APPROVAL' ? '⏳ Chờ phê duyệt' : '🔄 Chờ xem xét'}
                    </button>
                  ))}
                </div>

                {/* Block type filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black text-slate-400 uppercase w-24">Loại block</span>
                  {['MAINTENANCE','HOLIDAY','EVENT','OTHER'].map(t => (
                    <button
                      key={t}
                      onClick={() => toggleArrFilter(filterBlockType, setFilterBlockType, t)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold border transition-all",
                        filterBlockType.includes(t)
                          ? 'bg-slate-700 border-slate-700 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      )}
                    >
                      {t === 'MAINTENANCE' ? '🛠 Bảo trì' : t === 'HOLIDAY' ? '🏖 Nghỉ lễ' : t === 'EVENT' ? '🎉 Sự kiện' : '📌 Khác'}
                    </button>
                  ))}
                </div>

                {/* Booker search (Admin/Reviewer/Approver only) */}
                {user?.role !== 'CREATOR' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase w-24">Người đặt</span>
                    <input
                      type="text"
                      placeholder="Tìm theo tên người đặt..."
                      value={filterBooker}
                      onChange={e => setFilterBooker(e.target.value)}
                      className="h-8 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white w-56"
                    />
                  </div>
                )}

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1"
                  >
                    ✕ Xóa bộ lọc
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 px-6 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded-full" /><span className="text-xs font-bold text-slate-600">Chờ xem xét</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-orange-400 rounded-full" /><span className="text-xs font-bold text-slate-600">Chờ phê duyệt</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span className="text-xs font-bold text-slate-600">Đã phê duyệt</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-800 rounded-full" /><span className="text-xs font-bold text-slate-600">Block thủ công</span></div>
        <div className="flex items-center gap-2"><div className="border-2 border-blue-500 w-4 h-4 rounded-full" /><span className="text-xs font-bold text-slate-600">Của tôi (Creator)</span></div>
        {user?.role === 'ADMIN' && (
          <div className="flex items-center gap-2"><div className="border-2 border-red-500 w-4 h-4 rounded-full" /><span className="text-xs font-bold text-slate-600">Conflict (Admin)</span></div>
        )}
      </div>

      {/* 18.8.3 Room Availability Indicator — shown only when viewing a single room */}
      {selectedRoom !== 'all' && roomSlots.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3">
          <p className="text-[11px] font-black text-slate-400 uppercase mb-2 tracking-wider">
            Tình trạng phòng hôm nay
          </p>
          <div className="flex flex-wrap gap-1.5">
            {roomSlots.map((slot, i) => (
              <div
                key={slot.slot_id ?? i}
                title={slot.isAvailable ? `✅ Trống: ${slot.slot_name}` : `🔴 Đã đặt: ${slot.slot_name}${slot.booked_by ? ` — ${slot.booked_by}` : ''}`}
                className={cn(
                  "relative group flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-default transition-all",
                  slot.isAvailable
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                    : "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", slot.isAvailable ? "bg-emerald-500" : "bg-rose-500")} />
                {slot.start_time?.substring(0,5)} – {slot.end_time?.substring(0,5)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden min-h-[600px] flex flex-col relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
          </div>
        )}

        {/* Month View Implementation */}
        {view === 'month' && (
          <>
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, i) => (
                <div key={day} className={cn("p-4 text-center text-xs font-black tracking-widest", i === 6 ? "text-rose-500" : "text-slate-500")}>
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1 auto-rows-fr">
              {daysInMonth.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const isPastDay = day < startOfDay(new Date());
                
                // Filter events that overlap with this day (supports multi-day events)
                const dayEvents = events.filter(e => {
                  if (!e.start_datetime || !e.end_datetime) return false;
                  const eventStart = startOfDay(new Date(e.start_datetime));
                  const eventEnd = endOfDay(new Date(e.end_datetime));
                  return day >= eventStart && day <= eventEnd;
                });

                const visibleEvents = dayEvents.slice(0, 3);
                const hiddenCount = dayEvents.length - 3;

                const handleDayClick = () => {
                  if (user?.role === 'ADMIN') {
                    openAdminBlock(day);
                  } else if (user?.role === 'CREATOR') {
                    if (isPastDay) return;
                    openQuickBooking(day);
                  }
                };

                return (
                  <div 
                    key={day.toString()} 
                    onClick={handleDayClick}
                    className={cn(
                      "min-h-[120px] p-2 border-b border-r border-slate-100 flex flex-col gap-1 transition-colors group",
                      isToday ? "bg-indigo-50/50" : "hover:bg-slate-50/50",
                      !isCurrentMonth && "bg-slate-50/30",
                      isPastDay ? "cursor-not-allowed" : "cursor-pointer",
                      idx % 7 === 6 && "border-r-0"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold",
                        isToday ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : 
                        !isCurrentMonth ? "text-slate-400" : "text-slate-700"
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                      {visibleEvents.map(evt => {
                        const isMine = evt.user_id === user?.id;
                        
                        // Conflict checking for Admin
                        let isConflict = false;
                        if (user?.role === 'ADMIN') {
                          isConflict = dayEvents.some(other => {
                            if (other.id === evt.id) return false;
                            if (other.class_id !== evt.class_id) return false;
                            const s1 = new Date(evt.start_datetime).getTime();
                            const e1 = new Date(evt.end_datetime).getTime();
                            const s2 = new Date(other.start_datetime).getTime();
                            const e2 = new Date(other.end_datetime).getTime();
                            return s1 < e2 && e1 > s2;
                          });
                        }

                        let bgColor = 'bg-slate-100 text-slate-600';
                        
                        if (evt.event_type === 'MANUAL_BLOCK') bgColor = 'bg-slate-800 text-white';
                        else if (evt.status === 'APPROVED') bgColor = 'bg-green-100 text-green-700';
                        else if (evt.status === 'PENDING_APPROVAL') bgColor = 'bg-orange-100 text-orange-700';
                        else if (evt.status === 'PENDING_REVIEW' || evt.status === 'IN_REVIEW') bgColor = 'bg-yellow-100 text-yellow-800';

                        const tooltip = `Phòng: ${evt.class_name}\nNgười đặt: ${evt.user_name}\nThời gian: ${format(new Date(evt.start_datetime), 'HH:mm')} - ${format(new Date(evt.end_datetime), 'HH:mm')}\nTrạng thái: ${evt.status || 'Khóa thủ công'}`;

                        return (
                          <div 
                            key={evt.id} 
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleEventClick(e, evt);
                            }}
                            className={cn(
                              "px-2 py-1 text-[10px] font-bold rounded truncate cursor-pointer hover:opacity-80 transition-opacity",
                              bgColor,
                              isMine && "ring-2 ring-blue-500 ring-inset",
                              isConflict && "ring-2 ring-red-500 ring-inset"
                            )}
                            title={tooltip}
                          >
                            {selectedRoom === 'all' ? `[${evt.class_name}] ` : ''} 
                            {format(new Date(evt.start_datetime), 'HH:mm')} {evt.title}
                          </div>
                        );
                      })}

                      {hiddenCount > 0 && (
                        <div 
                          className="px-2 py-1 text-[10px] font-bold rounded bg-slate-100 text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Hiển thị danh sách ${hiddenCount} event bị ẩn.`);
                          }}
                        >
                          +{hiddenCount} thêm
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Week View Implementation */}
        {view === 'week' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="flex border-b border-slate-200 bg-slate-50/50 pr-4">
              <div className="w-16 flex-shrink-0" />
              <div className="flex-1 grid grid-cols-7">
                {daysOfWeek.map((day, i) => (
                  <div key={day.toString()} className={cn("p-3 text-center border-l border-slate-200", i === 6 && "text-rose-500")}>
                    <div className="text-xs font-bold uppercase">{format(day, 'E', { locale: vi })}</div>
                    <div className={cn("text-lg font-black mt-1", isSameDay(day, new Date()) ? "text-indigo-600" : "")}>{format(day, 'dd/MM')}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable grid */}
            <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-slate-50" style={{ height: '600px' }}>
              <div className="flex relative" style={{ height: '1440px' }}>
                {/* Time column */}
                <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-white relative">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="absolute w-full text-right pr-2 text-xs font-bold text-slate-400" style={{ top: `${i * 60 - 8}px` }}>
                      {i.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                <div className="flex-1 grid grid-cols-7 relative">
                  {/* Horizontal grid lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <React.Fragment key={i}>
                        <div className="absolute w-full border-t border-slate-200" style={{ top: `${i * 60}px` }} />
                        <div className="absolute w-full border-t border-slate-100 border-dashed" style={{ top: `${i * 60 + 30}px` }} />
                      </React.Fragment>
                    ))}
                  </div>

                  {daysOfWeek.map((day) => {
                    const isPastDay = day < startOfDay(new Date());

                    // Filter events for this day
                    const dayEvents = events.filter(e => {
                      if (!e.start_datetime || !e.end_datetime) return false;
                      const eventStart = new Date(e.start_datetime);
                      const eventEnd = new Date(e.end_datetime);
                      return isSameDay(eventStart, day) || isSameDay(eventEnd, day) || (eventStart < day && eventEnd > day);
                    });

                    return (
                      <div 
                        key={day.toString()} 
                        className={cn("relative border-l border-slate-200 group", isPastDay ? "bg-slate-100/50 cursor-not-allowed" : "cursor-pointer hover:bg-slate-100/30")}
                        onClick={() => {
                          if (user?.role === 'ADMIN') {
                            openAdminBlock(day);
                          } else if (user?.role === 'CREATOR') {
                            if (isPastDay) return;
                            openQuickBooking(day);
                          }
                        }}
                        title={!isPastDay ? "Click để đặt phòng" : ""}
                      >
                        {/* Outside operating hours overlay (00:00 - 07:00 and 22:00 - 24:00) */}
                        <div className="absolute w-full pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wLDhMODswWk04LDhMMTYsMFpNMzIsMEw0MCw4WiIgc3Ryb2tlPSIjZjFmNWY5IiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-50" style={{ top: 0, height: '420px' }} />
                        <div className="absolute w-full pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wLDhMODswWk04LDhMMTYsMFpNMzIsMEw0MCw4WiIgc3Ryb2tlPSIjZjFmNWY5IiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-50" style={{ top: '1320px', height: '120px' }} />

                        {/* Events */}
                        {dayEvents.map(evt => {
                          const start = new Date(evt.start_datetime);
                          const end = new Date(evt.end_datetime);
                          
                          // Cap at midnight for rendering within a single day column
                          const startMins = isSameDay(start, day) ? start.getHours() * 60 + start.getMinutes() : 0;
                          const endMins = isSameDay(end, day) ? end.getHours() * 60 + end.getMinutes() : 1440;
                          const height = Math.max(endMins - startMins, 20); // Min height 20px

                          // Conflict checking (simplified for UI border red)
                          let isConflict = false;
                          if (user?.role === 'ADMIN') {
                            isConflict = dayEvents.some(other => {
                              if (other.id === evt.id) return false;
                              if (other.class_id !== evt.class_id) return false;
                              const s1 = new Date(evt.start_datetime).getTime();
                              const e1 = new Date(evt.end_datetime).getTime();
                              const s2 = new Date(other.start_datetime).getTime();
                              const e2 = new Date(other.end_datetime).getTime();
                              return s1 < e2 && e1 > s2;
                            });
                          }

                          let bgColor = 'bg-slate-100 text-slate-600 border-slate-300';
                          if (evt.event_type === 'MANUAL_BLOCK') bgColor = 'bg-slate-800 text-white border-slate-900';
                          else if (evt.status === 'APPROVED') bgColor = 'bg-green-100 text-green-700 border-green-300';
                          else if (evt.status === 'PENDING_APPROVAL') bgColor = 'bg-orange-100 text-orange-700 border-orange-300';
                          else if (evt.status === 'PENDING_REVIEW' || evt.status === 'IN_REVIEW') bgColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';

                          const isMine = evt.user_id === user?.id;
                          const tooltip = `Phòng: ${evt.class_name}\nNgười đặt: ${evt.user_name}\nThời gian: ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}\nTrạng thái: ${evt.status || 'Khóa thủ công'}`;

                          return (
                            <div 
                              key={evt.id}
                              onClick={(e) => handleEventClick(e, evt)}
                              className={cn(
                                "absolute left-1 right-1 rounded-md border p-1 text-[10px] leading-tight overflow-hidden cursor-pointer hover:shadow-md transition-all z-10",
                                bgColor,
                                isMine && "ring-2 ring-blue-500",
                                isConflict && "ring-2 ring-red-500"
                              )}
                              style={{ top: `${startMins}px`, height: `${height}px` }}
                              title={tooltip}
                            >
                              <div className="font-bold truncate">{evt.title}</div>
                              {height >= 40 && (
                                <>
                                  <div className="truncate opacity-80">{evt.class_name}</div>
                                  <div className="truncate opacity-80">{format(start, 'HH:mm')} - {format(end, 'HH:mm')}</div>
                                </>
                              )}
                            </div>
                          );
                        })}

                        {/* Current time indicator */}
                        {isSameDay(day, new Date()) && (
                          <div className="absolute w-full z-20 pointer-events-none" style={{ top: `${new Date().getHours() * 60 + new Date().getMinutes()}px` }}>
                            <div className="absolute w-2 h-2 rounded-full bg-red-500 -left-1 -top-1" />
                            <div className="w-full border-t-2 border-red-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day View Implementation */}
        {view === 'day' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="flex border-b border-slate-200 bg-slate-50/50">
              <div className="w-16 flex-shrink-0 z-20 bg-slate-50/50 border-r border-slate-200" /> {/* Sticky corner */}
              <div className="flex-1 overflow-x-auto custom-scrollbar no-scrollbar-bottom flex">
                {(selectedRoom === 'all' ? rooms : rooms.filter(r => r.id === selectedRoom)).map((room) => (
                  <div 
                    key={room.id} 
                    className={cn(
                      "flex-1 min-w-[200px] p-3 text-center border-l border-slate-200 first:border-l-0", 
                      selectedRoom === 'all' && rooms.length > 5 && "min-w-[250px]"
                    )}
                  >
                    <div className="text-sm font-black text-slate-700 truncate">{room.name}</div>
                    <div className="mt-1">
                      <span className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase",
                        room.status === 'MAINTENANCE' ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {room.status === 'MAINTENANCE' ? 'Đang bảo trì' : 'Available'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable grid */}
            <div className="flex-1 overflow-auto relative custom-scrollbar bg-slate-50" style={{ height: '600px' }}>
              <div className="flex relative min-w-max" style={{ height: '1440px' }}>
                {/* Time column (sticky) */}
                <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-white sticky left-0 z-30 shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="absolute w-full text-right pr-2 text-xs font-bold text-slate-400" style={{ top: `${i * 60 - 8}px` }}>
                      {i.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Room columns */}
                <div className="flex flex-1 relative z-10">
                  {/* Horizontal grid lines */}
                  <div className="absolute inset-0 pointer-events-none w-full">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <React.Fragment key={i}>
                        <div className="absolute w-full border-t border-slate-200" style={{ top: `${i * 60}px` }} />
                        <div className="absolute w-full border-t border-slate-100 border-dashed" style={{ top: `${i * 60 + 15}px` }} />
                        <div className="absolute w-full border-t border-slate-100 border-dashed" style={{ top: `${i * 60 + 30}px` }} />
                        <div className="absolute w-full border-t border-slate-100 border-dashed" style={{ top: `${i * 60 + 45}px` }} />
                      </React.Fragment>
                    ))}
                  </div>

                  {(selectedRoom === 'all' ? rooms : rooms.filter(r => r.id === selectedRoom)).map((room) => {
                    const isPastDay = currentDate < startOfDay(new Date());
                    const isMaintenance = room.status === 'MAINTENANCE';

                    // Filter events for this room and day
                    const roomEvents = events.filter(e => {
                      if (!e.start_datetime || !e.end_datetime) return false;
                      if (e.class_id !== room.id) return false;
                      const eventStart = new Date(e.start_datetime);
                      const eventEnd = new Date(e.end_datetime);
                      return isSameDay(eventStart, currentDate) || isSameDay(eventEnd, currentDate) || (eventStart < currentDate && eventEnd > currentDate);
                    });

                    return (
                      <div 
                        key={room.id} 
                        className={cn(
                          "relative flex-1 min-w-[200px] border-l border-slate-200 group first:border-l-0", 
                          selectedRoom === 'all' && rooms.length > 5 && "min-w-[250px]",
                          isPastDay || isMaintenance ? "bg-slate-100/80 cursor-not-allowed" : "cursor-pointer hover:bg-slate-100/30"
                        )}
                        onClick={() => {
                          if (user?.role === 'ADMIN') {
                            openAdminBlock(currentDate, room.id);
                          } else if (user?.role === 'CREATOR') {
                            if (isPastDay || isMaintenance) return;
                            openQuickBooking(currentDate, room.id);
                          }
                        }}
                      >
                        {isMaintenance && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <span className="text-sm font-black text-slate-400 rotate-90 opacity-30 whitespace-nowrap">ĐANG BẢO TRÌ</span>
                          </div>
                        )}

                        {/* Events */}
                        {roomEvents.map(evt => {
                          const start = new Date(evt.start_datetime);
                          const end = new Date(evt.end_datetime);
                          
                          // Cap at midnight
                          const startMins = isSameDay(start, currentDate) ? start.getHours() * 60 + start.getMinutes() : 0;
                          const endMins = isSameDay(end, currentDate) ? end.getHours() * 60 + end.getMinutes() : 1440;
                          const height = Math.max(endMins - startMins, 20);

                          let bgColor = 'bg-slate-100 text-slate-600 border-slate-300';
                          if (evt.event_type === 'MANUAL_BLOCK') bgColor = 'bg-slate-800 text-white border-slate-900';
                          else if (evt.status === 'APPROVED') bgColor = 'bg-green-100 text-green-700 border-green-300';
                          else if (evt.status === 'PENDING_APPROVAL') bgColor = 'bg-orange-100 text-orange-700 border-orange-300';
                          else if (evt.status === 'PENDING_REVIEW' || evt.status === 'IN_REVIEW') bgColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';

                          const isMine = evt.user_id === user?.id;
                          const tooltip = `Người đặt: ${evt.user_name}\nThời gian: ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}\nTrạng thái: ${evt.status || 'Khóa thủ công'}`;

                          return (
                            <div 
                              key={evt.id}
                              onClick={(e) => handleEventClick(e, evt)}
                              className={cn(
                                "absolute left-1 right-1 rounded-md border p-2 text-xs leading-tight overflow-hidden cursor-pointer hover:shadow-md transition-all z-20",
                                bgColor,
                                isMine && "ring-2 ring-blue-500"
                              )}
                              style={{ top: `${startMins}px`, height: `${height}px` }}
                              title={tooltip}
                            >
                              <div className="font-bold truncate">{evt.title}</div>
                              {height >= 40 && (
                                <div className="truncate opacity-80 mt-1">{format(start, 'HH:mm')} - {format(end, 'HH:mm')}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Current time indicator */}
                {isSameDay(currentDate, new Date()) && (
                  <div className="absolute z-40 pointer-events-none" style={{ left: '4rem', right: 0, top: `${new Date().getHours() * 60 + new Date().getMinutes()}px` }}>
                    <div className="absolute w-2 h-2 rounded-full bg-red-500 -left-1 -top-1" />
                    <div className="w-full border-t-2 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Popover (18.6.1) */}
      {selectedEvent && (
        <div 
          ref={popoverRef}
          className="fixed z-[100] w-80 bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col opacity-0 transition-opacity duration-200"
          style={{ left: 0, top: 0 }}
        >
          {/* Header */}
          <div className="p-3 border-b border-slate-100 flex items-start gap-2 bg-slate-50/50">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={cn(
                  "text-[10px] uppercase font-bold",
                  selectedEvent.event_type === 'MANUAL_BLOCK' ? "border-slate-800 text-slate-800" :
                  selectedEvent.status === 'APPROVED' ? "border-green-600 text-green-600" :
                  selectedEvent.status === 'PENDING_APPROVAL' ? "border-orange-600 text-orange-600" :
                  "border-yellow-600 text-yellow-600"
                )}>
                  {selectedEvent.status || 'Khóa thủ công'}
                </Badge>
              </div>
              <h4 className="font-bold text-slate-800 line-clamp-2">{selectedEvent.title}</h4>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700">P.{selectedEvent.class_name}</span>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="capitalize">{format(new Date(selectedEvent.start_datetime), 'EEEE, dd/MM/yyyy', { locale: vi })}</div>
                <div className="text-slate-500">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {format(new Date(selectedEvent.start_datetime), 'HH:mm')} - {format(new Date(selectedEvent.end_datetime), 'HH:mm')}
                  {` (${Math.round((new Date(selectedEvent.end_datetime).getTime() - new Date(selectedEvent.start_datetime).getTime()) / 3600000 * 10) / 10} tiếng)`}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-slate-700">
                  {user?.role === 'CREATOR' && selectedEvent.user_id !== user?.id 
                    ? 'Ẩn (Quyền riêng tư)' 
                    : selectedEvent.user_name}
                </div>
                {selectedEvent.attendee_count && (
                  <div className="text-slate-500 text-xs mt-0.5">
                    Số lượng: {selectedEvent.attendee_count} người
                  </div>
                )}
              </div>
            </div>

            {selectedEvent.purpose && (
              <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600 italic border border-slate-100">
                {selectedEvent.purpose.substring(0, 100)}{selectedEvent.purpose.length > 100 ? '...' : ''}
              </div>
            )}
          </div>

          {/* Footer / Actions */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedEvent(null)}
            >
              Đóng
            </Button>
            {selectedEvent.event_type === 'MANUAL_BLOCK' && user?.role === 'ADMIN' && (
              <>
                <Button
                  variant="outline"
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                  size="sm"
                  onClick={() => openEditBlock(selectedEvent)}
                >
                  ✏️ Sửa
                </Button>
                <Button
                  variant="outline"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  size="sm"
                  onClick={() => handleDeleteBlock(selectedEvent.id, selectedEvent.title || 'Block')}
                >
                  🗑 Xóa
                </Button>
              </>
            )}
            {selectedEvent.event_type !== 'MANUAL_BLOCK' && (
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  if (user?.role === 'ADMIN' || user?.role === 'APPROVER' || user?.role === 'REVIEWER') {
                    router.push(`/bookings/${selectedEvent.id}`);
                  } else {
                    router.push(`/my-bookings/${selectedEvent.id}`);
                  }
                }}
              >
                Xem chi tiết đầy đủ
              </Button>
            )}
          </div>
        </div>
      )}
      {/* Quick Create Booking Modal (18.6.2) */}
      <AnimatePresence>
        {quickBookingModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setQuickBookingModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-black text-slate-800">Tạo booking nhanh</h3>
                <p className="text-xs text-slate-500 mt-1">Vui lòng điền thông tin tối thiểu. Bạn có thể bổ sung sau.</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Ngày học</label>
                    <Input 
                      type="date" 
                      value={qbDate}
                      onChange={(e) => setQbDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Phòng học</label>
                    <select 
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      value={qbRoom}
                      onChange={(e) => setQbRoom(e.target.value)}
                    >
                      <option value="" disabled>-- Chọn phòng --</option>
                      {rooms.map(r => (
                        <option key={r.id} value={r.id}>{r.name} {r.status === 'MAINTENANCE' ? '(Bảo trì)' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Khung giờ</label>
                  <select 
                    className={cn(
                      "w-full h-10 px-3 rounded-xl border text-sm outline-none focus:ring-2 transition-colors",
                      qbConflict 
                        ? "border-red-300 bg-red-50 text-red-700 focus:border-red-500 focus:ring-red-500/20" 
                        : "border-slate-200 bg-white focus:border-indigo-500 focus:ring-indigo-500/20"
                    )}
                    value={qbSlot}
                    onChange={(e) => setQbSlot(e.target.value)}
                    disabled={!qbRoom || !qbDate}
                  >
                    <option value="" disabled>{qbSlots.length ? '-- Chọn ca học --' : 'Vui lòng chọn phòng và ngày trước'}</option>
                    {qbSlots.map((s, idx) => (
                      <option key={s.slot_id ?? idx} value={s.slot_id}>
                        {s.slot_name} ({s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}) {s.booking_id !== null ? '⚠ Đã có lịch' : ''}
                      </option>
                    ))}
                  </select>
                  {qbConflict && (
                    <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      Khung giờ này đã bị trùng!
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Tiêu đề / Môn học (*)</label>
                  <Input 
                    placeholder="VD: Lớp Toán rời rạc..." 
                    value={qbTitle}
                    onChange={(e) => setQbTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Số lượng SV (*)</label>
                    <Input 
                      type="number" 
                      placeholder="VD: 50" 
                      value={qbAttendees}
                      onChange={(e) => setQbAttendees(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Mục đích sử dụng (*)</label>
                  <Input 
                    placeholder="Nhập mục đích sử dụng phòng..." 
                    value={qbPurpose}
                    onChange={(e) => setQbPurpose(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setQuickBookingModalOpen(false)}>Hủy</Button>
                <div className="flex-1" />
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/bookings/new?date=${qbDate}&room=${qbRoom}`)}
                  className="mr-2"
                >
                  Mở form đầy đủ
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleQuickCreate(false)}
                  disabled={qbSubmitting || qbConflict}
                >
                  Lưu nháp
                </Button>
                <Button 
                  onClick={() => handleQuickCreate(true)}
                  disabled={qbSubmitting || qbConflict}
                >
                  Lưu & Gửi ngay
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Admin Manual Block Modal (18.7.2) */}
      <AnimatePresence>
        {adminBlockModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setAdminBlockModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-800 text-white">
                <h3 className="text-lg font-black">
                  {abEditingId ? '✏️ Sửa Block Thủ Công' : 'Thêm Block Thủ Công'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {abStep === 'conflict'
                    ? `⚠️ Có ${abConflictData.length} booking APPROVED bị ảnh hưởng`
                    : 'Ghi đè lịch hệ thống với quyền Quản trị viên'}
                </p>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Phòng học (*)</label>
                  <select 
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    value={abRoom}
                    onChange={(e) => setAbRoom(e.target.value)}
                  >
                    <option value="">Tất cả phòng (System-wide Block)</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name} {r.status === 'MAINTENANCE' ? '(Bảo trì)' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Loại Block (*)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['MAINTENANCE', 'HOLIDAY', 'EVENT', 'OTHER'].map(type => (
                      <label key={type} className={cn(
                        "flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors text-xs font-bold",
                        abType === type ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      )}>
                        <input type="radio" name="abType" value={type} checked={abType === type} onChange={(e) => setAbType(e.target.value as 'MAINTENANCE' | 'HOLIDAY' | 'EVENT' | 'OTHER')} className="hidden" />
                        {type === 'MAINTENANCE' && '🛠 Bảo trì'}
                        {type === 'HOLIDAY' && '🏖 Ngày lễ'}
                        {type === 'EVENT' && '🎉 Sự kiện'}
                        {type === 'OTHER' && '📌 Khác'}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Tiêu đề (*)</label>
                  <Input 
                    placeholder="VD: Sửa chữa điều hòa, Nghỉ lễ Quốc Khánh..." 
                    value={abTitle}
                    onChange={(e) => setAbTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Ngày bắt đầu (*)</label>
                    <Input type="date" value={abStartDate} onChange={(e) => setAbStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Ngày kết thúc (*)</label>
                    <Input type="date" value={abEndDate} onChange={(e) => setAbEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Giờ bắt đầu</label>
                    <Input type="time" value={abStartTime} onChange={(e) => setAbStartTime(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">Giờ kết thúc</label>
                    <Input type="time" value={abEndTime} onChange={(e) => setAbEndTime(e.target.value)} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium -mt-2 italic">Để trống giờ nếu muốn block cả ngày (All-day)</p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Mô tả chi tiết</label>
                  <textarea 
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    rows={2}
                    placeholder="Lý do chi tiết..."
                    value={abDesc}
                    onChange={(e) => setAbDesc(e.target.value)}
                  />
                </div>

                <label className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={abNotify} onChange={e => setAbNotify(e.target.checked)} className="rounded text-rose-500 focus:ring-rose-500" />
                  <span className="text-xs font-bold text-rose-700">Gửi thông báo hủy/dời lịch cho các Booking bị ảnh hưởng</span>
                </label>

              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                {abStep === 'form' ? (
                  <>
                    <Button variant="ghost" onClick={() => { setAdminBlockModalOpen(false); resetAbForm(); }}>Hủy</Button>
                    <Button
                      className="bg-slate-800 text-white hover:bg-black"
                      onClick={handleBlockPreflight}
                      disabled={abSubmitting}
                    >
                      {abSubmitting ? 'Đang kiểm tra...' : (abEditingId ? 'Cập nhật Block' : 'Tiếp theo')}
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Conflict warning step – 3 choices */}
                    <div className="w-full space-y-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                        <p className="text-sm font-black text-amber-800">
                          ⚠️ Có {abConflictData.length} booking APPROVED đang bị ảnh hưởng:
                        </p>
                        <ul className="text-xs text-amber-700 space-y-0.5 max-h-28 overflow-y-auto">
                          {abConflictData.map((b, i) => (
                            <li key={b.id ?? i} className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                              {b.creator_name} — {b.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setAbStep('form')}>← Quay lại</Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-amber-700 border-amber-300 hover:bg-amber-50"
                          onClick={() => submitBlock(false, true)}
                          disabled={abSubmitting}
                        >
                          Tạo block & Thông báo Creator
                        </Button>
                        <Button
                          size="sm"
                          className="bg-rose-600 text-white hover:bg-rose-700"
                          onClick={() => submitBlock(true, true)}
                          disabled={abSubmitting}
                        >
                          Tạo block & Hủy các booking
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Block Confirm Dialog (18.7.5) */}
      <AnimatePresence>
        {abDeleteConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setAbDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-200"
            >
               <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                  <AlertTriangle className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-black text-slate-800 leading-tight">Xác nhận xóa block?</h3>
               <p className="text-slate-500 font-bold text-sm mt-3 leading-relaxed">
                  Bạn đang xóa block <span className="text-rose-600 italic">&quot;{abDeleteConfirm.title}&quot;</span>. 
                  {abDeleteConfirm.freed > 0 && ` Điều này sẽ giúp khôi phục khả năng sử dụng phòng cho ${abDeleteConfirm.freed} booking đã được duyệt.`}
               </p>
               <div className="flex gap-3 mt-8">
                  <Button variant="ghost" className="flex-1 rounded-xl font-black" onClick={() => setAbDeleteConfirm(null)}>Hủy bỏ</Button>
                  <Button className="flex-1 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-black shadow-xl shadow-rose-600/20" onClick={confirmDeleteBlock}>Xác nhận xóa</Button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
