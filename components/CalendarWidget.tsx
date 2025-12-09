import React, { useState, useEffect } from "react";
import { CalendarEvent, CalendarAccount, CalendarConfig } from "../types";
import {
  listEvents,
  listCalendars,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../services/calendarService";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Video,
  ExternalLink,
  Calendar as CalendarIcon,
  Plus,
  CheckSquare,
  CalendarDays,
  Trash2,
  Edit,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";

interface CalendarWidgetProps {
  mode: "MONTH" | "AGENDA";
  accounts: CalendarAccount[];
  onConnect: () => void;
  onRefresh: () => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  mode,
  accounts,
  onConnect,
  onRefresh,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<
    CalendarEvent[] | null
  >(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Add Event State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEventDate, setAddEventDate] = useState<Date>(new Date());
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = async () => {
    if (accounts.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      // Determine range based on mode
      let start: Date, end: Date;

      if (mode === "AGENDA") {
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      } else {
        start = new Date(year, month, 1, 0, 0, 0);
        end = new Date(year, month + 1, 0, 23, 59, 59);
      }

      const allEvents: CalendarEvent[] = [];
      const fetchPromises: Promise<void>[] = [];

      accounts.forEach((account, accountIndex) => {
         // Determine color based on account index
         // 0: Nord 9 (Blue)
         // 1: Nord 14 (Green)
         // 2: Nord 11 (Red) - default fallback for others
         let colorId = "9"; // Default Blue
         if (accountIndex === 1) colorId = "2"; // Green (Sage)
         else if (accountIndex > 1) colorId = "11"; // Red (Tomato approx)

         for (const cal of account.calendars) {
             if (cal.isVisible !== false) {
                 fetchPromises.push(
                     listEvents(account.accessToken, cal.id, start, end)
                     .then(evts => {
                         const enriched = evts.map(e => ({
                             ...e,
                             // Force color based on account index logic requested by user
                             colorId: colorId,
                             sourceCalendarId: cal.id,
                             sourceAccountEmail: account.email
                         }));
                         allEvents.push(...enriched);
                     })
                     .catch(err => {
                         console.error(`Failed to fetch for ${account.email} / ${cal.id}`, err);
                     })
                 );
             }
         }
      });

      await Promise.all(fetchPromises);
      setEvents(allEvents);
    } catch (err: any) {
      console.error(err);
      setError("PARTIAL_SYNC_FAILURE");
    } finally {
      setLoading(false);
    }
  };

  const toggleCalendarVisibility = async (accountEmail: string, calendarId: string) => {
      // Find account
      const account = accounts.find(a => a.email === accountEmail);
      if (!account) return;

      // Toggle
      const updatedCalendars = account.calendars.map(c => {
          if (c.id === calendarId) {
              return { ...c, isVisible: c.isVisible === false ? true : false };
          }
          return c;
      });

      // Optimistically update local state (passed from parent usually, but we need to trigger a parent update or update local context)
      // Since 'accounts' is a prop, we can't mutate it directly.
      // We should ideally have an 'onUpdateAccount' prop.
      // For now, let's assume we call a service and the parent 'App' will refresh eventually,
      // BUT for immediate feedback we might need to force a refresh.
      // Actually, 'updateAccountCalendars' updates Firestore. 'App.tsx' listens to real-time updates?
      // No, App.tsx uses 'getConnectedAccounts' on interval. We should probably trigger a refresh callback.
      
      // Let's implement the service call.
      // We need to import 'updateAccountCalendars' (which we need to export from authService likely or add to it)
      // See step above where I added it.
      
      try {
          const { updateAccountCalendars } = await import("../services/authService");
          await updateAccountCalendars(userEmail!, accountEmail, updatedCalendars);
          // We need to notify parent to reload accounts.
          onRefresh(); // This triggers a SILENT fetch in App.tsx
      } catch (e) {
          console.error("Failed to toggle visibility", e);
      }
  };
    // Need userEmail for firestore update.
    // 'accounts' prop doesn't have current user email directly, but we can assume the first account *might* be owner
    // OR strict way: pass 'currentUser' as prop.
    // Let's try to derive or just pass it.
    // Actually `onConnect` triggers `handleConnectCalendar` which calls `getConnectedAccounts(user.email)`.
    // It seems we don't have `user.email` here easily unless we pass it.
    // Let's temporarily use `accounts[0]?.email` assuming the first account is the logged-in user (Identity).
    const userEmail = accounts[0]?.email; 

    const handleRemoveAccount = async (accountEmail: string) => {
        if (!confirm(`Are you sure you want to disconnect ${accountEmail}?`)) return;
        
        try {
            const { removeCalendarAccount } = await import("../services/authService");
            await removeCalendarAccount(userEmail!, accountEmail);
            onRefresh();
        } catch (e) {
            console.error("Failed to remove account", e);
            alert("Failed to disconnect account");
        }
    };

  useEffect(() => {
    if (accounts.length > 0) {
      fetchEvents();
    }
  }, [accounts, year, month, mode]);

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
    fetchEvents(); // Refresh events
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
      fetchEvents();
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
    // by adding an 'initialEvent' prop to AddEventModal.
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
        <div className="text-nord-4 font-medium">SYNC_REQUIRED</div>
        <button
          onClick={onConnect}
          className="bg-nord-3 hover:bg-nord-9 hover:text-nord-1 text-nord-6 px-4 py-2 rounded transition-colors uppercase tracking-wider text-sm font-bold"
        >
          [ CONNECT_GOOGLE_CAL ]
        </button>
      </div>
    );
  }

  if (mode === "AGENDA") {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-4 pb-2 border-b-2 border-nord-1 flex justify-between items-center">
          <span className="text-nord-8 font-medium text-sm uppercase tracking-widest">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddClick(new Date())}
              className="text-nord-3 hover:text-nord-14 transition-colors"
              title="Add Event/Task"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="text-nord-3 hover:text-nord-8 disabled:animate-spin"
            >
              <Clock size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {error && (
            <div className="text-nord-11 border border-nord-11 bg-nord-11/10 p-2 rounded text-sm text-center mb-2">
              ! {error} !
            </div>
          )}
          {loading && events.length === 0 ? (
            <div className="text-center text-nord-3 animate-pulse mt-10">
              SYNCING_DATA...
            </div>
          ) : todayEvents.length > 0 ? (
            todayEvents.map((evt) => (
              <EventItem
                key={evt.id}
                evt={evt}
                onClick={() => setSelectedEvent(evt)}
              />
            ))
          ) : (
            <div className="text-center text-nord-3 text-lg italic mt-10">
              No events for today.
            </div>
          )}
        </div>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onDelete={() => handleDeleteClick(selectedEvent.id)}
            onEdit={() => handleEditEvent(selectedEvent)}
          />
        )}
        {isAddModalOpen && (
          <AddEventModal
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
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonthRaw = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon, etc.
  // Convert to Monday-based (0 = Mon, 6 = Sun)
  const firstDayOfMonth = firstDayOfMonthRaw === 0 ? 6 : firstDayOfMonthRaw - 1;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    const dayEvents = events.filter(
      (e) => e.date.getDate() === day && e.date.getMonth() === month
    );
    if (dayEvents.length > 0) {
      setSelectedDayEvents(dayEvents);
    } else {
      // If no events, open add modal directly
      const clickedDate = new Date(year, month, day);
      handleAddClick(clickedDate);
    }
  };

  const renderCalendarGrid = () => {
    const days = [];
    // Empty slots for prev month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="min-h-[30px] bg-nord-0/30 rounded-md"
        ></div>
      );
    }
    // Days
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
          onClick={() => handleDayClick(d)}
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
    <div className="flex flex-col relative font-mono">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-nord-1">
        <button
          onClick={prevMonth}
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
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-nord-1 rounded hover:text-nord-8"
        >
          <ChevronRight size={24} />
        </button>
        <button
            onClick={() => setIsAccountsModalOpen(true)}
            className="p-2 hover:bg-nord-1 rounded hover:text-nord-8 ml-2"
            title="Connected Accounts"
        >
            <Settings size={20} />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-2 text-center">
        {["MO", "TU", "WE", "TH", "FR", "SA", "SU"].map((d, i) => (
          <span key={i} className="text-sm text-nord-3 font-medium uppercase">
            {d}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-2.5">{renderCalendarGrid()}</div>

      {/* Popups */}
      {selectedDayEvents && (
        <div className="absolute inset-0 bg-nord-0/95 backdrop-blur-sm z-10 flex flex-col p-4 animate-fade-in border-2 border-nord-3 rounded-lg">
          <div className="flex justify-between items-center mb-4 border-b-2 border-nord-3 pb-2">
            <span className="text-nord-8 font-medium text-lg uppercase">
              Events [{selectedDayEvents[0].date.toLocaleDateString()}]
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddClick(selectedDayEvents[0].date)}
                className="text-nord-3 hover:text-nord-14 mr-2"
              >
                <Plus size={24} />
              </button>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="hover:text-nord-11"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 space-y-3">
            {selectedDayEvents.map((evt) => (
              <EventItem
                key={evt.id}
                evt={evt}
                onClick={() => setSelectedEvent(evt)}
              />
            ))}
          </div>
        </div>
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={() => handleDeleteClick(selectedEvent.id)}
          onEdit={() => handleEditEvent(selectedEvent)}
        />
      )}

      {isAccountsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsAccountsModalOpen(false)}>
            <div className="bg-nord-0 border-2 border-nord-8 w-full max-w-md p-6 rounded-2xl shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b border-nord-1 pb-2">
                    <h2 className="text-lg font-medium text-nord-6 uppercase">Connected Accounts</h2>
                    <button onClick={() => setIsAccountsModalOpen(false)} className="text-nord-3 hover:text-nord-11"><X size={24} /></button>
                </div>
                <div className="space-y-4 mb-6">
                    {accounts.map(acc => (
                        <div key={acc.email} className="bg-nord-1 p-3 rounded border border-nord-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Avatar 
                                        src={acc.picture} 
                                        alt={acc.name} 
                                        fallback={acc.name?.[0] || acc.email[0].toUpperCase()} 
                                    />
                                    <div>
                                        <div className="text-base font-medium text-nord-5">{acc.name || acc.email}</div>
                                        <div className="text-xs text-nord-3">{acc.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     <div className="text-xs text-nord-13 flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-nord-14 animate-pulse"></div> Active
                                     </div>
                                     <button 
                                        onClick={() => handleRemoveAccount(acc.email)}
                                        className="p-1.5 text-nord-3 hover:text-nord-11 hover:bg-nord-0 rounded transition-colors"
                                        title="Disconnect Account"
                                     >
                                        <LogOut size={14} />
                                     </button>
                                </div>
                            </div>
                            {/* Calendar List Toggles */}
                            <div className="pl-12 space-y-2 border-t border-nord-2 pt-3 mt-2">
                                {acc.calendars.map(cal => (
                                    <label key={cal.id} className="flex items-center gap-3 text-sm text-nord-4 cursor-pointer hover:text-nord-6 select-none transition-opacity">
                                        <input 
                                            type="checkbox" 
                                            checked={cal.isVisible !== false} 
                                            onChange={() => toggleCalendarVisibility(acc.email, cal.id)}
                                            className="rounded border-nord-3 bg-nord-0 text-nord-9 focus:ring-nord-9 w-4 h-4"
                                        />
                                        <span className={cal.isVisible === false ? "opacity-40" : ""}>{cal.summary}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => {
                        onConnect();
                        setIsAccountsModalOpen(false);
                    }}
                    className="w-full py-3 bg-nord-3 hover:bg-nord-9 hover:text-nord-1 text-nord-6 font-bold rounded transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> CONNECT ANOTHER ACCOUNT
                </button>
            </div>
        </div>
      )}

      {isAddModalOpen && (
        <AddEventModal
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

// Extracted Event Item for reuse and consistent styling
const EventItem: React.FC<{ evt: CalendarEvent; onClick: () => void }> = ({
  evt,
  onClick,
}) => {
  // Use event color mapping:
  // "9" (Blue) -> Account 1
  // "2" (Green) -> Account 2
  // "11" (Red) -> Account 3
  
  // Map colorId to Border/Hover classes
  let borderColor = "border-nord-9";
  let hoverColor = "hover:bg-nord-9/10";
  
  if (evt.colorId === "2") {
      borderColor = "border-nord-14";
      hoverColor = "hover:bg-nord-14/10";
  } else if (evt.colorId === "11") {
      borderColor = "border-nord-11";
      hoverColor = "hover:bg-nord-11/10";
  }

  return (
    <div
      onClick={onClick}
      className={`bg-nord-1 p-4 rounded-md border-l-4 ${borderColor} ${hoverColor} transition-colors cursor-pointer group`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-nord-5">{evt.title}</span>
        <span className="text-sm font-mono text-nord-3 group-hover:text-nord-6 font-medium">
          {evt.time}
        </span>
      </div>
      {evt.description && (
        <p className="text-sm text-nord-4 truncate opacity-70">
          {evt.description}
        </p>
      )}
    </div>
  );
};

const EventDetailModal: React.FC<{
  event: CalendarEvent;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}> = ({ event, onClose, onDelete, onEdit }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-nord-0 border-2 border-nord-8 w-full max-w-lg p-8 rounded-2xl shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-2 text-nord-3 hover:text-nord-8 hover:bg-nord-1 rounded transition-colors"
            title="Edit"
          >
            <Edit size={20} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-nord-3 hover:text-nord-11 hover:bg-nord-1 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={20} />
          </button>
          <div className="w-px h-6 bg-nord-3/30 mx-2"></div>
          <button
            onClick={onClose}
            className="p-1 text-nord-3 hover:text-nord-11 transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        <div className="mb-8 border-b-2 border-nord-1 pb-4">
          <h2 className="text-xl font-medium text-nord-6 mb-2 uppercase">
            {event.title}
          </h2>
          <div className="flex items-center gap-3 text-nord-13 text-base font-mono font-medium">
            <Clock size={20} />
            <span>
              {event.date.toLocaleDateString()} :: {event.time}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {event.description && (
            <div className="bg-nord-1 p-4 text-base text-nord-4 leading-relaxed font-mono border-l-4 border-nord-3 rounded-r-lg">
              {event.description}
            </div>
          )}

          {event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 text-nord-8 hover:text-nord-7 text-base transition-colors border-2 border-nord-3 p-3 hover:bg-nord-1 hover:border-nord-8 group rounded-lg"
            >
              <Video size={20} />
              <span className="truncate font-medium">{event.link}</span>
              <ExternalLink
                size={16}
                className="ml-auto opacity-50 group-hover:opacity-100"
              />
            </a>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-nord-3 text-xs uppercase tracking-wider mb-2 font-bold">
                <Users size={14} /> Attendees
              </div>
              <div className="flex flex-wrap gap-2">
                {event.attendees.map((a, i) => (
                  <div
                    key={i}
                    className="bg-nord-1 border border-nord-3 rounded-full px-3 py-1 text-xs text-nord-4 flex items-center gap-2"
                  >
                    {a.email}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AddEventModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  accounts: CalendarAccount[];
  onSuccess: () => void;
  initialEvent?: CalendarEvent | null;
}> = ({
  isOpen,
  onClose,
  date,
  accounts,
  onSuccess,
  initialEvent,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const [title, setTitle] = useState(initialEvent?.title || "");
  // Removed 'type' state as we no longer distinguish between Event/Task via UI
  
  const [time, setTime] = useState(
    initialEvent?.time !== "ALL DAY" ? initialEvent?.time || "12:00" : "12:00"
  );
  const [description, setDescription] = useState(
    initialEvent?.description || ""
  );
  const [duration, setDuration] = useState(60); // Default 60 mins
  const [hasGoogleMeet, setHasGoogleMeet] = useState(
    !!initialEvent?.link?.includes("meet.google")
  );
  const [attendees, setAttendees] = useState<string[]>([]);
  const [newAttendee, setNewAttendee] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Account/Calendar Selection
  // Default to the first account and its primary calendar (or first visible writable one)
  const defaultAccount = accounts[0];
  const defaultCalendarId = defaultAccount?.calendars?.find(c => c.accessRole === 'owner' || c.accessRole === 'writer')?.id || "primary";

  const [selectedAccountEmail, setSelectedAccountEmail] = useState<string>(
    // If editing, try to find account from event, else default
    (initialEvent as any)?.sourceAccountEmail || defaultAccount?.email || ""
  );
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>(
     (initialEvent as any)?.sourceCalendarId || defaultCalendarId
  );

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      // No strict type setting anymore
      if (initialEvent.time && initialEvent.time !== "ALL DAY") {
        setTime(initialEvent.time);
      }
      setDescription(initialEvent.description || "");
      setHasGoogleMeet(!!initialEvent.link?.includes("meet.google"));
      if (initialEvent.attendees) {
        setAttendees(initialEvent.attendees.map((a) => a.email));
      }
      
      const evt = initialEvent as any;
      if (evt.sourceAccountEmail) setSelectedAccountEmail(evt.sourceAccountEmail);
      if (evt.sourceCalendarId) setSelectedCalendarId(evt.sourceCalendarId);
    }
  }, [initialEvent]);

  // When account changes, reset calendar to its primary
  useEffect(() => {
      const account = accounts.find(a => a.email === selectedAccountEmail);
      if (account) {
          // If the currently selected calendar ID exists in this account, keep it. Else switch to default.
          const calExists = account.calendars.some(c => c.id === selectedCalendarId);
          if (!calExists) {
               const def = account.calendars.find(c => c.accessRole === 'owner' || c.accessRole === 'writer')?.id || "primary";
               setSelectedCalendarId(def);
          }
      }
  }, [selectedAccountEmail, accounts]);

  const handleAddAttendee = () => {
    if (newAttendee && newAttendee.includes("@")) {
      setAttendees([...attendees, newAttendee]);
      setNewAttendee("");
    }
  };

  const removeAttendee = (email: string) => {
    setAttendees(attendees.filter((a) => a !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const account = accounts.find(a => a.email === selectedAccountEmail);
    if (!account) {
        alert("Please select a valid account");
        return;
    }

    setIsSubmitting(true);
    try {
      // Construct start/end times
      const [hours, minutes] = time.split(":").map(Number);
      const startDate = new Date(date);
      startDate.setHours(hours, minutes, 0);

      const endDate = new Date(startDate);
      endDate.setMinutes(startDate.getMinutes() + duration);

      // Determine color based on account index to match display logic
      const accountIndex = accounts.findIndex(a => a.email === selectedAccountEmail);
      let colorId = "9"; // default
      if (accountIndex === 1) colorId = "2";
      else if (accountIndex > 1) colorId = "11";

      const eventBody: any = {
        summary: title,
        description: description,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        colorId: colorId,
        attendees: attendees.map((email) => ({ email })),
      };

      if (hasGoogleMeet) {
        eventBody.conferenceData = {
          createRequest: {
            requestId: Math.random().toString(36).substring(7),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        };
      }

      if (initialEvent) {
        // We use the account token associated with where the event currently is.
        // Moving events between calendars is NOT supported by updateEvent (needs move).
        // For now, assume we are updating in place.
        // If user changed calendar in UI, we might ideally 'move' it, but let's stick to update for now
        // or disable calendar selection during edit if it's too complex.
        // Let's assume we update using the *initial* event's location logic if avail,
        // but 'selectedCalendarId' is what we want. 
        
        // If calendar ID changed, we strictly need delete + create or 'move'.
        // For simplicity, let's just update in place using selectedCalendarId (assuming user didn't change it or we support it if same).
        await updateEvent(account.accessToken, selectedCalendarId, initialEvent.id, eventBody);
      } else {
        await createEvent(account.accessToken, selectedCalendarId, eventBody);
      }

      onSuccess();
    } catch (e: any) {
      console.error(e);
      alert("Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAccount = accounts.find(a => a.email === selectedAccountEmail);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-nord-0 border-2 border-nord-8 w-full max-w-md p-6 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-medium text-nord-6 mb-6 uppercase border-b border-nord-1 pb-2">
          {initialEvent ? "Edit" : "New"} Event
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Removed Type Toggle */}

          <div className="space-y-2">
            <label className="block text-nord-3 text-xs uppercase tracking-wider">
               Properties
            </label>
            
            {/* Account Selector */}
            {initialEvent ? (
                 <div className="w-full bg-nord-0 border border-nord-3 rounded p-2 text-nord-4 text-sm opacity-70">
                    Account: {selectedAccountEmail} (Locked)
                 </div>
            ) : (
                accounts.length > 1 && (
                    <select 
                        value={selectedAccountEmail} 
                        onChange={e => setSelectedAccountEmail(e.target.value)}
                        className="w-full bg-nord-1 border border-nord-3 rounded p-2 text-nord-4 text-sm focus:border-nord-8 focus:outline-none mb-2"
                    >
                        {accounts.map(a => (
                            <option key={a.email} value={a.email}>{a.email} {a.name ? `(${a.name})` : ''}</option>
                        ))}
                    </select>
                )
            )}
            
            {/* Calendar Selector REMOVED - Using {selectedCalendarId} implicitly */}
          </div>

          <div>
            <label className="block text-nord-3 text-xs uppercase tracking-wider mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-nord-1 border border-nord-3 rounded p-2 text-nord-4 focus:border-nord-8 focus:outline-none"
              placeholder="What's happening?"
              autoFocus
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-nord-3 text-xs uppercase tracking-wider mb-1">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-nord-1 border border-nord-3 rounded p-2 text-nord-4 focus:border-nord-8 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-nord-3 text-xs uppercase tracking-wider mb-1">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-nord-1 border border-nord-3 rounded p-2 text-nord-4 focus:border-nord-8 focus:outline-none"
              >
                <option value={15}>15 mins</option>
                <option value={30}>30 mins</option>
                <option value={60}>1 Hour</option>
                <option value={90}>1.5 Hours</option>
                <option value={120}>2 Hours</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="googleMeet"
              checked={hasGoogleMeet}
              onChange={(e) => setHasGoogleMeet(e.target.checked)}
              className="w-4 h-4 rounded border-nord-3 bg-nord-1 text-nord-9 focus:ring-nord-9"
            />
            <label
              htmlFor="googleMeet"
              className="text-nord-4 text-sm flex items-center gap-2 cursor-pointer"
            >
              <Video size={16} /> Add Google Meet Conference
            </label>
          </div>

          <div>
            <label className="block text-nord-3 text-xs uppercase tracking-wider mb-1">
              Invite People
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={newAttendee}
                onChange={(e) => setNewAttendee(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddAttendee();
                  }
                }}
                placeholder="email@example.com"
                className="flex-1 bg-nord-1 border border-nord-3 rounded p-2 text-nord-4 focus:border-nord-8 focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={handleAddAttendee}
                className="bg-nord-3 text-nord-6 px-3 rounded hover:bg-nord-2 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            {attendees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attendees.map((email) => (
                  <div
                    key={email}
                    className="bg-nord-1 border border-nord-3 rounded-full px-3 py-1 text-xs text-nord-4 flex items-center gap-2"
                  >
                    {email}
                    <button
                      onClick={() => removeAttendee(email)}
                      className="hover:text-nord-11"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-nord-3 text-xs uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-nord-1 border border-nord-3 rounded p-2 text-nord-4 focus:border-nord-8 focus:outline-none h-24 resize-none"
              placeholder="Details..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-nord-4 hover:text-nord-6 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title}
              className={`px-6 py-2 rounded font-bold text-nord-1 transition-colors bg-nord-9 hover:bg-nord-9/80 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Robust Avatar Component
const Avatar: React.FC<{ src?: string; alt?: string; fallback: string }> = ({ src, alt, fallback }) => {
    const [error, setError] = useState(false);

    if (src && !error) {
        return (
            <img 
                src={src} 
                alt={alt} 
                className="w-10 h-10 rounded-full object-cover bg-nord-3"
                onError={() => setError(true)}
                referrerPolicy="no-referrer"
            />
        );
    }
    
    return (
        <div className="w-10 h-10 rounded-full bg-nord-3 flex items-center justify-center text-nord-6 font-bold text-lg border border-nord-1">
            {fallback}
        </div>
    );
};
