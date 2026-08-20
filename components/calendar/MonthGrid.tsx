import React from "react";
import { CalendarEvent } from "../../types";
import { ChevronLeft, ChevronRight, Plus, X, Settings } from "lucide-react";
import { EventItem } from "./EventItem";
import { ModalFrame } from "../ui/ModalFrame";

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
      days.push(<div key={`empty-${i}`} className="min-h-[30px]"></div>);
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
                min-h-[30px] py-1 flex flex-col items-center justify-center cursor-pointer transition-colors relative
                ${
                  isToday
                    ? "bg-accent text-divider font-medium"
                    : "hover:bg-raised text-ink"
                }
                ${hasEvents && !isToday ? "text-accent" : ""}
            `}
        >
          <span className="font-medium mb-2">{d}</span>
          {hasEvents && !isToday && (
            <div className="w-1 h-1 rounded-full bg-blue absolute bottom-1"></div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-divider">
        <button
          onClick={onPrevMonth}
          className="p-1.5 text-muted hover:text-accent transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-normal text-ink tracking-[0.22em] uppercase">
          {currentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onNextMonth}
            className="p-1.5 text-muted hover:text-accent transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          {onOpenAccounts && (
            <button
              onClick={onOpenAccounts}
              className="p-1.5 text-muted hover:text-accent transition-colors"
              title="Connected Accounts"
            >
              <Settings size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1 text-center">
        {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((d, i) => (
          <span key={i} className="text-[10px] text-muted uppercase tracking-[0.08em]">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{renderCalendarGrid()}</div>

      {selectedDayEvents && (
        <ModalFrame
          title="Events"
          subtitle={selectedDayEvents[0].date.toLocaleDateString()}
          size="md"
          tone="info"
          onClose={onCloseDayModal}
          hideHeader
          bodyClassName="space-y-3"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-blue">
              Events [{selectedDayEvents[0].date.toLocaleDateString()}]
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAddFromDay(selectedDayEvents[0].date)}
                className="p-2 text-muted hover:text-green hover:bg-raised transition-colors"
                title="Add event"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={onCloseDayModal}
                className="p-2 text-muted hover:text-red hover:bg-raised transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="h-px bg-divider" />
          {selectedDayEvents.map((evt) => (
            <EventItem
              key={evt.id}
              evt={evt}
              onClick={() => onSelectEvent(evt)}
            />
          ))}
        </ModalFrame>
      )}
    </>
  );
};
