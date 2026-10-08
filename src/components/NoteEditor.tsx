import { useEffect, useRef } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import type { Ink, Note } from '../lib/diary';

interface Props {
  note?: Note;
  ink: Ink;
  placeholder: string;
  onChange: (text: string, noteId?: string) => void;
  onFocus: (noteId?: string) => void;
  onDelete?: (noteId: string) => void;
  onAddPhoto?: (noteId: string) => void;
  compact?: boolean;
}

export function NoteEditor({ note, ink, placeholder, onChange, onFocus, onDelete, onAddPhoto, compact = false }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const line = Number.parseFloat(getComputedStyle(textarea).lineHeight) || (compact ? 35 : 40);
    textarea.style.height = '0px';
    textarea.style.height = `${Math.max(line, Math.ceil(textarea.scrollHeight / line) * line)}px`;
  }, [note?.text, compact]);

  return <div className={`note-editor ${compact ? 'note-editor--compact' : ''}`} data-note-id={note?.id}>
    <textarea
      ref={textareaRef}
      aria-label={placeholder}
      className={`ink-${note?.ink ?? ink}`}
      placeholder={placeholder}
      value={note?.text ?? ''}
      onChange={(event) => onChange(event.target.value, note?.id)}
      onFocus={() => onFocus(note?.id)}
      rows={compact ? 1 : 3}
      spellCheck
    />
    {note && <div className="note-actions">
      {onAddPhoto && <button className="note-photo icon-button" type="button" aria-label="Přidat fotku k zápisu" title="Přidat fotku k zápisu (lze vybrat více)" onClick={() => onAddPhoto(note.id)}><ImagePlus size={16} /></button>}
      {onDelete && <button className="note-delete icon-button" type="button" aria-label="Odebrat poznámku" title="Odebrat poznámku" onClick={() => onDelete(note.id)}><Trash2 size={16} /></button>}
    </div>}
  </div>;
}
