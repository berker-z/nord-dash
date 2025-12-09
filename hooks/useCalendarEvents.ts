import { useCallback, useEffect, useState } from "react";
import { CalendarAccount, CalendarEvent } from "../types";
import { listEvents } from "../services/calendarService";

interface Options {
  accounts: CalendarAccount[];
  mode: "MONTH" | "AGENDA";
  currentDate: Date;
}

// Provides calendar events with consistent color + source metadata.
export const useCalendarEvents = ({ accounts, mode, currentDate }: Options) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (accounts.length === 0) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Determine range based on mode
    let start: Date;
    let end: Date;

    if (mode === "AGENDA") {
      const now = new Date();
      start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0
      );
      end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59
      );
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      start = new Date(year, month, 1, 0, 0, 0);
      end = new Date(year, month + 1, 0, 23, 59, 59);
    }

    const allEvents: CalendarEvent[] = [];
    const fetchPromises: Promise<void>[] = [];

    const accountColors = ["9", "2", "11", "12", "13", "14", "15"];

    accounts.forEach((account, accountIndex) => {
      const colorId = accountColors[accountIndex % accountColors.length];

      account.calendars
        .filter((cal) => cal.isVisible !== false)
        .forEach((cal) => {
          fetchPromises.push(
            listEvents(account.accessToken, cal.id, start, end)
              .then((evts) => {
                const enriched = evts.map((e) => ({
                  ...e,
                  colorId,
                  sourceCalendarId: cal.id,
                  sourceAccountEmail: account.email,
                })) as CalendarEvent[];
                allEvents.push(...enriched);
              })
              .catch((err) => {
                console.error(
                  `Failed to fetch for ${account.email} / ${cal.id}`,
                  err
                );
              })
          );
        });
    });

    try {
      await Promise.all(fetchPromises);
      setEvents(allEvents);
    } catch (e) {
      console.error(e);
      setError("PARTIAL_SYNC_FAILURE");
    } finally {
      setLoading(false);
    }
  }, [accounts, mode, currentDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { events, loading, error, refresh };
};
