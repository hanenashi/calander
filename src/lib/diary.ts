export type Ink = 'blue' | 'green' | 'red' | 'black';

export interface Note {
  id: string;
  text: string;
  ink: Ink;
  createdAt: number;
  updatedAt: number;
}

export interface PhotoGroup {
  id: string;
  photoIds: string[];
  noteId?: string;
  caption?: string;
}

export interface WeekRecord {
  id: string;
  days: Record<string, Note[]>;
  weekNotes: Note[];
  dayPhotoGroups: Record<string, PhotoGroup[]>;
  weekPhotoGroups: PhotoGroup[];
  updatedAt: number;
}

export interface LegacyWeekRecord extends Omit<WeekRecord, 'dayPhotoGroups' | 'weekPhotoGroups'> {
  dayPhotos: Record<string, string[]>;
  weekPhotos: string[];
}

export type StoredWeekRecord = WeekRecord | LegacyWeekRecord;

export interface PhotoRecord {
  id: string;
  blob: Blob;
  name: string;
  createdAt: number;
}

export function emptyWeek(id: string): WeekRecord {
  return { id, days: {}, weekNotes: [], dayPhotoGroups: {}, weekPhotoGroups: [], updatedAt: Date.now() };
}

export function createPhotoGroup(photoIds: string[], noteId?: string): PhotoGroup {
  return { id: crypto.randomUUID(), photoIds, ...(noteId ? { noteId } : {}) };
}

export function createNote(ink: Ink): Note {
  const now = Date.now();
  return { id: crypto.randomUUID(), text: '', ink, createdAt: now, updatedAt: now };
}

export function normalizeWeek(value: StoredWeekRecord): WeekRecord {
  const legacy = value as LegacyWeekRecord;
  const current = value as WeekRecord;
  const legacyGroups = (ids: string[]) => ids.map((id) => ({ id: `legacy-${id}`, photoIds: [id] }));
  return {
    id: value.id,
    days: value.days ?? {},
    weekNotes: value.weekNotes ?? [],
    dayPhotoGroups: current.dayPhotoGroups ?? Object.fromEntries(
      Object.entries(legacy.dayPhotos ?? {}).map(([key, ids]) => [key, legacyGroups(ids)])),
    weekPhotoGroups: current.weekPhotoGroups ?? legacyGroups(legacy.weekPhotos ?? []),
    updatedAt: value.updatedAt ?? Date.now()
  };
}

export function photoIdsInWeek(week: WeekRecord): string[] {
  return [...week.weekPhotoGroups, ...Object.values(week.dayPhotoGroups).flat()]
    .flatMap((group) => group.photoIds);
}
