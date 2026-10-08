import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getPhoto } from '../lib/storage';

interface Props {
  id: string;
  onRemove: (id: string) => void;
  compact?: boolean;
}

export function PhotoView({ id, onRemove, compact = false }: Props) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    void getPhoto(id).then((photo) => {
      if (!active || !photo) return;
      objectUrl = URL.createObjectURL(photo.blob);
      setUrl(objectUrl);
    });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id]);
  if (!url) return null;
  return <figure className={`photo ${compact ? 'photo--compact' : ''}`}>
    <img src={url} alt="Fotografie v diáři" loading="eager" />
    <button type="button" aria-label="Odebrat fotografii" title="Odebrat fotografii" onClick={() => onRemove(id)}><X size={16} /></button>
  </figure>;
}
