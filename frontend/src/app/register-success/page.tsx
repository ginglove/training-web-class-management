'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { 
  CheckCircle2, 
  Mail, 
  ArrowRight,
  ShieldAlert,
  Inbox,
  Command
} from 'lucide-react';
import Link from 'next/link';

export default function RegisterSuccess() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden font-sans">
      {/* Brutalist Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-emerald-500 rounded-full blur-[180px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[540px]"
      >
        <div className="bg-white rounded-[3.5rem] border-4 border-slate-900 shadow-[16px_16px_0px_0px_rgba(16,185,129,1)] p-12 lg:p-16 space-y-12 text-center">
          {/* Logo/Icon */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative w-32 h-32">
               <motion.div 
                 animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                 transition={{ duration: 4, repeat: Infinity }}
                 className="w-full h-full bg-emerald-500 border-4 border-slate-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
               >
                 <CheckCircle2 className="w-16 h-16" />
               </motion.div>
               <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white border-4 border-slate-900 rounded-2xl flex items-center justify-center text-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                 <Mail className="w-6 h-6" />
               </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em]">Yêu cầu đã được gửi</h2>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                GẦN <span className="text-emerald-600">XONG RỒI!</span>
              </h1>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-8">
            <p className="text-lg font-bold text-slate-700 leading-snug">
              Chúng tôi đã gửi một email xác thực đến địa chỉ của bạn. Vui lòng kiểm tra để hoàn tất đăng ký.
            </p>
            
            <div className="bg-slate-50 border-4 border-slate-900 p-8 rounded-[2rem] space-y-4 text-left shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex items-start gap-4">
                 <div className="bg-indigo-100 p-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                   <Inbox className="w-5 h-5 text-indigo-600" />
                 </div>
                 <p className="text-[11px] font-black text-slate-600 leading-relaxed uppercase tracking-wider">
                   Kiểm tra hộp thư đến (Inbox, Junk, Spam)
                 </p>
              </div>
              <div className="flex items-start gap-4">
                 <div className="bg-amber-100 p-2 rounded-lg border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                   <ShieldAlert className="w-5 h-5 text-amber-600" />
                 </div>
                 <p className="text-[11px] font-black text-slate-600 leading-relaxed uppercase tracking-wider">
                   Link xác thực có hiệu lực trong vòng 24 giờ.
                 </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-6">
            <Button 
              onClick={() => router.push('/')}
              className="w-full py-8 bg-slate-900 text-white font-black text-sm uppercase tracking-[0.3em] rounded-[2rem] border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(16,185,129,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:scale-95"
            >
              <div className="flex items-center gap-3">
                <span>Quay lại đăng nhập</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </Button>
            
            <div className="pt-4 flex flex-col items-center gap-2">
              <p className="text-[11px] font-bold text-slate-500">
                Không nhận được email?
              </p>
              <button className="text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline underline-offset-4 decoration-2">
                Gửi lại yêu cầu xác thực
              </button>
            </div>
          </div>
        </div>

        {/* Footer Support */}
        <div className="mt-10 flex flex-col items-center space-y-4">
           <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white/50 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
             <Command className="w-4 h-4" />
             <span>Training Center Identity Management</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
