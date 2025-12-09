import React from "react";
import { CalendarEvent } from "../../types";
import { ChevronLeft, ChevronRight, Plus, X, Settings } from "lucide-react";

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (day: number) => void;
  onCloseDayModal: () => void;
  onAddFromDay: (date: Date) => void;
  selectedDayEvents: CalendarEvent[] | null;
  onSelectEvent: (evt: CalendarEvent) => void;
  onOpenAccounts?: () => void;
}

export const MonthGrid: React.FC<Props> = ({
  currentDate,
  events,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  onCloseDayModal,
  onAddFromDay,
  selectedDayEvents,
  onSelectEvent,
  onOpenAccounts,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonthRaw = new Date(year, month, 1).getDay();
  const firstDayOfMonth = firstDayOfMonthRaw === 0 ? 6 : firstDayOfMonthRaw - 1;

  const renderCalendarGrid = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="min-h-[30px] bg-nord-0/30 rounded-md"
        ></div>
      );
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const hasEvents = events.some(
        (e) => e.date.getDate() === d && e.date.getMonth() === month
      );
      const isToday =
        new Date().getDate() === d &&
        new Date().getMonth() === month &&
        new Date().getFullYear() === year;

      days.push(
        <div
          key={d}
          onClick={() => onDayClick(d)}
          className={`
                min-h-[30px] py-1 flex flex-col items-center justify-center cursor-pointer transition-all relative rounded-md
                ${
                  isToday
                    ? "bg-nord-3 text-nord-6 font-medium ring-2 ring-nord-8"
                    : "hover:bg-nord-1 text-nord-4"
                }
                ${hasEvents ? "text-nord-8" : ""}
            `}
        >
          <span className="font-medium mb-3">{d}</span>
          {hasEvents && (
            <div className="w-1.5 h-1.5 rounded-full bg-nord-13 absolute bottom-1"></div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-nord-1">
        <button
          onClick={onPrevMonth}
          className="p-2 hover:bg-nord-1 rounded hover:text-nord-8"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="font-medium text-lg text-nord-4 uppercase tracking-widest">
          {currentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onNextMonth}
            className="p-2 hover:bg-nord-1 rounded hover:text-nord-8"
          >
            <ChevronRight size={24} />
          </button>
          {onOpenAccounts && (
            <button
              onClick={onOpenAccounts}
              className="p-2 hover:bg-nord-1 rounded hover:text-nord-8"
              title="Connected Accounts"
            >
              <Settings size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2 text-center">
        {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((d, i) => (
          <span key={i} className="text-sm text-nord-3 font-medium uppercase">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2.5">{renderCalendarGrid()}</div>

      {selectedDayEvents && (
        <div className="absolute inset-0 bg-nord-0/95 backdrop-blur-sm z-10 flex flex-col p-4 animate-fade-in border-2 border-nord-3 rounded-lg">
          <div className="flex justify-between items-center mb-4 border-b-2 border-nord-3 pb-2">
            <span className="text-nord-8 font-medium text-lg uppercase">
              Events [{selectedDayEvents[0].date.toLocaleDateString()}]
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAddFromDay(selectedDayEvents[0].date)}
                className="text-nord-3 hover:text-nord-14 mr-2"
              >
                <Plus size={24} />
              </button>
              <button onClick={onCloseDayModal} className="hover:text-nord-11">
                <X size={24} />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 space-y-3">
            {selectedDayEvents.map((evt) => (
              <EventItem
                key={evt.id}
                evt={evt}
                onClick={() => onSelectEvent(evt)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};
