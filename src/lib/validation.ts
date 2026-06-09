export const TITLE_MIN = 3;
export const TITLE_MAX = 200;
export const MESSAGE_MIN = 5;

export function validateTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length > 0 && trimmed.length < TITLE_MIN) return "Mindestens 3 Zeichen.";
  if (trimmed.length > TITLE_MAX) return "Maximal 200 Zeichen.";
  return "";
}

/** Validates a date string (YYYY-MM-DD). Empty string = "required" error. */
export function validateDate(date: string, today = new Date()): string {
  if (!date) return "Bitte ein Datum wählen.";
  const d = new Date(date);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (d < todayMidnight) return "Datum darf nicht in der Vergangenheit liegen.";
  return "";
}

export function validateMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length > 0 && trimmed.length < MESSAGE_MIN) return "Mindestens 5 Zeichen.";
  return "";
}

/** Returns true if the form can be submitted (title + date both valid). */
export function isDeadlineFormValid(title: string, date: string, today?: Date): boolean {
  return validateTitle(title) === "" && validateDate(date, today) === "" && title.trim().length >= TITLE_MIN;
}
