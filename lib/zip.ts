import JSZip from 'jszip';

export async function buildZip(files: { [name: string]: string }, assets: { [path: string]: Buffer } = {}) {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content);
  }
  for (const [p, buf] of Object.entries(assets)) zip.file(p, buf);
  const blob = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return blob;
}
