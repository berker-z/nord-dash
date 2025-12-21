export enum WidgetType {
  CALENDAR = 'CALENDAR',
  AGENDA = 'AGENDA',
  TODO = 'TODO',
  CRYPTO = 'CRYPTO',
  BIBLE = 'BIBLE',
  NOTEPAD = 'NOTEPAD'
}

export interface LayoutItem {
  id: string;
  type: WidgetType;
  title: string;
  heightLevel: number; // 1 = short, 2 = medium, 3 = tall
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date; // YYYY-MM-DD
  description?: string;
  link?: string;
  isTimeSpecific: boolean;
  time?: string; // HH:MM
  colorId?: string;
  attendees?: { email: string }[];
  sourceCalendarId?: string;
  sourceAccountEmail?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CryptoData {
  symbol: string;
  price: string;
  percentChange: string;
}

export interface BibleQuote {
  reference: string;
  text: string;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
}

export interface CalendarConfig {
  id: string;
  summary: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  isVisible: boolean;
  primary?: boolean;
  accessRole?: string;
}

export interface CalendarAccount {
  email: string;
  accessToken: string;
  refreshToken: string; // Critical for offline access
  expiresAt: number;    // timestamp
  picture?: string;
  name?: string;
  calendars: CalendarConfig[];
}
