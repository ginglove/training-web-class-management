"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  PlusCircle, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Shield, 
  Trash2, 
  Lock, 
  UserCheck,
  Building,
  Sparkles,
  X,
  Save,
  Clock,
  Eye,
  Phone,
  FileText,
  History,
  Unlock,
  Info
} from 'lucide-react';
import { fetchApi, getErrorMessage } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'ADMIN' | 'APPROVER' | 'REVIEWER' | 'CREATOR';
  department: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  created_at: string;
  last_login_at?: string;
  phone?: string;
  internal_notes?: string;
}

interface UserDetail {
  profile: User;
  bookings: { id: string, class_name: string, date: string, slot_name: string, status: string }[];
  login_history: Record<string, unknown>[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 20;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [isNewUserModal, setIsNewUserModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    user_role: 'CREATOR' as User['role'],
    department: '',
    status: 'ACTIVE' as User['status'],
    phone: '',
    internal_notes: '',
    send_email: true
  });

  useEffect(() => {
    loadUsers();
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/admin/users');
      setUsers(data);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách người dùng'));
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user: User | null) => {
    if (user) {
      setEditingUser(user);
      setIsNewUserModal(false);
      setFormData({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        password: '',
        user_role: user.role,
        department: user.department || '',
        status: user.status,
        phone: user.phone || '',
        internal_notes: user.internal_notes || '',
        send_email: false
      });
    } else {
      setEditingUser(null);
      setIsNewUserModal(true);
      setFormData({
        username: '',
        email: '',
        full_name: '',
        password: '',
        user_role: 'CREATOR',
        department: '',
        status: 'ACTIVE',
        phone: '',
        internal_notes: '',
        send_email: true
      });
    }
    setIsModalOpen(true);
  };

  const openDetail = async (user: User) => {
    try {
      const data = await fetchApi(`/api/admin/users/${user.id}`);
      setUserDetail(data);
      setIsDetailOpen(true);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Không thể lấy thông tin chi tiết'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isNewUserModal) {
        await fetchApi('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        toast.success('Tạo người dùng mới thành công. Mật khẩu tạm đã được tạo.');
      } else {
        await fetchApi(`/api/admin/users/${editingUser?.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData)
        });
        toast.success('Cập nhật người dùng thành công');
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, isNewUserModal ? 'Tạo mới thất bại' : 'Cập nhật thất bại'));
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
      toast.success(`Người dùng đã được ${newStatus === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu'}`);
      loadUsers();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Thao tác thất bại'));
    }
  };

  const handleUnlock = async (user: User) => {
    try {
      await fetchApi(`/api/admin/users/${user.id}/unlock`, { method: 'POST' });
      toast.success('Tài khoản đã được mở khóa ✅');
      loadUsers();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Mở khóa thất bại'));
    }
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('Bạn không thể tự xóa tài khoản của chính mình! 🚫');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng ${user.username}? Thao tác này sẽ chuyển sang trạng thái INACTIVE và ẩn khỏi hệ thống.`)) return;

    try {
      await fetchApi(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      });
      toast.success('Người dùng đã được xóa khỏi hệ thống');
      loadUsers();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Xóa thất bại'));
    }
  };

  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean)));

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = roleFilter.length === 0 || roleFilter.includes(u.role);
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    const matchesDept = deptFilter === 'ALL' || u.department === deptFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesDept;
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

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
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-14 h-14 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white focus:border-primary/30 transition-all shadow-xl shadow-slate-200/20 outline-none"
            />
          </div>
          <button 
            onClick={() => openModal(null)}
            className="w-full sm:w-auto h-14 px-8 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            Tạo tài khoản mới
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-wrap items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bộ lọc nâng cao:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           <div className="flex items-center gap-2">
             {['ADMIN', 'CREATOR', 'REVIEWER', 'APPROVER'].map(r => (
               <button
                 key={r}
                 onClick={() => {
                   setRoleFilter(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
                   setCurrentPage(1);
                 }}
                 className={cn(
                   "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                   roleFilter.includes(r) 
                     ? "bg-slate-900 text-white border-slate-900" 
                     : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200"
                 )}
               >
                 {r}
               </button>
             ))}
           </div>

           <div className="h-6 w-px bg-slate-100 mx-2" />

           <select 
             value={statusFilter}
             onChange={(e) => {
               setStatusFilter(e.target.value);
               setCurrentPage(1);
             }}
             className="h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none"
           >
             <option value="ALL">Tất cả trạng thái</option>
             <option value="ACTIVE">Hoạt động ✅</option>
             <option value="INACTIVE">Vô hiệu ⬛</option>
             <option value="LOCKED">Đã khóa 🔴</option>
           </select>

           <select 
             value={deptFilter}
             onChange={(e) => {
               setDeptFilter(e.target.value);
               setCurrentPage(1);
             }}
             className="h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none"
           >
             <option value="ALL">Tất cả phòng ban</option>
             {departments.map(d => (
               <option key={d} value={d}>{d}</option>
             ))}
           </select>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
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
                  <th className="p-8 text-left">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Ngày tạo</span>
                  </th>
                  <th className="p-8 text-right">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentUsers.map((u) => (
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
                         u.role === 'ADMIN' ? "bg-purple-100 text-purple-700 border-purple-200" :
                         u.role === 'CREATOR' ? "bg-blue-100 text-blue-700 border-blue-200" :
                         u.role === 'REVIEWER' ? "bg-orange-100 text-orange-700 border-orange-200" :
                         "bg-green-100 text-green-700 border-green-200"
                       )}>
                         {u.role}
                       </Badge>
                    </td>
                    <td className="p-8">
                       <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg",
                            u.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-600" : 
                            u.status === 'LOCKED' ? "bg-red-100 text-red-600" :
                            "bg-slate-200 text-slate-600"
                          )}>
                            {u.status}
                          </span>
                       </div>
                    </td>
                    <td className="p-8">
                       <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                          <Clock className="w-3 h-3" />
                          {new Date(u.created_at).toLocaleDateString('vi-VN')}
                       </div>
                    </td>
                    <td className="p-8 text-right">
                       <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => openDetail(u)}
                            className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10 transition-all active:scale-90"
                            title="Chi tiết"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => openModal(u)}
                            className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/10 transition-all active:scale-90"
                            title="Sửa / Đổi Role"
                          >
                            <Shield className="w-5 h-5" />
                          </button>
                          
                          {u.status === 'LOCKED' && (
                            <button 
                              onClick={() => handleUnlock(u)}
                              className="p-3 bg-amber-50 border border-amber-100 text-amber-500 hover:bg-amber-500 hover:text-white transition-all active:scale-90"
                              title="Mở khóa tài khoản"
                            >
                              <Unlock className="w-5 h-5" />
                            </button>
                          )}

                          <button 
                            onClick={() => handleToggleStatus(u)}
                            className={cn(
                              "p-3 border rounded-xl transition-all active:scale-90",
                              u.status === 'ACTIVE' ? "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-900 hover:text-white" : "bg-emerald-50 border-emerald-100 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                            )}
                            title={u.status === 'ACTIVE' ? "Vô hiệu hóa" : "Kích hoạt"}
                          >
                            {u.status === 'ACTIVE' ? <Lock className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                          </button>
                          <button 
                            onClick={() => handleDelete(u)}
                            className="p-3 bg-rose-50 border border-rose-100 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-90"
                            title="Xóa"
                          >
                            <Trash2 className="w-5 h-5" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12">
           <button 
             onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
             disabled={currentPage === 1}
             className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 disabled:opacity-30 transition-all hover:border-primary/20"
           >
             <ChevronLeft className="w-6 h-6" />
           </button>
           <div className="px-8 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-800 tracking-tighter">
              Trang {currentPage} / {totalPages}
           </div>
           <button 
             onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
             disabled={currentPage === totalPages}
             className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 disabled:opacity-30 transition-all hover:border-primary/20"
           >
             <ChevronRight className="w-6 h-6" />
           </button>
        </div>
      )}

      {/* Modal Tạo/Sửa User */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <div className="flex min-h-full items-center justify-center p-4 py-12">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100"
              >
              <div className="p-10 lg:p-12 space-y-8">
                <div className="flex items-center justify-between pb-8 border-b border-slate-100/60 mb-2">
                  <div className="flex items-center gap-5">
                     <div className={cn(
                       "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl border",
                       isNewUserModal 
                         ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20 border-emerald-400/50 text-white" 
                         : "bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-500/20 border-indigo-500/50 text-white"
                     )}>
                        {isNewUserModal ? <UserCheck className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
                     </div>
                     <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                           <Sparkles className={cn("w-3.5 h-3.5", isNewUserModal ? "text-emerald-500" : "text-indigo-500")} />
                           <p className={cn(
                             "text-[10px] font-black uppercase tracking-[0.25em]",
                             isNewUserModal ? "text-emerald-500" : "text-indigo-500"
                           )}>
                             {isNewUserModal ? 'Onboarding Hệ thống' : 'Quản trị Phân quyền'}
                           </p>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                          {isNewUserModal ? 'Thiết lập Tài khoản Mới' : 'Hồ sơ Nhân sự'}
                        </h3>
                     </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-[1.2rem] transition-all active:scale-90"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên (*)</label>
                        <Input 
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="h-12 bg-white border-slate-100 rounded-xl font-bold text-slate-700"
                          placeholder="Nguyễn Văn A"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên đăng nhập (*)</label>
                        <Input 
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="h-12 bg-white border-slate-100 rounded-xl font-bold text-slate-700"
                          placeholder="username123"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (*)</label>
                        <Input 
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="h-12 bg-white border-slate-100 rounded-xl font-bold text-slate-700"
                          placeholder="email@example.com"
                          required
                          type="email"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                        <Input 
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="h-12 bg-white border-slate-100 rounded-xl font-bold text-slate-700"
                          placeholder="09xx xxx xxx"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phòng ban</label>
                      <Input 
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="h-12 bg-white border-slate-100 rounded-xl font-bold text-slate-700"
                        placeholder="Khoa CNTT / Phòng Đào tạo"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ghi chú nội bộ</label>
                      <textarea 
                        value={formData.internal_notes}
                        onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                        className="w-full p-4 bg-white border border-slate-100 rounded-xl font-bold text-slate-700 text-sm min-h-[100px] outline-none focus:border-primary/30 transition-all"
                        placeholder="Thông tin thêm về nhân sự..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vai trò hệ thống</label>
                      <div className="grid grid-cols-2 gap-2">
                         {['CREATOR', 'REVIEWER', 'APPROVER', 'ADMIN'].map((role) => (
                           <button
                             key={role}
                             type="button"
                             onClick={() => setFormData({ ...formData, user_role: role as User['role'] })}
                             className={cn(
                               "py-3 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest transition-all",
                               formData.user_role === role 
                                 ? "bg-primary border-primary text-white" 
                                 : "bg-white border-slate-100 text-slate-400 hover:border-primary/20"
                             )}
                           >
                             {role}
                           </button>
                         ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trạng thái</label>
                      <div className="flex gap-2">
                         {[
                           { id: 'ACTIVE', label: 'ACTIVE✅', color: 'bg-emerald-500' },
                           { id: 'INACTIVE', label: 'INACTIVE⬛', color: 'bg-slate-600' },
                         ].map((status) => (
                           <button
                             key={status.id}
                             type="button"
                             onClick={() => setFormData({ ...formData, status: status.id as User['status'] })}
                             className={cn(
                               "flex-1 py-3 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest transition-all",
                               formData.status === status.id 
                                 ? `${status.color} border-transparent text-white`
                                 : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                             )}
                           >
                             {status.label}
                           </button>
                         ))}
                      </div>
                    </div>
                  </div>

                  {isNewUserModal && (
                    <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                      <input 
                        type="checkbox" 
                        checked={formData.send_email}
                        onChange={(e) => setFormData({ ...formData, send_email: e.target.checked })}
                        className="w-5 h-5 rounded border-indigo-300 text-indigo-600"
                      />
                      <label className="text-xs font-black text-indigo-700 uppercase tracking-tight">Gửi email thông báo & mật khẩu tạm cho người dùng</label>
                    </div>
                  )}

                  <div className="pt-4 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit"
                      className="flex-[2] py-5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      {isNewUserModal ? <PlusCircle className="w-5 h-5" /> : <Save className="w-5 h-5 fill-white" />}
                      <span>{isNewUserModal ? 'Tạo tài khoản' : 'Lưu thay đổi'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Chi tiết User */}
      <AnimatePresence>
        {isDetailOpen && userDetail && (
          <div className="fixed inset-0 z-[100] overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <div className="flex min-h-full items-center justify-center p-4 py-12">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, x: 50 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.9, opacity: 0, x: 50 }}
                className="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row h-[80vh]"
              >
              {/* Profile Sidebar */}
              <div className="w-full md:w-80 bg-slate-50 p-10 border-r border-slate-100 space-y-8 flex-shrink-0 overflow-y-auto">
                 <div className="text-center space-y-4">
                    <div className="w-24 h-24 rounded-[2rem] bg-white border-4 border-white shadow-xl mx-auto flex items-center justify-center text-3xl font-black text-primary">
                       {userDetail.profile.full_name.charAt(0)}
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">{userDetail.profile.full_name}</h3>
                       <p className="text-xs font-bold text-slate-400 mt-2">@{userDetail.profile.username}</p>
                    </div>
                    <Badge className={cn(
                         "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                         userDetail.profile.role === 'ADMIN' ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"
                    )}>
                       {userDetail.profile.role}
                    </Badge>
                 </div>

                 <div className="space-y-6 pt-6 border-t border-slate-200">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Liên hệ</p>
                       <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                          <Mail className="w-4 h-4 text-slate-300" />
                          <span className="truncate">{userDetail.profile.email}</span>
                       </div>
                       <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                          <Phone className="w-4 h-4 text-slate-300" />
                          <span>{userDetail.profile.phone || 'N/A'}</span>
                       </div>
                    </div>

                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phòng ban</p>
                       <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                          <Building className="w-4 h-4 text-slate-300" />
                          <span>{userDetail.profile.department || 'Chưa cập nhật'}</span>
                       </div>
                    </div>

                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trạng thái tài khoản</p>
                       <div className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight w-fit",
                          userDetail.profile.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                       )}>
                          {userDetail.profile.status}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 p-12 overflow-y-auto space-y-10 bg-white">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <History className="w-6 h-6 text-indigo-500" />
                       <h4 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Hoạt động gần đây</h4>
                    </div>
                    <button onClick={() => setIsDetailOpen(false)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl">
                       <X className="w-6 h-6" />
                    </button>
                 </div>

                 {/* History Tabs */}
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Info className="w-4 h-4" />
                          Ghi chú nội bộ
                       </div>
                       <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 leading-relaxed italic">
                          {userDetail.profile.internal_notes || "Không có ghi chú nào."}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <FileText className="w-4 h-4" />
                          Lịch sử Booking (10 gần nhất)
                       </div>
                       
                       {userDetail.bookings.length > 0 ? (
                         <div className="space-y-3">
                            {userDetail.bookings.map((b) => (
                               <div key={b.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-primary/20 transition-all shadow-sm">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                                        <Building className="w-5 h-5" />
                                     </div>
                                     <div>
                                        <p className="font-black text-slate-800 text-sm">{b.class_name}</p>
                                        <p className="text-[10px] font-bold text-slate-400">{new Date(b.date).toLocaleDateString('vi-VN')} • {b.slot_name}</p>
                                     </div>
                                  </div>
                                  <Badge className={cn(
                                     "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                                     b.status === 'APPROVED' ? "bg-emerald-100 text-emerald-600" :
                                     b.status === 'PENDING' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
                                  )}>
                                     {b.status}
                                  </Badge>
                               </div>
                            ))}
                         </div>
                       ) : (
                         <div className="p-12 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">Người dùng này chưa có lịch sử đặt phòng.</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
