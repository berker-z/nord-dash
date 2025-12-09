import React, { useEffect, useState } from "react";
import { CalendarAccount, CalendarEvent } from "../../types";
import { createEvent, updateEvent } from "../../services/calendarService";
import { Plus, Video, X } from "lucide-react";
import { ModalFrame } from "../ui/ModalFrame";
import { Checkbox } from "../ui/Checkbox";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  accounts: CalendarAccount[];
  onSuccess: () => void;
  initialEvent?: CalendarEvent | null;
}

export const EventFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  date,
  accounts,
  onSuccess,
  initialEvent,
}) => {
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [time, setTime] = useState(
    initialEvent?.time !== "ALL DAY" ? initialEvent?.time || "12:00" : "12:00"
  );
  const [description, setDescription] = useState(
    initialEvent?.description || ""
  );
  const [duration, setDuration] = useState(60);
  const [hasGoogleMeet, setHasGoogleMeet] = useState(
    !!initialEvent?.link?.includes("meet.google")
  );
  const [attendees, setAttendees] = useState<string[]>([]);
  const [newAttendee, setNewAttendee] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultAccount = accounts[0];
  const defaultCalendarId =
    defaultAccount?.calendars?.find(
      (c) => c.accessRole === "owner" || c.accessRole === "writer"
    )?.id || "primary";

  const [selectedAccountEmail, setSelectedAccountEmail] = useState<string>(
    (initialEvent as any)?.sourceAccountEmail || defaultAccount?.email || ""
  );
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>(
    (initialEvent as any)?.sourceCalendarId || defaultCalendarId
  );

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
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

  useEffect(() => {
    const account = accounts.find((a) => a.email === selectedAccountEmail);
    if (account) {
      const calExists = account.calendars.some((c) => c.id === selectedCalendarId);
      if (!calExists) {
        const def =
          account.calendars.find(
            (c) => c.accessRole === "owner" || c.accessRole === "writer"
          )?.id || "primary";
        setSelectedCalendarId(def);
      }
    }
  }, [selectedAccountEmail, accounts, selectedCalendarId]);

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

    const account = accounts.find((a) => a.email === selectedAccountEmail);
    if (!account) {
      alert("Please select a valid account");
      return;
    }

    setIsSubmitting(true);
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const startDate = new Date(date);
      startDate.setHours(hours, minutes, 0);

      const endDate = new Date(startDate);
      endDate.setMinutes(startDate.getMinutes() + duration);

      const accountIndex = accounts.findIndex(
        (a) => a.email === selectedAccountEmail
      );
      let colorId = "9";
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
        await updateEvent(
          account.accessToken,
          selectedCalendarId,
          initialEvent.id,
          eventBody
        );
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

  const selectedAccount = accounts.find((a) => a.email === selectedAccountEmail);

  if (!isOpen) return null;

  return (
    <ModalFrame
      title={initialEvent ? "Edit Event" : "New Event"}
      subtitle={date.toDateString()}
      tone="info"
      size="md"
      onClose={onClose}
      hideHeader
      bodyClassName="space-y-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-nord-8 font-semibold">
          {initialEvent ? "Edit Event" : "New Event"}
        </div>
        <button
          onClick={onClose}
          className="p-2 text-nord-3 hover:text-nord-11 hover:bg-nord-1 rounded transition-colors"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>
      <div className="h-px bg-nord-2" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-nord-3 text-xs uppercase tracking-wider">
            Properties
          </label>

          {initialEvent ? (
            <div className="w-full bg-nord-0 border border-nord-3 rounded p-2 text-nord-4 text-sm opacity-80">
              Account: {selectedAccountEmail} (Locked)
            </div>
          ) : (
            accounts.length > 1 && (
              <select
                value={selectedAccountEmail}
                onChange={(e) => setSelectedAccountEmail(e.target.value)}
                className="w-full bg-nord-1 border border-nord-3 rounded p-2 text-nord-4 text-sm focus:border-nord-8 focus:outline-none mb-2"
              >
                {accounts.map((a) => (
                  <option key={a.email} value={a.email}>
                    {a.email} {a.name ? `(${a.name})` : ""}
                  </option>
                ))}
              </select>
            )
          )}
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

        <div className="flex items-center gap-3 py-2">
          <Checkbox
            checked={hasGoogleMeet}
            onChange={setHasGoogleMeet}
            aria-label="Toggle Google Meet"
          />
          <span className="text-nord-4 text-sm flex items-center gap-2">
            <Video size={16} /> Add Google Meet Conference
          </span>
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
            className="w-full bg-nord-1 border-nord-3 border rounded p-2 text-nord-4 focus:border-nord-8 focus:outline-none h-24 resize-none"
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
    </ModalFrame>
  );
};
