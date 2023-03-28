import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeInInterval',
})
export class TimeInIntervalPipe implements PipeTransform {
  public transform(interval: number = 30, format24 =  true, formatted = false, startMin?: number, endMin?: number): string[] {
    const times: any[] = []; // time array
    const ap = ['AM', 'PM']; // AM-PM
    const format = format24 ? 24 : 12

    for (let startTime = startMin ?? 0; startTime < (endMin ?? 24 * 60); startTime += interval) {
      // getting hours of day in 0-24 format
      const hour = Math.floor(startTime / 60);

      // getting minutes of the hour in 0-interval format
      const minute = startTime % 60;

      // pushing data in array in [00:00 - 12:00 AM/PM format] if format24 is false else [00:00 - 23:00]`
      const hourString = `0${hour % format === 0 && format === 12 ? '12' : hour % format}`.slice(-2);
      const minuteString = `0${minute}`.slice(-2);
      let time: string;

      if (formatted) {
        time = `${hourString[0] === '0' ? hourString[1] : hourString}${
          interval === 60 && (minuteString === '00' || minuteString === '0') ? '' : `:${minuteString}`
        } `;
      } else {
        time = `${hourString}:${minuteString}`;
      }

      if (format === 12) {
        time += ap[Math.floor(hour / 12)];
      }

      times.push(time);
    }

    // if (format === 24) {
    //   times.push('24:00');
    // } else if (formatted) {
    //   times.push('24:00 PM');
    // } else {
    //   times.push('24:00PM');
    // }

    return times;
  }
}
