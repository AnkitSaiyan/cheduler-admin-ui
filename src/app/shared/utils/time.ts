export function formatTime(timeString: string, format: 12 | 24 = 12, interval = 30): string {
  if (!timeString) {
    return '';
  }

  const [hourPart, minutePart]: string[] = timeString.split(':');

  // console.log(hourPart, minutePart);

  if (!hourPart || !minutePart) {
    return '';
  }

  if (hourPart?.length !== 2 || minutePart?.length < 2) {
    return '';
  }

  if (Number.isNaN(+hourPart) || Number.isNaN(+minutePart.slice(0, 2))) {
    return '';
  }

  let ap = '';
  if (format === 12) {
    if (+hourPart >= 12 && +hourPart < 24) {
      ap = 'PM';
    } else {
      ap = 'AM';
    }
  }

  let minuteInInterval = +minutePart.slice(0, 2);
  if (minuteInInterval < 60) {
    if (minuteInInterval % interval) {
      minuteInInterval -= minuteInInterval % interval;
    }
  }

  const hour = hourPart === '12' ? hourPart : `0${Math.floor(format === 12 ? +hourPart % 12 : +hourPart).toString()}`.slice(-2);
  const min = +minutePart.slice(0, 2) > 60 ? '00' : `0${minuteInInterval}`.slice(-2);

  if (format === 12) {
    return `${hour}:${min}${ap}`;
  }

  return `${hour}:${min}`;
}

export function get24HourTimeString(timeString: string | undefined): string {
  let time = '';

  if (timeString) {
    const hour = +timeString.slice(0, 2);
    if (timeString.toLowerCase().includes('pm')) {
      if (hour < 12) {
        time = `${hour + 12}:${timeString.slice(3, 5)}`;
      } else {
        time = `${hour}:${timeString.slice(3, 5)}`;
      }
    } else if (timeString.toLowerCase().includes('am')) {
      if (hour === 12) {
        time = `00:${timeString.slice(3, 5)}`;
      } else {
        time = timeString.slice(0, 5);
      }
    }
  }

  return time;
}

export function timeToNumber(timeString: string): number {
  if (timeString && timeString.includes(':')) {
    const timeInNo = +timeString.split(':').join('');

    if (!Number.isNaN(timeInNo)) {
      return timeInNo;
    }
  }

  return 0;
}

export function checkTimeRangeOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
  const a = timeToNumber(start1);
  const b = timeToNumber(end1);

  const c = timeToNumber(start2);
  const d = timeToNumber(end2);

  if (b <= c || d <= a) {
    return false;
  }

  return true;
}
