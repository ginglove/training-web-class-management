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

export default function MyBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [booking, setBooking] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const loadBooking = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/bookings/${id}`);
      setBooking(res.data);
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Booking detail load failed'));
      router.push('/my-bookings');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  React.useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  const handleAction = async (action: string) => {
    if (action === 'CANCEL') {
      try {
        await fetchApi(`/api/bookings/${booking.id}/cancel`, { method: 'POST' });
        toast.success('Booking cancelled');
        loadBooking();
      } catch (err: any) {
        toast.error(getErrorMessage(err, 'Cancel failed'));
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
          <h1 className="text-2xl font-bold tracking-tight">Booking Details</h1>
          <p className="text-slate-500 font-mono text-sm mt-1">#{booking.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-8 space-y-8">
            <div className="flex items-center justify-between border-b pb-6">
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-500">Course / Content</div>
                <div className="text-xl font-bold text-slate-900">{booking.course_name || booking.purpose}</div>
              </div>
              <Badge className={cn(
                "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                displayStatus === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                displayStatus === 'PENDING_REVIEW' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                displayStatus === 'COMPLETED' ? "bg-slate-50 text-slate-600 border-slate-100" :
                "bg-rose-50 text-rose-600 border-rose-100"
              )}>
                {displayStatus}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">{booking.class_name}</div>
                  <div className="text-sm text-slate-500">{booking.class_location}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">{format(new Date(booking.date), 'dd/MM/yyyy')}</div>
                  <div className="text-sm text-slate-500">{booking.slot_name} ({booking.start_time} - {booking.end_time})</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">Attendees</div>
                  <div className="text-sm text-slate-500">{booking.attendee_count} people</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">Purpose</div>
                  <div className="text-sm text-slate-500">{booking.reason}</div>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Calendar Preview</h3>
            <div className="bg-slate-50 rounded-lg p-8 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200">
              <CalendarIcon className="w-8 h-8 mb-2" />
              <p className="text-sm text-center">Calendar UI Component (Pending integration)</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold mb-4">Status</h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                  <div className="font-bold text-slate-900 text-sm">Request Created</div>
                  <div className="text-xs text-slate-500 mt-1">{format(new Date(booking.created_at), 'dd/MM/yyyy HH:mm')}</div>
                </div>
              </div>
              
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${
                  displayStatus === 'COMPLETED' ? 'bg-slate-100 text-slate-600' :
                  displayStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 
                  displayStatus === 'REJECTED' || displayStatus === 'CANCELLED' ? 'bg-rose-100 text-rose-600' : 
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {displayStatus === 'COMPLETED' || displayStatus === 'APPROVED' ? <CheckCircle2 className="w-4 h-4" /> : 
                   displayStatus === 'REJECTED' || displayStatus === 'CANCELLED' ? <XCircle className="w-4 h-4" /> : 
                   <Clock className="w-4 h-4" />}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                  <div className="font-bold text-slate-900 text-sm">
                    {displayStatus === 'COMPLETED' ? 'Completed' : 
                     displayStatus === 'APPROVED' ? 'Approved' :
                     displayStatus === 'REJECTED' ? 'Rejected' :
                     displayStatus === 'CANCELLED' ? 'Cancelled' :
                     'Processing'}
                  </div>
                  {booking.reviewer_note && (
                    <div className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded border-l-2 border-primary italic">
                      "{booking.reviewer_note}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Button 
              className="w-full justify-start gap-2 bg-white text-slate-900 border-slate-200 hover:bg-slate-50"
              onClick={() => handleAction('CLONE')}
            >
              <Copy className="w-4 h-4" />
              Clone Request
            </Button>
            
            {(booking.status === 'PENDING_REVIEW' || booking.status === 'IN_REVIEW') && (
              <Button 
                variant="destructive"
                className="w-full justify-start gap-2"
                onClick={() => handleAction('CANCEL')}
              >
                <XCircle className="w-4 h-4" />
                Cancel Request
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
