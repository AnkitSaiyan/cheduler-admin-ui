export enum RouteType {
  View = 'view',
  Add = 'add',
}

export enum RouteName {
  Absence = 'absence',
  Appointment = 'appointment',
  Exam = 'exam',
  Room = 'room',
  PrioritySlot = 'priority-slots',
  SiteSetting = 'site-management',
  Practice = 'practice-hours',
  Physicians = 'physicians',
  Roles = 'roles',
  EmailTemplate = 'email-template',
  Staffs = 'staff',
  User = 'user',
  CompleteProfile = 'complete-profile',
  LoginFailed = 'login-failed'
}

export enum Permission {
  // Absence
  CreateAbsences = 'can_create_absences',
  DeleteAbsences = 'can_delete_absences',
  ReadAbsences = 'can_read_absences',
  UpdateAbsences = 'can_update_absences',

  // Appointment
  CreateAppointments = 'can_create_appointments',
  DeleteAppointments = 'can_delete_appointments',
  ReadAppointments = 'can_read_appointments',
  UpdateAppointments = 'can_update_appointments',

  // Exams
  CreateExams = 'can_create_exams',
  DeleteExams = 'can_delete_exams',
  ReadExams = 'can_read_exams',
  UpdateExams = 'can_update_exams',

  // Users
  CreateUser = 'can_create_user',
  DeleteUser = 'can_delete_user',
  ReadUser = 'can_read_user',
  UpdateUser = 'can_update_user',

  // Rooms
  CreateRooms = 'can_create_rooms',
  DeleteRooms = 'can_delete_rooms',
  ReadRooms = 'can_read_rooms',
  UpdateRooms = 'can_update_rooms',

  // Priority Slots
  CreatePrioritySlots = 'can_create_priority_slot',
  DeletePrioritySlots = 'can_delete_priority_slot',
  ReadPrioritySlots = 'can_read_priority_slot',
  UpdatePrioritySlots = 'can_update_priority',

  // Site Settings
  CreateSiteSetting = 'can_create_site_setting',
  ReadSiteSetting = 'can_read_site_setting',
  UpdateSiteSetting = 'can_update_site_setting',

  // Practice Hours
  CreatePractice = 'can_create_practice',
  ReadPractice = 'can_read_practice',
  UpdatePractice = 'can_update_practice',

  // Physicians
  CreatePhysicians = 'can_create_physicians',
  DeletePhysicians = 'can_delete_physicians',
  ReadPhysicians = 'can_read_physicians',
  UpdatePhysicians = 'can_update_physicians',

  // User Roles
  CreateRoles = 'can_create_user_roles',
  DeleteRoles = 'can_delete_user_roles',
  ReadRoles = 'can_read_roles',

  // Staffs
  CreateStaffs = 'can_create_staffs',
  DeleteStaffs = 'can_delete_staffs',
  ReadStaffs = 'can_read_staffs',
  UpdateStaffs = 'can_update_staffs',

  // Email Template
  ReadEmailTemplate = 'can_read_email_template',
  UpdateEmailTemplate = 'can_update_email_template',
}

export enum GeneralUserPermission {
	// Absence
	ReadAbsences = 'can_read_absences',

	// Appointment
	CreateAppointments = 'can_create_appointments',
	ReadAppointments = 'can_read_appointments',
	UpdateAppointments = 'can_update_appointments',

	// exam
	CreateExams = 'can_create_exams',
	ReadExams = 'can_read_exams',
	UpdateExams = 'can_update_exams',

	// Rooms
	CreateRooms = 'can_create_rooms',
	ReadRooms = 'can_read_rooms',
	UpdateRooms = 'can_update_rooms',

	// Priority slots
	CreatePrioritySlots = 'can_create_priority_slot',
	ReadPrioritySlots = 'can_read_priority_slot',
	UpdatePrioritySlots = 'can_update_priority',

	// Site setting
	CreateSiteSetting = 'can_create_site_setting',
	ReadSiteSetting = 'can_read_site_setting',
	UpdateSiteSetting = 'can_update_site_setting',

	// Practice
	CreatePractice = 'can_create_practice',
	ReadPractice = 'can_read_practice',
	UpdatePractice = 'can_update_practice',

	// physician
	CreatePhysicians = 'can_create_physicians',
	ReadPhysicians = 'can_read_physicians',
	UpdatePhysicians = 'can_update_physicians',

	// Role
	CreateRoles = 'can_create_user_roles',
	ReadRoles = 'can_read_roles',

	// Staffs
	ReadStaffs = 'can_read_staffs',

	// Email template

	// User
	ReadUser = 'can_read_user',
}

export enum ReaderPermission {
	// Absence
	ReadAbsences = 'can_read_absences',

	// Appointment
	ReadAppointments = 'can_read_appointments',

	// Exams
	ReadExams = 'can_read_exams',

	// Rooms
	ReadRooms = 'can_read_rooms',

	// Priority Slot
	ReadPrioritySlots = 'can_read_priority_slot',

	// Physician
	ReadPhysicians = 'can_read_physicians',

	// Role
	ReadRoles = 'can_read_roles',

	// Staff
	ReadStaffs = 'can_read_staffs',

	// User
	ReadUser = 'can_read_user',

	// Email template
}













