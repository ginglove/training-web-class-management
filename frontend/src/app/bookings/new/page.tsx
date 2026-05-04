'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { fetchApi } from '@/lib/api';
import { 
  ArrowLeft, ArrowRight, Check, Calendar, Users, 
  Info, Laptop, CheckCircle2, MapPin, Clock, 
  ChevronRight, Sparkles, Building, Hash, Zap, XCircle, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errorTranslations';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';

export default function NewBookingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [step, setStep] = React.useState(1);
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = React.useState<string>('');
  const [date, setDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = React.useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<string>('');
  
  const [courseName, setCourseName] = React.useState('');
  const [purpose, setPurpose] = React.useState('');
  const [attendeeCount, setAttendeeCount] = React.useState('');
  
  const [loading, setLoading] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [generalError, setGeneralError] = React.useState('');

  React.useEffect(() => {
    if (user && user.role !== 'CREATOR' && user.role !== 'ADMIN') {
      router.push('/home');
    }
    fetchApi('/api/rooms').then(setRooms).catch(console.error);

    const urlParams = new URLSearchParams(window.location.search);
    const cloneId = urlParams.get('cloneFrom');
    if (cloneId) {
      fetchApi(`/api/bookings/${cloneId}`)
        .then(data => {
          setSelectedRoom(data.class_id);
          setCourseName(data.course_name || '');
          setPurpose(data.purpose || '');
          setAttendeeCount(data.attendee_count?.toString() || '');
          toast.success('Đã sao chép thông tin từ booking cũ');
        })
        .catch(console.error);
    }
  }, [user, router]);

  React.useEffect(() => {
    if (selectedRoom && date) {
      fetchApi(`/api/rooms/${selectedRoom}/availability?date=${date}`)
        .then(res => setSlots(res.slots))
        .catch(console.error);
    } else {
      setSlots([]);
    }
  }, [selectedRoom, date]);

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!date) errors.date = 'Vui lòng chọn ngày';
    if (!selectedRoom) errors.room = 'Vui lòng chọn phòng';
    if (!selectedSlot) errors.slot = 'Vui lòng chọn ca học';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!courseName.trim()) errors.courseName = 'Vui lòng nhập tên khóa học';
    if (!purpose.trim()) errors.purpose = 'Vui lòng nhập mục đích sử dụng';
    if (!attendeeCount) errors.attendeeCount = 'Vui lòng nhập số lượng SV';
    else if (parseInt(attendeeCount) <= 0) errors.attendeeCount = 'Số lượng phải lớn hơn 0';
    
    const room = rooms.find(r => r.id === selectedRoom);
    if (room && parseInt(attendeeCount) > room.capacity) {
      errors.attendeeCount = `Vượt quá sức chứa của phòng (${room.capacity})`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setGeneralError('');
    try {
      const res = await fetchApi('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          class_id: selectedRoom,
          date,
          slot_id: parseInt(selectedSlot),
          course_name: courseName,
          purpose,
          attendee_count: parseInt(attendeeCount, 10),
        }),
      });
      toast.success('Đã tạo bản nháp thành công!');
      router.push(`/bookings/${res.id}`);
    } catch (err: any) {
      setGeneralError(getErrorMessage(err, 'Lỗi khi tạo booking'));
      toast.error('Có lỗi xảy ra khi tạo yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoomData = rooms.find(r => r.id === selectedRoom);
  const selectedSlotData = slots.find(s => s.slot_id.toString() === selectedSlot);

  const steps = [
    { id: 1, name: 'Phòng & Thời gian', icon: Calendar },
    { id: 2, name: 'Chi tiết khóa học', icon: Laptop },
    { id: 3, name: 'Xác nhận yêu cầu', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex items-center gap-6">
        <button 
          onClick={() => router.back()}
          className="w-14 h-14 bg-white rounded-[1.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary hover:scale-105 transition-all group"
        >
          <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3" />
            <span>Quy trình 3 bước</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-800">Đặt lớp học mới 🏢</h1>
          <p className="text-slate-500 font-medium text-sm">Khởi tạo yêu cầu mượn phòng đào tạo giảng dạy.</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 md:p-10">
        <div className="flex justify-between items-center relative">
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = step >= s.id;
            const isCurrent = step === s.id;
            
            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 border-4 border-white shadow-xl",
                  isActive ? "bg-primary text-white scale-110" : "bg-slate-100 text-slate-400"
                )}>
                  {step > s.id ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </div>
                <div className={cn(
                  "text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap absolute top-full mt-4",
                  isActive ? "text-slate-800" : "text-slate-300"
                )}>
                  {s.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {generalError && (
        <div className="bg-rose-50 text-rose-500 p-6 rounded-3xl border-2 border-rose-100 font-black text-xs uppercase tracking-widest flex items-center gap-4 animate-shake">
          <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
          {generalError}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <Card className="lg:col-span-7 p-8 lg:p-10 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Chọn ngày & phòng</h3>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Ngày đào tạo dự kiến</label>
                    <div className="relative group">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                      <Input
                        type="date"
                        value={date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDate(e.target.value)}
                        className="pl-14 h-14 bg-slate-50/50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white transition-all"
                        error={formErrors.date}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end ml-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Danh sách phòng học khả dụng</label>
                      <span className="text-[9px] font-black text-primary uppercase">({rooms.length} phòng)</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                      {rooms.map(r => (
                        <button
                          key={r.id}
                          onClick={() => setSelectedRoom(r.id)}
                          className={cn(
                            "p-5 rounded-3xl flex justify-between items-center transition-all group border-2",
                            selectedRoom === r.id 
                              ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" 
                              : "bg-white border-slate-100 hover:border-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                              selectedRoom === r.id ? "bg-primary text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                            )}>
                              <Building className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-sm group-hover:text-primary transition-colors">{r.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{r.location}</p>
                            </div>
                          </div>
                          <Badge className="bg-slate-100 text-slate-500 border-none px-4 py-1.5 rounded-xl text-[9px] font-black uppercase">
                            {r.capacity} CHỖ
                          </Badge>
                        </button>
                      ))}
                    </div>
                    {formErrors.room && <p className="text-xs text-rose-500 ml-1 font-bold">{formErrors.room}</p>}
                  </div>
                </div>
              </Card>

              <div className="lg:col-span-5 space-y-8">
                <Card className="p-8 lg:p-10 space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Ca học trống</h3>
                  </div>

                  <div className="space-y-4">
                    {!selectedRoom ? (
                      <div className="p-16 text-center text-slate-300 border-4 border-dashed border-slate-50 rounded-[2.5rem] flex flex-col items-center gap-4">
                        <Calendar className="w-12 h-12 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-loose">
                          Vui lòng chọn<br />phòng học để xem lịch
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {slots.map(s => {
                          const isBooked = !!s.booking_id;
                          const isSelected = selectedSlot === s.slot_id.toString();
                          return (
                            <button
                              key={s.slot_id}
                              disabled={isBooked}
                              onClick={() => setSelectedSlot(s.slot_id.toString())}
                              className={cn(
                                "p-5 rounded-3xl flex justify-between items-center transition-all group border-2 relative overflow-hidden",
                                isBooked ? "bg-slate-50 border-slate-50 text-slate-200 cursor-not-allowed opacity-60" : 
                                isSelected ? "bg-primary text-white border-primary shadow-xl shadow-primary/20" : 
                                "bg-white border-slate-100 hover:border-primary/20"
                              )}
                            >
                              <div className="relative z-10 text-left">
                                <p className={cn("font-black text-sm", isSelected ? "text-white" : "text-slate-800 group-hover:text-primary transition-colors")}>
                                  {s.slot_name}
                                </p>
                                <p className={cn("text-[10px] font-black uppercase tracking-widest mt-0.5", isSelected ? "text-white/80" : "text-slate-400")}>
                                  {s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}
                                </p>
                              </div>
                              {isBooked ? (
                                <Badge className="bg-rose-50 text-rose-400 border-none text-[8px] font-black px-3 py-1">ĐÃ ĐẶT</Badge>
                              ) : isSelected ? (
                                <CheckCircle2 className="w-6 h-6 text-white" />
                              ) : (
                                <Badge className="bg-emerald-50 text-emerald-500 border-none text-[8px] font-black px-3 py-1">CÒN TRỐNG</Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {formErrors.slot && <p className="text-xs text-rose-500 ml-1 font-bold">{formErrors.slot}</p>}
                  </div>
                </Card>

                <Button 
                  onClick={nextStep} 
                  className="w-full h-16 rounded-3xl bg-primary shadow-2xl shadow-primary/20 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 group hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <span>Tiếp tục bước 2</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <Card className="p-8 lg:p-12 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                <div className="space-y-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Chi tiết khóa học</h3>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tên khóa đào tạo</label>
                      <div className="relative group">
                        <Laptop className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <Input
                          placeholder="VD: Kiểm thử phần mềm cơ bản..."
                          value={courseName}
                          onChange={(e) => setCourseName(e.target.value)}
                          className="pl-14 h-14 bg-slate-50/50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white transition-all"
                          error={formErrors.courseName}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Số lượng SV tham dự</label>
                      <div className="relative group">
                        <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <Input
                          type="number"
                          placeholder="Nhập số lượng..."
                          value={attendeeCount}
                          onChange={(e) => setAttendeeCount(e.target.value)}
                          className="pl-14 h-14 bg-slate-50/50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:bg-white transition-all"
                          error={formErrors.attendeeCount}
                        />
                      </div>
                      {selectedRoomData && (
                        <p className="text-[9px] text-slate-400 font-bold uppercase ml-1 italic">
                          Sức chứa phòng {selectedRoomData.name}: {selectedRoomData.capacity} CHỖ.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100">
                      <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Mục tiêu sử dụng</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <textarea
                      className={cn(
                        "w-full min-h-[200px] p-6 bg-slate-50/50 border-2 border-slate-100 rounded-3xl font-bold text-slate-700 focus:bg-white focus:border-primary transition-all resize-none text-sm placeholder:text-slate-300",
                        formErrors.purpose && "border-rose-200 bg-rose-50/10 focus:border-rose-500"
                      )}
                      placeholder="Mô tả chi tiết nội dung đào tạo hoặc yêu cầu thêm về thiết bị (Máy chiếu, bảng, Mic...)"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    />
                    {formErrors.purpose && <p className="text-xs text-rose-500 ml-1 font-bold">{formErrors.purpose}</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-12 border-t border-slate-50">
                <Button 
                  variant="ghost" 
                  onClick={prevStep} 
                  className="h-14 px-10 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50"
                >
                  Quay lại
                </Button>
                <Button 
                  onClick={nextStep} 
                  className="h-14 px-12 rounded-2xl bg-primary shadow-xl shadow-primary/20 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 group"
                >
                  <span>Xem xác nhận</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          )}

          {step === 3 && (
            <Card className="p-8 lg:p-12 space-y-12 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-20 opacity-[0.03] rotate-12 pointer-events-none">
                <CheckCircle2 className="w-96 h-96" />
              </div>

              <div className="relative space-y-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Xác nhận & Hoàn tất</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                  <div className="md:col-span-4 space-y-6">
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 space-y-6">
                      <div className="space-y-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian đặt</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-primary" />
                            <span className="font-black text-slate-800 text-lg">{date}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary" />
                            <span className="font-black text-slate-800">{selectedSlotData?.slot_name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t border-slate-200">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa điểm</div>
                        <div className="flex items-center gap-3 text-slate-800">
                          <Building className="w-5 h-5 text-primary" />
                          <span className="font-black">{selectedRoomData?.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khóa đào tạo</div>
                        <div className="font-black text-slate-800 text-xl leading-tight">{courseName}</div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quy mô SV</div>
                        <div className="font-black text-slate-800 text-xl">{attendeeCount} người</div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-6 border-t border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nội dung / Ghi chú</div>
                      <div className="bg-slate-50/50 p-6 rounded-3xl border-2 border-slate-100 text-slate-600 font-medium text-sm leading-relaxed italic">
                        "{purpose}"
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-6 bg-primary/5 rounded-[2rem] border border-primary/20">
                      <div className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Info className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-loose">
                        Yêu cầu sẽ được lưu ở trạng thái <b>Bản nháp</b>.<br />
                        Vui lòng gửi phê duyệt sau khi hoàn thành.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-12 border-t border-slate-50 relative z-10">
                <Button 
                  variant="ghost" 
                  onClick={prevStep} 
                  disabled={loading}
                  className="h-14 px-10 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest"
                >
                  Quay lại
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="h-16 px-16 rounded-[2rem] bg-slate-900 shadow-2xl shadow-slate-400 font-black text-[11px] uppercase tracking-[0.25em] flex items-center gap-3 hover:bg-black transition-all hover:scale-[1.02] active:scale-95"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-white" />
                      <span>Xác nhận ngay</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
