'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { fetchApi } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

export default function NewBookingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = React.useState<string>('');
  const [date, setDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = React.useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<string>('');
  
  const [courseName, setCourseName] = React.useState('');
  const [purpose, setPurpose] = React.useState('');
  const [attendeeCount, setAttendeeCount] = React.useState('');
  
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    // Redirect if not authorized
    if (user && user.role !== 'CREATOR' && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
    fetchApi('/api/rooms').then(setRooms).catch(console.error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !date || !selectedSlot || !courseName || !purpose || !attendeeCount) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetchApi('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          class_id: selectedRoom,
          date,
          slot_id: selectedSlot,
          course_name: courseName,
          purpose,
          attendee_count: parseInt(attendeeCount, 10),
        }),
      });
      router.push(`/bookings/${res.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 neu-flat rounded-full flex items-center justify-center hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Booking</h1>
          <p className="text-slate-500 mt-1">Reserve a classroom for a training session</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="bg-red-100 text-danger p-4 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">Schedule Details</h3>
              
              <div className="space-y-4">
                <Input
                  label="Date"
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />

                <div className="flex flex-col space-y-1.5 w-full">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Classroom</label>
                  <select
                    className="neu-input w-full text-foreground"
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a room</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5 w-full">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Time Slot</label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {slots.length === 0 && <p className="text-sm text-slate-500 italic col-span-2">Select a room and date first</p>}
                    {slots.map(s => {
                      const isBooked = !!s.booking_id;
                      const isSelected = selectedSlot === s.slot_id;
                      return (
                        <button
                          key={s.slot_id}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(s.slot_id)}
                          className={`
                            py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200
                            ${isBooked ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50' : 
                              isSelected ? 'neu-pressed text-primary ring-1 ring-primary/50' : 'neu-flat hover:text-primary'}
                          `}
                        >
                          {s.slot_name}<br/>
                          <span className="text-xs opacity-75">{s.start_time.substring(0,5)} - {s.end_time.substring(0,5)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">Training Details</h3>
              
              <div className="space-y-4">
                <Input
                  label="Course Name"
                  type="text"
                  placeholder="e.g. Advanced Playwright Testing"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  required
                />

                <div className="flex flex-col space-y-1.5 w-full">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Purpose</label>
                  <textarea
                    className="neu-input w-full text-foreground min-h-[100px] resize-none"
                    placeholder="Describe the training session..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Attendee Count"
                  type="number"
                  min="1"
                  placeholder="e.g. 20"
                  value={attendeeCount}
                  onChange={(e) => setAttendeeCount(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end">
            <Button type="submit" isLoading={loading} className="px-8">
              Create Booking Draft
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
