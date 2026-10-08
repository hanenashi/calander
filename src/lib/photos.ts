const MAX_BYTES = 320_000;
const MAX_EDGE = 1600;

export async function compressPhoto(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Vyberte fotografii ve formátu JPEG, PNG nebo WebP.');
  }
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error('Fotografii se nepodařilo otevřít. Zkuste jiný snímek.'); }
  try {
    let scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    for (let attempt = 0; attempt < 6; attempt++) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Fotografii se nepodařilo zmenšit.');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const quality = Math.max(0.48, 0.82 - attempt * 0.07);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob && blob.size <= MAX_BYTES) return blob;
      scale *= 0.78;
    }
    throw new Error('Fotografie je stále příliš velká. Zkuste menší snímek.');
  } finally {
    bitmap.close();
  }
}
