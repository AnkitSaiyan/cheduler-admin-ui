//  ID constants

export const STAFF_ID = 'staffID';
export const ROOM_ID = 'roomID';
export const PHYSICIAN_ID = 'physicianID';
export const EXAM_ID = 'examID';
export const ABSENCE_ID = 'absenceID';
export const APPOINTMENT_ID = 'appointmentID';
export const EMAIL_ID = 'emailID';
export const PRIORITY_ID = 'priorityID';

// Other constants

export const COMING_FROM_ROUTE = 'comingFromRoute';
export const EDIT = 'edit';
export const Statuses = Object.freeze(['inactive', 'active']);

// RegExp Const

export const EMAIL_REGEX: RegExp = /(.+)@(.+){1,}\.(.+){2,}/;

export const TIME_24: RegExp = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const NUM_ONLY_REGEX: RegExp = /^\d+$/;
