export class Appointment {
	practiceId: string;

	patientId: string;

	physicianId: string;

	dateTime: Date;

	constructor(practiceId: string, patientId: string, physicianId: string, dateTime: Date) {
		this.practiceId = practiceId;
		this.patientId = patientId;
		this.physicianId = physicianId;
		this.dateTime = dateTime;
	}
}
