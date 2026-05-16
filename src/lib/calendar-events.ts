import RNCalendarEvents, {
  type AuthorizationStatus,
  type CalendarEventWritable,
} from "react-native-calendar-events";

export type CalendarAuthorizationStatus = AuthorizationStatus;
export type WritableCalendar = {
  id: string;
  title: string;
  color?: string;
  isPrimary?: boolean;
};

const unavailableMessage =
  "Calendar integration is not available in this build yet. Rebuild the native app with `expo run:ios`, and use that build instead of Expo Go.";

function requireCalendarModule() {
  if (!RNCalendarEvents) {
    throw new Error(unavailableMessage);
  }

  return RNCalendarEvents;
}

export function isCalendarEventsAvailable(): boolean {
  return Boolean(RNCalendarEvents);
}

export function getCalendarUnavailableMessage(): string {
  return unavailableMessage;
}

export async function checkCalendarPermissions(): Promise<CalendarAuthorizationStatus> {
  return requireCalendarModule().checkPermissions();
}

export async function requestCalendarPermissions(): Promise<CalendarAuthorizationStatus> {
  return requireCalendarModule().requestPermissions();
}

export async function findWritableCalendars(): Promise<WritableCalendar[]> {
  const calendars = await requireCalendarModule().findCalendars();

  return calendars
    .filter((calendar) => calendar.allowsModifications)
    .map((calendar) => ({
      id: calendar.id,
      title: calendar.title,
      color: calendar.color,
      isPrimary: calendar.isPrimary,
    }));
}

export async function createCalendarEvent(
  title: string,
  details: CalendarEventWritable,
): Promise<string> {
  return requireCalendarModule().saveEvent(title, details);
}
