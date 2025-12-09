// Re-export the Google Calendar client so existing imports stay stable.
export {
  listCalendars,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "./googleCalendarClient";
