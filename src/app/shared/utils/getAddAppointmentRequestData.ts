import { AddAppointmentRequestData, Appointment } from '../models/appointment.model';

export function getAddAppointmentRequestData(
	appointment: Appointment,
	addID = true,
	updatedFields: { [key: string]: any } = {},
): AddAppointmentRequestData {
	return (
		appointment
			? {
					...(addID && appointment.id ? { id: appointment.id } : {}),
					patientFname: appointment.patientFname,
					patientLname: appointment.patientLname,
					patientTel: appointment.patientTel,
					patientEmail: appointment.patientEmail,
					startedAt: appointment.startedAt,
					userId: appointment.userId,
					doctorId: appointment.doctorId,
					readStatus: appointment.readStatus,
					approval: appointment.approval,
					...updatedFields,
			  }
			: {}
	) as AddAppointmentRequestData;
}
