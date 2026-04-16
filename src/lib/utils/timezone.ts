/**
 * IST timezone utilities for Mumbai operations.
 * All date strings in the system use YYYY-MM-DD in IST.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30

/** Returns today's date string in IST (YYYY-MM-DD) */
export function todayIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return ist.toISOString().split('T')[0];
}

/** Returns current IST Date object */
export function nowIST(): Date {
  return new Date(Date.now() + IST_OFFSET_MS);
}

/** Checks if current IST time is within shift window */
export function isWithinShiftWindow(
  shiftStart: string,
  shiftEnd: string,
  windowMinutes: number = 30
): boolean {
  const now = new Date();
  const istHours = (now.getUTCHours() + 5) % 24 + (now.getUTCMinutes() + 30 >= 60 ? 1 : 0);
  const istMinutes = (now.getUTCMinutes() + 30) % 60;
  const currentMinutes = istHours * 60 + istMinutes;

  const [startH, startM] = shiftStart.split(':').map(Number);
  const shiftStartMinutes = startH * 60 + startM;

  // Allow check-in from (shiftStart - windowMinutes) to shiftEnd
  const [endH, endM] = shiftEnd.split(':').map(Number);
  const shiftEndMinutes = endH * 60 + endM;

  return currentMinutes >= (shiftStartMinutes - windowMinutes) && currentMinutes <= shiftEndMinutes;
}
