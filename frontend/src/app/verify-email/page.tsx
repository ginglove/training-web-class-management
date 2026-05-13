'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { 
  CheckCircle2, 
  XCircle,
  Loader2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Mã xác thực không hợp lệ hoặc đã hết hạn.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetchApi(`/api/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(res.message || 'Email đã được xác thực thành công!');
      } catch (err: unknown) {
        setStatus('error');
        const msg = err instanceof Error ? err.message : 'Xác thực thất bại. Vui lòng thử lại sau.';
        setMessage(msg);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-indigo-500 rounded-full blur-[180px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="bg-white rounded-[3rem] border-4 border-slate-900 shadow-[16px_16px_0px_0px_rgba(15,23,42,1)] p-12 text-center space-y-10">
          
          {/* Status Icon */}
          <div className="flex justify-center">
            {status === 'loading' && (
              <div className="w-24 h-24 bg-slate-100 border-4 border-slate-900 rounded-[2rem] flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] animate-pulse">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <motion.div 
                initial={{ rotate: -20, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                className="w-24 h-24 bg-emerald-500 border-4 border-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
              >
                <CheckCircle2 className="w-12 h-12" />
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div 
                initial={{ x: -10 }}
                animate={{ x: 0 }}
                className="w-24 h-24 bg-rose-500 border-4 border-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
              >
                <XCircle className="w-12 h-12" />
              </motion.div>
            )}
          </div>

          {/* Text */}
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              {status === 'loading' ? 'Đang xác thực...' : status === 'success' ? 'Xác thực thành công' : 'Lỗi xác thực'}
            </h1>
            <p className="text-sm font-bold text-slate-600 leading-relaxed">
              {message || (status === 'loading' ? 'Vui lòng chờ trong giây lát trong khi chúng tôi kiểm tra mã xác thực của bạn.' : '')}
            </p>
          </div>

          {/* Action */}
          <div className="pt-4">
            {status !== 'loading' && (
              <Button 
                onClick={() => router.push('/')}
                className="w-full py-7 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(79,70,229,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                <div className="flex items-center gap-3">
                  <span>{status === 'success' ? 'Đăng nhập ngay' : 'Về trang chủ'}</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Button>
            )}
          </div>
        </div>

        {/* Brand Footer */}
        <div className="mt-10 flex justify-center">
           <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-3 bg-white/50 backdrop-blur-md rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
             <ShieldCheck className="w-4 h-4 text-emerald-500" />
             <span>Secure Identity Verification</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải...</div>}>
      <VerifyEmailContent />
    </React.Suspense>
  );
}
