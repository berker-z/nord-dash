import React, { useState, useEffect, useMemo } from "react";
import {
  Plane,
  Home,
  Calendar as CalendarIcon,
  X,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ScheduleEntry, TripEntry, EventEntry } from "../types";

// Helper to parse date strings "YYYY-MM-DD HH:MM:SS"
// Handles malformed timestamps like "2025-11-04 6:01:00" (missing leading zero)
const parseDate = (dateStr: string): Date => {
  // Normalize the date string to handle single-digit hours
  const normalized = dateStr.replace(/(\d{4}-\d{2}-\d{2}) (\d):/, "$1 0$2:");
  return new Date(normalized.replace(" ", "T"));
};

const isTrip = (entry: ScheduleEntry): entry is TripEntry =>
  entry.type === "TRIP";

// Dynamically load all JSON files from flights folder
const loadScheduleData = (): ScheduleEntry[] => {
  const modules = import.meta.glob("../flights/*.json", { eager: true });
  const allData: ScheduleEntry[] = [];

  Object.values(modules).forEach((module: any) => {
    if (Array.isArray(module.default)) {
      allData.push(...module.default);
    }
  });

  return allData;
};

interface CurrentStatus {
  state: "HOME" | "AWAY" | "FLYING" | "STANDBY";
  location: string;
  until?: Date;
  nextEvent?: Date;
  details?: string;
  entry?: ScheduleEntry;
}

const formatTimeUntil = (target: Date, now: Date): string => {
  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  return `${hours}h ${minutes}m`;
};

const getCurrentStatus = (
  schedule: ScheduleEntry[],
  now: Date
): CurrentStatus => {
  // Sort schedule by start time
  const sortedSchedule = [...schedule].sort((a, b) => {
    const aStart = isTrip(a)
      ? parseDate(a.outbound.departure)
      : parseDate(a.details.departure_time);
    const bStart = isTrip(b)
      ? parseDate(b.outbound.departure)
      : parseDate(b.details.departure_time);
    return aStart.getTime() - bStart.getTime();
  });

  // Check current status
  for (const entry of sortedSchedule) {
    if (isTrip(entry)) {
      const start = parseDate(entry.outbound.departure);
      const end = parseDate(entry.inbound.arrival);

      if (now >= start && now <= end) {
        const outArr = parseDate(entry.outbound.arrival);
        if (now <= outArr) {
          return {
            state: "FLYING",
            location: `Flying to ${entry.destination}`,
            until: end,
            entry,
          };
        }
        const inDep = parseDate(entry.inbound.departure);
        if (now >= inDep) {
          return {
            state: "FLYING",
            location: `Flying to IST`,
            until: end,
            entry,
          };
        }
        return {
          state: "AWAY",
          location: entry.destination,
          until: end,
          entry,
        };
      }
    } else {
      const start = parseDate(entry.details.departure_time);
      const end = parseDate(entry.details.arrival_time);

      if (now >= start && now <= end) {
        if (
          entry.details.flight_number === "HSBY" ||
          entry.details.flight_number === "CFR"
        ) {
          // Find next event after this standby
          let nextEvent: Date | undefined;
          for (const nextEntry of sortedSchedule) {
            const nextStart = isTrip(nextEntry)
              ? parseDate(nextEntry.outbound.departure)
              : parseDate(nextEntry.details.departure_time);
            if (nextStart > end) {
              nextEvent = nextStart;
              break;
            }
          }
          return {
            state: "STANDBY",
            location:
              entry.details.flight_number === "HSBY"
                ? "Home Standby"
                : "Call For Roster",
            until: end,
            nextEvent,
            entry,
          };
        }
        return {
          state: "FLYING",
          location: `Flight ${entry.details.flight_number}`,
          until: end,
          entry,
        };
      }
    }
  }

  // She's home - find next event
  let nextEvent: Date | undefined;
  for (const entry of sortedSchedule) {
    const start = isTrip(entry)
      ? parseDate(entry.outbound.departure)
      : parseDate(entry.details.departure_time);
    if (start > now) {
      nextEvent = start;
      break;
    }
  }

  return { state: "HOME", location: "Home", nextEvent };
};

