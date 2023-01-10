import { Pipe, PipeTransform } from '@angular/core';
import _default from 'chart.js/dist/core/core.interaction';
import x = _default.modes.x;

@Pipe({
  name: 'timeInInterval',
})
export class TimeInIntervalPipe implements PipeTransform {
  public transform(interval: number = 30): any {
    const times: any[] = []; // time array
    let startTime = 0; // start time
    const ap = ['AM', 'PM']; // AM-PM

    for (let i = 0; startTime < 24 * 60; i++) {
      // getting hours of day in 0-24 format
      const hour = Math.floor(startTime / 60);

      // getting minutes of the hour in 0-interval format
      const minute = startTime % 60;

      // pushing data in array in [00:00 - 12:00 AM/PM format]
      const time = `${`0${hour % 12}`.slice(-2)}:${`0${minute}`.slice(-2)}${ap[Math.floor(hour / 12)]}`;
      times[i] = { value: time, name: time };
      startTime += interval;
    }

    return times;
  }
}
