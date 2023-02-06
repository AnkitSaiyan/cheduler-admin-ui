export function formatTime(timeString: string): string {
  if (!timeString) {
    return '';
  }

  const [hourPart, minutePart]: string[] = timeString.split(':');

  console.log(hourPart, minutePart);

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
  if (+hourPart >= 12 && +hourPart < 24) {
    ap = 'PM';
  } else {
    ap = 'AM';
  }

  const hour = hourPart === '12' ? hourPart : `0${Math.floor(+hourPart % 12).toString()}`.slice(-2);
  const min = +minutePart.slice(0, 2) > 60 ? '00' : `0${minutePart.slice(0, 2).toString()}`.slice(-2);

  return `${hour}:${min}${ap}`;
}
