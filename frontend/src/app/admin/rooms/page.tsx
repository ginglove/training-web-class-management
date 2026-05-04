'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { fetchApi } from '@/lib/api';
import { 
  Search, 
  Plus, 
  MapPin, 
  Users, 
  Settings2, 
  Trash2, 
  CalendarDays, 
  X,
  Building,
  Sparkles,
  Info,
  ChevronRight,
  MonitorPlay,
  Save,
  Zap,
  ArrowUpRight,
  Gavel
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errorTranslations';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminRoomsPage() {
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingRoom, setEditingRoom] = React.useState<any>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    location: '',
    capacity: 30,
    description: '',
    status: 'AVAILABLE'
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const loadRooms = async () => {
    try {
      const data = await fetchApi('/api/rooms');
      setRooms(data);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Lỗi khi tải danh sách phòng'));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadRooms();
  }, []);

  const openModal = (room: any = null) => {
    setFormErrors({});
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        location: room.location,
        capacity: room.capacity,
        description: room.description || '',
        status: room.status
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        location: '',
        capacity: 30,
        description: '',
        status: 'AVAILABLE'
      });
    }
    setIsModalOpen(true);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Tên phòng không được để trống';
    if (!formData.location.trim()) errors.location = 'Vị trí không được để trống';
    if (formData.capacity <= 0) errors.capacity = 'Sức chứa phải ít nhất là 1';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (editingRoom) {
        await fetchApi(`/api/admin/rooms/${editingRoom.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData)
        });
      } else {
        await fetchApi('/api/admin/rooms', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      toast.success(editingRoom ? 'Cập nhật phòng thành công ✅' : 'Thêm phòng mới thành công ✅');
      setIsModalOpen(false);
      loadRooms();
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Thao tác thất bại'));
    }
  };

  const filteredRooms = rooms.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[1.2rem] bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100 shadow-xl shadow-amber-500/5">
                <Building className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">
                  <Sparkles className="w-3 h-3" />
                  <span>Quản lý tài nguyên</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-800">Cấu hình Phòng học 🏢</h1>
             </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">Tùy chỉnh danh sách các phòng đào tạo, cập nhật sức chứa và vị trí để tối ưu hóa việc phân bổ lịch học.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Tìm tên phòng, tòa nhà..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-14 h-14 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-primary/30 transition-all shadow-xl shadow-slate-200/20 outline-none"
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="w-full sm:w-auto px-10 h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>Thêm phòng mới</span>
          </button>
        </div>
      </div>

      {/* Rooms List */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden relative min-h-[500px]">
        {loading ? (
          <div className="p-20 space-y-8 text-center">
             <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
             <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Đang tải danh sách cơ sở vật chất...</p>
          </div>
        ) : filteredRooms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Thông tin phòng</span>
                  </th>
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Vị trí</span>
                  </th>
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Sức chứa</span>
                  </th>
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</span>
                  </th>
                  <th className="p-8 text-right">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Quản trị</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRooms.map((r) => (
                  <tr key={r.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="p-8">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                          <MonitorPlay className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-slate-800 text-xl tracking-tight leading-none group-hover:text-primary transition-colors">{r.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 italic line-clamp-1 max-w-xs">"{r.description || 'Không có mô tả'}"</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                       <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl w-fit shadow-sm">
                          <MapPin className="w-4 h-4 text-slate-300" />
                          <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{r.location}</span>
                       </div>
                    </td>
                    <td className="p-8">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                             <Users className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-black text-slate-700">{r.capacity} chỗ</span>
                       </div>
                    </td>
                    <td className="p-8">
                       <Badge className={cn(
                         "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm",
                         r.status === 'AVAILABLE' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                         r.status === 'MAINTENANCE' ? "bg-rose-50 text-rose-600 border-rose-100" :
                         "bg-white text-slate-400 border-slate-100"
                       )}>
                         {r.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Bảo trì'}
                       </Badge>
                    </td>
                    <td className="p-8 text-right">
                       <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => openModal(r)}
                            className="p-4 bg-white border border-slate-100 rounded-[1.2rem] text-slate-400 hover:text-primary hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10 transition-all active:scale-90"
                          >
                            <Settings2 className="w-5 h-5" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-32 text-center space-y-8">
            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto border border-slate-100">
              <Home className="w-12 h-12 text-slate-200" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Không tìm thấy phòng học</h3>
              <p className="text-slate-400 font-bold max-w-md mx-auto italic">Thử thay đổi từ khóa tìm kiếm hoặc thêm phòng học mới.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Chỉnh sửa / Thêm mới */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-10 lg:p-14 space-y-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-[1.2rem] bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
                        <MonitorPlay className="w-6 h-6" />
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Cấu hình tài sản</p>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{editingRoom ? 'Cập nhật Phòng' : 'Phòng học mới'}</h3>
                     </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-4 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên phòng học</label>
                      <div className="relative group">
                         <MonitorPlay className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                         <Input 
                           value={formData.name}
                           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                           className="pl-14 h-14 bg-slate-50/50 border-2 border-slate-100 rounded-2xl font-bold focus:bg-white transition-all outline-none"
                           placeholder="Ví dụ: LAB 401..."
                         />
                      </div>
                      {formErrors.name && <p className="text-xs text-rose-500 font-bold ml-1">{formErrors.name}</p>}
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vị trí (Tòa nhà)</label>
                      <div className="relative group">
                         <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                         <Input 
                           value={formData.location}
                           onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                           className="pl-14 h-14 bg-slate-50/50 border-2 border-slate-100 rounded-2xl font-bold focus:bg-white transition-all outline-none"
                           placeholder="Ví dụ: Tòa nhà A..."
                         />
                      </div>
                      {formErrors.location && <p className="text-xs text-rose-500 font-bold ml-1">{formErrors.location}</p>}
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sức chứa (Học viên)</label>
                      <div className="relative group">
                         <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                         <Input 
                           type="number"
                           value={formData.capacity}
                           onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                           className="pl-14 h-14 bg-slate-50/50 border-2 border-slate-100 rounded-2xl font-bold focus:bg-white transition-all outline-none"
                         />
                      </div>
                      {formErrors.capacity && <p className="text-xs text-rose-500 font-bold ml-1">{formErrors.capacity}</p>}
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái vận hành</label>
                      <div className="flex gap-4">
                         {['AVAILABLE', 'MAINTENANCE'].map((s) => (
                           <button
                             key={s}
                             type="button"
                             onClick={() => setFormData({ ...formData, status: s })}
                             className={cn(
                               "flex-1 h-14 rounded-2xl border-2 font-black text-[9px] uppercase tracking-widest transition-all",
                               formData.status === s 
                                 ? (s === 'AVAILABLE' ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20" : "bg-rose-500 border-rose-500 text-white shadow-xl shadow-rose-500/20")
                                 : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                             )}
                           >
                             {s === 'AVAILABLE' ? 'Sẵn sàng' : 'Bảo trì'}
                           </button>
                         ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả ngắn gọn</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full h-32 p-6 bg-slate-50/50 border-2 border-slate-100 rounded-3xl font-bold focus:bg-white focus:border-primary/30 transition-all outline-none resize-none text-sm"
                      placeholder="Ghi chú về trang thiết bị: Máy chiếu, Điều hòa..."
                    />
                  </div>

                  <div className="pt-6 flex gap-5">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-5 bg-primary text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <Save className="w-5 h-5 fill-white" />
                      <span>{editingRoom ? 'Lưu cấu hình' : 'Tạo phòng ngay'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
