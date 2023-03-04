import {
  AddAppointmentRequestData, Appointment, AppointmentSlotsRequestData,
  CreateAppointmentFormValues,
  SelectedSlots,
  Slot,
  SlotModified
} from "../models/appointment.model";
import {DateDistributed} from "../models/calendar.model";
import {CalendarUtils} from "./calendar.utils";

export class AppointmentUtils {
  constructor() {}
  public static GetModifiedSlotData(slots: Slot[]): {
    newSlots: SlotModified[];
    examIdToSlots: {
      [key: number]: SlotModified[]
    }
  } {
    if (!slots?.length) {
      return {examIdToSlots: {}, newSlots: []};
    }

    const newSlots: SlotModified[] = [];
    const examIdToSlotsMap: { [key: number]: SlotModified[] } = {};
    const uniqueSlots = new Set<string>();

    slots.forEach((slot) => {
      const slotString = `${slot.start}-${slot.end}`;

      if (!uniqueSlots.has(slotString)) {
        slot?.exams?.forEach((exam) => {
          const newSlot = {
            start: slot.start,
            end: slot.end,
            examId: exam.examId,
            roomList: exam.roomId,
            userList: exam.userId
          } as SlotModified;

          if (!examIdToSlotsMap[+exam.examId]) {
            examIdToSlotsMap[+exam.examId] = [];
          }

          examIdToSlotsMap[+exam.examId].push(newSlot)
          newSlots.push(newSlot);
        });

        uniqueSlots.add(slotString);
      }
    });

    return {newSlots, examIdToSlots: examIdToSlotsMap};
  }

  public static IsSlotAvailable(slot: SlotModified, selectedTimeSlot: SelectedSlots) {
    let isAvailable = true;

    Object.entries(selectedTimeSlot).forEach(([key, value]) => {
      const timeString = `${slot.start}-${slot.end}`;
      if (+key !== +slot.examId && timeString === value.slot) {
        isAvailable = false;
      }
    });

    return isAvailable;
  }

  public static ToggleSlotSelection(slot: SlotModified, selectedTimeSlot: SelectedSlots): void {
    if (!this.IsSlotAvailable(slot, selectedTimeSlot) || !slot.end || !slot.start) {
      return;
    }

    if (selectedTimeSlot[slot.examId]?.slot === `${slot.start}-${slot.end}`) {
      selectedTimeSlot[slot.examId] = {slot: '', roomList: [], userList: [], examId: slot.examId};
    } else {
      selectedTimeSlot[slot.examId] = {
        slot: `${slot.start}-${slot.end}`,
        examId: slot.examId,
        roomList: slot?.roomList ?? [],
        userList: slot?.userList ?? []
      };
    }
  }

  public static GenerateSlotRequestData(date: DateDistributed, examList: number[]): AppointmentSlotsRequestData {
    const dateString = CalendarUtils.DateDistributedToString(date,'-');

    return {
      exams: examList,
      fromDate: dateString,
      toDate: dateString,
    } as AppointmentSlotsRequestData;
  }

  public static GenerateAppointmentRequestData(
    formValues: CreateAppointmentFormValues,
    selectedTimeSlot: SelectedSlots,
    appointment: Appointment | undefined
  ): AddAppointmentRequestData {
    const {startedAt, startTime, examList, ...rest} = formValues;

    const requestData: AddAppointmentRequestData = {
      ...rest,
      examDetails: examList.map((examID) => {
        const examDetails = {
          examId: +examID,
          startedAt: CalendarUtils.DateDistributedToString(startedAt, '-'),
          endedAt: CalendarUtils.DateDistributedToString(startedAt, '-'),
          roomList: selectedTimeSlot[+examID]?.roomList ?? [],
          userList: selectedTimeSlot[+examID]?.userList ?? []
        };

        if (selectedTimeSlot[+examID]) {
          const time = selectedTimeSlot[+examID].slot.split('-');
          const start = time[0].split(':');
          const end = time[1].split(':');

          examDetails.startedAt += ` ${start[0]}:${start[1]}:00`;
          examDetails.endedAt += ` ${end[0]}:${end[1]}:00`;
        } else {
          const time = selectedTimeSlot[0].slot.split('-');
          const start = time[0].split(':');
          const end = time[1].split(':');

          examDetails.startedAt += ` ${start[0]}:${start[1]}:00`;
          examDetails.endedAt += ` ${end[0]}:${end[1]}:00`;
        }

        return examDetails;
      }),
    };

    if (appointment && appointment?.id) {
      requestData.id = appointment.id;
    }

    return requestData;
  }
}
