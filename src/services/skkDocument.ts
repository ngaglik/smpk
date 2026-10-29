import PizZip from 'pizzip';
import templateUrl from '../assets/templates/template_skk.docx?url';
import type { DerivedState, SmpkFormState } from '../types/smpk';
import { fillSkkXml } from './skkTemplate';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export async function generateSkkDocx(form: SmpkFormState, derived: DerivedState): Promise<Blob> {
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error('Template SKK tidak dapat dimuat.');
  }

  const buffer = await response.arrayBuffer();
  const zip = new PizZip(buffer);
  const documentFile = zip.file('word/document.xml');
  if (!documentFile) {
    throw new Error('Struktur template SKK tidak valid.');
  }

  zip.file('word/document.xml', fillSkkXml(documentFile.asText(), form, derived));

  return zip.generate({ type: 'blob', mimeType: DOCX_MIME });
}
