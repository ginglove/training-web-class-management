'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { fetchApi } from '@/lib/api';
import { Lock, Eye, EyeOff, ShieldCheck, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errorTranslations';
import { useRouter } from 'next/navigation';

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

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.current_password) newErrors.current_password = 'Vui lòng nhập mật khẩu hiện tại';
    if (!formData.new_password) newErrors.new_password = 'Vui lòng nhập mật khẩu mới';
    else if (formData.new_password.length < 8) newErrors.new_password = 'Mật khẩu phải từ 8 ký tự trở lên';
    
    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = 'Mật khẩu xác nhận không khớp';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await fetchApi('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          old_password: formData.current_password,
          new_password: formData.new_password,
        }),
      });
      toast.success('Đổi mật khẩu thành công!');
      setFormData({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => {
        router.push('/home');
      }, 1000);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Đổi mật khẩu thất bại'));
      if (err.errors) setErrors(err.errors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Đổi mật khẩu 🔒</h1>
        <p className="text-slate-500 mt-2">Cập nhật mật khẩu để bảo vệ tài khoản của bạn.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mật khẩu hiện tại</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input 
                    type={showCurrent ? 'text' : 'password'}
                    value={formData.current_password}
                    onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                    className="pl-11 pr-12"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.current_password && <p className="text-xs text-danger mt-1 font-medium">{errors.current_password}</p>}
              </div>

              <div className="h-px bg-slate-100 my-2" />

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input 
                    type={showNew ? 'text' : 'password'}
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    className="pl-11 pr-12"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.new_password && <p className="text-xs text-danger mt-1 font-medium">{errors.new_password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Xác nhận mật khẩu mới</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input 
                    type={showConfirm ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    className="pl-11 pr-12"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirm_password && <p className="text-xs text-danger mt-1 font-medium">{errors.confirm_password}</p>}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Mật khẩu an toàn</span>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 neu-flat rounded-2xl text-primary font-bold hover:neu-pressed transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Cập nhật mật khẩu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Card>

        <div className="flex items-start gap-4 p-6 neu-pressed rounded-3xl bg-slate-50/50">
          <AlertCircle className="w-6 h-6 text-primary shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-slate-800">Quy định về mật khẩu</h4>
            <ul className="text-xs text-slate-500 space-y-1 list-disc ml-4">
              <li>Mật khẩu mới phải khác mật khẩu cũ.</li>
              <li>Độ dài tối thiểu là 8 ký tự.</li>
              <li>Nên bao gồm cả chữ hoa, chữ thường, số và ký tự đặc biệt.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
