import {DateDistributed} from "../models/calendar.model";

export class CalendarUtils {
  constructor() {}
  public static DateDistributedToString(date: DateDistributed, separator = '-'): string {
    return `${date.year}${separator}${date.month}${separator}${date.day}`;
  }

  public static DateToDateDistributed(date: Date): DateDistributed {
    if (!date) {
      return {} as DateDistributed;
    }

    return {
      year: new Date(date).getFullYear(),
      month: new Date(date).getMonth() + 1,
      day: new Date(date).getDate(),
    };
  }

  public static DateTo24TimeString(date: Date): string {
    if (!date) {
      return '';
    }

    date = new Date(date);

    return `${date.getHours()}:${date.getMinutes()}:00`;
  }

  public static DurationInMinFromHour(hour: number, minute = 0): number {
    return hour * 60 + minute;
  }
}
