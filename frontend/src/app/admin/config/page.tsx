'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { 
  Save, 
  RefreshCcw, 
  ShieldCheck, 
  Clock,
  Sparkles,
  Command,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminConfigPage() {
  const [saving, setSaving] = React.useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Cấu hình hệ thống đã được cập nhật thành công ✅');
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100 shadow-xl shadow-indigo-500/5">
                <Command className="w-6 h-6" />
             </div>
             <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
                  <Sparkles className="w-3 h-3" />
                  <span>Tham số vận hành</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-800">Cấu hình Hệ thống ⚙️</h1>
             </div>
          </div>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">Quản lý các quy tắc nghiệp vụ toàn cục, thiết lập bảo mật và các tham số vận hành cốt lõi của nền tảng.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="p-10 lg:p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl shadow-slate-200/30 space-y-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-125 transition-transform">
             <Clock className="w-48 h-48" />
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Quy tắc Đặt phòng</h2>
          </div>
          
          <div className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian đặt trước tối thiểu (Giờ)</label>
              <input type="number" defaultValue="2" className="w-full h-14 p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 focus:bg-white focus:border-primary/30 transition-all outline-none" />
              <p className="text-[9px] text-slate-400 font-bold italic ml-1">Giảng viên phải đặt trước ít nhất 2 giờ trước khi ca học bắt đầu.</p>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Định mức đặt phòng hàng tuần</label>
              <input type="number" defaultValue="5" className="w-full h-14 p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 focus:bg-white focus:border-primary/30 transition-all outline-none" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời lượng tối đa mỗi booking (Giờ)</label>
              <input type="number" defaultValue="8" className="w-full h-14 p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-700 focus:bg-white focus:border-primary/30 transition-all outline-none" />
            </div>
          </div>
        </Card>

        <Card className="p-10 lg:p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl shadow-slate-200/30 space-y-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-125 transition-transform">
             <ShieldCheck className="w-48 h-48" />
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Bảo mật Hệ thống</h2>
          </div>

          <div className="space-y-6 relative z-10">
            {[
              { label: 'Tự động Đăng ký', desc: 'Cho phép người dùng tự tạo tài khoản', checked: true },
              { label: 'Xác minh Email', desc: 'Yêu cầu xác nhận email khi đăng ký', checked: true },
              { label: 'Khóa tài khoản tự động', desc: 'Khóa sau 5 lần đăng nhập thất bại', checked: true },
              { label: 'Chế độ Bảo trì', desc: 'Tạm dừng tất cả các hoạt động đặt phòng', checked: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] hover:bg-white hover:border-primary/20 transition-all group/item">
                <div className="space-y-1">
                  <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{item.label}</p>
                  <p className="text-[10px] font-bold text-slate-400 italic uppercase">{item.desc}</p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                   <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-center gap-6">
        <button className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95">
          <RefreshCcw className="w-5 h-5 inline-block mr-3" />
          Khôi phục mặc định
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-14 py-5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-4"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 fill-white" />
              <span>Lưu cấu hình ngay</span>
            </>
          )}
        </button>
      </div>

      {/* Warning Card */}
      <div className="bg-amber-50 border-2 border-dashed border-amber-100 p-10 rounded-[3rem] flex flex-col md:flex-row items-center gap-8">
         <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/10 shrink-0">
            <AlertTriangle className="w-8 h-8" />
         </div>
         <div className="space-y-2 text-center md:text-left">
            <h4 className="text-xl font-black text-amber-800 uppercase tracking-tight">Cảnh báo Quan trọng</h4>
            <p className="text-xs font-bold text-amber-600 leading-relaxed uppercase tracking-wider">
               Các thay đổi trong phần này sẽ ảnh hưởng trực tiếp đến toàn bộ quy trình đặt phòng của giảng viên. Hãy chắc chắn bạn đã hiểu rõ tác động trước khi lưu cấu hình.
            </p>
         </div>
      </div>
    </div>
  );
}
