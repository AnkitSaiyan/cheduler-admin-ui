import {
  AddAppointmentRequestData, Appointment, AppointmentSlotsRequestData,
  CreateAppointmentFormValues,
  SelectedSlots,
  Slot,
  SlotModified
} from "../models/appointment.model";
import {DateDistributed} from "../models/calendar.model";
import {CalendarUtils} from "./calendar.utils";
import {checkTimeRangeOverlapping} from "./time";

export class AppointmentUtils {
  constructor() {}
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
    const uniqueSlots = new Set<string>();

    slots.forEach((slot) => {
      const slotString = `${slot.start}-${slot.end}`;

      if (!uniqueSlots.has(slotString)) {
        slot?.exams?.forEach((exam: any) => {
          let newSlot;
          if (isCombinable) {
            newSlot = {
              start: slot.start,
              end: slot.end,
              examId: exam.examId,
              roomList: exam.rooms,
              userList: exam.users,
            } as SlotModified;
          } else {
            newSlot = {
              start: exam.start,
              end: exam.end,
              examId: exam.examId,
              roomList: exam.rooms,
              userList: exam.users,
            } as SlotModified;
          }

          if (!examIdToSlotsMap[+exam.examId]) {
            examIdToSlotsMap[+exam.examId] = [];
          }

          examIdToSlotsMap[+exam.examId].push(newSlot);
          newSlots.push(newSlot);
        });

        uniqueSlots.add(slotString);
      }
    });

    return { newSlots, examIdToSlots: examIdToSlotsMap };
  }

  public static IsSlotAvailable(slot: SlotModified, selectedTimeSlot: SelectedSlots) {
    return !Object.values(selectedTimeSlot)?.some((value) => {
      const firstSlot = value.slot.split('-');
      return slot.examId !==value.examId && checkTimeRangeOverlapping(firstSlot[0], firstSlot[1], slot.start, slot.end)
    });
  }

  public static ToggleSlotSelection(slot: SlotModified, selectedTimeSlot: SelectedSlots): void {
    if (!this.IsSlotAvailable(slot, selectedTimeSlot) || !slot.end || !slot.start) {
      return;
    }

    if (selectedTimeSlot[slot.examId]?.slot === `${slot.start}-${slot.end}`) {
      selectedTimeSlot[slot.examId] = { slot: '', roomList: [], userList: [], examId: slot.examId };
    } else {
      selectedTimeSlot[slot.examId] = {
        slot: `${slot.start}-${slot.end}`,
        examId: slot.examId,
        roomList: slot?.roomList ?? [],
        userList: slot?.userList ?? [],
      };
    }
  }

  public static GenerateSlotRequestData(date: DateDistributed, examList: number[]): AppointmentSlotsRequestData {
    const dateString = CalendarUtils.DateDistributedToString(date, '-');

    return {
      exams: examList,
      fromDate: dateString,
      toDate: dateString,
    } as AppointmentSlotsRequestData;
  }

  public static GenerateAppointmentRequestData(
    formValues: CreateAppointmentFormValues,
    selectedTimeSlot: SelectedSlots,
    appointment?: Appointment | undefined,
  ): AddAppointmentRequestData {
    const { startedAt, startTime, examList, ...rest } = formValues;

    const requestData: any = {
      ...rest,
      date: CalendarUtils.DateDistributedToString(startedAt, '-'),
      slot: {
        examId: 0,
        start: '',
        end: '',
        exams: examList.map((examID) => {
          const examDetails = {
            examId: +examID,
            rooms: selectedTimeSlot[+examID]?.roomList ?? [],
            users: selectedTimeSlot[+examID]?.userList ?? [],
          };

          if (selectedTimeSlot[+examID]) {
            const time = selectedTimeSlot[+examID].slot.split('-');
            const start = time[0].split(':');
            const end = time[1].split(':');

            examDetails['start'] = `${start[0]}:${start[1]}:00`;
            examDetails['end'] = `${end[0]}:${end[1]}:00`;
          } else {
            const time = selectedTimeSlot[0].slot.split('-');
            const start = time[0].split(':');
            const end = time[1].split(':');

            examDetails['start'] = `${start[0]}:${start[1]}:00`;
            examDetails['end'] = `${end[0]}:${end[1]}:00`;
          }

          return examDetails;
        }),
      },
    };

    if (appointment && appointment?.id) {
      requestData.id = appointment.id;
    }

    return requestData;
  }
}



















