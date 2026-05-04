'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { fetchApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  MapPin, 
  Search, 
  PlusCircle,
  Sparkles,
  Calendar,
  LayoutGrid,
  Zap,
  ArrowUpRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = React.useState(initialDate);
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  const loadSchedule = React.useCallback(async (targetDate: string) => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/rooms/availability/all?date=${targetDate}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load schedule', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSchedule(date);
  }, [date, loadSchedule]);

  const handlePrevDay = () => {
    const newDate = format(subDays(new Date(date), 1), 'yyyy-MM-dd');
    setDate(newDate);
    router.push(`/schedule?date=${newDate}`);
  };

  const handleNextDay = () => {
    const newDate = format(addDays(new Date(date), 1), 'yyyy-MM-dd');
    setDate(newDate);
    router.push(`/schedule?date=${newDate}`);
  };

  const handleToday = () => {
    const newDate = format(new Date(), 'yyyy-MM-dd');
    setDate(newDate);
    router.push(`/schedule?date=${newDate}`);
  };

  // Group data by room
  const roomsMap = new Map();
  data.forEach(item => {
    if (!roomsMap.has(item.class_id)) {
      roomsMap.set(item.class_id, {
        id: item.class_id,
        name: item.class_name,
        location: item.location,
        capacity: item.capacity,
        slots: []
      });
    }
    roomsMap.get(item.class_id).slots.push(item);
  });

  const rooms = Array.from(roomsMap.values()).filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Slot headers (SRS fixed 4 slots)
  const slotNames = ['Slot 1', 'Slot 2', 'Slot 3', 'Slot 4'];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-xl shadow-indigo-500/5">
                <Calendar className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
                  <Sparkles className="w-3 h-3" />
                  <span>Thời gian biểu</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-800">Lịch phòng học 📅</h1>
             </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">Xem chi tiết tình trạng sử dụng phòng học theo thời gian thực để lập kế hoạch đào tạo tối ưu.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border-2 border-slate-100 shadow-xl shadow-slate-200/20">
            <button onClick={handlePrevDay} className="p-3 bg-slate-50 rounded-xl hover:bg-primary hover:text-white transition-all active:scale-90 text-slate-400 border border-slate-100">
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button onClick={handleToday} className="px-6 py-3 bg-white text-[10px] font-black text-slate-600 hover:text-primary uppercase tracking-widest transition-all active:scale-95">
              Hôm nay
            </button>

            <button onClick={handleNextDay} className="p-3 bg-slate-50 rounded-xl hover:bg-primary hover:text-white transition-all active:scale-90 text-slate-400 border border-slate-100">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="relative group lg:w-48">
            <CalendarDays className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 group-focus-within:scale-110 transition-transform z-10" />
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="pl-14 h-14 bg-white border-2 border-slate-100 rounded-2xl font-black text-slate-700 focus:bg-white focus:border-primary/30 transition-all shadow-xl shadow-slate-200/20 outline-none"
            />
          </div>

          <div className="relative group lg:w-64">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Tìm tên phòng..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-14 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-primary/30 transition-all shadow-xl shadow-slate-200/20 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Legend & Date Summary */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center text-primary shadow-inner">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ngày đang xem</p>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{format(new Date(date), 'EEEE, dd MMMM yyyy', { locale: vi })}</h2>
          </div>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
             <div className="w-4 h-4 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trống</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-4 h-4 bg-rose-500 rounded-lg shadow-lg shadow-rose-500/20" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Đã đặt</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-4 h-4 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cố định</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden relative min-h-[500px]">
        {loading ? (
          <div className="p-20 space-y-12">
             {[1,2,3,4].map(i => (
               <div key={i} className="h-24 bg-slate-50 rounded-3xl animate-pulse border border-slate-100" />
             ))}
          </div>
        ) : rooms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-8 text-left sticky left-0 z-20 bg-slate-50/80 backdrop-blur-md w-80">
                    <div className="flex items-center gap-3">
                       <LayoutGrid className="w-5 h-5 text-slate-300" />
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Phòng học / Vị trí</span>
                    </div>
                  </th>
                  {slotNames.map((name, i) => (
                    <th key={i} className="p-8 text-center min-w-[240px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">{name}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ca đào tạo</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rooms.map((room) => (
                  <tr key={room.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="p-8 sticky left-0 z-20 bg-white/80 backdrop-blur-md border-r border-slate-50 group-hover:bg-white transition-colors">
                      <div className="space-y-1">
                        <p className="font-black text-slate-800 text-lg tracking-tight group-hover:text-primary transition-colors">{room.name}</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{room.location}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Users className="w-3 h-3 text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{room.capacity} chỗ</span>
                        </div>
                      </div>
                    </td>
                    {room.slots.sort((a:any, b:any) => a.slot_id - b.slot_id).map((slot: any) => {
                      const isBooked = !!slot.booking_id;
                      const isFixed = slot.is_fixed;
                      return (
                        <td key={slot.slot_id} className="p-4">
                          <motion.div
                            whileHover={{ y: -4 }}
                            className={cn(
                              "relative h-32 rounded-[2rem] p-6 flex flex-col justify-between border-2 transition-all overflow-hidden group/slot shadow-sm",
                              isBooked 
                                ? "bg-rose-50 border-rose-100 shadow-rose-200/10" 
                                : isFixed 
                                ? "bg-indigo-50 border-indigo-100 shadow-indigo-200/10"
                                : "bg-white border-slate-100 hover:border-emerald-500/30 shadow-slate-200/10"
                            )}
                          >
                            {/* Visual Indicator */}
                            <div className={cn(
                              "absolute top-0 right-0 p-6 opacity-[0.05] group-hover/slot:scale-125 transition-transform",
                              isBooked ? "text-rose-500" : isFixed ? "text-indigo-500" : "text-emerald-500"
                            )}>
                              {isBooked ? <Users className="w-12 h-12" /> : isFixed ? <Clock className="w-12 h-12" /> : <PlusCircle className="w-12 h-12" />}
                            </div>

                            <div className="relative z-10 flex flex-col h-full justify-between">
                              <div className="space-y-1">
                                <p className={cn("text-[9px] font-black uppercase tracking-widest", isBooked ? "text-rose-400" : isFixed ? "text-indigo-400" : "text-slate-300")}>
                                  {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}
                                </p>
                                <p className={cn("font-black text-sm tracking-tight line-clamp-1", isBooked ? "text-rose-600" : isFixed ? "text-indigo-600" : "text-slate-400")}>
                                  {isBooked ? (slot.course_name || slot.purpose) : isFixed ? 'Lịch cố định' : 'Trống'}
                                </p>
                              </div>

                              <div className="flex items-center justify-between">
                                <Badge className={cn(
                                  "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border-none",
                                  isBooked ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : 
                                  isFixed ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : 
                                  "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                )}>
                                  {isBooked ? 'Đã đặt' : isFixed ? 'Fixed' : 'Sẵn sàng'}
                                </Badge>

                                {!isBooked && !isFixed && (
                                  <Link href={`/bookings/new?roomId=${room.id}&date=${date}&slotId=${slot.slot_id}`}>
                                    <button className="w-8 h-8 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                      <PlusCircle className="w-4 h-4" />
                                    </button>
                                  </Link>
                                )}
                                {isBooked && (
                                   <Link href={`/bookings/${slot.booking_id}`}>
                                     <button className="w-8 h-8 rounded-xl bg-white border border-rose-100 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                       <Info className="w-4 h-4" />
                                     </button>
                                   </Link>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-32 text-center space-y-8">
            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto border border-slate-100">
              <Calendar className="w-12 h-12 text-slate-200" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Không có dữ liệu lịch</h3>
              <p className="text-slate-400 font-bold max-w-md mx-auto italic">Thử chọn một ngày khác hoặc thay đổi từ khóa tìm kiếm.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
