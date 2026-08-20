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
      <div className="mb-3 pb-2 border-b border-divider flex justify-between items-center">
        <span className="text-meta text-blue">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddToday}
            className="text-muted hover:text-green transition-colors"
            title="Add Event/Task"
          >
            <Plus size={17} />
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-muted hover:text-accent disabled:animate-spin"
          >
            <Clock size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-2 max-w-3xl w-full mx-auto">
        {error && (
          <div className="text-red border border-red/60 bg-red/10 p-2 text-sm text-center mb-2">
            ! {error} !
          </div>
        )}
        {loading && todayEvents.length === 0 ? (
          <div className="text-center text-muted animate-pulse mt-10">
            SYNCING_DATA...
          </div>
        ) : todayEvents.length > 0 ? (
          sortedEvents.map((evt) => (
            <EventItem key={evt.id} evt={evt} onClick={() => onSelectEvent(evt)} />
          ))
        ) : (
          <div className="text-center text-muted italic mt-10">
            No events for today.
          </div>
        )}
      </div>
    </div>
  );
};
