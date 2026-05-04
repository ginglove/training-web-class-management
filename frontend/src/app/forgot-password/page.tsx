'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/errorTranslations';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Key,
  Sparkles,
  Command,
  ChevronRight,
  Fingerprint,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !newPassword) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu mới.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Intentional Vulnerability: This directly resets the password without an email token verification
      // A great test case for the software testing training!
      await fetchApi('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ 
          email, 
          new_password: newPassword 
        }),
      });

      setSuccess(true);
    } catch (err: any) {
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
            <h2 className="text-3xl font-black text-slate-800">Đặt lại thành công!</h2>
            <p className="text-slate-500 font-medium">Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập bằng mật khẩu mới.</p>
          </div>
          <Button 
            onClick={() => router.push('/')} 
            className="w-full py-6 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all"
          >
            Quay lại Đăng nhập
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="bg-white rounded-[3.5rem] p-12 lg:p-16 border border-slate-200 shadow-2xl shadow-slate-200/50 space-y-12 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-amber-500" />
          
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 mx-auto bg-slate-900 rounded-[2rem] flex items-center justify-center text-amber-400 shadow-2xl shadow-slate-900/20 transform group-hover:rotate-12 transition-transform duration-500">
              <Key className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">Khôi phục Quyền</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Đặt lại mật khẩu truy cập hệ thống</p>
            </div>
          </div>

          <form onSubmit={handleReset} className="space-y-8" noValidate>
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

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  <Mail className="w-3 h-3 text-amber-500" /> Địa chỉ Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="account@training.vn"
                  className="rounded-[1.5rem] border-2 bg-slate-50 border-slate-100 p-6 font-black focus:bg-white focus:shadow-xl focus:shadow-amber-500/5 transition-all text-sm outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  <Lock className="w-3 h-3 text-amber-500" /> Mật khẩu mới
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className="rounded-[1.5rem] border-2 bg-slate-50 border-slate-100 p-6 font-black focus:bg-white focus:shadow-xl focus:shadow-amber-500/5 transition-all text-sm outline-none"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-7 bg-amber-500 text-white font-black text-xs uppercase tracking-[0.25em] rounded-[1.5rem] shadow-2xl shadow-amber-500/30 hover:bg-amber-600 hover:scale-[1.03] active:scale-95 transition-all group" 
              isLoading={loading}
            >
              <div className="flex items-center gap-3">
                <span>Cập nhật mật khẩu</span>
                {!loading && <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />}
              </div>
            </Button>
          </form>

          <div className="pt-8 border-t border-slate-50 flex flex-col items-center gap-4">
             <Link href="/" className="text-[11px] font-black text-slate-400 hover:text-amber-500 uppercase tracking-widest transition-colors flex items-center gap-2">
               <ChevronRight className="w-4 h-4 rotate-180" /> Quay lại Đăng nhập
             </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
