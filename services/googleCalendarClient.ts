import { CalendarEvent } from "../types";

// Google Calendar API client (no auth/secret handling)
export const listCalendars = async (accessToken: string) => {
  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to list calendars");
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (e) {
    console.error("Error listing calendars", e);
    return [];
  }
};

export const listEvents = async (
  accessToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date
): Promise<CalendarEvent[]> => {
  try {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      const errorBody = await response.text();
      console.error(
        "Calendar API Error Response:",
        response.status,
        errorBody
      );
      throw new Error(
        `Failed to fetch calendar events: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    return (data.items || []).map((item: any) => {
      const start = item.start.dateTime || item.start.date;
      const dateObj = new Date(start);
      const isAllDay = !item.start.dateTime;

      let videoLink =
        item.conferenceData?.entryPoints?.find(
          (ep: any) => ep.entryPointType === "video"
        )?.uri || null;

      if (
        !videoLink &&
        item.location &&
        (item.location.includes("zoom.us") ||
          item.location.includes("teams.microsoft") ||
          item.location.includes("meet.google"))
      ) {
        videoLink = item.location;
      }

      if (!videoLink && item.description) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = item.description.match(urlRegex);
        if (urls) {
          videoLink = urls.find(
            (url: string) =>
              url.includes("zoom.us") ||
              url.includes("teams.microsoft") ||
              url.includes("meet.google")
          );
        }
      }

      return {
        id: item.id,
        title: item.summary || "(No Title)",
        date: dateObj,
        description: item.description,
        link: videoLink || undefined,
        isTimeSpecific: !isAllDay,
        time: isAllDay
          ? "ALL DAY"
          : dateObj.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
        colorId: item.colorId,
        attendees: item.attendees,
      };
    });
  } catch (error: any) {
    console.error("Calendar API Error:", error);
    if (error.message === "UNAUTHORIZED") {
      throw error;
    }
    return [];
  }
};

export const createEvent = async (
  accessToken: string,
  calendarId: string,
  event: any
) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?conferenceDataVersion=1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      const error = await response.text();
      console.error("Failed to create event:", error);
      throw new Error("Failed to create event");
    }

    return await response.json();
  } catch (error) {
    console.error("Create Event Error:", error);
    throw error;
  }
};

export const updateEvent = async (
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: any
) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events/${eventId}?conferenceDataVersion=1`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      const error = await response.text();
      console.error("Failed to update event:", error);
      throw new Error("Failed to update event");
    }

    return await response.json();
  } catch (error) {
    console.error("Update Event Error:", error);
    throw error;
  }
};

export const deleteEvent = async (
  accessToken: string,
  calendarId: string,
  eventId: string
) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      const error = await response.text();
      console.error("Failed to delete event:", error);
      throw new Error("Failed to delete event");
    }

    return true;
  } catch (error) {
    console.error("Delete Event Error:", error);
    throw error;
  }
};
