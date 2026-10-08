import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Download, ImagePlus, Menu, Plus, Printer, RotateCcw, Upload, WifiOff, X } from 'lucide-react';
import { DAY_NAMES, DAY_SHORT, addDays, isoWeekId, localDateKey, mondayOf, monthGenitive, weekDates, weekHeading } from './lib/calendar';
import { createNote, emptyWeek, normalizeWeek, type Ink, type Note, type WeekRecord } from './lib/diary';
import { getWeek, putPhoto, putWeek } from './lib/storage';
import { compressPhoto } from './lib/photos';
import { exportBackup, importBackup } from './lib/backup';
import { useDiary } from './hooks/useDiary';
import { NoteEditor } from './components/NoteEditor';
import { PhotoView } from './components/PhotoView';
import './styles.css';

type Location = { kind: 'day'; key: string } | { kind: 'week' };
type Notice = { text: string; undo?: () => void };
const INKS: { key: Ink; label: string }[] = [
  { key: 'blue', label: 'Modrá' }, { key: 'green', label: 'Zelená' },
  { key: 'red', label: 'Červená' }, { key: 'black', label: 'Černá' }
];

function notesAt(week: WeekRecord, location: Location): Note[] {
  return location.kind === 'week' ? week.weekNotes : (week.days[location.key] ?? []);
}

function setNotes(week: WeekRecord, location: Location, notes: Note[]): WeekRecord {
  return location.kind === 'week'
    ? { ...week, weekNotes: notes }
    : { ...week, days: { ...week.days, [location.key]: notes } };
}

function photoIdsAt(week: WeekRecord, location: Location): string[] {
  return location.kind === 'week' ? week.weekPhotos : (week.dayPhotos[location.key] ?? []);
}

function setPhotoIds(week: WeekRecord, location: Location, ids: string[]): WeekRecord {
  return location.kind === 'week'
    ? { ...week, weekPhotos: ids }
    : { ...week, dayPhotos: { ...week.dayPhotos, [location.key]: ids } };
}

function BotanicalMark() {
  return <svg viewBox="0 0 45 45" fill="none" aria-hidden="true" className="botanical-mark">
    <path d="M21 39C24 26 21 17 14 7M22 28c9-7 13-11 15-20M20 23C12 19 8 18 4 19m19 11c8-2 13-1 18 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M14 8c-1 6 0 9 5 11 2-6 0-9-5-11ZM36 8c-6 0-9 3-10 8 6 1 9-2 10-8ZM5 19c3-4 6-4 10-2-1 5-5 6-10 2Zm36 13c-4-5-9-6-14-3 3 5 8 6 14 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>;
}

