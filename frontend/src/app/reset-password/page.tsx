'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/errorTranslations';
import { 
  Lock, 
  Key,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  // Password Rules validation
  const rules = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };
  const isPasswordValid = Object.values(rules).every(Boolean);
  const isMatch = newPassword === confirmPassword && newPassword !== '';

  React.useEffect(() => {
    if (!token) {
      setError('Token không hợp lệ hoặc không tồn tại.');
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Token không hợp lệ.');
      return;
    }
    if (!isPasswordValid) {
      setError('Mật khẩu chưa đạt yêu cầu.');
      return;
    }
    if (!isMatch) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await fetchApi('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ 
          token, 
          new_password: newPassword 
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Đổi mật khẩu thất bại. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3.5rem] p-16 border border-slate-200 shadow-2xl text-center space-y-8 max-w-md relative z-10"
        >
          <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-500/20">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Cập nhật thành công!</h2>
            <p className="text-slate-500 font-medium">Mật khẩu của bạn đã được thay đổi. Tự động chuyển về trang Đăng nhập...</p>
          </div>
          <Button 
            onClick={() => router.push('/')} 
            className="w-full py-6 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-[1.5rem] hover:bg-slate-800 transition-all"
          >
            Đăng nhập ngay
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="bg-white rounded-[3.5rem] p-12 lg:p-16 border border-slate-200 shadow-2xl shadow-slate-200/50 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-500" />
          
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 mx-auto bg-slate-900 rounded-[2rem] flex items-center justify-center text-blue-400 shadow-2xl shadow-slate-900/20 transform group-hover:rotate-12 transition-transform duration-500">
              <Key className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Tạo mật khẩu mới</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hãy đảm bảo mật khẩu của bạn an toàn</p>
            </div>
          </div>

          <form onSubmit={handleReset} className="space-y-6" noValidate>
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-[1.5rem] text-xs font-black flex items-center gap-3 shadow-sm"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  <Lock className="w-3 h-3 text-blue-500" /> Mật khẩu mới
                </label>
                <div className="relative group/pass">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-[1.5rem] border-2 bg-slate-50 border-slate-100 p-6 font-black focus:bg-white focus:shadow-xl focus:shadow-blue-500/5 transition-all text-sm outline-none w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors p-2 rounded-xl"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password strength checklist */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                  <div className={`flex items-center gap-2 ${rules.length ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3 h-3" /> Tối thiểu 8 ký tự
                  </div>
                  <div className={`flex items-center gap-2 ${rules.uppercase ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3 h-3" /> Ít nhất 1 chữ hoa
                  </div>
                  <div className={`flex items-center gap-2 ${rules.number ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3 h-3" /> Ít nhất 1 chữ số
                  </div>
                  <div className={`flex items-center gap-2 ${rules.special ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3 h-3" /> 1 ký tự đặc biệt
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  <Lock className="w-3 h-3 text-blue-500" /> Xác nhận mật khẩu
                </label>
                <div className="relative group/pass">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`rounded-[1.5rem] border-2 p-6 font-black focus:bg-white focus:shadow-xl focus:shadow-blue-500/5 transition-all text-sm outline-none w-full ${confirmPassword && !isMatch ? 'border-rose-300 bg-rose-50' : 'bg-slate-50 border-slate-100'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors p-2 rounded-xl"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={!isPasswordValid || !isMatch || !token}
              className="w-full py-7 bg-blue-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl shadow-blue-500/30 hover:bg-blue-600 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100" 
              isLoading={loading}
            >
              Đặt mật khẩu mới
            </Button>
          </form>

          <div className="pt-6 text-center">
             <Link href="/" className="text-[11px] font-black text-slate-400 hover:text-blue-500 uppercase tracking-widest transition-colors">
               Quay lại Đăng nhập
             </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải...</div>}>
      <ResetPasswordContent />
    </React.Suspense>
  );
}
