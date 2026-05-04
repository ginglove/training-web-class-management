'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { fetchApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { 
  User, Mail, Building, Shield, Save, 
  MonitorSmartphone, History, BarChart3, 
  Upload, LogOut, ChevronRight, CheckCircle2,
  Lock, Settings, Smartphone, LayoutDashboard,
  Zap, ArrowUpRight, FileText, Trash2, LogOut as LogOutIcon,
  ShieldCheck, RefreshCcw, Save as SaveIcon,
  Globe, Key, AlertTriangle, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { getErrorMessage } from '@/lib/errorTranslations';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('info');
  
  const [formData, setFormData] = React.useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    username: user?.username || ''
  });
  const [stats, setStats] = React.useState<any>(null);
  const [history, setHistory] = React.useState<any[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const isChanged = React.useMemo(() => {
    return (
      formData.full_name !== (user?.full_name || '') ||
      formData.phone !== (user?.phone || '') ||
      formData.department !== (user?.department || '')
    );
  }, [formData, user]);

  const loadStats = React.useCallback(async () => {
    try {
      const res = await fetchApi('/api/bookings/stats');
      setStats(res);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }, []);

  const loadHistory = React.useCallback(async () => {
    try {
      const res = await fetchApi('/api/bookings?limit=5');
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  }, []);

  React.useEffect(() => {
    loadStats();
    loadHistory();
  }, [loadStats, loadHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Filter only editable fields per SRS
      const body = {
        full_name: formData.full_name,
        phone: formData.phone,
        department: formData.department
      };
      
      const updatedUser = await fetchApi('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      updateUser(updatedUser);
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Cập nhật thất bại'));
      if (err.errors) setErrors(err.errors);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'info', label: 'Thông tin cá nhân', icon: User },
    { id: 'security', label: 'Bảo mật & Phiên', icon: Shield },
    { id: 'history', label: 'Lịch sử hoạt động', icon: History },
    ...(user?.role === 'CREATOR' ? [{ id: 'stats', label: 'Thống kê booking', icon: BarChart3 }] : []),
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-32">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-[2rem] bg-slate-900 flex items-center justify-center text-primary shadow-[6px_6px_0px_0px_rgba(30,58,138,0.2)] rotate-3">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-black text-primary uppercase tracking-[0.3em]">
              <Settings className="w-4 h-4" />
              <span>Cài đặt hệ thống</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">Hồ sơ cá nhân 👤</h1>
          </div>
        </div>
        <p className="text-slate-500 font-bold text-lg max-w-2xl leading-relaxed italic">
          Quản lý thông tin tài khoản, bảo mật và các thiết bị đang truy cập vào hệ thống đào tạo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar Navigation */}
        {/* Sidebar Navigation */}
        {/* Sidebar Navigation */}
        <div className="lg:col-span-4 space-y-10">
          <Card className="bg-white rounded-[3.5rem] border-2 border-slate-900 p-10 text-center relative overflow-hidden group shadow-[12px_12px_0px_0px_rgba(15,23,42,0.05)]">
            {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-full h-32 bg-slate-900 overflow-hidden">
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
               <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            </div>
            
            <div className="relative pt-12">
              <input type="file" id="avatar-upload" className="hidden" accept="image/png, image/jpeg" />
              <label 
                htmlFor="avatar-upload"
                className="block w-40 h-40 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] border-4 border-slate-900 overflow-hidden group/avatar cursor-pointer relative transition-transform group-hover:-translate-y-2 group-hover:-translate-x-2 duration-500"
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl font-black text-slate-900 uppercase">
                    {user?.full_name?.charAt(0) || 'U'}
                  </span>
                )}
                <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all gap-2">
                  <Upload className="w-8 h-8 text-white animate-bounce" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Đổi ảnh (Max 2MB)</span>
                </div>
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{user?.full_name}</h2>
                  <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20" title="Tài khoản đã xác thực">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-400 italic flex items-center justify-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  {user?.email}
                </p>
              </div>
              
              <div className="mt-12 pt-10 border-t-4 border-slate-50 space-y-5">
                <div className="flex justify-between items-center bg-slate-50/50 px-8 py-5 rounded-3xl border-2 border-slate-100/50 transition-all hover:bg-white hover:border-slate-900 group/item">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm group-hover/item:text-slate-900 group-hover/item:border-slate-900 transition-all">
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Vai trò</span>
                  </div>
                  <Badge className={cn(
                    "border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black uppercase px-5 py-2 rounded-xl",
                    user?.role === 'ADMIN' ? 'bg-purple-600 text-white border-slate-900' :
                    user?.role === 'CREATOR' ? 'bg-blue-600 text-white border-slate-900' :
                    user?.role === 'REVIEWER' ? 'bg-orange-500 text-white border-slate-900' :
                    user?.role === 'APPROVER' ? 'bg-green-600 text-white border-slate-900' :
                    'bg-slate-900 text-white border-slate-900'
                  )}>
                    {user?.role} {user?.role === 'ADMIN' ? '🟣' : user?.role === 'CREATOR' ? '🔵' : user?.role === 'REVIEWER' ? '🟠' : user?.role === 'APPROVER' ? '🟢' : ''}
                  </Badge>
                </div>

                <div className="flex justify-between items-center bg-slate-50/50 px-8 py-5 rounded-3xl border-2 border-slate-100/50 transition-all hover:bg-white hover:border-slate-900 group/item">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm group-hover/item:text-slate-900 group-hover/item:border-slate-900 transition-all">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Trạng thái</span>
                  </div>
                  <span className={cn(
                    "text-[11px] font-black uppercase tracking-tight flex items-center gap-2",
                    (user?.status || 'ACTIVE') === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-400'
                  )}>
                    {user?.status || 'ACTIVE'} {(user?.status || 'ACTIVE') === 'ACTIVE' ? '✅' : '⬛'}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-50/50 px-8 py-5 rounded-3xl border-2 border-slate-100/50 transition-all hover:bg-white hover:border-slate-900 group/item">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm group-hover/item:text-slate-900 group-hover/item:border-slate-900 transition-all">
                      <History className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Tham gia</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight italic">
                    Thành viên từ {user?.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy') : '01/01/2024'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center justify-between p-6 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all group border-2",
                    activeTab === tab.id 
                      ? "bg-slate-900 border-slate-900 text-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] scale-[1.02]" 
                      : "bg-white border-transparent text-slate-500 hover:border-slate-900 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <Icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-primary" : "text-slate-400")} />
                    <span>{tab.label}</span>
                  </div>
                  {activeTab === tab.id && <ChevronRight className="w-5 h-5 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8">
          <Card className="bg-white rounded-[3.5rem] border-2 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,0.05)] min-h-[700px] overflow-hidden">
            {activeTab === 'info' && (
              <div className="p-10 lg:p-16 space-y-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                      <User className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Thông tin cá nhân</h3>
                  </div>
                  {isChanged && (
                    <button 
                      type="button"
                      onClick={() => setFormData({
                        full_name: user?.full_name || '',
                        phone: user?.phone || '',
                        department: user?.department || '',
                        username: user?.username || ''
                      })}
                      className="px-8 py-4 bg-white border-2 border-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:scale-95"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      Hủy (Reset)
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Họ và tên */}
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Họ và tên</label>
                      <div className="relative group">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <Input 
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="pl-16 h-16 bg-slate-50 border-2 border-transparent rounded-[2rem] font-black text-slate-700 focus:bg-white focus:border-slate-900 transition-all outline-none text-lg"
                          placeholder="Nhập họ và tên"
                          required
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase ml-1 italic leading-relaxed">2–100 ký tự, không có số.</p>
                      {errors.full_name && <p className="text-xs text-rose-500 mt-1 font-black uppercase tracking-widest">{errors.full_name}</p>}
                    </div>

                    {/* Email (Readonly) */}
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Email (Readonly)</label>
                      <div className="relative">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-200" />
                        <Input 
                          value={user?.email}
                          disabled
                          className="pl-16 h-16 bg-slate-50 text-slate-300 border-2 border-slate-100 border-dashed rounded-[2rem] font-black text-lg cursor-not-allowed"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase ml-1 italic leading-relaxed">Chỉ Admin mới có quyền đổi email.</p>
                    </div>

                    {/* Tên đăng nhập (Readonly) */}
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Tên đăng nhập (Readonly)</label>
                      <div className="relative">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-200 opacity-50" />
                        <Input 
                          value={user?.username || user?.email?.split('@')[0]}
                          disabled
                          className="pl-16 h-16 bg-slate-50 text-slate-300 border-2 border-slate-100 border-dashed rounded-[2rem] font-black text-lg cursor-not-allowed"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase ml-1 italic leading-relaxed">Cố định sau khi tạo tài khoản.</p>
                    </div>

                    {/* Số điện thoại */}
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Số điện thoại</label>
                      <div className="relative group">
                        <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <Input 
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="pl-16 h-16 bg-slate-50 border-2 border-transparent rounded-[2rem] font-black text-slate-700 focus:bg-white focus:border-slate-900 transition-all outline-none text-lg"
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase ml-1 italic leading-relaxed">10 chữ số, bắt đầu 0 (optional).</p>
                    </div>

                    {/* Phòng ban */}
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Phòng ban</label>
                      <div className="relative group">
                        <Building className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <Input 
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="pl-16 h-16 bg-slate-50 border-2 border-transparent rounded-[2rem] font-black text-slate-700 focus:bg-white focus:border-slate-900 transition-all outline-none text-lg"
                          placeholder="Nhập phòng ban"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase ml-1 italic leading-relaxed">Tối đa 100 ký tự (optional).</p>
                    </div>

                    {/* Vai trò (Readonly) */}
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Vai trò (Readonly)</label>
                      <div className="relative">
                        <Shield className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-200" />
                        <Input 
                          value={user?.role}
                          disabled
                          className="pl-16 h-16 bg-slate-50 text-slate-300 border-2 border-slate-100 border-dashed rounded-[2rem] font-black text-lg cursor-not-allowed"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase ml-1 italic leading-relaxed">Chỉ Admin mới đổi được role.</p>
                    </div>
                  </div>

                  <div className="pt-12 border-t-2 border-slate-50 flex justify-end">
                    <button 
                      type="submit"
                      disabled={loading || !isChanged}
                      className={cn(
                        "h-16 px-12 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 active:scale-95 group",
                        isChanged 
                          ? "bg-slate-900 border-2 border-slate-900 text-white shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                          : "bg-slate-100 border-2 border-slate-200 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      {loading ? (
                        <RefreshCcw className="w-5 h-5 animate-spin" />
                      ) : (
                        <SaveIcon className="w-5 h-5" />
                      )}
                      Lưu thay đổi
                    </button>
                  </div>
                </form>

                <div className="pt-20 border-t-2 border-slate-50 space-y-8">
                  <div className="flex items-center gap-4 text-rose-500">
                    <Trash2 className="w-7 h-7" />
                    <h4 className="text-3xl font-black uppercase tracking-tighter">Vùng nguy hiểm</h4>
                  </div>
                  
                  <div className="p-10 rounded-[3rem] bg-rose-50/50 border-2 border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-8 group hover:bg-rose-50 transition-all duration-500">
                    <div className="space-y-3 text-center sm:text-left">
                      <p className="text-xl font-black text-slate-900 tracking-tight">Đăng xuất khỏi hệ thống</p>
                      <p className="text-sm font-bold text-rose-400 italic leading-relaxed">Xóa tất cả các phiên làm việc và quay lại màn hình đăng nhập.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const { logout } = useAuthStore.getState();
                        logout();
                        window.location.href = '/login';
                      }}
                      className="h-16 px-10 bg-white border-2 border-rose-200 text-rose-500 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-[6px_6px_0px_0px_rgba(244,63,94,0.1)] active:scale-95"
                    >
                      Đăng xuất ngay
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="p-10 lg:p-16 space-y-16">
                {/* Mục Mật khẩu */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-500 flex items-center justify-center text-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                      <Key className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Mật khẩu</h3>
                  </div>
                  
                  <div className="p-10 bg-slate-900 rounded-[3rem] border-2 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,0.1)] group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                      <Lock className="w-40 h-40 text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="space-y-3">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Mật khẩu hiện tại</p>
                        <p className="text-3xl text-white font-black tracking-[0.5em]">••••••••</p>
                        <p className="text-sm font-bold text-slate-500 italic mt-4">Lần cuối thay đổi: 3 tháng trước</p>
                      </div>
                      <button 
                        onClick={() => window.location.href='/profile/change-password'}
                        className="h-16 px-10 bg-white border-2 border-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] text-slate-900 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-4 active:scale-95"
                      >
                        <RefreshCcw className="w-5 h-5" />
                        Đổi mật khẩu ngay
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mục Phiên đăng nhập */}
                <div className="space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-[1.5rem] bg-emerald-500 flex items-center justify-center text-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Phiên đăng nhập</h3>
                        <p className="text-sm font-bold text-slate-400 italic">Quản lý các thiết bị đang truy cập tài khoản của bạn.</p>
                      </div>
                    </div>
                    
                    <button className="h-14 px-8 bg-white border-2 border-rose-500 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(244,63,94,1)] active:scale-95">
                      Đăng xuất tất cả thiết bị khác
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Current Session */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between p-10 bg-emerald-50 border-2 border-slate-900 rounded-[2.5rem] group shadow-[8px_8px_0px_0px_rgba(16,185,129,0.1)] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none gap-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-emerald-500 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform duration-500">
                          <MonitorSmartphone className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-black text-slate-900 text-xl tracking-tight uppercase">MacBook Pro - Chrome Desktop</div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-slate-400" />
                              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">IP: 14.226.12.94 • Hà Nội, VN</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Đang trực tuyến</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-slate-900 text-white border-none px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-200/40 w-fit">
                        Thiết bị hiện tại
                      </Badge>
                    </div>

                    {/* Other Sessions */}
                    {[
                      { device: 'iPhone 13 - Safari Mobile', ip: '27.72.105.18', loc: 'Hồ Chí Minh, VN', time: '2 giờ trước', icon: Smartphone },
                      { device: 'Windows PC - Edge', ip: '113.161.45.102', loc: 'Đà Nẵng, VN', time: '1 ngày trước', icon: MonitorSmartphone }
                    ].map((session, i) => (
                      <div key={i} className="flex flex-col lg:flex-row lg:items-center justify-between p-10 bg-white border-2 border-slate-100 rounded-[2.5rem] group hover:border-slate-900 transition-all duration-500 gap-8">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-slate-50 border-2 border-slate-100 group-hover:border-slate-900 group-hover:bg-white text-slate-300 group-hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all duration-500">
                            <session.icon className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <div className="font-black text-slate-800 text-xl tracking-tight uppercase">{session.device}</div>
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                IP: {session.ip} • {session.loc} • {session.time}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button className="h-14 px-8 bg-white border-2 border-slate-200 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-lg active:scale-95 flex items-center gap-3">
                          <LogOut className="w-5 h-5" />
                          Đăng xuất khỏi thiết bị này
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="p-10 lg:p-16 space-y-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-500 flex items-center justify-center text-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                      <History className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Nhật ký đăng nhập</h3>
                      <p className="text-sm font-bold text-slate-400 italic">Theo dõi lịch sử truy cập tài khoản để đảm bảo an toàn.</p>
                    </div>
                  </div>
                  <button 
                    className="h-14 px-8 bg-white border-2 border-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2 active:scale-95"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Làm mới
                  </button>
                </div>

                {/* Alert nếu có đăng nhập thất bại */}
                <div className="p-8 bg-rose-50 border-2 border-rose-500 rounded-[2rem] flex items-center gap-6 animate-pulse shadow-[8px_8px_0px_0px_rgba(244,63,94,0.1)]">
                  <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center shrink-0 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-rose-600 uppercase tracking-[0.2em]">Cảnh báo bảo mật</p>
                    <p className="text-sm font-black text-slate-900 leading-none">
                      ⚠ Phát hiện <span className="text-rose-600">3 lần</span> đăng nhập thất bại từ IP <span className="underline decoration-rose-500 decoration-2">172.16.254.1</span> gần đây.
                    </p>
                  </div>
                </div>

                {/* Danh sách login */}
                <div className="bg-white border-2 border-slate-900 rounded-[2.5rem] overflow-hidden shadow-[12px_12px_0px_0px_rgba(15,23,42,0.05)]">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] border-r border-slate-800">Thiết bị</th>
                          <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] border-r border-slate-800">Địa chỉ IP</th>
                          <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] border-r border-slate-800">Thời gian</th>
                          <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em]">Kết quả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { device: 'MacBook Pro - Chrome', ip: '14.226.12.94', time: 'Hôm nay, 10:45', status: 'SUCCESS', loc: 'Hà Nội, VN' },
                          { device: 'iPhone 13 - Safari', ip: '27.72.105.18', time: 'Hôm qua, 22:15', status: 'SUCCESS', loc: 'Hồ Chí Minh, VN' },
                          { device: 'Unknown Device - Edge', ip: '172.16.254.1', time: '02/05/2026, 09:30', status: 'FAILED', loc: 'Unknown' },
                          { device: 'Unknown Device - Edge', ip: '172.16.254.1', time: '02/05/2026, 09:29', status: 'FAILED', loc: 'Unknown' },
                          { device: 'Unknown Device - Edge', ip: '172.16.254.1', time: '02/05/2026, 09:28', status: 'FAILED', loc: 'Unknown' },
                          { device: 'Windows PC - Firefox', ip: '113.161.45.102', time: '01/05/2026, 14:20', status: 'SUCCESS', loc: 'Đà Nẵng, VN' },
                        ].map((log, i) => (
                          <tr key={i} className="group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                            <td className="px-10 py-8 border-r border-slate-100">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-transform group-hover:rotate-6",
                                  log.device.includes('iPhone') ? "bg-amber-50 text-amber-500 border-amber-900/10" : "bg-indigo-50 text-indigo-500 border-indigo-900/10"
                                )}>
                                  {log.device.includes('iPhone') ? <Smartphone className="w-5 h-5" /> : <MonitorSmartphone className="w-5 h-5" />}
                                </div>
                                <span className="font-black text-slate-900 text-sm tracking-tight uppercase">{log.device}</span>
                              </div>
                            </td>
                            <td className="px-10 py-8 border-r border-slate-100">
                              <div className="space-y-1">
                                <p className="font-black text-slate-700 text-sm">{log.ip}</p>
                                <p className="text-[10px] font-bold text-slate-400 italic uppercase tracking-widest">{log.loc}</p>
                              </div>
                            </td>
                            <td className="px-10 py-8 border-r border-slate-100">
                              <span className="font-black text-slate-500 text-[11px] uppercase tracking-widest">{log.time}</span>
                            </td>
                            <td className="px-10 py-8">
                              <Badge className={cn(
                                "border-2 font-black uppercase text-[9px] tracking-widest px-4 py-1.5 rounded-xl",
                                log.status === 'SUCCESS' 
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                  : "bg-rose-50 text-rose-600 border-rose-200 animate-pulse"
                              )}>
                                {log.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Hiển thị 6 trên tối đa 20 bản ghi gần nhất</p>
                    <div className="flex gap-2">
                       <button className="w-10 h-10 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all active:scale-90">1</button>
                       <button className="w-10 h-10 bg-slate-900 border-2 border-slate-900 rounded-xl flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">2</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && user?.role === 'CREATOR' && (
              <div className="p-10 lg:p-16 space-y-12">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[1.5rem] bg-amber-500 flex items-center justify-center text-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Thống kê booking của tôi</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Tổng số booking', value: stats?.total || 42, icon: LayoutDashboard, color: 'indigo', text: 'text-indigo-600' },
                    { label: 'Đã được duyệt', value: stats?.approved || 35, icon: CheckCircle2, color: 'emerald', text: 'text-emerald-600' },
                    { label: 'Bị từ chối', value: stats?.rejected || 4, icon: Trash2, color: 'rose', text: 'text-rose-600' },
                    { label: 'Tỉ lệ duyệt', value: '83%', icon: Zap, color: 'amber', text: 'text-amber-600' }
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div key={i} className="p-6 bg-white border-2 border-slate-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] space-y-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] text-white", `bg-${stat.color}-500`)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">{stat.label}</p>
                          <p className={cn("text-3xl font-black tracking-tighter", stat.text)}>{stat.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Biểu đồ cột 6 tháng */}
                  <div className="lg:col-span-8 p-10 bg-white border-2 border-slate-900 rounded-[3rem] shadow-[10px_10px_0px_0px_rgba(15,23,42,0.05)] space-y-8">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">Booking 6 tháng gần nhất</p>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-indigo-500 border border-slate-900" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Số lượng</span>
                      </div>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-4 pt-4 border-b-2 border-slate-900 px-4">
                      {[
                        { month: 'T11', val: 12 },
                        { month: 'T12', val: 18 },
                        { month: 'T01', val: 8 },
                        { month: 'T02', val: 24 },
                        { month: 'T03', val: 15 },
                        { month: 'T04', val: 21 },
                      ].map((item, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                          <div 
                            className="w-full bg-indigo-500 border-2 border-slate-900 shadow-[4px_0px_0px_0px_rgba(15,23,42,0.1)] relative transition-all group-hover:bg-indigo-400 group-hover:-translate-y-1"
                            style={{ height: `${(item.val / 24) * 100}%` }}
                          >
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.val}
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[-24px]">{item.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Phòng học đặt nhiều nhất */}
                  <div className="lg:col-span-4 p-10 bg-slate-900 rounded-[3rem] border-2 border-slate-900 shadow-[10px_10px_0px_0px_rgba(15,23,42,1)] text-white space-y-8">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500 border-2 border-white flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-black uppercase text-amber-400 tracking-[0.3em]">Phòng đặt nhiều nhất</p>
                      <h4 className="text-3xl font-black tracking-tighter uppercase leading-tight">Room A101</h4>
                      <p className="text-sm font-bold text-slate-400 italic">Tổng 12 lượt đặt thành công</p>
                    </div>
                    <div className="pt-6 border-t border-slate-800">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span>Tần suất</span>
                        <span className="text-amber-400">Rất cao 🔥</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
