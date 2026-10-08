import JSZip from 'jszip';
import { getAllPhotos, getAllWeeks, getWeek, putPhoto, putWeek } from './storage';
import { normalizeWeek, photoIdsInWeek, type Ink, type LegacyWeekRecord, type Note, type PhotoGroup, type StoredWeekRecord, type WeekRecord } from './diary';

interface BackupManifest {
  format: 'calander-backup';
  version: 2;
  exportedAt: string;
  weeks: WeekRecord[];
  photos: { id: string; name: string; createdAt: number }[];
}

const VALID_INKS = new Set<Ink>(['blue', 'green', 'red', 'black']);

function validNote(value: unknown): value is Note {
  if (!value || typeof value !== 'object') return false;
  const note = value as Partial<Note>;
  return typeof note.id === 'string' && typeof note.text === 'string' && VALID_INKS.has(note.ink as Ink)
    && typeof note.createdAt === 'number' && typeof note.updatedAt === 'number';
}

function validWeekBase(value: unknown): value is StoredWeekRecord {
  if (!value || typeof value !== 'object') return false;
  const week = value as Partial<StoredWeekRecord>;
  return typeof week.id === 'string' && /^\d{4}-W\d{2}$/.test(week.id)
    && typeof week.updatedAt === 'number' && Array.isArray(week.weekNotes)
    && week.weekNotes.every(validNote) && !!week.days && typeof week.days === 'object'
    && Object.values(week.days).every((notes) => Array.isArray(notes) && notes.every(validNote));
}

function validPhotoGroup(value: unknown): value is PhotoGroup {
  if (!value || typeof value !== 'object') return false;
  const group = value as Partial<PhotoGroup>;
  return typeof group.id === 'string' && Array.isArray(group.photoIds) && group.photoIds.length > 0
    && group.photoIds.every((id) => typeof id === 'string')
    && (group.noteId === undefined || typeof group.noteId === 'string')
    && (group.caption === undefined || typeof group.caption === 'string');
}

function validWeek(value: unknown): value is WeekRecord {
  if (!validWeekBase(value)) return false;
  const week = value as Partial<WeekRecord>;
  return !!week.dayPhotoGroups && typeof week.dayPhotoGroups === 'object'
    && Object.values(week.dayPhotoGroups).every((groups) => Array.isArray(groups) && groups.every(validPhotoGroup))
    && Array.isArray(week.weekPhotoGroups) && week.weekPhotoGroups.every(validPhotoGroup);
}

function validLegacyWeek(value: unknown): value is LegacyWeekRecord {
  if (!validWeekBase(value)) return false;
  const week = value as Partial<LegacyWeekRecord>;
  return !!week.dayPhotos && typeof week.dayPhotos === 'object'
    && Object.values(week.dayPhotos).every((ids) => Array.isArray(ids) && ids.every((id) => typeof id === 'string'))
    && Array.isArray(week.weekPhotos) && week.weekPhotos.every((id) => typeof id === 'string');
}

export async function exportBackup(): Promise<void> {
  const [storedWeeks, allPhotos] = await Promise.all([getAllWeeks(), getAllPhotos()]);
  const weeks = storedWeeks.map(normalizeWeek);
  const referenced = new Set(weeks.flatMap(photoIdsInWeek));
  const photos = allPhotos.filter((photo) => referenced.has(photo.id));
  const zip = new JSZip();
  const manifest: BackupManifest = {
    format: 'calander-backup', version: 2, exportedAt: new Date().toISOString(), weeks,
    photos: photos.map(({ id, name, createdAt }) => ({ id, name, createdAt }))
  };
  zip.file('diary.json', JSON.stringify(manifest, null, 2));
  for (const photo of photos) zip.file(`photos/${photo.id}.jpg`, photo.blob);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `kalendar-zaloha-${new Date().toISOString().slice(0, 10)}.zip`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function importBackup(file: File): Promise<{ weeks: number; photos: number }> {
  const zip = await JSZip.loadAsync(file);
  const raw = zip.file('diary.json');
  if (!raw) throw new Error('Soubor neobsahuje zálohu diáře.');
  const manifest = JSON.parse(await raw.async('string')) as Partial<Omit<BackupManifest, 'version'>> & { version?: number };
  const validVersion = manifest.version === 2 || manifest.version === 1;
  if (manifest.format !== 'calander-backup' || !validVersion
    || !Array.isArray(manifest.weeks)
    || !manifest.weeks.every(manifest.version === 2 ? validWeek : validLegacyWeek)
    || !Array.isArray(manifest.photos) || !manifest.photos.every((photo) =>
      typeof photo.id === 'string' && typeof photo.name === 'string' && typeof photo.createdAt === 'number')) {
    throw new Error('Záloha má neplatný nebo nepodporovaný formát.');
  }

  for (const photo of manifest.photos) {
    const archived = zip.file(`photos/${photo.id}.jpg`);
    if (!archived) throw new Error('V záloze chybí některá fotografie.');
  }
  const weeks = (manifest.weeks as StoredWeekRecord[]).map(normalizeWeek);
  const ids = new Set(manifest.photos.map((photo) => photo.id));
  if (weeks.some((week) => photoIdsInWeek(week).some((id) => !ids.has(id)))) {
    throw new Error('Záloha odkazuje na chybějící fotografii.');
  }
  for (const photo of manifest.photos) {
    const archived = zip.file(`photos/${photo.id}.jpg`)!;
    const bytes = await archived.async('uint8array');
    await putPhoto({ id: photo.id, name: photo.name, createdAt: photo.createdAt,
      blob: new Blob([Uint8Array.from(bytes)], { type: 'image/jpeg' }) });
  }
  for (const week of weeks) {
    const existing = await getWeek(week.id);
    if (!existing || existing.updatedAt < week.updatedAt) await putWeek(week);
  }
  return { weeks: weeks.length, photos: manifest.photos.length };
}
