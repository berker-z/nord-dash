import React, { useEffect } from "react";
import { CalendarEvent } from "../../types";
import { Plus, Clock } from "lucide-react";
import { EventItem } from "./EventItem";

interface Props {
  todayEvents: CalendarEvent[];
  loading: boolean;
  error: string | null;
  onAddToday: () => void;
  onRefresh: () => void;
  onSelectEvent: (evt: CalendarEvent) => void;
}

export const AgendaView: React.FC<Props> = ({
  todayEvents,
  loading,
  error,
  onAddToday,
  onRefresh,
  onSelectEvent,
}) => {
  const sortedEvents = [...todayEvents].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh();
    }, 60_000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 pb-2 border-b-2 border-nord-1 flex justify-between items-center">
        <span className="text-meta text-nord-8">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddToday}
            className="text-nord-3 hover:text-nord-14 transition-colors"
            title="Add Event/Task"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-nord-3 hover:text-nord-8 disabled:animate-spin"
          >
            <Clock size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-w-3xl w-full mx-auto">
        {error && (
          <div className="text-nord-11 border border-nord-11 bg-nord-11/10 p-2 rounded text-sm text-center mb-2">
            ! {error} !
          </div>
        )}
        {loading && todayEvents.length === 0 ? (
          <div className="text-center text-nord-3 animate-pulse mt-10">
            SYNCING_DATA...
          </div>
        ) : todayEvents.length > 0 ? (
          sortedEvents.map((evt) => (
            <EventItem key={evt.id} evt={evt} onClick={() => onSelectEvent(evt)} />
          ))
        ) : (
          <div className="text-center text-nord-3 text-lg italic mt-10">
            No events for today.
          </div>
        )}
      </div>
    </div>
  );
};
