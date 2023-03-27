export enum Weekday {
  SUN,
  MON,
  TUE,
  WED,
  THU,
  FRI,
  SAT,
  ALL,
}

export interface TimeSlot {
  id?: number;
  dayStart: string;
  dayEnd: string;
  weekday?: Weekday;
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

export interface DateDistributed {
  day: number;
  month: number;
  year: number
}

export function getDaysOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getWeekdayOfDay(date: Date, day: number): number {
  const newDate = new Date(date);
  return new Date(newDate.getFullYear(), newDate.getMonth(), day).getDay();
}

export function getDateOfMonth(year: number, month: number, day = 0): number {
  return new Date(year, month, day).getDate();
}

export function getWeekdayWiseDays(date: Date): number[][] {
  const year: number = date.getFullYear();
  const month: number = date.getMonth();
  const days: number = getDaysOfMonth(year, month);
  const currentWeekday: number = getWeekdayOfDay(date, 1);

  const daysMatrix: number[][] = [];

  let daysRow: number[] = [];

  for (let weekday = 0; weekday < currentWeekday; weekday++) {
    daysRow.push(getDateOfMonth(year, month, weekday - currentWeekday + 1) + 31);
  }

  for (let day = 1; day <= days; day++) {
    if (daysRow.length === 7) {
      daysMatrix.push(daysRow);
      daysRow = [];
    }

    daysRow.push(day);
  }

  let day = 1 + 31;
  while (daysRow.length < 7) {
    daysRow.push(day++);
  }

  daysMatrix.push(daysRow);

  return daysMatrix;
}

export function getAllDaysOfWeek(selectedDate: Date): number[][] {
  const weekday = new Date(selectedDate).getDay() - 1;
  const date = new Date(selectedDate).getDate();
  const year = new Date(selectedDate).getFullYear();
  const month = new Date(selectedDate).getMonth();

  const daysOfWeekArr: number[][] = [];

  let tempDate = new Date(selectedDate);
  tempDate = new Date(tempDate.setDate(tempDate.getDate() - weekday));

  for (let day = weekday; day >= 0; day--) {
    daysOfWeekArr.push([getDateOfMonth(year, tempDate.getMonth() + 1, date - day), tempDate.getMonth()]);
    tempDate = new Date(tempDate.setDate(tempDate.getDate() + 1));
  }

  for (let day = weekday + 1; day < 7; day++) {
    daysOfWeekArr.push([getDateOfMonth(year, month, date + (day - weekday)), tempDate.getMonth()]);
    tempDate = new Date(tempDate.setDate(tempDate.getDate() + 1));
  }

  return daysOfWeekArr;
}

export function getDurationMinutes(start: Date, end: Date): number {
  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const startH = startDate.getHours();
    const endH = endDate.getHours();

    // if (endH === 0) {
    //   endH = 24;
    // }


    if (startH === endH) {
      return endDate.getMinutes() - startDate.getMinutes();
    }

    const hours = endH - (startH + 1);
    const minutes = 60 - startDate.getMinutes() + endDate.getMinutes();
    return Math.abs(hours * 60 + minutes);
  }

  return 0;
}

export function stringToTimeArray(timeString: string | undefined, splitBy: string = ':'): number[] {
  if (!timeString) {
    return [0, 0, 0];
  }

  const timeStringArray = timeString.split(splitBy);

  const hour = timeStringArray.length && !Number.isNaN(+timeStringArray[0]) ? +timeStringArray[0] : 0;
  const min = timeStringArray.length > 1 && !Number.isNaN(+timeStringArray[1]) ? +timeStringArray[1] : 0;
  const second = timeStringArray.length > 2 && !Number.isNaN(+timeStringArray[2]) ? +timeStringArray[2] : 0;

  return [hour, min, second];
}


export interface Interval {
  dayStart: string;
  dayEnd: string;
}

export interface CalenderTimeSlot {
  timings: string[];
  intervals: Interval[];
}
