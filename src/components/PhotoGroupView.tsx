import { Image, Link2, X } from 'lucide-react';
import type { PhotoGroup } from '../lib/diary';
import { usePhotoUrl } from '../hooks/usePhotoUrl';

interface Props {
  group: PhotoGroup;
  compact?: boolean;
  onOpen: (photoId: string) => void;
  onRemove: (groupId: string, photoId: string) => void;
}

export function PhotoGroupView({ group, compact = false, onOpen, onRemove }: Props) {
  const firstId = group.photoIds[0];
  const url = usePhotoUrl(firstId);
  return <div className={`photo-group ${compact ? 'photo-group--compact' : ''}`} data-group-id={group.id}>
    <button type="button" className="photo-card" aria-label={`Otevřít fotografii${group.photoIds.length > 1 ? `, skupina ${group.photoIds.length} fotografií` : ''}`}
      onClick={() => onOpen(firstId)}>
      {url ? <img src={url} alt="Fotografie v diáři" loading="eager" /> : <span className="photo-loading"><Image aria-hidden="true" /></span>}
      {group.photoIds.length > 1 && <span className="photo-count">+{group.photoIds.length - 1}</span>}
    </button>
    {group.noteId && <span className="photo-linked" title="Fotografie patří k zápisu"><Link2 size={13} /></span>}
    {group.photoIds.length === 1 && <button type="button" className="photo-remove" aria-label="Odebrat fotografii" title="Odebrat fotografii"
      onClick={() => onRemove(group.id, firstId)}><X size={16} /></button>}
  </div>;
}
