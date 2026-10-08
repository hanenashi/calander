export type Ink = 'blue' | 'green' | 'red' | 'black';

export interface Note {
  id: string;
  text: string;
  ink: Ink;
  createdAt: number;
  updatedAt: number;
}

export interface WeekRecord {
  id: string;
  days: Record<string, Note[]>;
  weekNotes: Note[];
  dayPhotos: Record<string, string[]>;
  weekPhotos: string[];
  updatedAt: number;
}

export interface PhotoRecord {
  id: string;
  blob: Blob;
  name: string;
  createdAt: number;
}

export function emptyWeek(id: string): WeekRecord {
  return { id, days: {}, weekNotes: [], dayPhotos: {}, weekPhotos: [], updatedAt: Date.now() };
}

export function createNote(ink: Ink): Note {
  const now = Date.now();
  return { id: crypto.randomUUID(), text: '', ink, createdAt: now, updatedAt: now };
}

export function normalizeWeek(value: WeekRecord): WeekRecord {
  return {
    id: value.id,
    days: value.days ?? {},
    weekNotes: value.weekNotes ?? [],
    dayPhotos: value.dayPhotos ?? {},
    weekPhotos: value.weekPhotos ?? [],
    updatedAt: value.updatedAt ?? Date.now()
  };
}
