import { describe, expect, it } from 'vitest';
import { normalizeWeek, photoIdsInWeek, type LegacyWeekRecord } from './diary';

describe('photo groups', () => {
  it('keeps existing diary photos as independent single-photo groups', () => {
    const oldWeek: LegacyWeekRecord = {
      id: '2026-W41', days: {}, weekNotes: [], updatedAt: 5,
      dayPhotos: { '2026-10-09': ['first', 'second'] }, weekPhotos: ['weekly']
    };
    const migrated = normalizeWeek(oldWeek);
    expect(migrated.dayPhotoGroups['2026-10-09']).toEqual([
      { id: 'legacy-first', photoIds: ['first'] },
      { id: 'legacy-second', photoIds: ['second'] }
    ]);
    expect(migrated.weekPhotoGroups).toEqual([{ id: 'legacy-weekly', photoIds: ['weekly'] }]);
    expect(photoIdsInWeek(migrated)).toEqual(['weekly', 'first', 'second']);
    expect(normalizeWeek(migrated)).toEqual(migrated);
  });
});
