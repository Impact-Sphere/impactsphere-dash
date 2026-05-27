import type { TimeSlot } from "@/app/types/meeting";

export const MIN_SLOT_DURATION_MS = 30 * 60 * 1000;

export const getNextHalfHourStart = () => {
  const now = new Date();
  const nextHalfHour = new Date(now);
  const minutes = nextHalfHour.getMinutes();

  nextHalfHour.setSeconds(0, 0);
  nextHalfHour.setMilliseconds(0);

  if (minutes < 30) {
    nextHalfHour.setMinutes(30);
  } else {
    nextHalfHour.setMinutes(0);
    nextHalfHour.setHours(nextHalfHour.getHours() + 1);
  }

  return nextHalfHour;
};

export const isSameCalendarDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const getStartMinTimeForDate = (date: Date) => {
  const nextHalfHour = getNextHalfHourStart();

  if (isSameCalendarDay(date, nextHalfHour)) {
    return nextHalfHour;
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

export const getMinEndDate = (slot: TimeSlot) => {
  const start = new Date(slot.start);
  return new Date(start.getTime() + MIN_SLOT_DURATION_MS);
};

export const getEndMinTimeForDate = (date: Date, slot: TimeSlot) => {
  const minEnd = getMinEndDate(slot);

  if (isSameCalendarDay(date, new Date(slot.start))) {
    return minEnd;
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

export const createDefaultSlot = (): TimeSlot => {
  const start = getNextHalfHourStart();
  const end = new Date(start.getTime() + MIN_SLOT_DURATION_MS);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

export const sortSlotsByStart = (slots: TimeSlot[] = []) =>
  [...slots].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

export const mergeContiguousSlots = (slots: TimeSlot[] = []) => {
  const sorted = sortSlotsByStart(slots);

  return sorted.reduce<TimeSlot[]>((merged, current) => {
    if (!merged.length) {
      return [current];
    }

    const previous = merged[merged.length - 1];
    const previousEnd = new Date(previous.end).getTime();
    const currentStart = new Date(current.start).getTime();

    if (previousEnd === currentStart) {
      merged[merged.length - 1] = {
        start: previous.start,
        end: current.end,
      };
      return merged;
    }

    merged.push(current);
    return merged;
  }, []);
};

export const getSlotValidation = (
  slot: TimeSlot,
  allSlots: TimeSlot[],
  index: number,
) => {
  const start = new Date(slot.start).getTime();
  const end = new Date(slot.end).getTime();

  const invalidRange = end - start < MIN_SLOT_DURATION_MS;
  const pastStart = start < getNextHalfHourStart().getTime();

  const colliding = allSlots.some((other, otherIndex) => {
    if (otherIndex === index) return false;

    const otherStart = new Date(other.start).getTime();
    const otherEnd = new Date(other.end).getTime();

    return start < otherEnd && end > otherStart;
  });

  return { invalidRange, pastStart, colliding };
};
