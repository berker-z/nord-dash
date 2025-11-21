import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import { ChevronLeft, ChevronRight, X, Clock, Video, ExternalLink } from 'lucide-react';

// Dummy Data Generator
const generateDummyEvents = (year: number, month: number): CalendarEvent[] => {
  const events: CalendarEvent[] = [
    {
      id: '1',
      title: 'Weekly Sync',
      date: new Date(year, month, 2),
      isTimeSpecific: true,
      time: '05:00',
      description: 'Team alignment.'
    },
    {
      id: '2',
      title: 'Project Review',
      date: new Date(year, month, 15),
      isTimeSpecific: true,
      time: '14:00',
      description: 'Reviewing Q2 goals.',
    },
  ];
  
  // Generate many events for "Today" to test scrolling
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    events.push({
      id: `today-${i}`,
      title: `System Task ${i + 1}`,
      date: today,
      isTimeSpecific: true,
      time: `${10 + i}:00`,
      description: `Routine maintenance check #${i + 1}`
    });
  }

  return events;
};

interface CalendarWidgetProps {
  mode: 'MONTH' | 'AGENDA';
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ mode }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const dummyEvents = generateDummyEvents(year, month);

  // Filter for Agenda Mode (Today)
  const todayEvents = dummyEvents.filter(e => {
    const today = new Date();
    return e.date.getDate() === today.getDate() && 
           e.date.getMonth() === today.getMonth() && 
           e.date.getFullYear() === today.getFullYear();
  });

  if (mode === 'AGENDA') {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-4 pb-2 border-b-2 border-nord-1 flex justify-between items-center">
           <span className="text-nord-8 font-medium text-sm uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {todayEvents.length > 0 ? todayEvents.map(evt => (
                <div key={evt.id} className="bg-nord-1 p-4 rounded-md border-l-4 border-nord-9 hover:bg-nord-2 transition-colors cursor-pointer group" onClick={() => setSelectedEvent(evt)}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-lg text-nord-5">{evt.title}</span>
                        <span className="text-sm font-mono text-nord-3 group-hover:text-nord-8 font-medium">{evt.time}</span>
                    </div>
                    {evt.description && <p className="text-sm text-nord-4 truncate opacity-70">{evt.description}</p>}
                </div>
            )) : (
                <div className="text-center text-nord-3 text-lg italic mt-10">No events for today.</div>
            )}
        </div>
        {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      </div>
    );
  }

  // Calendar Mode Logic
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    const events = dummyEvents.filter(e => e.date.getDate() === day && e.date.getMonth() === month);
    if (events.length > 0) {
        setSelectedDayEvents(events);
    }
  };

  const renderCalendarGrid = () => {
    const days = [];
    // Empty slots for prev month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[40px] bg-nord-0/30 rounded-md"></div>);
    }
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const hasEvents = dummyEvents.some(e => e.date.getDate() === d && e.date.getMonth() === month);
      const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
      
      days.push(
        <div 
            key={d} 
            onClick={() => handleDayClick(d)}
            className={`
                min-h-[50px] flex flex-col items-center justify-center cursor-pointer transition-all relative rounded-md
                ${isToday ? 'bg-nord-3 text-nord-6 font-medium ring-2 ring-nord-8' : 'hover:bg-nord-1 text-nord-4'}
                ${hasEvents ? 'text-nord-8' : ''}
            `}
        >
          <span className="text-lg md:text-xl font-normal">{d}</span>
          {hasEvents && <div className="w-1.5 h-1.5 rounded-full bg-nord-13 absolute bottom-1.5"></div>}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="h-full flex flex-col relative font-mono">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6 pb-2 border-b border-nord-1">
        <button onClick={prevMonth} className="p-2 hover:bg-nord-1 rounded hover:text-nord-8"><ChevronLeft size={24} /></button>
        <span className="font-medium text-xl text-nord-4 uppercase tracking-widest">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="p-2 hover:bg-nord-1 rounded hover:text-nord-8"><ChevronRight size={24} /></button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-2 text-center">
        {['SU','MO','TU','WE','TH','FR','SA'].map((d, i) => (
            <span key={i} className="text-sm text-nord-3 font-medium uppercase">{d}</span>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-2 flex-1">
        {renderCalendarGrid()}
      </div>

      {/* Popups */}
      {selectedDayEvents && (
        <div className="absolute inset-0 bg-nord-0/95 backdrop-blur-sm z-10 flex flex-col p-4 animate-fade-in border-2 border-nord-3 rounded-lg">
            <div className="flex justify-between items-center mb-4 border-b-2 border-nord-3 pb-2">
                <span className="text-nord-8 font-medium text-lg uppercase">Events [{selectedDayEvents[0].date.toLocaleDateString()}]</span>
                <button onClick={() => setSelectedDayEvents(null)} className="hover:text-nord-11"><X size={24} /></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-3">
                {selectedDayEvents.map(evt => (
                    <div 
                        key={evt.id} 
                        onClick={() => setSelectedEvent(evt)}
                        className="bg-nord-1 p-4 border-l-4 border-nord-13 cursor-pointer hover:brightness-110 rounded-md"
                    >
                        <div className="text-nord-6 font-medium text-lg">{evt.title}</div>
                        <div className="text-nord-3 text-sm font-mono font-medium">{evt.time}</div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
};

const EventDetailModal: React.FC<{ event: CalendarEvent; onClose: () => void }> = ({ event, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-nord-0 border-4 border-nord-8 w-full max-w-lg p-8 rounded-2xl shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-nord-3 hover:text-nord-11">
                    <X size={28} />
                </button>
                
                <div className="mb-8 border-b-2 border-nord-1 pb-4">
                    <h2 className="text-2xl font-medium text-nord-6 mb-2 uppercase">{event.title}</h2>
                    <div className="flex items-center gap-3 text-nord-13 text-lg font-mono font-medium">
                        <Clock size={20} />
                        <span>{event.date.toLocaleDateString()} :: {event.time}</span>
                    </div>
                </div>

                <div className="space-y-6">
                    {event.description && (
                        <div className="bg-nord-1 p-4 text-lg text-nord-4 leading-relaxed font-mono border-l-4 border-nord-3 rounded-r-lg">
                            {event.description}
                        </div>
                    )}

                    {event.link && (
                        <a 
                            href={event.link} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-3 text-nord-8 hover:text-nord-7 text-lg transition-colors border-2 border-nord-3 p-3 hover:bg-nord-1 hover:border-nord-8 group rounded-lg"
                        >
                            <Video size={20} />
                            <span className="truncate font-medium">{event.link}</span>
                            <ExternalLink size={16} className="ml-auto opacity-50 group-hover:opacity-100" />
                        </a>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t-2 border-nord-1 flex justify-end">
                    <button onClick={onClose} className="px-6 py-3 bg-nord-3 hover:bg-nord-2 text-nord-6 text-sm font-medium transition-colors uppercase tracking-wider rounded-lg">
                        [ CLOSE_MODAL ]
                    </button>
                </div>
            </div>
        </div>
    )
}