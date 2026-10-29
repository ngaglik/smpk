import type { DerivedState, SmpkFormState } from '../types/smpk';

const GENDER_CHECKBOX: Record<string, number> = {
  female: 18,
  male: 21,
  unknown: 24
};

const RELIGION_CHECKBOX: Record<string, number> = {
  islam: 28,
  kristen: 30,
  katolik: 32,
  hindu: 34,
  buddha: 36,
  konghucu: 38,
  kepercayaan: 41,
  lainnya: 46
};

const MANNER_CHECKBOX: Record<string, number> = {
  '39104002': 91, // Sakit
  '417928002': 94, // Kekerasan
  'LA11137-9': 97, // Tidak dapat ditentukan
  'LA18034-1': 100, // Kecelakaan
  '219290002': 103, // Keputusan hukum
  TK000252: 106, // Investigasi masih berjalan
  'LA18036-6': 109, // Bunuh diri
  '15863006': 112, // Perang/Konflik
  '87309006': 115, // Tidak diketahui
  '74964007': 118 // Lainnya
};

const PLACE_OF_DEATH: Record<string, string> = {
  rs: 'Rumah sakit',
  rumah: 'Rumah tinggal',
  jalan: 'Jalan / tempat umum',
  lainnya: 'Lainnya'
};

const AGE_UNIT: Record<string, string> = {
  a: 'tahun',
  mo: 'bulan',
  wk: 'minggu',
  d: 'hari',
  h: 'jam',
  min: 'menit'
};

function formatDate(value?: string): string {
  if (!value) return '';
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function formatTime(value?: string): string {
  return value?.slice(11, 16) ?? '';
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function ageText(derived: DerivedState): string {
  if (!derived.usia) return 'Tidak diketahui';
  return `${derived.usia.n} ${AGE_UNIT[derived.usia.u] ?? derived.usia.u}`;
}

/**
 * Mengisi `word/document.xml` dari template_skk.docx berdasarkan urutan node teks.
 * Indeks mengikuti struktur template saat ini (template_skk.docx).
 */
export function fillSkkXml(xml: string, form: SmpkFormState, derived: DerivedState): string {
  const replacements: Record<number, string> = {};

  if (form.tgl_isi) {
    replacements[4] = `Tanggal pengisian formulir SMPK : ${formatDate(form.tgl_isi)}`;
  }
  if (form.no_rm?.trim()) {
    replacements[9] = `Nomor rekam medis: ${form.no_rm.trim()}`;
  }
  if (form.nama?.trim()) {
    replacements[12] = form.nama.trim();
  }
  if (form.id_jenis === 'nik' && form.id_nilai?.trim()) {
    replacements[14] = form.id_nilai.trim();
  }
  if (form.id_jenis === 'paspor' && form.id_nilai?.trim()) {
    replacements[15] = `b. Untuk WNA - No Paspor: ${form.id_nilai.trim()}`;
  }

  const genderIndex = GENDER_CHECKBOX[form.jk ?? ''];
  if (genderIndex !== undefined) replacements[genderIndex] = '☑';

  const religionIndex = RELIGION_CHECKBOX[form.agama ?? ''];
  if (religionIndex !== undefined) replacements[religionIndex] = '☑';

  if (form.tempat_lahir?.trim() || form.tgl_lahir) {
    const birth = form.tgl_lahir_tt ? 'Tidak diketahui' : formatDate(form.tgl_lahir);
    replacements[48] = `a. Tempat (Kab/Kota), tanggal lahir: ${form.tempat_lahir?.trim() || '-'}, ${birth}`;
  }

  replacements[52] = `b. Usia saat meninggal: ${ageText(derived)}`;

  if (form.tempat_mati || form.waktu_mati) {
    const place = PLACE_OF_DEATH[form.tempat_mati ?? ''] ?? form.tempat_mati ?? '-';
    replacements[56] = `a. Tempat (Kab/Kota), tanggal dan waktu meninggal: ${place}`;
    replacements[57] = formatDate(form.waktu_mati);
    replacements[58] = formatTime(form.waktu_mati);
  }

  if (form.doa === 'ya') replacements[63] = '☑';
  if (form.doa === 'tidak') replacements[65] = '☑';

  if (form.petugas_jenazah?.trim()) {
    replacements[70] = `    b.1. Nama Pemeriksa Jenazah:${form.petugas_jenazah.trim()}`;
  }

  if (form.domisili?.trim()) {
    replacements[77] = `Alamat sesuai KTP: ${form.domisili.trim()}`;
  }

  const mannerIndex = MANNER_CHECKBOX[form.cara_mati ?? ''];
  if (mannerIndex !== undefined) replacements[mannerIndex] = '☑';

  if (form.dokter_nama?.trim()) {
    replacements[125] = `Nama Lengkap ${form.dokter_nama.trim()}         Nama Lengkap____________________________________`;
  }
  if (form.dokter_sip?.trim()) {
    replacements[126] = `No. SIP  ${form.dokter_sip.trim()}                      Hubungan dengan Almarhum/ah:____________________`;
  }

  let index = 0;
  return xml.replace(/<w:t(?: [^>]*)?>[\s\S]*?<\/w:t>/g, (match) => {
    const value = replacements[index];
    index += 1;
    if (value === undefined) return match;

    return match.replace(
      /(<w:t(?: [^>]*)?>)[\s\S]*?(<\/w:t>)/,
      (_whole, open: string, close: string) => `${open}${escapeXml(value)}${close}`
    );
  });
}
