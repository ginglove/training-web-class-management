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
  Lock, Settings, Smartphone, LayoutDashboard
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { getErrorMessage } from '@/lib/errorTranslations';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('info');
  
  const [formData, setFormData] = React.useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const updatedUser = await fetchApi('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      setUser(updatedUser);
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
    { id: 'stats', label: 'Thống kê cá nhân', icon: BarChart3 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
          <Settings className="w-3 h-3" />
          <span>Cài đặt hệ thống</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-800">Hồ sơ cá nhân 👤</h1>
        <p className="text-slate-500 font-medium text-sm">Quản lý thông tin tài khoản, bảo mật và thiết bị truy cập.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-28 h-28 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner border-4 border-white overflow-hidden group/avatar cursor-pointer">
                <span className="text-4xl font-black text-primary uppercase">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-black text-slate-800 leading-tight">{user?.full_name}</h2>
              <p className="text-xs font-bold text-slate-400 mt-1">{user?.email}</p>
              
              <div className="mt-8 pt-8 border-t border-slate-50 space-y-3">
                <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vai trò</span>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase">
                    {user?.role}
                  </Badge>
                </div>
                <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phòng ban</span>
                  <span className="text-[10px] font-black text-slate-700 uppercase">{user?.department || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center justify-between p-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all group",
                    activeTab === tab.id 
                      ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                      : "text-slate-500 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:text-slate-800"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Icon className={cn("w-5 h-5", activeTab === tab.id ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                    <span>{tab.label}</span>
                  </div>
                  {activeTab === tab.id && <ChevronRight className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 min-h-[600px] overflow-hidden">
            {activeTab === 'info' && (
              <div className="p-8 lg:p-12 space-y-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Thông tin cơ bản</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Họ và tên giảng viên</label>
                      <div className="relative group">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <Input 
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="pl-14 h-14 bg-slate-50/50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white transition-all"
                          placeholder="Nhập họ và tên"
                          required
                        />
                      </div>
                      {errors.full_name && <p className="text-xs text-rose-500 mt-1 font-bold">{errors.full_name}</p>}
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Địa chỉ Email (Hệ thống)</label>
                      <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                        <Input 
                          value={user?.email}
                          disabled
                          className="pl-14 h-14 bg-slate-50 text-slate-300 border-2 border-slate-100 border-dashed rounded-2xl font-bold cursor-not-allowed"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase ml-1 italic">Email là ID định danh duy nhất và không thể thay đổi.</p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Số điện thoại liên hệ</label>
                      <div className="relative group">
                        <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <Input 
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="pl-14 h-14 bg-slate-50/50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white transition-all"
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Khoa / Phòng ban</label>
                      <div className="relative">
                        <Building className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200" />
                        <Input 
                          value={user?.department}
                          disabled
                          className="pl-14 h-14 bg-slate-50 text-slate-300 border-2 border-slate-100 border-dashed rounded-2xl font-bold cursor-not-allowed"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase ml-1 italic">Liên hệ Admin nếu thông tin phòng ban chưa chính xác.</p>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-slate-50 flex justify-end">
                    <Button 
                      type="submit"
                      disabled={loading}
                      className="h-14 px-10 rounded-2xl bg-primary shadow-xl shadow-primary/20 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="w-5 h-5 fill-white" />
                          <span>Lưu cấu hình</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="p-8 lg:p-12 space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Phiên đăng nhập</h3>
                  </div>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    Hệ thống tự động theo dõi các thiết bị truy cập để đảm bảo an toàn cho tài khoản của bạn.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-emerald-50/50 border-2 border-emerald-100 rounded-3xl group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white shadow-md text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-50 group-hover:scale-110 transition-transform">
                        <MonitorSmartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-base">MacBook Pro - Chrome Desktop</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Đang trực tuyến (Phiên này)</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500 text-white border-none px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-200">
                      Tin cậy
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white shadow-sm text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-base">iPhone 13 - Safari Mobile</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Hoạt động 2 giờ trước • Hồ Chí Minh, VN</div>
                      </div>
                    </div>
                    <button className="p-4 text-rose-500 bg-rose-50 rounded-2xl opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-50">
                  <div className="bg-slate-900 rounded-[2rem] p-8 lg:p-10 text-white space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                      <Lock className="w-40 h-40" />
                    </div>
                    <div className="relative z-10 space-y-2">
                      <h4 className="text-xl font-black uppercase tracking-tight">Mật khẩu bảo mật</h4>
                      <p className="text-slate-400 font-medium text-sm">Cập nhật mật khẩu thường xuyên giúp tăng cường bảo mật hồ sơ đào tạo.</p>
                    </div>
                    <div className="relative z-10">
                      <Button 
                        variant="primary" 
                        onClick={() => window.location.href='/change-password'}
                        className="bg-primary hover:bg-primary/90 px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
                      >
                        Đổi mật khẩu ngay
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {['history', 'stats'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-full p-20 text-center space-y-6">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 border-2 border-slate-100 border-dashed">
                  {activeTab === 'history' ? <History className="w-10 h-10" /> : <BarChart3 className="w-10 h-10" />}
                </div>
                <div className="space-y-2 max-w-sm">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                    {activeTab === 'history' ? 'Nhật ký Hoạt động' : 'Thống kê Cá nhân'}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed italic">
                    Tính năng đang được triển khai và sẽ sớm khả dụng trong bản cập nhật tiếp theo. 🧊
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
