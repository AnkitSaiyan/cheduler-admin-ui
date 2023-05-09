//  ID constants

export const STAFF_ID = 'staffID';
export const ROOM_ID = 'roomID';
export const PHYSICIAN_ID = 'physicianID';
export const EXAM_ID = 'examID';
export const ABSENCE_ID = 'absenceID';
export const APPOINTMENT_ID = 'appointmentID';
export const EMAIL_TEMPLATE_ID = 'emailID';
export const PRIORITY_ID = 'priorityID';
// export const DEV_TENANT_ID = 'NBK0';
// export const UAT_TENANT_ID = 'N5v0';

// Language Constants

export const ENG_BE = 'en-BE';
export const DUTCH_BE = 'nl-BE';

// Other constants

export const COMING_FROM_ROUTE = 'comingFromRoute';
export const EDIT = 'edit';
export const Statuses = Object.freeze(['inactive', 'active']);
export const StatusesNL = Object.freeze(['inactief', 'actief']);

// RegExp Const

export const EMAIL_REGEX: RegExp = /(.+)@(.+){1,}\.(.+){2,}/;
export const TIME_24: RegExp = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
export const NUM_ONLY_REGEX: RegExp = /^\d+$/;

// Cache Keys

export const ChedulerCacheKey = 'cb4a17fd-d34c-48d3-bc5d-9525f9071c9a-b2c_1_cheduler_staff_signin.441c0f18-a9ce-4c55-99c1-4232715e39a5-diflexmoauth.b2clogin.com-accesstoken-d526e147-4713-4a0a-bf56-d8f500fb9a62--https://diflexmoauth.onmicrosoft.com/cheduler.api/cheduler.api--'
export const UserManagementCacheKey = 'cb4a17fd-d34c-48d3-bc5d-9525f9071c9a-b2c_1_cheduler_staff_signin.441c0f18-a9ce-4c55-99c1-4232715e39a5-diflexmoauth.b2clogin.com-accesstoken-d526e147-4713-4a0a-bf56-d8f500fb9a62--https://diflexmoauth.onmicrosoft.com/usermanagement.api/usermanagement.api--'

// Date Time Const

export const GlobalTimeFormat = 'HH:mm';
export const GlobalDateFormat = 'dd/MM/yyyy';
export const GlobalDateTimeFormat = 'dd/MM/yyyy, HH:mm';

// URL constants
export const DEV_SUBDOMAIN = 'red-sea-08bb7b903'

// eslint-disable-next-line @typescript-eslint/naming-convention
export const EXT_Patient_Tenant = 'NPXN';
export const EXT_Admin_Tenant = 'N5v0';

// error messages

export const ErrNoAccessPermitted: string = 'You are not permitted to access this page';
export const ErrNoActionPermission: string = 'You are not permitted to perform this action';
export const ErrUnauthorized: string = 'You are not authorized to access this page';
export const ErrLoginFailed: string = 'Failed to login user';

// Info messages

export const LoggingYouOut = 'Logging you out';
