import { describe, expect, it } from 'vitest';
import { addDays, isoWeekId, localDateKey, mondayOf, weekDates, weekHeading } from './calendar';

describe('Czech weekly calendar', () => {
  it('uses Monday through Sunday and the ISO week-year at New Year', () => {
    const monday = mondayOf(new Date(2021, 0, 1));
    expect(localDateKey(monday)).toBe('2020-12-28');
    expect(weekDates(monday).map(localDateKey)).toEqual([
      '2020-12-28', '2020-12-29', '2020-12-30', '2020-12-31',
      '2021-01-01', '2021-01-02', '2021-01-03'
    ]);
    expect(isoWeekId(monday)).toBe('2020-W53');
    expect(isoWeekId(addDays(monday, 7))).toBe('2021-W01');
  });

  it('shows the current Czech week heading', () => {
    expect(weekHeading(new Date(2026, 9, 5))).toBe('41. týden · říjen 2026');
  });
});
