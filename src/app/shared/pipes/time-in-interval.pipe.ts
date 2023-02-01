import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeInInterval',
})
export class TimeInIntervalPipe implements PipeTransform {
  public transform(interval: number = 30, formatted = false): string[] {
    const times: any[] = []; // time array
    const ap = ['AM', 'PM']; // AM-PM

    for (let startTime = 0; startTime < 24 * 60; startTime += interval) {
      // getting hours of day in 0-24 format
      const hour = Math.floor(startTime / 60);

      // getting minutes of the hour in 0-interval format
      const minute = startTime % 60;

      // pushing data in array in [00:00 - 12:00 AM/PM format]
      const hourString = `0${hour % 12 === 0 ? '12' : hour % 12}`.slice(-2);
      const minuteString = `0${minute}`.slice(-2);
      let time: string;

      if (formatted) {
        time = `${hourString[0] === '0' ? hourString[1] : hourString} ${minuteString === '00' || minuteString === '0' ? '' : `: ${minuteString}`} `;
      } else {
        time = `${hourString}:${minuteString}`;
      }

      time += ap[Math.floor(hour / 12)];

      times.push(time);
    }

    return times;
  }
}
