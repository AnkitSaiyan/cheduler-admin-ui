export enum Weekday {
  ALL,
  MON,
  TUE,
  WED,
  THU,
  FRI,
  SAT,
  SUN,
}

export interface TimeSlot {
  id?: number;
  dayStart: Date;
  dayEnd: Date;
}

export interface WeekWisePracticeAvailability {
  slotNo: number;
  monday: TimeSlot;
  tuesday: TimeSlot;
  wednesday: TimeSlot;
  thursday: TimeSlot;
  friday: TimeSlot;
  saturday: TimeSlot;
  sunday: TimeSlot;
}

export declare type TimeDurationType = 'Minutes' | 'Hours' | 'Days';

export enum Month {
  JAN = 1,
  FEB,
  MAR,
  APR,
  MAY,
  JUN,
  JUL,
  AUG,
  SEP,
  OCT,
  NOV,
  DEC,
}
