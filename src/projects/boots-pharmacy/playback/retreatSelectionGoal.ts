import type { JourneyBeat } from "@/app/orchestra/types";
import {
  AVAIL_PLAYBACK_DATE,
  AVAIL_PLAYBACK_TIME,
  AVAIL_RETREAT_DATE_INTENT,
} from "@/projects/boots-pharmacy/playback/availRetreatSync";
import {
  BOOK_DEFAULT_DATE,
  BOOK_DEFAULT_TIME,
  isBookDefaultDateSelected,
  isBookPlaybackDateSelected,
  isBookPlaybackTimeSelected,
  isBookDefaultTimeSelected,
} from "@/projects/boots-pharmacy/playback/book";
import type { RetreatSelectionGoal } from "@/projects/types";

function availCard(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".proto-avail-card");
}

function isAvailDateDaySelected(day: number): boolean {
  const card = availCard();
  if (!card) return false;
  const cells = Array.from(
    card.querySelectorAll<HTMLElement>(
      ".proto-avail-cal-cell:not(.proto-avail-cal-cell--time):not(.proto-avail-cal-cell--disabled)"
    )
  );
  const cell = cells.find((el) => el.textContent?.trim() === String(day));
  return cell?.classList.contains("proto-avail-cal-cell--selected") ?? false;
}

function isAvailTimeSelected(time: string): boolean {
  const card = availCard();
  if (!card) return false;
  const cells = Array.from(
    card.querySelectorAll<HTMLElement>(
      ".proto-avail-cal-cell--time:not(.proto-avail-cal-cell--disabled)"
    )
  );
  const cell = cells.find((el) => el.textContent?.trim() === time);
  return cell?.classList.contains("proto-avail-cal-cell--selected") ?? false;
}

function isAnyAvailTimeSelected(): boolean {
  return (
    availCard()?.querySelector(
      ".proto-avail-cal-cell--time.proto-avail-cal-cell--selected"
    ) != null
  );
}

function isAvailOnDateStep(): boolean {
  return Boolean(availCard()?.querySelector(".proto-avail-calendars"));
}

function isAvailOnTimeStep(): boolean {
  const card = availCard();
  if (!card) return false;
  return (
    Boolean(card.querySelector(".proto-avail-cal-cell--time")) &&
    !card.querySelector(".proto-avail-footer .proto-avail-btn-primary")?.textContent?.match(
      /book now/i
    )
  );
}

function formatMonthDay(date: { month: string; day: number }): string {
  return `${date.month} ${date.day}`;
}

function bookStep2DefaultGoal(): RetreatSelectionGoal {
  const dateOk = isBookDefaultDateSelected();
  const playbackDate = isBookPlaybackDateSelected();
  const playbackTime = isBookPlaybackTimeSelected();
  const defaultTime = isBookDefaultTimeSelected();
  const domGoalMet =
    dateOk && !playbackDate && !playbackTime && defaultTime;

  let actual = "unknown";
  if (playbackDate && playbackTime) {
    actual = `playback ${formatMonthDay(AVAIL_PLAYBACK_DATE)} + ${AVAIL_PLAYBACK_TIME}`;
  } else if (playbackDate) {
    actual = `playback date ${formatMonthDay(AVAIL_PLAYBACK_DATE)}`;
  } else if (playbackTime) {
    actual = `playback time ${AVAIL_PLAYBACK_TIME}`;
  } else if (dateOk && defaultTime) {
    actual = `${formatMonthDay(BOOK_DEFAULT_DATE)} + ${BOOK_DEFAULT_TIME}`;
  } else if (dateOk) {
    actual = `${formatMonthDay(BOOK_DEFAULT_DATE)}, time not ${BOOK_DEFAULT_TIME}`;
  } else {
    actual = "date not June 24";
  }

  return {
    expectsSelection: true,
    domGoalMet,
    expected: `${formatMonthDay(BOOK_DEFAULT_DATE)} + ${BOOK_DEFAULT_TIME}, not playback ${formatMonthDay(AVAIL_PLAYBACK_DATE)}/${AVAIL_PLAYBACK_TIME}`,
    actual,
  };
}