export const ScheduleWidget: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleData] = useState<ScheduleEntry[]>(() => loadScheduleData());
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(
    null
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const status = useMemo(
    () => getCurrentStatus(scheduleData, now),
    [scheduleData, now]
  );

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="h-full flex flex-col justify-between cursor-pointer group p-4 rounded-lg"
      >
        <div className="flex justify-between items-start">
          <div className="p-2 rounded-lg bg-nord-3 text-nord-6 group-hover:bg-nord-9 group-hover:text-nord-0 transition-colors">
            {status.state === "HOME" ? (
              <Home size={24} />
            ) : status.state === "STANDBY" ? (
              <Clock size={24} />
            ) : (
              <Plane
                size={24}
                className={status.state === "FLYING" ? "animate-pulse" : ""}
              />
            )}
          </div>
          <div className="text-xs font-mono text-nord-3 uppercase tracking-widest">
            STATUS
          </div>
        </div>

        <div>
          <div className="text-nord-4 font-medium text-lg leading-tight mb-1">
            {status.state === "HOME"
              ? "Elif is Home"
              : status.state === "STANDBY"
              ? status.location
              : status.state === "AWAY"
              ? `In ${status.location}`
              : status.location}
          </div>

          {(status.state === "FLYING" || status.state === "AWAY") &&
            status.until && (
              <div className="text-sm text-nord-6 font-mono">
                Home in {formatTimeUntil(status.until, now)}
              </div>
            )}

          {(status.state === "HOME" || status.state === "STANDBY") &&
            status.nextEvent && (
              <div className="text-sm text-nord-3 font-mono">
                Next: {formatTimeUntil(status.nextEvent, now)}
              </div>
            )}

          {status.state === "STANDBY" && status.until && (
            <div className="text-xs text-nord-3 font-mono opacity-70">
              Until{" "}
              {status.until.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}

          {status.state === "HOME" && !status.nextEvent && (
            <div className="text-sm text-nord-3 font-mono">
              No upcoming flights
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ScheduleModal
          scheduleData={scheduleData}
          onClose={() => setIsModalOpen(false)}
          onEventClick={(entry) => {
            setSelectedEntry(entry);
          }}
        />
      )}

      {selectedEntry && (
        <FlightDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </>
  );
};

const ScheduleModal: React.FC<{
  scheduleData: ScheduleEntry[];
  onClose: () => void;
  onEventClick: (entry: ScheduleEntry) => void;
}> = ({ scheduleData, onClose, onEventClick }) => {
  // Start with current month, allow free navigation
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const year = currentYear;
  const month = currentMonth;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonthRaw = new Date(year, month, 1).getDay();
  const firstDayOfMonth = firstDayOfMonthRaw === 0 ? 6 : firstDayOfMonthRaw - 1;

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const eventBlocks = useMemo(() => {
    const blocks: {
      day: number;
      start: number;
      height: number;
      color: string;
      title: string;
      entry: ScheduleEntry;
    }[] = [];

    scheduleData.forEach((entry) => {
      let start: Date, end: Date, color: string, title: string;

      if (isTrip(entry)) {
        start = parseDate(entry.outbound.departure);
        end = parseDate(entry.inbound.arrival);
        color = "bg-nord-10";
        title = entry.destination.split(" ")[0];
      } else {
        start = parseDate(entry.details.departure_time);
        end = parseDate(entry.details.arrival_time);
        color = "bg-nord-14";
        title = entry.details.flight_number;
      }

      let current = new Date(start);
      while (current < end) {
        const currentDay = current.getDate();
        const currentMonth = current.getMonth();
        const currentYear = current.getFullYear();

        if (currentMonth !== month || currentYear !== year) {
          current.setDate(current.getDate() + 1);
          current.setHours(0, 0, 0, 0);
          continue;
        }

        let startHour = 0;
        if (
          current.getDate() === start.getDate() &&
          current.getMonth() === start.getMonth() &&
          current.getFullYear() === start.getFullYear()
        ) {
          startHour = start.getHours() + start.getMinutes() / 60;
        }

        let endHour = 24;
        const endOfDay = new Date(current);
        endOfDay.setHours(23, 59, 59, 999);

        if (end <= endOfDay) {
          endHour = end.getHours() + end.getMinutes() / 60;
        }

        const top = startHour * 5;
        const height = (endHour - startHour) * 5;

        blocks.push({
          day: currentDay,
          start: top,
          height,
          color,
          title,
          entry,
        });

        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
      }
    });
    return blocks;
  }, [scheduleData, year, month]);

  const monthName = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (month === 0) {
      setCurrentMonth(11);
      setCurrentYear(year - 1);
    } else {
      setCurrentMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setCurrentMonth(0);
      setCurrentYear(year + 1);
    } else {
      setCurrentMonth(month + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8"
      onClick={onClose}
    >
      <div
        className="bg-nord-0 w-full h-full max-w-7xl rounded-2xl border-2 border-nord-8 flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b-2 border-nord-3 bg-nord-1">
          <div className="flex items-center gap-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-nord-2 rounded text-nord-3 hover:text-nord-8 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-2xl font-medium text-nord-6 uppercase tracking-widest flex items-center gap-4">
              <CalendarIcon size={28} className="text-nord-8" />
              {monthName}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-nord-2 rounded text-nord-3 hover:text-nord-8 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-nord-1 rounded text-nord-3 hover:text-nord-11 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-nord-0">
          <div className="grid grid-cols-7 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-bold text-nord-6 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}

            {blanks.map((i) => (
              <div key={`blank-${i}`} className="min-h-[150px]"></div>
            ))}

            {days.map((day) => {
              const blocks = eventBlocks.filter((b) => b.day === day);
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={day}
                  className={`min-h-[150px] relative bg-nord-1 rounded-md border border-nord-3 overflow-hidden ${
                    isToday ? "ring-2 ring-nord-8" : ""
                  }`}
                >
                  <div
                    className={`absolute top-2 right-2 font-mono text-sm z-20 ${
                      isToday ? "text-nord-8 font-bold" : "text-nord-6"
                    }`}
                  >
                    {day}
                  </div>

                  <div className="absolute top-8 left-2 right-2 bottom-2 overflow-hidden">
                    {blocks.map((block, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(block.entry);
                        }}
                        className={`absolute left-0 right-0 ${block.color} rounded-sm text-sm text-nord-4 px-1 overflow-hidden whitespace-nowrap cursor-pointer`}
                        style={{
                          top: `${block.start}px`,
                          height: `${Math.max(block.height, 2)}px`,
                        }}
                        title={block.title}
                      >
                        {block.height > 10 && block.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const FlightDetailModal: React.FC<{
  entry: ScheduleEntry;
  onClose: () => void;
}> = ({ entry, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const isTrip = entry.type === "TRIP";
  const tripEntry = isTrip ? (entry as TripEntry) : null;
  const eventEntry = !isTrip ? (entry as EventEntry) : null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-nord-0 border-2 border-nord-8 w-full max-w-lg p-8 rounded-2xl shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="p-1 text-nord-3 hover:text-nord-11 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        <div className="mb-8 border-b-2 border-nord-1 pb-4">
          <h2 className="text-xl font-medium text-nord-6 mb-2 uppercase">
            {isTrip
              ? tripEntry!.destination
              : eventEntry!.details.flight_number}
          </h2>
          <div className="flex items-center gap-3 text-nord-13 text-base font-mono font-medium">
            <Plane size={20} />
            <span>
              {isTrip
                ? `${tripEntry!.outbound.flight} / ${tripEntry!.inbound.flight}`
                : eventEntry!.details.flight_number}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {isTrip && tripEntry && (
            <>
              {/* Outbound Flight */}
              <div className="bg-nord-1 p-4 text-base text-nord-4 leading-relaxed font-mono border-l-4 border-nord-10 rounded-r-lg">
                <div className="flex items-center gap-2 text-nord-3 text-xs uppercase tracking-wider mb-2 font-bold">
                  <Plane size={14} className="rotate-45" /> Outbound
                </div>
                <div className="space-y-1">
                  <div>Flight: {tripEntry.outbound.flight}</div>
                  <div>
                    Departs:{" "}
                    {parseDate(tripEntry.outbound.departure).toLocaleString()}
                  </div>
                  <div>
                    Arrives:{" "}
                    {parseDate(tripEntry.outbound.arrival).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Rest Time */}
              <div className="bg-nord-1 p-4 text-base text-nord-4 leading-relaxed font-mono border-l-4 border-nord-3 rounded-r-lg">
                <div className="flex items-center gap-2 text-nord-3 text-xs uppercase tracking-wider mb-2 font-bold">
                  <Clock size={14} /> Rest Time
                </div>
                <div>{tripEntry.rest_time}</div>
              </div>

              {/* Inbound Flight */}
              <div className="bg-nord-1 p-4 text-base text-nord-4 leading-relaxed font-mono border-l-4 border-nord-10 rounded-r-lg">
                <div className="flex items-center gap-2 text-nord-3 text-xs uppercase tracking-wider mb-2 font-bold">
                  <Plane size={14} className="-rotate-45" /> Inbound
                </div>
                <div className="space-y-1">
                  <div>Flight: {tripEntry.inbound.flight}</div>
                  <div>
                    Departs:{" "}
                    {parseDate(tripEntry.inbound.departure).toLocaleString()}
                  </div>
                  <div>
                    Arrives:{" "}
                    {parseDate(tripEntry.inbound.arrival).toLocaleString()}
                  </div>
                </div>
              </div>
            </>
          )}

          {!isTrip && eventEntry && (
            <>
              <div className="bg-nord-1 p-4 text-base text-nord-4 leading-relaxed font-mono border-l-4 border-nord-14 rounded-r-lg">
                <div className="flex items-center gap-2 text-nord-3 text-xs uppercase tracking-wider mb-2 font-bold">
                  <MapPin size={14} /> Location
                </div>
                <div className="space-y-1">
                  <div>From: {eventEntry.details.departure_airport}</div>
                  <div>To: {eventEntry.details.arrival_airport}</div>
                </div>
              </div>

              <div className="bg-nord-1 p-4 text-base text-nord-4 leading-relaxed font-mono border-l-4 border-nord-14 rounded-r-lg">
                <div className="flex items-center gap-2 text-nord-3 text-xs uppercase tracking-wider mb-2 font-bold">
                  <Clock size={14} /> Schedule
                </div>
                <div className="space-y-1">
                  <div>
                    Start:{" "}
                    {parseDate(
                      eventEntry.details.departure_time
                    ).toLocaleString()}
                  </div>
                  <div>
                    End:{" "}
                    {parseDate(
                      eventEntry.details.arrival_time
                    ).toLocaleString()}
                  </div>
                  <div>Duration: {eventEntry.details.duration}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
