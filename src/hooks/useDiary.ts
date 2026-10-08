import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyWeek, normalizeWeek, type WeekRecord } from '../lib/diary';
import { getWeek, putWeek } from '../lib/storage';

export type SaveState = 'loading' | 'saved' | 'saving' | 'error';

export function useDiary(weekId: string) {
  const [week, setWeek] = useState<WeekRecord | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('loading');
  const weekRef = useRef<WeekRecord | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const saveIdRef = useRef(0);

  useEffect(() => {
    let active = true;
    weekRef.current = null;
    setWeek(null);
    setSaveState('loading');
    const load = async () => {
      try {
        await queueRef.current.catch(() => undefined);
        const loaded = normalizeWeek((await getWeek(weekId)) ?? emptyWeek(weekId));
        if (!active) return;
        weekRef.current = loaded;
        setWeek(loaded);
        setSaveState('saved');
      } catch {
        if (active) setSaveState('error');
      }
    };
    void load();
    return () => { active = false; };
  }, [weekId]);

  const updateWeek = useCallback((update: (current: WeekRecord) => WeekRecord) => {
    const current = weekRef.current;
    if (!current) return;
    const next = { ...update(current), updatedAt: Date.now() };
    weekRef.current = next;
    setWeek(next);
    setSaveState('saving');
    const saveId = ++saveIdRef.current;
    queueRef.current = queueRef.current.catch(() => undefined).then(() => putWeek(next));
    void queueRef.current.then(
      () => { if (saveId === saveIdRef.current) setSaveState('saved'); },
      () => { if (saveId === saveIdRef.current) setSaveState('error'); }
    );
  }, []);

  const reload = useCallback(async () => {
    await queueRef.current.catch(() => undefined);
    const loaded = normalizeWeek((await getWeek(weekId)) ?? emptyWeek(weekId));
    weekRef.current = loaded;
    setWeek(loaded);
    setSaveState('saved');
  }, [weekId]);

  const flush = useCallback(() => queueRef.current, []);

  return { week, saveState, updateWeek, reload, flush };
}
