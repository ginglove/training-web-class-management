'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/errorTranslations';
import { cn } from '@/lib/utils';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User,
  Building,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Phone,
  Command,
  Fingerprint
} from 'lucide-react';

export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [generalError, setGeneralError] = React.useState('');

  // Password Strength Logic
  const strength = React.useMemo(() => {
    if (!password) return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return { label: 'Yếu🔴', color: 'bg-rose-500', width: '33%' };
    if (score <= 4) return { label: 'Trung bình🟡', color: 'bg-amber-500', width: '66%' };
    return { label: 'Mạnh🟢', color: 'bg-emerald-500', width: '100%' };
  }, [password]);

  const isMatch = password === confirmPassword && confirmPassword !== '';

  const checkAvailability = async (field: 'email' | 'username', value: string) => {
    try {
      const res = await fetchApi(`/api/auth/check-availability?${field}=${value}`);
      if (!res.available) {
        setFieldErrors(prev => ({ ...prev, [field]: res.message }));
      } else {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    } catch (err) {
      console.error('Availability check failed', err);
    }
  };

  const handleBlur = (field: string) => {
    if (field === 'fullName') {
      if (fullName.length < 2 || fullName.length > 100) {
        setFieldErrors(prev => ({ ...prev, fullName: 'Họ tên phải từ 2–100 ký tự, chỉ chữ cái' }));
      }
    }
    if (field === 'email' && email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldErrors(prev => ({ ...prev, email: 'Email không đúng định dạng' }));
      } else {
        checkAvailability('email', email);
      }
    }
    if (field === 'username' && username) {
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setFieldErrors(prev => ({ ...prev, username: 'Chỉ dùng chữ cái, số và dấu _' }));
      } else {
        checkAvailability('username', username);
      }
    }
    if (field === 'confirmPassword' && confirmPassword && !isMatch) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: 'Mật khẩu xác nhận chưa khớp' }));
    }
  };

  const isFormValid = 
    fullName.length >= 2 && 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    /^[a-zA-Z0-9_]+$/.test(username) &&
    password.length >= 8 &&
    isMatch &&
    agreeTerms &&
    Object.keys(fieldErrors).length === 0;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setGeneralError('');

    try {
      await fetchApi('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ 
          full_name: fullName, 
          email, 
          username,
          phone,
          password, 
          department 
        }),
      });
      router.push('/register-success');
    } catch (err: unknown) {
      setGeneralError(getErrorMessage(err, 'Đăng ký thất bại. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden font-sans">
      {/* Brutalist Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 w-full max-w-[480px] space-y-10">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(79,70,229,1)] transform hover:rotate-6 transition-transform duration-500">
            <Command className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Tạo <span className="text-indigo-600">tài khoản mới</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Hệ thống quản lý đào tạo tập trung</p>
          </div>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-[3rem] border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(15,23,42,1)] p-10 lg:p-12 space-y-10 relative group">
          <AnimatePresence mode="wait">
            {generalError && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-rose-50 border-2 border-rose-900 text-rose-900 p-5 rounded-2xl text-[11px] font-black uppercase flex items-center gap-3"
              >
                <XCircle className="w-5 h-5 shrink-0" />
                {generalError}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleRegister} className="space-y-6" noValidate>
            {/* Họ và Tên */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Họ và tên *</label>
              <div className={cn(
                "relative flex items-center transition-all border-4 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]",
                fieldErrors.fullName ? "border-rose-500 shadow-rose-900/10" : "focus-within:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]"
              )}>
                <User className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors(prev => {
                      const next = { ...prev };
                      delete next.fullName;
                      return next;
                    });
                  }}
                  onBlur={() => handleBlur('fullName')}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-12 pr-4 py-4 bg-white text-sm font-bold outline-none"
                />
              </div>
              {fieldErrors.fullName && <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight px-1 italic">{fieldErrors.fullName}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Email *</label>
              <div className={cn(
                "relative flex items-center transition-all border-4 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]",
                fieldErrors.email ? "border-rose-500 shadow-rose-900/10" : "focus-within:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]"
              )}>
                <Mail className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => {
                      const next = { ...prev };
                      delete next.email;
                      return next;
                    });
                  }}
                  onBlur={() => handleBlur('email')}
                  placeholder="name@training.vn"
                  className="w-full pl-12 pr-4 py-4 bg-white text-sm font-bold outline-none"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight px-1 italic flex items-center gap-2">
                  {fieldErrors.email}
                  {fieldErrors.email.includes('đăng nhập') && (
                    <Link href="/login" className="text-indigo-600 underline">Đăng nhập ngay</Link>
                  )}
                </p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tên đăng nhập *</label>
              <div className={cn(
                "relative flex items-center transition-all border-4 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]",
                fieldErrors.username ? "border-rose-500 shadow-rose-900/10" : "focus-within:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]"
              )}>
                <Fingerprint className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (fieldErrors.username) setFieldErrors(prev => {
                      const next = { ...prev };
                      delete next.username;
                      return next;
                    });
                  }}
                  onBlur={() => handleBlur('username')}
                  placeholder="username_123"
                  className="w-full pl-12 pr-4 py-4 bg-white text-sm font-bold outline-none"
                />
              </div>
              {fieldErrors.username && <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight px-1 italic">{fieldErrors.username}</p>}
            </div>

            {/* Mật khẩu */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Mật khẩu *</label>
              <div className={cn(
                "relative flex items-center transition-all border-4 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]",
                fieldErrors.password ? "border-rose-500 shadow-rose-900/10" : "focus-within:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]"
              )}>
                <Lock className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-white text-sm font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-900"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* Strength Bar */}
              {strength && (
                <div className="space-y-1.5 px-1 mt-1">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className="text-slate-400 italic">Bảo mật:</span>
                    <span className={cn(strength.color.replace('bg-', 'text-'))}>{strength.label}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-900/10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: strength.width }}
                      className={cn("h-full transition-all duration-500", strength.color)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Xác nhận mật khẩu */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Xác nhận mật khẩu *</label>
              <div className={cn(
                "relative flex items-center transition-all border-4 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]",
                confirmPassword && !isMatch ? "border-rose-500" : confirmPassword && isMatch ? "border-emerald-500" : ""
              )}>
                <ShieldCheck className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-white text-sm font-bold outline-none"
                />
                <div className="absolute right-4">
                  {confirmPassword && (
                    isMatch ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-rose-500" />
                  )}
                </div>
              </div>
              {fieldErrors.confirmPassword && <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight px-1 italic">{fieldErrors.confirmPassword}</p>}
            </div>

            {/* SĐT & Phòng ban (Optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Số điện thoại</label>
                <div className="relative flex items-center border-4 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <Phone className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09..."
                    className="w-full pl-10 pr-3 py-3 bg-white text-xs font-bold outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Phòng ban</label>
                <div className="relative flex items-center border-4 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <Building className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Engineering"
                    className="w-full pl-10 pr-3 py-3 bg-white text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-4 cursor-pointer group mt-4">
              <div className="relative mt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-6 h-6 border-4 border-slate-900 rounded-lg bg-white peer-checked:bg-indigo-600 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]" />
                <CheckCircle2 className="absolute top-1 left-1 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 leading-relaxed select-none">
                Tôi đồng ý với các <span className="text-indigo-600 underline underline-offset-4">Điều khoản & Chính sách</span> bảo mật của hệ thống. *
              </span>
            </label>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              isLoading={loading}
              className="w-full py-8 bg-slate-900 text-white font-black text-sm uppercase tracking-[0.3em] rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(79,70,229,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-30 disabled:hover:translate-x-0 active:scale-95 mt-4"
            >
              ĐĂNG KÝ TÀI KHOẢN
            </Button>
          </form>

          <div className="pt-8 border-t-2 border-slate-50 text-center">
            <p className="text-[11px] font-bold text-slate-500">
              Đã có tài khoản?{' '}
              <Link href="/" className="text-indigo-600 font-black hover:underline underline-offset-4">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Support Footer */}
        <div className="flex items-center justify-center gap-8 pt-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Server Status: Online</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-300" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TLS 1.3 Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
