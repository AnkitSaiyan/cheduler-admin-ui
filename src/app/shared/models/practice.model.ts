import { Weekday } from './weekday';

export interface PracticeAvailability {
  id?: number;
  weekday: Weekday;
  dayStart: Date;
  dayEnd: Date;
}
