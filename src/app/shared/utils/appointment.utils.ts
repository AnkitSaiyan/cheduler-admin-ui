import {
  AddAppointmentRequestData, Appointment, AppointmentSlotsRequestData,
  CreateAppointmentFormValues,
  SelectedSlots,
  Slot,
  SlotModified
} from "../models/appointment.model";
import {DateDistributed} from "../models/calendar.model";
import {DateTimeUtils} from "./date-time.utils";

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
              exams: slot.exams,
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
      const firstSlot = value?.slot?.split('-');
      return firstSlot?.length && slot.examId !== value.examId && DateTimeUtils.CheckTimeRangeOverlapping(firstSlot[0], firstSlot[1], slot.start, slot.end);
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
        ...slot,
        slot: `${slot.start}-${slot.end}`,
        examId: slot.examId,
        roomList: slot?.roomList ?? [],
        userList: slot?.userList ?? [],
      };
      console.log(selectedTimeSlot);
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
                };
                if (selectedTimeSlot[+examID]) {
                  const time: any = selectedTimeSlot[+examID];
                  examDetails['start'] = time.start;
                  examDetails['end'] = time.end;
                } else {
                  const time: any = selectedTimeSlot[0];
                  const start = time.start;
                  const end = time.end;

                  examDetails['start'] = `${start[0]}:${start[1]}:00`;
                  examDetails['end'] = `${end[0]}:${end[1]}:00`;
                }

                return examDetails;
              }),
            }
          : { ...finalCombinableRequestData, examId: 0 },
    };

    if (appointment && appointment?.id) {
      requestData.id = appointment.id;
    }

    return requestData;
  }
}

































