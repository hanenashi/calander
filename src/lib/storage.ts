import type { PhotoRecord, StoredWeekRecord, WeekRecord } from './diary';

const DB_NAME = 'calander-diary';
const DB_VERSION = 1;
let databasePromise: Promise<IDBDatabase> | undefined;

function database(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;
  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('weeks')) db.createObjectStore('weeks', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  databasePromise = opening.catch((error) => {
    databasePromise = undefined;
    throw error;
  });
  return databasePromise;
}

async function transaction<T>(storeName: 'weeks' | 'photos', mode: IDBTransactionMode, action: (store: IDBObjectStore, resolve: (value: T) => void, reject: (error: Error) => void) => void): Promise<T> {
  const db = await database();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    let settled = false;
    let result: T;
    const done = (value: T) => { result = value; };
    const fail = (error: Error) => { if (!settled) { settled = true; reject(error); } };
    tx.oncomplete = () => { if (!settled) { settled = true; resolve(result); } };
    tx.onerror = () => fail(tx.error ?? new Error('Ukládání selhalo.'));
    tx.onabort = () => fail(tx.error ?? new Error('Ukládání bylo přerušeno.'));
    try { action(tx.objectStore(storeName), done, fail); }
    catch (error) { fail(error instanceof Error ? error : new Error(String(error))); }
  });
}

export function getWeek(id: string): Promise<StoredWeekRecord | undefined> {
  return transaction('weeks', 'readonly', (store, resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result as StoredWeekRecord | undefined);
    request.onerror = () => reject(request.error ?? new Error('Týden se nepodařilo načíst.'));
  });
}

export function putWeek(record: WeekRecord): Promise<void> {
  return transaction('weeks', 'readwrite', (store, resolve, reject) => {
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Týden se nepodařilo uložit.'));
  });
}

export function getAllWeeks(): Promise<StoredWeekRecord[]> {
  return transaction('weeks', 'readonly', (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as StoredWeekRecord[]);
    request.onerror = () => reject(request.error ?? new Error('Zálohu se nepodařilo načíst.'));
  });
}

export function getPhoto(id: string): Promise<PhotoRecord | undefined> {
  return transaction('photos', 'readonly', (store, resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result as PhotoRecord | undefined);
    request.onerror = () => reject(request.error ?? new Error('Fotografii se nepodařilo načíst.'));
  });
}

export function putPhoto(record: PhotoRecord): Promise<void> {
  return transaction('photos', 'readwrite', (store, resolve, reject) => {
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Fotografii se nepodařilo uložit.'));
  });
}

export function getAllPhotos(): Promise<PhotoRecord[]> {
  return transaction('photos', 'readonly', (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as PhotoRecord[]);
    request.onerror = () => reject(request.error ?? new Error('Zálohu se nepodařilo načíst.'));
  });
}

export function deletePhoto(id: string): Promise<void> {
  return transaction('photos', 'readwrite', (store, resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Fotografii se nepodařilo odebrat.'));
  });
}
