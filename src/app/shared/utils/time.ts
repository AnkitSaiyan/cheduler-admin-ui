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