function App() {
  const today = useMemo(() => new Date(), []);
  const [monday, setMonday] = useState(() => mondayOf(today));
  const [selectedDay, setSelectedDay] = useState(() => (today.getDay() + 6) % 7);
  const [mobilePage, setMobilePage] = useState<'day' | 'week'>('day');
  const [ink, setInk] = useState<Ink>('blue');
  const [activeNoteId, setActiveNoteId] = useState<string>();
  const [notice, setNotice] = useState<Notice>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [writingSize, setWritingSize] = useState(() => Number(localStorage.getItem('calander-writing-size') ?? 18));
  const photoInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const photoTargetRef = useRef<{ location: Location; weekId: string }>({ location: { kind: 'day', key: localDateKey(today) }, weekId: isoWeekId(today) });
  const activeWeekIdRef = useRef(isoWeekId(monday));
  activeWeekIdRef.current = isoWeekId(monday);
  const { week, saveState, updateWeek, reload, flush } = useDiary(isoWeekId(monday));
  const dates = useMemo(() => weekDates(monday), [monday]);
  const selectedKey = localDateKey(dates[selectedDay]);

  useEffect(() => {
    const onOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOnline);
    void navigator.storage?.persist?.();
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOnline); };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--writing-size', `${writingSize}px`);
    localStorage.setItem('calander-writing-size', String(writingSize));
  }, [writingSize]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(undefined), notice.undo ? 9000 : 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function changeWeek(offset: number) {
    setMonday((date) => addDays(date, offset * 7));
    setSelectedDay(0);
    setMobilePage('day');
    setActiveNoteId(undefined);
  }

  function goToday() {
    setMonday(mondayOf(new Date()));
    setSelectedDay((new Date().getDay() + 6) % 7);
    setMobilePage('day');
  }

  function changeNote(location: Location, text: string, noteId?: string) {
    updateWeek((current) => {
      const notes = notesAt(current, location);
      if (noteId) return setNotes(current, location, notes.map((note) => note.id === noteId ? { ...note, text, updatedAt: Date.now() } : note));
      const note = { ...createNote(ink), text };
      setActiveNoteId(note.id);
      return setNotes(current, location, [...notes, note]);
    });
  }

  function addNote(location: Location) {
    const note = createNote(ink);
    updateWeek((current) => setNotes(current, location, [...notesAt(current, location), note]));
    setActiveNoteId(note.id);
    requestAnimationFrame(() => document.querySelector<HTMLTextAreaElement>(`[data-note-id="${note.id}"] textarea`)?.focus());
  }

  function removeNote(location: Location, id: string) {
    if (!week) return;
    const removed = notesAt(week, location).find((note) => note.id === id);
    if (!removed) return;
    updateWeek((current) => setNotes(current, location, notesAt(current, location).filter((note) => note.id !== id)));
    setNotice({ text: 'Poznámka odebrána.', undo: () => {
      updateWeek((current) => setNotes(current, location, [...notesAt(current, location), removed]));
      setNotice(undefined);
    } });
  }

  function chooseInk(nextInk: Ink) {
    setInk(nextInk);
    if (!activeNoteId) return;
    updateWeek((current) => {
      const days = Object.fromEntries(Object.entries(current.days).map(([key, notes]) =>
        [key, notes.map((note) => note.id === activeNoteId ? { ...note, ink: nextInk, updatedAt: Date.now() } : note)]));
      const weekNotes = current.weekNotes.map((note) => note.id === activeNoteId ? { ...note, ink: nextInk, updatedAt: Date.now() } : note);
      return { ...current, days, weekNotes };
    });
  }

  function choosePhoto(location: Location) {
    if (!week) { setNotice({ text: 'Počkejte, až se diář načte.' }); return; }
    photoTargetRef.current = { location, weekId: isoWeekId(monday) };
    photoInputRef.current?.click();
  }

  async function onPhotoSelected(file?: File) {
    if (!file) return;
    const { location, weekId } = photoTargetRef.current;
    try {
      const blob = await compressPhoto(file);
      const id = crypto.randomUUID();
      await putPhoto({ id, blob, name: file.name, createdAt: Date.now() });
      if (activeWeekIdRef.current === weekId) {
        updateWeek((current) => setPhotoIds(current, location, [...photoIdsAt(current, location), id]));
      } else {
        await flush();
        const stored = normalizeWeek((await getWeek(weekId)) ?? emptyWeek(weekId));
        await putWeek({ ...setPhotoIds(stored, location, [...photoIdsAt(stored, location), id]), updatedAt: Date.now() });
      }
      setNotice({ text: 'Fotografie přidána a uložena v zařízení.' });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'Fotografii se nepodařilo přidat.' });
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  }

  function removePhoto(location: Location, id: string) {
    updateWeek((current) => setPhotoIds(current, location, photoIdsAt(current, location).filter((value) => value !== id)));
    setNotice({ text: 'Fotografie odebrána.', undo: () => {
      updateWeek((current) => setPhotoIds(current, location, [...photoIdsAt(current, location), id]));
      setNotice(undefined);
    } });
  }

  async function makeBackup() {
    setMenuOpen(false);
    try {
      await flush();
      await exportBackup();
      setNotice({ text: 'Záloha stažena. Uchovejte ji na bezpečném místě.' });
    } catch { setNotice({ text: 'Zálohu se nepodařilo vytvořit.' }); }
  }

  async function restoreBackup(file?: File) {
    if (!file) return;
    setMenuOpen(false);
    if (!window.confirm('Obnovit zálohu? Novější zápisy v tomto zařízení zůstanou zachované.')) return;
    try {
      await flush();
      const result = await importBackup(file);
      await reload();
      setNotice({ text: `Obnoveno ${result.weeks} týdnů a ${result.photos} fotografií.` });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'Zálohu se nepodařilo obnovit.' });
    } finally {
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  }

  function renderNotes(location: Location, compact: boolean) {
    if (!week) return null;
    const notes = notesAt(week, location);
    const placeholder = location.kind === 'week' ? 'Sem můžete psát, co patří celému týdnu…' : 'Dotkněte se a pište…';
    return <div className="notes-list">
      {(notes.length ? notes : [undefined]).map((note, index) => <NoteEditor key={index === 0 ? 'first' : note?.id ?? `empty-${index}`}
        note={note} ink={ink} compact={compact} placeholder={index === 0 ? placeholder : 'Další poznámka…'}
        onChange={(text, id) => changeNote(location, text, id)}
        onFocus={(id) => { setActiveNoteId(id); if (location.kind === 'day') setSelectedDay(dates.findIndex((date) => localDateKey(date) === location.key)); }}
        onDelete={(id) => removeNote(location, id)} />)}
    </div>;
  }

  function renderPhotos(location: Location, compact = false) {
    if (!week) return null;
    const ids = photoIdsAt(week, location);
    if (!ids.length) return null;
    return <div className="photo-list">{ids.map((id) => <PhotoView key={id} id={id} compact={compact} onRemove={(photoId) => removePhoto(location, photoId)} />)}</div>;
  }

  const saveText = saveState === 'loading' ? 'Načítám diář…' : saveState === 'saving' ? 'Ukládám…' : saveState === 'error' ? 'Uložení se nezdařilo' : 'Uloženo v tomto zařízení';

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><BotanicalMark /><span>Kalendář</span></div>
      <div className="week-navigation" aria-label="Pohyb mezi týdny">
        <button type="button" className="nav-arrow" aria-label="Předchozí týden" onClick={() => changeWeek(-1)}><ChevronLeft /></button>
        <h1>{weekHeading(monday)}</h1>
        <button type="button" className="nav-arrow" aria-label="Další týden" onClick={() => changeWeek(1)}><ChevronRight /></button>
        <button type="button" className="today-button" onClick={goToday}>DNES</button>
      </div>
      <div className="desktop-tools">
        <div className="ink-picker" role="group" aria-label="Barva pera">
          {INKS.map((item) => <button key={item.key} type="button" className={`ink-option ${ink === item.key ? 'is-active' : ''}`} aria-label={item.label} aria-pressed={ink === item.key} title={item.label} onClick={() => chooseInk(item.key)}><span className={`ink-dot ink-${item.key}`} /><span>{item.label}</span></button>)}
        </div>
        <button className="tool-button" type="button" onClick={() => choosePhoto({ kind: 'day', key: selectedKey })}><ImagePlus /><span>Fotka</span></button>
        <button className="tool-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}><Menu /><span>Více</span></button>
      </div>
    </header>

    {menuOpen && <div className="menu-panel">
      <button type="button" onClick={() => void makeBackup()}><Download size={19} /> Stáhnout zálohu</button>
      <button type="button" onClick={() => backupInputRef.current?.click()}><Upload size={19} /> Obnovit zálohu</button>
      <button type="button" onClick={() => { setMenuOpen(false); window.print(); }}><Printer size={19} /> Tisknout týden</button>
      <div className="size-controls"><span>Velikost písma</span><button type="button" aria-label="Zmenšit písmo" onClick={() => setWritingSize(Math.max(15, writingSize - 1))}>A−</button><button type="button" aria-label="Zvětšit písmo" onClick={() => setWritingSize(Math.min(25, writingSize + 1))}>A+</button></div>
    </div>}

    <main>
      <div className="mobile-day-tabs" role="tablist" aria-label="Dny týdne">
        {dates.map((date, index) => <button key={localDateKey(date)} type="button" role="tab" aria-selected={mobilePage === 'day' && selectedDay === index} className={mobilePage === 'day' && selectedDay === index ? 'is-selected' : ''} onClick={() => { setSelectedDay(index); setMobilePage('day'); setActiveNoteId(undefined); }}><span>{DAY_SHORT[index]}</span><strong>{date.getDate()}</strong></button>)}
      </div>

      <div className="diary-spread">
        <section className="diary-page days-page" aria-label="Dny týdne">
          <div className="page-header desktop-page-header"><span>{weekHeading(monday)}</span><BotanicalMark /></div>
          {dates.map((date, index) => {
            const key = localDateKey(date);
            const location: Location = { kind: 'day', key };
            return <article key={key} className={`day-row ${localDateKey(today) === key ? 'is-today' : ''} ${selectedDay === index ? 'is-selected' : ''}`} onClick={() => setSelectedDay(index)}>
              <div className="day-label"><span>{DAY_NAMES[index]}</span><strong>{date.getDate()}</strong><small>{monthGenitive(date)}</small></div>
              <div className="day-content">{renderNotes(location, true)}{renderPhotos(location, true)}</div>
              <button className="row-add icon-button" type="button" aria-label={`Další poznámka pro ${DAY_NAMES[index]}`} title="Další poznámka" onClick={() => addNote(location)}><Plus size={17} /></button>
            </article>;
          })}
        </section>

        <section className="diary-page week-page" aria-label="Poznámky k týdnu">
          <div className="page-header"><h2>Poznámky k týdnu</h2><BotanicalMark /></div>
          <div className="week-writing">{renderNotes({ kind: 'week' }, false)}{renderPhotos({ kind: 'week' })}</div>
          <div className="page-actions"><button type="button" onClick={() => addNote({ kind: 'week' })}><Plus size={17} /> Další poznámka</button><button type="button" onClick={() => choosePhoto({ kind: 'week' })}><ImagePlus size={17} /> Přidat fotku</button></div>
        </section>
      </div>

      <section className={`mobile-page ${mobilePage === 'week' ? 'show-week' : 'show-day'}`}>
        {mobilePage === 'day' ? <div className="mobile-paper">
          <div className="mobile-page-title"><h2>{DAY_NAMES[selectedDay][0].toUpperCase() + DAY_NAMES[selectedDay].slice(1)} {dates[selectedDay].getDate()}. {monthGenitive(dates[selectedDay])}</h2><BotanicalMark /></div>
          {renderNotes({ kind: 'day', key: selectedKey }, false)}
          {renderPhotos({ kind: 'day', key: selectedKey })}
          <div className="page-actions"><button type="button" onClick={() => addNote({ kind: 'day', key: selectedKey })}><Plus size={18} /> Další poznámka</button><button type="button" onClick={() => choosePhoto({ kind: 'day', key: selectedKey })}><ImagePlus size={18} /> Přidat fotku</button></div>
          <button type="button" className="page-switch" onClick={() => { setMobilePage('week'); setActiveNoteId(undefined); }}><BookOpen size={19} /> Týdenní poznámky <ChevronRight size={20} /></button>
        </div> : <div className="mobile-paper">
          <div className="mobile-page-title"><h2>Poznámky k týdnu</h2><BotanicalMark /></div>
          {renderNotes({ kind: 'week' }, false)}
          {renderPhotos({ kind: 'week' })}
          <div className="page-actions"><button type="button" onClick={() => addNote({ kind: 'week' })}><Plus size={18} /> Další poznámka</button><button type="button" onClick={() => choosePhoto({ kind: 'week' })}><ImagePlus size={18} /> Přidat fotku</button></div>
          <button type="button" className="page-switch" onClick={() => { setMobilePage('day'); setActiveNoteId(undefined); }}><CalendarDays size={19} /> Zpět na dny <ChevronRight size={20} /></button>
        </div>}
      </section>
    </main>

    <footer className="footer-bar"><span className={saveState === 'error' ? 'save-error' : ''}>{saveText}</span><span>{online ? 'Funguje i bez internetu' : <><WifiOff size={15} /> Bez internetu</>}</span></footer>
    <div className="mobile-tools"><div className="ink-picker" role="group" aria-label="Barva pera">{INKS.map((item) => <button key={item.key} type="button" className={`ink-option ${ink === item.key ? 'is-active' : ''}`} aria-label={item.label} aria-pressed={ink === item.key} onClick={() => chooseInk(item.key)}><span className={`ink-dot ink-${item.key}`} /></button>)}</div><button type="button" className="tool-button" aria-label="Přidat fotografii" onClick={() => choosePhoto(mobilePage === 'week' ? { kind: 'week' } : { kind: 'day', key: selectedKey })}><ImagePlus /></button><button type="button" className="tool-button" aria-label="Další možnosti" onClick={() => setMenuOpen(!menuOpen)}><Menu /></button></div>

    {notice && <div className="notice" role="status"><span>{notice.text}</span>{notice.undo && <button type="button" onClick={notice.undo}><RotateCcw size={16} /> Vrátit</button>}<button type="button" aria-label="Zavřít zprávu" onClick={() => setNotice(undefined)}><X size={16} /></button></div>}
    <input ref={photoInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onPhotoSelected(event.target.files?.[0])} />
    <input ref={backupInputRef} className="sr-only" type="file" accept=".zip,application/zip" onChange={(event) => void restoreBackup(event.target.files?.[0])} />
  </div>;
}

export default App;
