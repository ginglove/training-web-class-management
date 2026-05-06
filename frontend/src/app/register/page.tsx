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
  UserPlus,
  User,
  Building,
  CheckCircle2,
  Fingerprint
} from 'lucide-react';

export default function Register() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [generalError, setGeneralError] = React.useState('');
  const [isSuccess, setIsSuccess] = React.useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên';
    
    if (!email) errors.email = 'Vui lòng nhập địa chỉ email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email không đúng định dạng';
    
    if (!password) errors.password = 'Vui lòng nhập mật khẩu';
    else if (password.length < 8) errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    
    if (!validate()) return;

    setLoading(true);

    try {
      const data = await fetchApi('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          full_name: fullName, 
          email, 
          password, 
          department 
        }),
      });

      setIsSuccess(true);
      setTimeout(() => {
        login(data.user, data.access_token);
        router.push('/home');
      }, 2000);
    } catch (err: unknown) {
      setGeneralError(getErrorMessage(err, 'Đăng ký thất bại. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
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
            <h2 className="text-3xl font-black text-slate-800">Đăng ký thành công!</h2>
            <p className="text-slate-500 font-medium">Chào mừng bạn gia nhập hệ thống đào tạo. Đang chuyển hướng...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[540px]"
      >
        <div className="bg-white rounded-[3.5rem] p-12 lg:p-16 border border-slate-200 shadow-2xl shadow-slate-200/50 space-y-12 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500" />
          
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 mx-auto bg-slate-900 rounded-[2rem] flex items-center justify-center text-indigo-400 shadow-2xl shadow-slate-900/20 transform group-hover:-rotate-6 transition-transform duration-500">
              <UserPlus className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">Yêu cầu Cấp quyền</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Đăng ký tài khoản người dùng mới</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-8" noValidate>
            <AnimatePresence mode="wait">
              {generalError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-rose-50 border border-rose-100 text-rose-600 p-5 rounded-[1.5rem] text-xs font-black flex items-center gap-3 shadow-sm"
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  {generalError}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  <User className="w-3 h-3 text-indigo-500" /> Họ và Tên
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  error={fieldErrors.fullName}
                  className="rounded-[1.5rem] border-2 bg-slate-50 border-slate-100 p-6 font-black focus:bg-white focus:shadow-xl focus:shadow-indigo-500/5 transition-all text-sm outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  <Mail className="w-3 h-3 text-indigo-500" /> Email Công việc
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@training.vn"
                  error={fieldErrors.email}
                  className="rounded-[1.5rem] border-2 bg-slate-50 border-slate-100 p-6 font-black focus:bg-white focus:shadow-xl focus:shadow-indigo-500/5 transition-all text-sm outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  <Lock className="w-3 h-3 text-indigo-500" /> Mật khẩu
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  error={fieldErrors.password}
                  className="rounded-[1.5rem] border-2 bg-slate-50 border-slate-100 p-6 font-black focus:bg-white focus:shadow-xl focus:shadow-indigo-500/5 transition-all text-sm outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  <Building className="w-3 h-3 text-indigo-500" /> Phòng ban
                </label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering, HR"
                  className="rounded-[1.5rem] border-2 bg-slate-50 border-slate-100 p-6 font-black focus:bg-white focus:shadow-xl focus:shadow-indigo-500/5 transition-all text-sm outline-none"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-7 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.25em] rounded-[1.5rem] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-[1.03] active:scale-95 transition-all group" 
              isLoading={loading}
            >
              <div className="flex items-center gap-3">
                <span>Tạo tài khoản ngay</span>
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </div>
            </Button>
          </form>

          <div className="pt-8 border-t border-slate-50 flex flex-col items-center gap-4">
             <p className="text-[11px] font-bold text-slate-500">
               Đã có tài khoản?{' '}
               <Link href="/" className="text-indigo-600 font-black hover:underline underline-offset-4">
                 Đăng nhập ngay
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
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Security Audit</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
