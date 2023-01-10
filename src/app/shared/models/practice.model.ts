import { WeekdayModel } from './weekday.model';

export interface PracticeAvailability {
  id?: number;
  weekday: WeekdayModel;
  dayStart: Date;
  dayEnd: Date;
}
