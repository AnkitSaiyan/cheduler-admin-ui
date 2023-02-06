import { Weekday } from './calendar.model';

export interface PracticeAvailability {
  id?: number;
  weekday: Weekday;
  dayStart: Date;
  dayEnd: Date;
}


export interface PracticeAvailabilityServer {
  id?: number;
  weekday: Weekday;
  dayStart: string;
  dayEnd: string;
}
