'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { 
  Search, 
  Shield, 
  UserX, 
  UserCheck, 
  X, 
  Mail, 
  Sparkles,
  Users,
  Building,
  Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errorTranslations';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  department?: string;
  status: string;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [formData, setFormData] = React.useState({
    status: 'ACTIVE',
    user_role: 'CREATOR',
    department: ''
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const loadUsers = async () => {
    try {
      const data = await fetchApi('/api/admin/users');
      setUsers(data);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Lỗi khi tải danh sách người dùng'));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadUsers();
  }, []);

  const openModal = (user: User) => {
    setFormErrors({});
    setEditingUser(user);
    setFormData({
      status: user.status,
      user_role: user.role,
      department: user.department || ''
    });
    setIsModalOpen(true);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.department.trim()) errors.department = 'Phòng ban không được để trống';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !editingUser) return;

    try {
      await fetchApi(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      toast.success('Cập nhật người dùng thành công');
      setIsModalOpen(false);
      loadUsers();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Cập nhật thất bại'));
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('Bạn không thể tự khóa tài khoản của chính mình! 🚫');
      return;
    }
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await fetchApi(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      toast.success(`Người dùng đã được ${newStatus === 'ACTIVE' ? 'kích hoạt' : 'khóa'}`);
      loadUsers();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Thao tác thất bại'));
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-xl shadow-indigo-500/5">
                <Users className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
                  <Sparkles className="w-3 h-3" />
                  <span>Cơ sở dữ liệu nhân sự</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-800">Quản lý Người dùng 👥</h1>
             </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">Điều chỉnh vai trò, trạng thái và thông tin phòng ban của toàn bộ giảng viên và nhân viên trong hệ thống.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Tìm theo tên, email, username..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-14 h-14 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-primary/30 transition-all shadow-xl shadow-slate-200/20 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden relative min-h-[500px]">
        {loading ? (
          <div className="p-20 space-y-8 text-center">
             <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
             <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Đang tải danh sách nhân sự...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Hồ sơ nhân sự</span>
                  </th>
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Phòng ban</span>
                  </th>
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Vai trò</span>
                  </th>
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</span>
                  </th>
                  <th className="p-8 text-right">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="p-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-[1.2rem] bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xl border border-slate-50 shadow-sm">
                          {u.full_name?.charAt(0) || u.username?.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-slate-800 text-lg tracking-tight leading-none">{u.full_name}</p>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{u.email}</span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-300 italic">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-8">
                       <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl w-fit">
                          <Building className="w-4 h-4 text-slate-300" />
                          <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{u.department || 'Chưa cập nhật'}</span>
                       </div>
                    </td>
                    <td className="p-8">
                       <Badge className={cn(
                         "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm",
                         u.role === 'ADMIN' ? "bg-slate-900 text-primary border-slate-800" :
                         u.role === 'APPROVER' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                         u.role === 'REVIEWER' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                         "bg-white text-slate-400 border-slate-100"
                       )}>
                         {u.role}
                       </Badge>
                    </td>
                    <td className="p-8">
                       <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", u.status === 'ACTIVE' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                          <span className={cn("text-[10px] font-black uppercase tracking-widest", u.status === 'ACTIVE' ? "text-emerald-500" : "text-rose-500")}>
                            {u.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
                          </span>
                       </div>
                    </td>
                    <td className="p-8 text-right">
                       <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => openModal(u)}
                            className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10 transition-all active:scale-90"
                          >
                            <Shield className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(u)}
                            className={cn(
                              "p-3 border rounded-xl transition-all active:scale-90",
                              u.status === 'ACTIVE' ? "bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white" : "bg-emerald-50 border-emerald-100 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                            )}
                          >
                            {u.status === 'ACTIVE' ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
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
              <Users className="w-12 h-12 text-slate-200" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Không tìm thấy nhân sự</h3>
              <p className="text-slate-400 font-bold max-w-md mx-auto italic">Thử thay đổi từ khóa tìm kiếm hoặc kiểm tra lại bộ lọc.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Cập nhật */}
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
              className="relative w-full max-w-lg bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-10 lg:p-12 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100">
                        <Shield className="w-6 h-6" />
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Cấp quyền nhân sự</p>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Chỉnh sửa Vai trò</h3>
                     </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-5">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary font-black shadow-sm">
                      {editingUser?.full_name?.charAt(0)}
                   </div>
                   <div>
                      <p className="font-black text-slate-800 text-base">{editingUser?.full_name}</p>
                      <p className="text-xs font-bold text-slate-400 italic">{editingUser?.email}</p>
                   </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vai trò hệ thống</label>
                    <div className="grid grid-cols-2 gap-3">
                       {['CREATOR', 'REVIEWER', 'APPROVER', 'ADMIN'].map((role) => (
                         <button
                           key={role}
                           type="button"
                           onClick={() => setFormData({ ...formData, user_role: role })}
                           className={cn(
                             "py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                             formData.user_role === role 
                               ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" 
                               : "bg-white border-slate-100 text-slate-400 hover:border-primary/20"
                           )}
                         >
                           {role}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phòng ban / Khoa</label>
                    <div className="relative group">
                       <Building className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                       <Input 
                         value={formData.department}
                         onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                         className="pl-14 h-14 bg-slate-50/50 border-2 border-slate-100 rounded-2xl font-bold focus:bg-white transition-all outline-none"
                         placeholder="Ví dụ: Khoa CNTT, Phòng Đào tạo..."
                       />
                    </div>
                    {formErrors.department && <p className="text-xs text-rose-500 font-bold ml-1">{formErrors.department}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái tài khoản</label>
                    <div className="flex gap-4">
                       {['ACTIVE', 'INACTIVE'].map((status) => (
                         <button
                           key={status}
                           type="button"
                           onClick={() => setFormData({ ...formData, status })}
                           className={cn(
                             "flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                             formData.status === status 
                               ? (status === 'ACTIVE' ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20" : "bg-rose-500 border-rose-500 text-white shadow-xl shadow-rose-500/20")
                               : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                           )}
                         >
                           {status === 'ACTIVE' ? 'Kích hoạt' : 'Khóa'}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
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
                      <span>Lưu thay đổi</span>
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
