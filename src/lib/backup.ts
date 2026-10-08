import JSZip from 'jszip';
import { getAllPhotos, getAllWeeks, getWeek, putPhoto, putWeek } from './storage';
import { normalizeWeek, type Ink, type Note, type WeekRecord } from './diary';

interface BackupManifest {
  format: 'calander-backup';
  version: 1;
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

function validWeek(value: unknown): value is WeekRecord {
  if (!value || typeof value !== 'object') return false;
  const week = value as Partial<WeekRecord>;
  return typeof week.id === 'string' && /^\d{4}-W\d{2}$/.test(week.id)
    && typeof week.updatedAt === 'number' && Array.isArray(week.weekNotes)
    && week.weekNotes.every(validNote) && !!week.days && typeof week.days === 'object'
    && Object.values(week.days).every((notes) => Array.isArray(notes) && notes.every(validNote))
    && !!week.dayPhotos && typeof week.dayPhotos === 'object'
    && Object.values(week.dayPhotos).every((ids) => Array.isArray(ids) && ids.every((id) => typeof id === 'string'))
    && Array.isArray(week.weekPhotos) && week.weekPhotos.every((id) => typeof id === 'string');
}

export async function exportBackup(): Promise<void> {
  const [weeks, allPhotos] = await Promise.all([getAllWeeks(), getAllPhotos()]);
  const referenced = new Set(weeks.flatMap((week) => [
    ...week.weekPhotos, ...Object.values(week.dayPhotos).flat()
  ]));
  const photos = allPhotos.filter((photo) => referenced.has(photo.id));
  const zip = new JSZip();
  const manifest: BackupManifest = {
    format: 'calander-backup', version: 1, exportedAt: new Date().toISOString(), weeks,
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
  const manifest = JSON.parse(await raw.async('string')) as Partial<BackupManifest>;
  if (manifest.format !== 'calander-backup' || manifest.version !== 1
    || !Array.isArray(manifest.weeks) || !manifest.weeks.every(validWeek)
    || !Array.isArray(manifest.photos) || !manifest.photos.every((photo) =>
      typeof photo.id === 'string' && typeof photo.name === 'string' && typeof photo.createdAt === 'number')) {
    throw new Error('Záloha má neplatný nebo nepodporovaný formát.');
  }

  for (const photo of manifest.photos) {
    const archived = zip.file(`photos/${photo.id}.jpg`);
    if (!archived) throw new Error('V záloze chybí některá fotografie.');
  }
  const ids = new Set(manifest.photos.map((photo) => photo.id));
  if (manifest.weeks.some((week) => [...week.weekPhotos, ...Object.values(week.dayPhotos).flat()].some((id) => !ids.has(id)))) {
    throw new Error('Záloha odkazuje na chybějící fotografii.');
  }
  for (const photo of manifest.photos) {
    const archived = zip.file(`photos/${photo.id}.jpg`)!;
    const bytes = await archived.async('uint8array');
    await putPhoto({ id: photo.id, name: photo.name, createdAt: photo.createdAt,
      blob: new Blob([Uint8Array.from(bytes)], { type: 'image/jpeg' }) });
  }
  for (const week of manifest.weeks) {
    const existing = await getWeek(week.id);
    if (!existing || existing.updatedAt < week.updatedAt) await putWeek(normalizeWeek(week));
  }
  return { weeks: manifest.weeks.length, photos: manifest.photos.length };
}
