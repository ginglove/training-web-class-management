'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/errorTranslations';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Command,
  Fingerprint,
  Zap
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [capsLockActive, setCapsLockActive] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [generalError, setGeneralError] = React.useState('');
  const [errorType, setErrorType] = React.useState<'error' | 'warning'>('error');

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!email) errors.email = 'Vui lòng nhập địa chỉ email';
    if (!password) errors.password = 'Vui lòng nhập mật khẩu';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setErrorType('error');
    
    if (!validate()) return;

    setLoading(true);

    try {
      const data = await fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
      });

      login(data.user, data.access_token, data.refresh_token);
      
      if (data.force_password_change) {
        router.push('/profile/change-password');
      } else {
        router.push('/home');
      }
    } catch (err: unknown) {
      const errorData = err as { 
        remaining_attempts?: number; 
        error?: string; 
        message?: string; 
      };

      if (errorData.remaining_attempts !== undefined) {
        setGeneralError(`Tên đăng nhập hoặc mật khẩu không đúng. Bạn còn ${errorData.remaining_attempts} lần thử.`);
      } else if (errorData.error === 'Account is inactive' || errorData.error === 'Email chưa xác nhận') {
        setErrorType('warning');
        setGeneralError(errorData.message || 'Tài khoản chưa được kích hoạt. Liên hệ Admin.');
      } else if (errorData.error === 'Account locked') {
        setGeneralError(errorData.message || 'Tài khoản bị khóa. Vui lòng thử lại sau.');
      } else {
        setGeneralError(getErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="bg-white rounded-[3.5rem] p-12 lg:p-16 border border-slate-200 shadow-2xl shadow-slate-200/50 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
          
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 mx-auto bg-slate-900 rounded-[2rem] flex items-center justify-center text-primary shadow-2xl shadow-slate-900/20 transform group-hover:rotate-6 transition-transform duration-500">
              <Command className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">Class Booking</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Hệ thống quản trị đào tạo v4.0</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6" noValidate>
            <AnimatePresence mode="wait">
              {generalError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-5 rounded-[1.5rem] text-xs font-black flex items-center gap-3 shadow-sm border ${
                    errorType === 'warning' 
                      ? 'bg-amber-50 border-amber-200 text-amber-700' 
                      : 'bg-rose-50 border-rose-100 text-rose-600'
                  }`}
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  {generalError}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  <Mail className="w-3 h-3 text-primary" /> Địa chỉ Email / Tên đăng nhập
                </label>
                <Input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@training.vn"
                  error={fieldErrors.email}
                  className="rounded-[1.5rem] border-2 bg-slate-50 border-slate-100 p-6 font-black focus:bg-white focus:shadow-xl focus:shadow-primary/5 transition-all text-sm outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  <Lock className="w-3 h-3 text-primary" /> Mật khẩu truy cập
                </label>
                <div className="relative group/pass">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={handleKeyUp}
                    placeholder="••••••••"
                    error={fieldErrors.password}
                    className="rounded-[1.5rem] border-2 bg-slate-50 border-slate-100 p-6 font-black focus:bg-white focus:shadow-xl focus:shadow-primary/5 transition-all text-sm outline-none w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors p-2 rounded-xl"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <AnimatePresence>
                  {capsLockActive && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10px] font-bold text-amber-500 ml-4 flex items-center gap-1"
                    >
                      ⚠ CapsLock đang bật
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-colors ${rememberMe ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white'}`}>
                  {rememberMe && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">Ghi nhớ</span>
              </label>
              
              <Link href="/forgot-password" className="text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-widest transition-colors">
                Quên mật khẩu?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full py-7 bg-primary text-white font-black text-xs uppercase tracking-[0.25em] rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all group" 
              isLoading={loading}
            >
              <div className="flex items-center gap-3">
                <span>Đăng nhập hệ thống</span>
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </div>
            </Button>
          </form>

          <div className="pt-8 border-t border-slate-50 flex flex-col items-center gap-4">
             <div className="flex items-center gap-4">
                <div className="h-px w-8 bg-slate-100" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Hoặc</p>
                <div className="h-px w-8 bg-slate-100" />
             </div>
             <p className="text-[11px] font-bold text-slate-500">
               Chưa có tài khoản?{' '}
               <Link href="/register" className="text-primary font-black hover:underline underline-offset-4">
                 Yêu cầu cấp quyền ngay
               </Link>
             </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center space-y-4">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/50 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200">
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Identity Verify</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/50 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>High Speed</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-300 font-medium uppercase tracking-[0.2em]">© 2024 TRAINING CENTER MANAGEMENT SYSTEM</p>
        </div>
      </motion.div>
    </div>
  );
}
