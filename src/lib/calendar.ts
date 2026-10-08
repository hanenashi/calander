export const DAY_NAMES = ['pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota', 'neděle'] as const;
export const DAY_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'] as const;

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function mondayOf(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

export function isoWeekId(date: Date): string {
  const thursday = addDays(mondayOf(date), 3);
  const isoYear = thursday.getFullYear();
  const firstThursday = addDays(mondayOf(new Date(isoYear, 0, 4)), 3);
  const week = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / 604800000);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

export function weekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function weekHeading(monday: Date): string {
  const week = Number(isoWeekId(monday).split('W')[1]);
  const sunday = addDays(monday, 6);
  const month = new Intl.DateTimeFormat('cs-CZ', { month: 'long' }).format(sunday);
  return `${week}. týden · ${month} ${sunday.getFullYear()}`;
}

export function monthGenitive(date: Date): string {
  return new Intl.DateTimeFormat('cs-CZ', { month: 'long', day: 'numeric' }).format(date).replace(/^\d+\.\s*/, '');
}
