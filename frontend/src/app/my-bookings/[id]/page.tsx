'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { getErrorMessage } from '@/lib/errorTranslations';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, Clock, CheckCircle2, XCircle, 
  AlertCircle, MapPin, Users, FileText, Calendar as CalendarIcon,
  Copy
} from 'lucide-react';

export default function MyBookingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [booking, setBooking] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadBooking();
  }, [params.id]);

  const loadBooking = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/bookings/${params.id}`);
      setBooking(res.data);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Lỗi khi tải chi tiết booking'));
      router.push('/my-bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    if (action === 'CANCEL') {
      try {
        await fetchApi(`/api/bookings/${booking.id}/cancel`, { method: 'POST' });
        toast.success('Đã hủy booking');
        loadBooking();
      } catch (err: any) {
        toast.error(getErrorMessage(err, 'Hủy thất bại'));
      }
    } else if (action === 'CLONE') {
      router.push(`/bookings/new?cloneFrom=${booking.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) return null;

  const isPastApproved = booking.status === 'APPROVED' && new Date(booking.end_time) < new Date();
  const displayStatus = isPastApproved ? 'COMPLETED' : booking.status;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/my-bookings')} className="px-3">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chi tiết Booking</h1>
          <p className="text-slate-500 font-mono text-sm mt-1">#{booking.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">{booking.title}</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">{booking.room?.name || 'Phòng không xác định'}</div>
                  <div className="text-sm text-slate-500">Sức chứa: {booking.room?.capacity} người</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">
                    {format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}
                  </div>
                  <div className="text-sm text-slate-500">
                    Ngày: {format(new Date(booking.start_time), 'dd/MM/yyyy')}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">Mục đích sử dụng</div>
                  <div className="text-sm text-slate-500">{booking.reason}</div>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Mô phỏng Mini Calendar</h3>
            <div className="bg-slate-50 rounded-lg p-8 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200">
              <CalendarIcon className="w-8 h-8 mb-2" />
              <p className="text-sm text-center">Calendar UI Component (Đang chờ tích hợp từ package Calendar)</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold mb-4">Trạng thái</h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {/* Timeline Items */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                  <div className="font-bold text-slate-900 text-sm">Đã tạo yêu cầu</div>
                  <div className="text-xs text-slate-500 mt-1">{format(new Date(booking.created_at), 'dd/MM/yyyy HH:mm')}</div>
                </div>
              </div>
              
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className={\`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 \${
                  displayStatus === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                  displayStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 
                  displayStatus === 'REJECTED' || displayStatus === 'CANCELLED' ? 'bg-rose-100 text-rose-600' : 
                  'bg-yellow-100 text-yellow-600'
                }\`}>
                  {displayStatus === 'COMPLETED' || displayStatus === 'APPROVED' ? <CheckCircle2 className="w-4 h-4" /> : 
                   displayStatus === 'REJECTED' || displayStatus === 'CANCELLED' ? <XCircle className="w-4 h-4" /> : 
                   <Clock className="w-4 h-4" />}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                  <div className="font-bold text-slate-900 text-sm">
                    {displayStatus === 'COMPLETED' ? 'Đã hoàn thành' : 
                     displayStatus === 'APPROVED' ? 'Đã duyệt' : 
                     displayStatus === 'REJECTED' ? 'Bị từ chối' : 
                     displayStatus === 'CANCELLED' ? 'Đã hủy' : 'Chờ duyệt'}
                  </div>
                  {displayStatus === 'REJECTED' && booking.rejection_reason && (
                    <div className="text-xs text-rose-600 mt-1 mt-2 bg-rose-50 p-2 rounded">
                      Lý do: {booking.rejection_reason}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {!isPastApproved && (
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                {(booking.status === 'REJECTED' || booking.status === 'CANCELLED') && (
                  <Button className="w-full text-blue-600 bg-blue-50 hover:bg-blue-100 border-none" variant="outline" onClick={() => handleAction('CLONE')}>
                    <Copy className="w-4 h-4 mr-2" /> Tạo lại yêu cầu (Clone)
                  </Button>
                )}
                {booking.status === 'PENDING' && (
                  <Button className="w-full text-rose-600 bg-rose-50 hover:bg-rose-100 border-none" variant="outline" onClick={() => handleAction('CANCEL')}>
                    <XCircle className="w-4 h-4 mr-2" /> Hủy yêu cầu này
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
