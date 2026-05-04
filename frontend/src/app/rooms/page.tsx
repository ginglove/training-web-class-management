'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { fetchApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { 
  Users, 
  MapPin, 
  MonitorPlay, 
  Info, 
  ChevronRight, 
  Clock, 
  Search, 
  Filter,
  Sparkles,
  Building,
  ArrowUpRight,
  LayoutGrid,
  Zap,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoomsPage() {
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCapacity, setFilterCapacity] = React.useState<string>('all');

  React.useEffect(() => {
    fetchApi('/api/rooms').then(res => {
      setRooms(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         room.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterCapacity === 'all') return matchesSearch;
    if (filterCapacity === 'small') return matchesSearch && room.capacity <= 15;
    if (filterCapacity === 'medium') return matchesSearch && room.capacity > 15 && room.capacity <= 30;
    if (filterCapacity === 'large') return matchesSearch && room.capacity > 30;
    
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-xl shadow-indigo-500/5">
                <Building className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
                  <Sparkles className="w-3 h-3" />
                  <span>Cơ sở vật chất</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-800">Danh sách Phòng học 🏢</h1>
             </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">Khám phá và xem lịch của các phòng học đào tạo hiện có trong hệ thống.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Tìm tên phòng, tòa nhà..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-14 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-primary/30 transition-all shadow-xl shadow-slate-200/20 outline-none"
            />
          </div>
          <div className="relative w-full sm:w-64 group">
             <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors z-10" />
             <select 
               value={filterCapacity}
               onChange={(e) => setFilterCapacity(e.target.value)}
               className="w-full h-14 pl-14 pr-10 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:border-primary/30 transition-all appearance-none shadow-xl shadow-slate-200/20 cursor-pointer relative z-0"
             >
               <option value="all">Tất cả sức chứa</option>
               <option value="small">Nhỏ (≤ 15 chỗ)</option>
               <option value="medium">Vừa (16-30 chỗ)</option>
               <option value="large">Lớn (&gt; 30 chỗ)</option>
             </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-80 bg-white rounded-[3rem] animate-pulse border border-slate-100 shadow-sm" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredRooms.map((room, i) => (
              <motion.div
                layout
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="group relative bg-white border border-slate-100 rounded-[3rem] p-0 overflow-hidden shadow-2xl shadow-slate-200/30 hover:shadow-primary/20 hover:border-primary/20 transition-all duration-500 h-full flex flex-col">
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 group-hover:opacity-[0.05] transition-all pointer-events-none">
                     <Building className="w-48 h-48" />
                  </div>

                  <div className="p-10 flex-1 flex flex-col space-y-8 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                        <MonitorPlay className="w-8 h-8" />
                      </div>
                      <Badge className={cn(
                        "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border shadow-sm",
                        room.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                      )}>
                        {room.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-3xl font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors leading-none">{room.name}</h3>
                      <p className="text-slate-400 font-bold text-sm line-clamp-2 leading-relaxed italic">
                        "{room.description || 'Không có mô tả chi tiết cho phòng học này.'}"
                      </p>
                    </div>
                    
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tòa nhà / Vị trí</p>
                          <p className="font-black text-slate-700 text-sm">{room.location}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Sức chứa tối đa</p>
                          <p className="font-black text-slate-700 text-sm">{room.capacity} Học viên</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 mt-auto border-t border-slate-50 bg-slate-50/50 flex items-center justify-between group/footer">
                    <Link href={`/bookings/new?roomId=${room.id}`} className="flex-1">
                      <button className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest shadow-sm hover:bg-primary hover:text-white hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                        <Zap className="w-4 h-4" />
                        <span>Đặt ngay</span>
                      </button>
                    </Link>
                    <div className="w-12 h-12 bg-transparent rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-primary transition-all">
                       <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {!loading && filteredRooms.length === 0 && (
        <div className="py-32 text-center space-y-8 bg-white rounded-[4rem] border-4 border-dashed border-slate-50 shadow-inner">
          <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto border border-slate-100">
            <Search className="w-12 h-12 text-slate-200" />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Không tìm thấy phòng phù hợp</h3>
            <p className="text-slate-400 font-bold max-w-md mx-auto italic">Thử thay đổi từ khóa tìm kiếm hoặc lọc theo sức chứa khác.</p>
          </div>
          <button 
            onClick={() => { setSearchQuery(''); setFilterCapacity('all'); }}
            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
