import { CalendarEvent } from '../types';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '../config';

export const listCalendars = async (accessToken: string) => {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      console.error("Failed to list calendars");
      return [];
    }

    const data = await response.json();
    console.log("AVAILABLE CALENDARS:", data.items);
    return data.items || [];
  } catch (e) {
    console.error("Error listing calendars", e);
    return [];
  }
};

export const listEvents = async (accessToken: string, timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> => {
  try {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    console.log(`Fetching events from ${timeMin.toISOString()} to ${timeMax.toISOString()}`);
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      const errorBody = await response.text();
      console.error('Calendar API Error Response:', response.status, errorBody);
      throw new Error(`Failed to fetch calendar events: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.items?.length || 0} events`);

    return (data.items || []).map((item: any) => {
      const start = item.start.dateTime || item.start.date;
      const dateObj = new Date(start);
      
      // Check if it's an all-day event
      const isAllDay = !item.start.dateTime;

      // Extract Video Link
      // 1. Check Google Meet (conferenceData)
      let videoLink = item.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;

      // 2. If no Meet, check Location for Zoom/Teams/etc
      if (!videoLink && item.location && (item.location.includes('zoom.us') || item.location.includes('teams.microsoft') || item.location.includes('meet.google'))) {
        videoLink = item.location;
      }

      // 3. If still nothing, check Description for the first URL that looks like a meeting link
      if (!videoLink && item.description) {
         const urlRegex = /(https?:\/\/[^\s]+)/g;
         const urls = item.description.match(urlRegex);
         if (urls) {
            videoLink = urls.find((url: string) => url.includes('zoom.us') || url.includes('teams.microsoft') || url.includes('meet.google'));
         }
      }
      
      return {
        id: item.id,
        title: item.summary || '(No Title)',
        date: dateObj,
        description: item.description, // Description is already passed, just ensuring it's explicit
        link: videoLink, // Only use detected video links, don't fallback to generic calendar URL
        isTimeSpecific: !isAllDay,
        time: isAllDay ? 'ALL DAY' : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
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



export const createEvent = async (accessToken: string, event: any) => {
  try {
    // conferenceDataVersion=1 is required to create Google Meet links
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

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

export const updateEvent = async (accessToken: string, eventId: string, event: any) => {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?conferenceDataVersion=1`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

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

export const deleteEvent = async (accessToken: string, eventId: string) => {
  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

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

// --- OAUTH HELPERS FOR "FOREVER ACCESS" ---

export const exchangeCodeForToken = async (code: string) => {
  try {
    const params = new URLSearchParams({
      code: code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: window.location.origin, // Must match the one in Google Console
      grant_type: 'authorization_code',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to exchange code');
    }
    
    return data; // Contains access_token, refresh_token, expires_in, etc.
  } catch (error) {
    console.error("Token Exchange Error:", error);
    throw error;
  }
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to refresh token');
    }

    return data; // Contains new access_token, expires_in
  } catch (error) {
    console.error("Token Refresh Error:", error);
    throw error;
  }
};
