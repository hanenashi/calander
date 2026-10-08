import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { ChevronLeft, ChevronRight, Link2, Minus, Plus, Trash2, X } from 'lucide-react';
import type { Note, PhotoGroup } from '../lib/diary';
import { usePhotoUrl } from '../hooks/usePhotoUrl';

export interface GalleryItem {
  photoId: string;
  group: PhotoGroup;
}

interface Props {
  items: GalleryItem[];
  photoId: string;
  notes: Note[];
  heading: string;
  onSelect: (photoId: string) => void;
  onClose: () => void;
  onChangeGroup: (groupId: string, change: Partial<Pick<PhotoGroup, 'noteId' | 'caption'>>) => void;
  onRemove: (groupId: string, photoId: string) => void;
}

const clamp = (value: number) => Math.min(4, Math.max(1, value));

export function PhotoLightbox({ items, photoId, notes, heading, onSelect, onClose, onChangeGroup, onRemove }: Props) {
  const index = items.findIndex((item) => item.photoId === photoId);
  const item = items[index];
  const url = usePhotoUrl(photoId);
  const linkedNote = item?.group.noteId ? notes.find((note) => note.id === item.group.noteId) : undefined;
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [editing, setEditing] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const storyPointer = useRef({ id: -1, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ startX: 0, startY: 0, distance: 0, scale: 1, swipable: false });

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);

  useEffect(() => { setScale(1); setOffset({ x: 0, y: 0 }); }, [photoId]);

  function select(relative: number) {
    if (index < 0 || items.length < 2) return;
    onSelect(items[(index + relative + items.length) % items.length].photoId);
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const controls = [...document.querySelectorAll<HTMLElement>('.lightbox button:not(:disabled), .lightbox select, .lightbox textarea')];
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || !document.querySelector('.lightbox')?.contains(document.activeElement))) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !document.querySelector('.lightbox')?.contains(document.activeElement))) {
          event.preventDefault(); first?.focus();
        }
        return;
      }
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.key === 'ArrowLeft') { event.preventDefault(); select(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); select(1); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  function zoom(next: number) {
    const value = clamp(next);
    setScale(value);
    if (value === 1) setOffset({ x: 0, y: 0 });
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    zoom(scale + (event.deltaY < 0 ? 0.25 : -0.25));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      gesture.current = { startX: event.clientX, startY: event.clientY, distance: 0, scale, swipable: true };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.distance = Math.hypot(a.x - b.x, a.y - b.y);
      gesture.current.scale = scale;
      gesture.current.swipable = false;
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      zoom(gesture.current.scale * Math.hypot(a.x - b.x, a.y - b.y) / (gesture.current.distance || 1));
    } else if (scale > 1) {
      setOffset((current) => ({ x: current.x + event.clientX - previous.x, y: current.y + event.clientY - previous.y }));
    }
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    if (pointers.current.size === 1 && gesture.current.swipable && scale === 1) {
      const dx = event.clientX - gesture.current.startX;
      const dy = event.clientY - gesture.current.startY;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.35) select(dx < 0 ? 1 : -1);
    }
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 1) gesture.current.swipable = false;
  }

  if (!item) return null;
  const story = linkedNote?.text.trim();
  const caption = item.group.caption?.trim();

  return <div className="lightbox" role="dialog" aria-modal="true" aria-label="Prohlížeč fotografií">
    <header className="lightbox-header">
      <button type="button" ref={closeRef} aria-label="Zavřít fotografii" onClick={onClose}><X /></button>
      <span>{heading} · {index + 1} / {items.length}</span>
      <div className="lightbox-zoom">
        <button type="button" aria-label="Oddálit fotografii" disabled={scale === 1} onClick={() => zoom(scale - 0.5)}><Minus /></button>
        <span>{Math.round(scale * 100)} %</span>
        <button type="button" aria-label="Přiblížit fotografii" disabled={scale === 4} onClick={() => zoom(scale + 0.5)}><Plus /></button>
      </div>
    </header>

    <div className="lightbox-stage" onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove}
      onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onDoubleClick={() => zoom(scale === 1 ? 2 : 1)}>
      {url ? <div className="lightbox-image-frame">
        <img src={url} alt="Fotografie v diáři" draggable={false}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }} />
        {(story || caption) && <div className="lightbox-story"
          onWheel={(event) => event.stopPropagation()}
          onPointerDown={(event) => { event.stopPropagation(); storyPointer.current = { id: event.pointerId, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerMove={(event) => { event.stopPropagation(); if (storyPointer.current.id === event.pointerId) {
            event.currentTarget.scrollTop += storyPointer.current.y - event.clientY;
            storyPointer.current.y = event.clientY;
          } }}
          onPointerUp={(event) => { event.stopPropagation(); storyPointer.current.id = -1; }}>
          {story && <p>{story}</p>}{caption && <p>{caption}</p>}
        </div>}
      </div> : <span className="lightbox-loading">Načítám fotografii…</span>}
    </div>

    {items.length > 1 && <>
      <button type="button" className="lightbox-arrow lightbox-arrow--prev" aria-label="Předchozí fotografie" onClick={() => select(-1)}><ChevronLeft /></button>
      <button type="button" className="lightbox-arrow lightbox-arrow--next" aria-label="Další fotografie" onClick={() => select(1)}><ChevronRight /></button>
    </>}

    <footer className="lightbox-footer">
      <button type="button" onClick={() => setEditing(!editing)} aria-expanded={editing}><Link2 size={18} /> Text k fotce</button>
      <span>{items.length > 1 ? 'Přejeďte prstem pro další' : 'Dvojitým klepnutím přiblížíte'}</span>
      <button type="button" className="lightbox-delete" onClick={() => onRemove(item.group.id, photoId)}><Trash2 size={17} /> Odebrat</button>
    </footer>

    {editing && <div className="lightbox-edit">
      <label>Propojit se zápisem
        <select value={item.group.noteId ?? ''} onChange={(event) => onChangeGroup(item.group.id, { noteId: event.target.value || undefined })}>
          <option value="">Bez propojení</option>
          {notes.map((note) => <option key={note.id} value={note.id}>{note.text.trim().slice(0, 72) || 'Prázdný zápis'}</option>)}
        </select>
      </label>
      <label>Popisek fotografie / skupiny
        <textarea rows={2} value={item.group.caption ?? ''} placeholder="Volitelný popisek…"
          onChange={(event) => onChangeGroup(item.group.id, { caption: event.target.value })} />
      </label>
    </div>}
  </div>;
}
