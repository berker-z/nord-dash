export enum WidgetType {
  CALENDAR = 'CALENDAR',
  AGENDA = 'AGENDA',
  TODO = 'TODO',
  CRYPTO = 'CRYPTO',
  BIBLE = 'BIBLE'
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
