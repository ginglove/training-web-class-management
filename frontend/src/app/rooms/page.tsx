'use client';

import * as React from 'react';
import { Card } from '@/components/ui/Card';
import { fetchApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Users, MapPin, MonitorPlay } from 'lucide-react';

export default function RoomsPage() {
  const [rooms, setRooms] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [date, setDate] = React.useState<string>(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    fetchApi('/api/rooms').then(res => {
      setRooms(res);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classrooms</h1>
          <p className="text-slate-500 mt-1">Explore available training facilities</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading classrooms...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <Card key={room.id} className="flex flex-col h-full">
              <div className="flex-1">
                <div className="w-12 h-12 neu-pressed rounded-full flex items-center justify-center text-primary mb-4">
                  <MonitorPlay className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">{room.name}</h3>
                <p className="text-slate-500 text-sm mt-1">{room.description || 'No description available.'}</p>
                
                <div className="mt-6 space-y-3">
                  <div className="flex items-center text-slate-600 text-sm">
                    <MapPin className="w-4 h-4 mr-3 text-slate-400" />
                    <span>Location: {room.location}</span>
                  </div>
                  <div className="flex items-center text-slate-600 text-sm">
                    <Users className="w-4 h-4 mr-3 text-slate-400" />
                    <span>Capacity: {room.capacity} seats</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-slate-200">
                <button className="w-full text-center text-primary font-semibold hover:text-primary-dark transition-colors">
                  View Schedule
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
