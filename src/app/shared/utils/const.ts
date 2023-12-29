//  ID constants

export const STAFF_ID = 'staffID';
export const ROOM_ID = 'roomID';
export const PHYSICIAN_ID = 'physicianID';
export const EXAM_ID = 'examID';
export const ABSENCE_ID = 'absenceID';
export const ABSENCE_TYPE = 'absenceType';
export const APPOINTMENT_ID = 'appointmentID';
export const EMAIL_TEMPLATE_ID = 'emailID';
export const PRIORITY_ID = 'priorityID';

// params type array

export const ABSENCE_TYPE_ARRAY = ['rooms', 'staff', 'public-holiday'] as const;

// Language Constants

export const ENG_BE = 'en-BE';
export const DUTCH_BE = 'nl-BE';

// Other constants

export const COMING_FROM_ROUTE = 'comingFromRoute';
export const EDIT = 'edit';
export const Statuses = Object.freeze(['inactive', 'active']);
export const StatusesNL = Object.freeze(['inactief', 'actief']);

// RegExp Const

export const EMAIL_REGEX: RegExp = /^([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
export const TIME_24: RegExp = /^([0-1]?\d|2[0-3]):[0-5]\d$/;
export const NUM_ONLY_REGEX: RegExp = /^\d+$/;

// Cache Keys

export const ChedulerCacheKey =
	'cb4a17fd-d34c-48d3-bc5d-9525f9071c9a-b2c_1_cheduler_staff_signin.441c0f18-a9ce-4c55-99c1-4232715e39a5-diflexmoauth.b2clogin.com-accesstoken-d526e147-4713-4a0a-bf56-d8f500fb9a62--https://diflexmoauth.onmicrosoft.com/cheduler.api/cheduler.api--';
export const UserManagementCacheKey =
	'cb4a17fd-d34c-48d3-bc5d-9525f9071c9a-b2c_1_cheduler_staff_signin.441c0f18-a9ce-4c55-99c1-4232715e39a5-diflexmoauth.b2clogin.com-accesstoken-d526e147-4713-4a0a-bf56-d8f500fb9a62--https://diflexmoauth.onmicrosoft.com/usermanagement.api/usermanagement.api--';

// Date Time Const

export const GlobalTimeFormat = 'HH:mm';
export const GlobalDateFormat = 'dd/MM/yyyy';
export const GlobalDateTimeFormat = 'dd/MM/yyyy, HH:mm';

// URL constants
export const DEV_SUBDOMAIN = 'red-sea-08bb7b903';
export const EXT_PATIENT_TENANT = 'NPXN';
export const EXT_ADMIN_TENANT = 'N5v0';

// error messages

export const ErrNoAccessPermitted: string = 'You are not permitted to access this page';
export const ErrNoActionPermission: string = 'You are not permitted to perform this action';
export const ErrUnauthorized: string = 'You are not authorized to access this page';
export const ErrLoginFailed: string = 'Failed to login user';

// Info messages

export const LoggingYouOut = 'Logging you out';

export enum BodyType {
	Male = 'male',
	Female = 'female',
	Common = 'common',
}

export enum CalendarType {
	Day = 'day',
	Week = 'week',
	Month = 'month',
}

// appointment card
export const TIME_INTERVAL: number = 15;
export const PIXELS_PER_MIN: number = 4;
