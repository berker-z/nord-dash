import React, { useState } from "react";
import { CalendarEvent, CalendarAccount } from "../types";
import { deleteEvent } from "../services/calendarService";
import { X, Clock, Calendar as CalendarIcon, Plus } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";
import { useCalendarEvents } from "../hooks/useCalendarEvents";
import { EventItem } from "./calendar/EventItem";
import { EventDetailModal } from "./calendar/EventDetailModal";
import { EventFormModal } from "./calendar/EventFormModal";
import { AccountModal } from "./calendar/AccountModal";
import { AgendaView } from "./calendar/AgendaView";
import { MonthGrid } from "./calendar/MonthGrid";

interface CalendarWidgetProps {
  mode: "MONTH" | "AGENDA";
  accounts: CalendarAccount[];
  onConnect: () => void;
  onRefresh: () => void;
  onRemoveAccount: (accountEmail: string) => Promise<void>;
  accountError?: string | null;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  mode,
  accounts,
  onConnect,
  onRefresh,
  onRemoveAccount,
  accountError,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<
    CalendarEvent[] | null
  >(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const { events, loading, error, refresh } = useCalendarEvents({
    accounts,
    mode,
    currentDate,
  });

  // Add Event State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEventDate, setAddEventDate] = useState<Date>(new Date());
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handleRemoveAccount = async (accountEmail: string) => {
    if (!confirm(`Are you sure you want to disconnect ${accountEmail}?`)) return;

    try {
      await onRemoveAccount(accountEmail);
      onRefresh();
    } catch (e) {
      console.error("Failed to remove account", e);
      alert("Failed to disconnect account");
    }
  };

  // Filter for Agenda Mode (Today)
  const todayEvents = events.filter((e) => {
    const today = new Date();
    return (
      e.date.getDate() === today.getDate() &&
      e.date.getMonth() === today.getMonth() &&
      e.date.getFullYear() === today.getFullYear()
    );
  });

  const handleAddClick = (date: Date) => {
    setAddEventDate(date);
    setIsAddModalOpen(true);
  };

  const handleEventCreated = () => {
    setIsAddModalOpen(false);
    refresh(); // Refresh events
  };

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!selectedEvent || !eventToDelete) return;
    
    // Find the account and token for this event
    // We attached sourceAccountEmail to the event in fetchEvents (we need to update type definition or just cast)
    const evt = selectedEvent as any;
    const account = accounts.find(a => a.email === evt.sourceAccountEmail);
    if (!account) return;

    try {
      await deleteEvent(account.accessToken, evt.sourceCalendarId, eventToDelete);
      setSelectedEvent(null);
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
      refresh();
    } catch (e: any) {
      console.error(e);
      alert("Failed to delete event");
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(null);
    setAddEventDate(event.date);
    // We need to pass the event to edit to the modal.
    // For now, let's just open the modal and we'll handle pre-filling in the modal itself
    // by adding an 'initialEvent' prop to the form modal.
    setEditingEvent(event);
    setIsAddModalOpen(true);
  };

  // State for editing
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  if (accounts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
        <div className="text-nord-3 opacity-50">
          <CalendarIcon size={48} />
        </div>
        <div className="text-nord-4">SYNC_REQUIRED</div>
        <button
          onClick={onConnect}
          className="bg-nord-3 hover:bg-nord-9 hover:text-nord-1 text-nord-6 px-4 py-2 rounded transition-colors uppercase tracking-wider text-sm"
        >
          [ CONNECT_GOOGLE_CAL ]
        </button>
      </div>
    );
  }

  if (mode === "AGENDA") {
    return (
      <div className="h-full flex flex-col">
        <AgendaView
          todayEvents={todayEvents}
          loading={loading}
          error={error}
          onAddToday={() => handleAddClick(new Date())}
          onRefresh={refresh}
          onSelectEvent={(evt) => setSelectedEvent(evt)}
        />
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onDelete={() => handleDeleteClick(selectedEvent.id)}
            onEdit={() => handleEditEvent(selectedEvent)}
          />
        )}
        {isAddModalOpen && (
          <EventFormModal
            isOpen={isAddModalOpen}
            onClose={() => {
              setIsAddModalOpen(false);
              setEditingEvent(null);
            }}
            date={addEventDate}
            accounts={accounts}
            onSuccess={handleEventCreated}
            initialEvent={editingEvent}
          />
        )}

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          title="Delete Event"
          message="Are you sure you want to delete this event? This action cannot be undone."
          onConfirm={confirmDeleteEvent}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setEventToDelete(null);
          }}
          confirmText="Delete"
          isDestructive={true}
        />
      </div>
    );
  }

  // Calendar Mode Logic
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    const dayEvents = events.filter(
      (e) => e.date.getDate() === day && e.date.getMonth() === month
    );
    if (dayEvents.length > 0) {
      setSelectedDayEvents(dayEvents);
    } else {
      const clickedDate = new Date(year, month, day);
      handleAddClick(clickedDate);
    }
  };

  return (
    <div className="flex flex-col relative font-mono">
      {accountError && (
        <div className="mb-3 p-2 text-sm text-nord-11 border border-nord-11 bg-nord-11/10 rounded">
          {accountError}
        </div>
      )}

      <MonthGrid
        currentDate={currentDate}
        events={events}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onDayClick={handleDayClick}
        onCloseDayModal={() => setSelectedDayEvents(null)}
        onAddFromDay={(date) => handleAddClick(date)}
        selectedDayEvents={selectedDayEvents}
        onSelectEvent={(evt) => setSelectedEvent(evt)}
        onOpenAccounts={() => setIsAccountsModalOpen(true)}
      />

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={() => handleDeleteClick(selectedEvent.id)}
          onEdit={() => handleEditEvent(selectedEvent)}
        />
      )}

      {isAccountsModalOpen && (
        <AccountModal
          accounts={accounts}
          onClose={() => setIsAccountsModalOpen(false)}
          onConnect={onConnect}
          onRemoveAccount={handleRemoveAccount}
        />
      )}

      {isAddModalOpen && (
        <EventFormModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingEvent(null);
          }}
          date={addEventDate}
          accounts={accounts}
          onSuccess={handleEventCreated}
          initialEvent={editingEvent}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        onConfirm={confirmDeleteEvent}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setEventToDelete(null);
        }}
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};
