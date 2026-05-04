'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { fetchApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Check, X, Send, UserCheck, FastForward } from 'lucide-react';

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  
  const [booking, setBooking] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    loadBooking();
  }, [params.id]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const res = await fetchApi(`/api/bookings/${params.id}`);
      setBooking(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, payload: any = {}) => {
    try {
      setActionLoading(true);
      setError('');
      await fetchApi(`/api/bookings/${booking.id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      await loadBooking();
      setNote('');
    } catch (err: any) {
      setError(err.message || `Failed to ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading booking details...</div>;
  if (error && !booking) return <div className="p-8 text-center text-danger">{error}</div>;
  if (!booking) return <div className="p-8 text-center text-slate-500">Booking not found.</div>;

  const role = user?.role;
  const status = booking.status;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 neu-flat rounded-full flex items-center justify-center hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold tracking-tight">Booking #{booking.id.substring(0,8)}</h1>
              <Badge variant="default" className="text-sm px-3 py-1 bg-slate-200">
                {status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-slate-500 mt-1">Requested by {booking.creator_name} on {formatDate(booking.created_at)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-danger p-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold border-b pb-4 mb-4">Training Information</h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Course Name</p>
                <p className="font-medium text-foreground mt-1">{booking.course_name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Room</p>
                <p className="font-medium text-foreground mt-1">{booking.class_name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Date</p>
                <p className="font-medium text-foreground mt-1">{formatDate(booking.date)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Time Slot</p>
                <p className="font-medium text-foreground mt-1">{booking.slot_name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Attendees</p>
                <p className="font-medium text-foreground mt-1">{booking.attendee_count}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Purpose</p>
                <div className="mt-2 p-4 neu-pressed rounded-xl text-slate-700 whitespace-pre-wrap">
                  {booking.purpose}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold border-b pb-4 mb-4">Audit Logs</h3>
            <div className="space-y-4">
              {booking.logs?.map((log: any) => (
                <div key={log.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary mt-1.5" />
                    <div className="w-px h-full bg-slate-200 my-1" />
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold text-foreground">
                      {log.actor_name} ({log.actor_role})
                    </p>
                    <p className="text-xs text-slate-500 mb-1">{formatDate(log.created_at)}</p>
                    <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border">
                      <span className="font-medium text-primary mr-2">
                        {log.from_status ? `${log.from_status} ➔ ${log.to_status}` : `Created ➔ ${log.to_status}`}
                      </span>
                      {log.comment && <span className="text-slate-600 block mt-1">"{log.comment}"</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold border-b pb-4 mb-4">Actions</h3>
            
            <div className="space-y-4">
              {/* Creator Actions */}
              {role === 'CREATOR' && status === 'DRAFT' && (
                <Button 
                  onClick={() => handleAction('submit', { comment: note })} 
                  isLoading={actionLoading}
                  className="w-full flex justify-center space-x-2"
                >
                  <Send className="w-4 h-4" /> <span>Submit for Review</span>
                </Button>
              )}
              
              {role === 'CREATOR' && ['DRAFT', 'PENDING_REVIEW'].includes(status) && (
                <Button 
                  variant="danger" 
                  onClick={() => handleAction('cancel', { reason: note })} 
                  isLoading={actionLoading}
                  className="w-full flex justify-center space-x-2 mt-2"
                >
                  <X className="w-4 h-4" /> <span>Cancel Booking</span>
                </Button>
              )}

              {/* Reviewer Actions */}
              {role === 'REVIEWER' && status === 'PENDING_REVIEW' && (
                <Button 
                  onClick={() => handleAction('claim')} 
                  isLoading={actionLoading}
                  className="w-full flex justify-center space-x-2"
                >
                  <UserCheck className="w-4 h-4" /> <span>Claim Review</span>
                </Button>
              )}

              {role === 'REVIEWER' && status === 'IN_REVIEW' && booking.reviewer_id === user?.id && (
                <div className="space-y-2">
                  <textarea 
                    placeholder="Add a review note..."
                    className="w-full neu-input text-sm resize-none h-20"
                    value={note} onChange={e => setNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleAction('forward', { note })} 
                      isLoading={actionLoading}
                      className="flex-1 flex justify-center space-x-2"
                    >
                      <FastForward className="w-4 h-4" /> <span>Forward</span>
                    </Button>
                    <Button 
                      variant="danger"
                      onClick={() => handleAction('reject', { reason: note })} 
                      isLoading={actionLoading}
                      className="flex-1 flex justify-center space-x-2"
                    >
                      <X className="w-4 h-4" /> <span>Reject</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Approver Actions */}
              {role === 'APPROVER' && status === 'PENDING_APPROVAL' && (
                <div className="space-y-2">
                  <textarea 
                    placeholder="Add an approval note..."
                    className="w-full neu-input text-sm resize-none h-20"
                    value={note} onChange={e => setNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleAction('approve', { note })} 
                      isLoading={actionLoading}
                      className="flex-1 flex justify-center space-x-2 !bg-emerald-500 !text-white hover:!bg-emerald-600"
                    >
                      <Check className="w-4 h-4" /> <span>Approve</span>
                    </Button>
                    <Button 
                      variant="danger"
                      onClick={() => handleAction('reject', { reason: note })} 
                      isLoading={actionLoading}
                      className="flex-1 flex justify-center space-x-2"
                    >
                      <X className="w-4 h-4" /> <span>Reject</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* State Fallback */}
              {!['DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL'].includes(status) && (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-sm text-slate-500 border border-slate-200">
                  This booking has reached a final state and cannot be modified.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
