import {
	AddAppointmentRequestData,
	Appointment,
	AppointmentSlotsRequestData,
	CreateAppointmentFormValues,
	SelectedSlots,
	Slot,
	SlotModified,
} from '../models/appointment.model';
import { DateDistributed } from '../models/calendar.model';
import { DateTimeUtils } from './date-time.utils';

export class AppointmentUtils {
	public static GetModifiedSlotData(
		slots: Slot[],
		isCombinable: boolean,
	): {
		newSlots: SlotModified[];
		examIdToSlots: {
			[key: number]: SlotModified[];
		};
	} {
		if (!slots?.length) {
			return { examIdToSlots: {}, newSlots: [] };
		}

		const newSlots: SlotModified[] = [];
		const examIdToSlotsMap: { [key: number]: SlotModified[] } = {};

		slots.forEach((slot) => {
			const uniqueSlots = new Set<string>();

			slot?.exams?.forEach((exam: any) => {
				const slotString = isCombinable ? `${slot.start}-${slot.end}` : `${exam.start}-${exam.end}`;

				if (!uniqueSlots.has(slotString + exam.examId)) {
					const newSlot = {
						examId: exam.examId,
						roomList: exam.rooms,
						userList: exam.users,
						...(isCombinable
							? {
									start: slot.start,
									end: slot.end,
									exams: slot.exams,
							  }
							: {
									start: exam.start,
									end: exam.end,
							  }),
					} as SlotModified;

					if (!examIdToSlotsMap[+exam.examId]) {
						examIdToSlotsMap[+exam.examId] = [];
					}

					examIdToSlotsMap[+exam.examId].push(newSlot);
					newSlots.push(newSlot);
					uniqueSlots.add(slotString + exam.examId);
				}
			});
		});

		return { newSlots, examIdToSlots: examIdToSlotsMap };
	}

	public static IsSlotAvailable(slot: SlotModified, selectedTimeSlot: SelectedSlots) {
		return !Object.values(selectedTimeSlot)?.some((value) => {
			const firstSlot = value?.slot?.split('-');
			return (
				firstSlot?.length && slot.examId !== value.examId && DateTimeUtils.CheckTimeRangeOverlapping(firstSlot[0], firstSlot[1], slot.start, slot.end)
			);
		});
	}

	public static ToggleSlotSelection(slot: SlotModified, selectedTimeSlot: SelectedSlots, isEdit = false): void {
		if (!isEdit && (!this.IsSlotAvailable(slot, selectedTimeSlot) || !slot?.end || !slot?.start)) {
			return;
		}

		const SelectedSlot = selectedTimeSlot;
		if (SelectedSlot[slot.examId]?.slot === `${slot.start}-${slot.end}`) {
			SelectedSlot[slot.examId] = { slot: '', roomList: [], userList: [], examId: slot.examId };
		} else {
			SelectedSlot[slot.examId] = {
				...slot,
				slot: `${slot.start}-${slot.end}`,
				examId: slot.examId,
				roomList: slot?.roomList ?? [],
				userList: slot?.userList ?? [],
			};
		}
	}

	public static GenerateSlotRequestData(date: DateDistributed, examList: number[]): AppointmentSlotsRequestData {
		const dateString = DateTimeUtils.DateDistributedToString(date, '-');

		return {
			exams: examList,
			fromDate: dateString,
			toDate: dateString,
		} as AppointmentSlotsRequestData;
	}

	public static GenerateAppointmentRequestData(
		formValues: CreateAppointmentFormValues,
		selectedTimeSlot: SelectedSlots,
		appointment: Appointment | undefined,
		isCombinable: boolean,
	): AddAppointmentRequestData {
		const { startedAt, startTime, examList, ...rest } = formValues;
		const { userList, roomList, slot, exams, ...restData } = { ...Object.values(selectedTimeSlot)[0] } as any;
		let finalCombinableRequestData = {};

		if (exams?.length) {
			finalCombinableRequestData = {
				...restData,
				exams: exams.map(({ userId, roomId, ...examRest }) => ({ ...examRest })),
			};
		}

		const requestData: any = {
			...rest,
			date: DateTimeUtils.DateDistributedToString(startedAt, '-'),
			slot:
				!isCombinable || !exams?.length
					? {
							examId: 0,
							start: '',
							end: '',
							exams: examList.map((examID) => {
								const examDetails = {
									examId: +examID,
									rooms: selectedTimeSlot[+examID]?.roomList ?? [],
									users: selectedTimeSlot[+examID]?.userList ?? [],
									start: '',
									end: '',
								};

								if (selectedTimeSlot[+examID]) {
									const time: any = selectedTimeSlot[+examID];
									examDetails.start = time.start;
									examDetails.end = time.end;
								} else {
									const time: any = selectedTimeSlot[0];
									const start = time?.start;
									const end = time?.end;

									examDetails.start = `${start[0]}:${start[1]}:00`;
									examDetails.end = `${end[0]}:${end[1]}:00`;
								}

								return examDetails;
							}),
					  }
					: { ...finalCombinableRequestData, examId: 0 },
		};

		if (isCombinable) {
			requestData.slot.exams.sort((e1, e2) => DateTimeUtils.TimeToNumber(e1.start) - DateTimeUtils.TimeToNumber(e2.start));

			if (!requestData.slot.start) {
				requestData.slot.start = requestData.slot.exams[0].start;
			}
			if (!requestData.slot.end) {
				requestData.slot.end = requestData.slot.exams[requestData.slot.exams.length - 1].end;
			}
		}

		if (appointment?.id) {
			requestData.id = appointment.id;
		}

		return requestData;
	}
}
