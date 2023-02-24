import { Weekday } from './calendar.model';

export interface PracticeAvailability {
  id?: number;
  weekday: Weekday;
  dayStart: string;
  dayEnd: string;
}

export interface PracticeAvailabilityServer {
  id?: number;
  weekday: Weekday;
  dayStart: string;
  dayEnd: string;
}