function bookStep2PlaybackGoal(): RetreatSelectionGoal {
  const dateOk = isBookPlaybackDateSelected();
  const timeOk = isBookPlaybackTimeSelected();
  const domGoalMet = dateOk && timeOk;

  return {
    expectsSelection: true,
    domGoalMet,
    expected: `${formatMonthDay(AVAIL_PLAYBACK_DATE)} + ${AVAIL_PLAYBACK_TIME}`,
    actual: domGoalMet
      ? `${formatMonthDay(AVAIL_PLAYBACK_DATE)} + ${AVAIL_PLAYBACK_TIME}`
      : [
          dateOk ? "" : `date not ${formatMonthDay(AVAIL_PLAYBACK_DATE)}`,
          timeOk ? "" : `time not ${AVAIL_PLAYBACK_TIME}`,
        ]
          .filter(Boolean)
          .join(", ") || "selection missing",
  };
}

function availContinueGoal(): RetreatSelectionGoal {
  const day = AVAIL_RETREAT_DATE_INTENT.day;
  const selected = isAvailDateDaySelected(day);
  const onDateStep = isAvailOnDateStep();
  const domGoalMet = selected && onDateStep;

  return {
    expectsSelection: true,
    domGoalMet,
    expected: `availability date step, June ${day} selected`,
    actual: !onDateStep
      ? "availability not on date step"
      : selected
        ? `June ${day} selected`
        : isAvailDateDaySelected(AVAIL_PLAYBACK_DATE.day)
          ? `playback date June ${AVAIL_PLAYBACK_DATE.day} still selected`
          : "no expected date selected",
  };
}

function availTimeGoal(): RetreatSelectionGoal {
  const day = AVAIL_PLAYBACK_DATE.day;
  const dateOk = isAvailDateDaySelected(day);
  const timeSelected = isAnyAvailTimeSelected();
  const domGoalMet = dateOk && !timeSelected;

  return {
    expectsSelection: true,
    domGoalMet,
    expected: `June ${day} selected, no time slot`,
    actual: timeSelected
      ? isAvailTimeSelected(AVAIL_PLAYBACK_TIME)
        ? `playback time ${AVAIL_PLAYBACK_TIME} still selected`
        : "unexpected time slot selected"
      : dateOk
        ? `June ${day}, no time`
        : isAvailDateDaySelected(AVAIL_RETREAT_DATE_INTENT.day)
          ? `retreat date June ${AVAIL_RETREAT_DATE_INTENT.day} instead of playback June ${day}`
          : "playback date not selected",
  };
}

function availBookGoal(): RetreatSelectionGoal {
  const day = AVAIL_PLAYBACK_DATE.day;
  const dateOk = isAvailDateDaySelected(day);
  const timeOk = isAvailTimeSelected(AVAIL_PLAYBACK_TIME);
  const domGoalMet = dateOk && timeOk;

  return {
    expectsSelection: true,
    domGoalMet,
    expected: `June ${day} + ${AVAIL_PLAYBACK_TIME}`,
    actual: domGoalMet
      ? `June ${day} + ${AVAIL_PLAYBACK_TIME}`
      : [
          dateOk ? "" : `date not June ${day}`,
          timeOk ? "" : `time not ${AVAIL_PLAYBACK_TIME}`,
        ]
          .filter(Boolean)
          .join(", ") || "selection missing",
  };
}

/** DOM selection baseline for CJM step-back — avail + book beats with stateful UI. */
export function checkRetreatSelectionGoal(
  beat: JourneyBeat | undefined
): RetreatSelectionGoal | null {
  if (!beat) return null;
  switch (beat.id) {
    case "avail-continue":
      return availContinueGoal();
    case "avail-time":
      return availTimeGoal();
    case "avail-book":
      return availBookGoal();
    case "book-step2":
      return bookStep2DefaultGoal();
    default:
      break;
  }

  if (beat.bookScript === "select-book-date" || beat.bookScript === "select-book-time") {
    return bookStep2DefaultGoal();
  }

  if (beat.bookScript === "reserve-appointment") {
    return bookStep2PlaybackGoal();
  }

  return null;
}
