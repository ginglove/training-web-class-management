'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { 
  Lock, 
  ShieldCheck, 
  Save, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle2,
  Zap,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '@/lib/errorTranslations';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [strength, setStrength] = React.useState(0);

  React.useEffect(() => {
    const pass = formData.new_password;
    let s = 0;
    if (pass.length > 5) s++;
    if (pass.length > 8) s++;
    if (/[A-Z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;
    setStrength(s);
  }, [formData.new_password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await fetchApi('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: formData.current_password,
          newPassword: formData.new_password,
        }),
      });
      toast.success('Đổi mật khẩu thành công!');
      setFormData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Đổi mật khẩu thất bại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32 pt-8">
      {/* Nút Quay lại */}
      <button 
        onClick={() => router.back()}
        className="group flex items-center gap-3 px-6 py-3 bg-white border-2 border-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:scale-95"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Quay lại hồ sơ</span>
      </button>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-[2rem] bg-slate-900 flex items-center justify-center text-primary shadow-[6px_6px_0px_0px_rgba(30,58,138,0.2)] rotate-3">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-black text-primary uppercase tracking-[0.3em]">
              <ShieldAlert className="w-4 h-4" />
              <span>Bảo mật hệ thống</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">Thay đổi mật khẩu 🔐</h1>
          </div>
        </div>
        <p className="text-slate-500 font-bold text-lg max-w-2xl leading-relaxed italic">
          Đảm bảo tài khoản của bạn luôn an toàn bằng cách sử dụng mật khẩu mạnh và không chia sẻ cho bất kỳ ai.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Guidance Column */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="p-10 rounded-[3rem] bg-slate-900 border-2 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,0.3)] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
               <ShieldCheck className="w-48 h-48" />
            </div>
            <div className="relative z-10 space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tight">Tiêu chuẩn bảo mật</h3>
                <p className="text-slate-400 font-bold text-sm leading-relaxed italic">Một mật khẩu mạnh cần đáp ứng các tiêu chí sau để chống lại các cuộc tấn công Brute-force.</p>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Tối thiểu 8 ký tự', check: formData.new_password.length >= 8 },
                  { label: 'Bao gồm chữ HOA', check: /[A-Z]/.test(formData.new_password) },
                  { label: 'Bao gồm chữ số', check: /[0-9]/.test(formData.new_password) },
                  { label: 'Ký tự đặc biệt (@, #, !...)', check: /[^A-Za-z0-9]/.test(formData.new_password) },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group/item">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-500",
                      item.check 
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                        : "bg-white/5 border-white/10 text-white/20"
                    )}>
                      {item.check ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-white/20" />}
                    </div>
                    <span className={cn(
                      "text-[11px] font-black uppercase tracking-widest transition-colors",
                      item.check ? "text-white" : "text-slate-500"
                    )}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <span>Độ mạnh mật khẩu</span>
                  <span className={cn(
                    "text-primary",
                    strength >= 4 ? "text-emerald-400" : strength >= 2 ? "text-amber-400" : "text-rose-400"
                  )}>
                    {strength >= 4 ? 'Tối ưu' : strength >= 2 ? 'Trung bình' : 'Yếu'}
                  </span>
                </div>
                <div className="h-3 bg-white/5 rounded-full border border-white/10 overflow-hidden flex gap-1 p-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div 
                      key={s}
                      className={cn(
                        "flex-1 rounded-full transition-all duration-500",
                        s <= strength 
                          ? (strength >= 4 ? 'bg-emerald-400' : strength >= 2 ? 'bg-amber-400' : 'bg-rose-400')
                          : 'bg-transparent'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="p-8 bg-amber-50 border-2 border-amber-900/10 rounded-[2.5rem] flex gap-6 group hover:bg-white hover:border-slate-900 transition-all duration-500">
            <AlertCircle className="w-10 h-10 text-amber-600 flex-shrink-0 group-hover:rotate-12 transition-transform" />
            <div className="space-y-2">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Lưu ý quan trọng</p>
              <p className="text-xs font-bold text-amber-900/60 leading-relaxed italic">Sau khi đổi mật khẩu thành công, tất cả các phiên đăng nhập khác trên thiết bị lạ sẽ được yêu cầu xác thực lại.</p>
            </div>
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-7">
          <Card className="p-10 lg:p-16 rounded-[3.5rem] bg-white border-2 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,0.05)] relative overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Mật khẩu hiện tại</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                    <Lock className="w-6 h-6" />
                  </div>
                  <Input 
                    type={showCurrent ? "text" : "password"}
                    value={formData.current_password}
                    onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                    className="pl-16 pr-16 h-16 bg-slate-50 border-2 border-transparent rounded-[2rem] font-black text-slate-700 focus:bg-white focus:border-slate-900 transition-all outline-none text-lg"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-900 transition-colors"
                  >
                    {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-8 pt-6 border-t-2 border-slate-50">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Mật khẩu mới</label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                      <Zap className="w-6 h-6" />
                    </div>
                    <Input 
                      type={showNew ? "text" : "password"}
                      value={formData.new_password}
                      onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                      className="pl-16 pr-16 h-16 bg-slate-50 border-2 border-transparent rounded-[2rem] font-black text-slate-700 focus:bg-white focus:border-slate-900 transition-all outline-none text-lg"
                      placeholder="Tối thiểu 8 ký tự..."
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-900 transition-colors"
                    >
                      {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Xác nhận mật khẩu mới</label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <Input 
                      type={showConfirm ? "text" : "password"}
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      className="pl-16 pr-16 h-16 bg-slate-50 border-2 border-transparent rounded-[2rem] font-black text-slate-700 focus:bg-white focus:border-slate-900 transition-all outline-none text-lg"
                      placeholder="Nhập lại mật khẩu mới..."
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-900 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {formData.confirm_password && formData.new_password !== formData.confirm_password && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-rose-500 font-black uppercase tracking-widest ml-1"
                      >
                        Mật khẩu xác nhận chưa trùng khớp
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="pt-12 border-t-2 border-slate-50">
                <button 
                  type="submit"
                  disabled={loading || strength < 3}
                  className="w-full h-20 bg-slate-900 border-2 border-slate-900 rounded-[2rem] font-black text-[13px] uppercase tracking-[0.3em] text-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-4 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                >
                  {loading ? (
                    <div className="w-8 h-8 border-[4px] border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-7 h-7 group-hover:scale-110 transition-transform" />
                      <span>Xác nhận cập nhật bảo mật</span>
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6">
                   Hành động này sẽ cập nhật ngay lập tức vào cơ sở dữ liệu.
                </p>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
