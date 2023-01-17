import { Weekday } from './calendar.model';

export interface PracticeAvailability {
  id?: number;
  weekday: Weekday;
  dayStart: Date;
  dayEnd: Date;
}
