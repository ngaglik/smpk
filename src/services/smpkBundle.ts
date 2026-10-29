import type { DerivedState, IntervalVal, SmpkFormState } from '../types/smpk';

type Coding = { system: string; code: string; display?: string };
type FhirResource = Record<string, unknown>;

const LOINC = 'http://loinc.org';
const SNOMED = 'http://snomed.info/sct';
const KEMKES = 'http://terminology.kemkes.go.id';
const UCUM = 'http://unitsofmeasure.org';
const ICD10 = 'http://hl7.org/fhir/sid/icd-10';
const OBS_CATEGORY = 'http://terminology.hl7.org/CodeSystem/observation-category';
const DATA_ABSENT = 'http://terminology.hl7.org/CodeSystem/data-absent-reason';
const LOCATION_TYPE = 'http://terminology.kemkes.go.id/CodeSystem/location-type';

/** Reference internal Bundle harus memakai UUID yang valid. */
const bundleUrn = (suffix: string) => `urn:uuid:9b1deb4d-3b7d-4bad-9bdd-2b0d7b3d${suffix}`;

const INTERVAL_UNIT_LABEL: Record<string, string> = {
  min: 'minute',
  h: 'hour',
  d: 'day',
  wk: 'week',
  mo: 'month',
  a: 'year'
};

const AGE_FACTOR: Record<string, number> = {
  min: 1 / 525960,
  h: 1 / 8766,
  d: 1 / 365.25,
  wk: 7 / 365.25,
  mo: 1 / 12,
  a: 1
};

/** Lampiran 3 playbook SMPK v1.5 — Observation.valueCodeableConcept untuk Cara mati. */
const MANNER_OF_DEATH: Record<string, Coding> = {
  '39104002': { system: SNOMED, code: '39104002', display: 'Illness' },
  'LA18034-1': { system: LOINC, code: 'LA18034-1', display: 'Accident' },
  'LA18036-6': { system: LOINC, code: 'LA18036-6', display: 'Suicide' },
  '417928002': { system: SNOMED, code: '417928002', display: 'Abuse' },
  '219290002': { system: SNOMED, code: '219290002', display: 'Legal Execution' },
  '15863006': { system: SNOMED, code: '15863006', display: 'Conflict' },
  'LA11137-9': { system: LOINC, code: 'LA11137-9', display: 'Unable to Determine' },
  TK000252: { system: KEMKES, code: 'TK000252', display: 'Investigasi Masih Berjalan' },
  '87309006': { system: SNOMED, code: '87309006', display: 'Death of Unknown Cause' },
  '74964007': { system: SNOMED, code: '74964007', display: 'Other' }
};

const YES_NO: Record<string, Coding> = {
  ya: { system: SNOMED, code: '373066001', display: 'Yes' },
  tidak: { system: SNOMED, code: '373067005', display: 'No' },
  unknown: { system: SNOMED, code: '261665006', display: 'Unknown' }
};

/** Dasar diagnosis penyebab kematian (Tabel 9 playbook SMPK). */
const DIAGNOSIS_BASIS: Coding[] = [
  { system: SNOMED, code: '129465004', display: 'Medical record' },
  { system: KEMKES, code: 'TK000636', display: 'Pemeriksaan luar' },
  { system: SNOMED, code: '5785009', display: 'Forensic autopsy' },
  { system: KEMKES, code: 'TK000637', display: 'Autopsi Klinis' }
];

/** Lampiran 4 playbook SMPK — tempat kejadian penyebab eksternal. */
const EXTERNAL_PLACE: Record<string, string> = {
  '264362003': 'Home',
  '257703003': 'Sports center',
  '272505000': 'Industrial site',
  '75414001': 'Construction site',
  '257573002': 'Boarding house',
  '74056004': 'Orphanage',
  '257698009': 'School',
  '385437003': 'Institution',
  '276052003': 'Public facilities',
  '272504001': 'Agricultural site',
  '272510001': 'Highway',
  '272509006': 'Freeway',
  '284438004': 'Trade and service environment',
  '74964007': 'Other'
};

/** Kondisi saat meninggal pada kematian perempuan. */
const MATERNAL_CONDITION: Record<string, Coding> = {
  '77386006': { system: SNOMED, code: '77386006', display: 'Pregnancy' },
  '255410009': { system: SNOMED, code: '255410009', display: 'Maternal postpartum' },
  TK000265: { system: KEMKES, code: 'TK000265', display: '43 hari - 1 tahun sebelum kematian' },
  '261665006': { system: SNOMED, code: '261665006', display: 'Unknown' }
};

/** Lampiran 5 — sistem & display untuk kondisi ibu mempengaruhi janin/neonatal. */
const MATERNAL_IMPACT_SYSTEM = 'http://terminology.kemkes.go.id/CodeSystem/icd-10-pm';
const MATERNAL_IMPACT_LABEL: Record<string, string> = {
  M1: 'Complications of placenta, cord and membranes',
  M2: 'Maternal complications of pregnancy',
  M3: 'Other complications of labour and delivery',
  M4: 'Maternal medical and surgical conditions',
  M5: 'No maternal condition identified'
};

function numberValue(value?: string): number | null {
  if (value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

interface CauseRow {
  key: string;
  icdKey: string;
  ivKey: string;
  urn: string;
  line?: number;
  code: Coding;
  interval: Coding;
}

const CAUSE_ROWS: CauseRow[] = [
  {
    key: 'pa',
    icdKey: 'pa_icd',
    ivKey: 'iva',
    urn: bundleUrn('cb11'),
    line: 1,
    code: { system: LOINC, code: '79378-6', display: 'Cause of death' },
    interval: { system: LOINC, code: '69440-6', display: 'Disease onset to death interval' }
  },
  {
    key: 'pb',
    icdKey: 'pb_icd',
    ivKey: 'ivb',
    urn: bundleUrn('cb12'),
    line: 2,
    code: { system: LOINC, code: '79378-6', display: 'Cause of death' },
    interval: { system: KEMKES, code: 'TK000259', display: 'Interval waktu terjadinya b sampai terjadinya a' }
  },
  {
    key: 'pc',
    icdKey: 'pc_icd',
    ivKey: 'ivc',
    urn: bundleUrn('cb13'),
    line: 3,
    code: { system: LOINC, code: '79378-6', display: 'Cause of death' },
    interval: { system: KEMKES, code: 'TK000260', display: 'Interval waktu terjadinya c sampai terjadinya b' }
  },
  {
    key: 'pd',
    icdKey: 'pd_icd',
    ivKey: 'ivd',
    urn: bundleUrn('cb14'),
    line: 4,
    code: { system: LOINC, code: '79378-6', display: 'Cause of death' },
    interval: { system: KEMKES, code: 'TK000261', display: 'Interval waktu terjadinya d sampai terjadinya c' }
  },
  {
    key: 'kl',
    icdKey: 'kl_icd',
    ivKey: 'ivk',
    urn: bundleUrn('cb15'),
    code: { system: LOINC, code: '69441-4', display: 'Other significant causes or conditions of death' },
    interval: { system: LOINC, code: '69440-6', display: 'Disease onset to death interval' }
  }
];

export function toUtcDateTime(value?: string): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00+07:00`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    const date = new Date(`${value}:00+07:00`);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function ageInYears(usia: { n: number; u: string } | null): number | null {
  if (!usia) return null;
  const factor = AGE_FACTOR[usia.u] ?? 1;
  return Number((usia.n * factor).toFixed(4));
}

function observationBase(
  category: 'survey' | 'exam' | 'vital-signs',
  patientRef: string,
  practitionerRef: string,
  encounterRef: string,
  effectiveDateTime: string,
  issued: string,
  focus?: string
): FhirResource {
  let coding: Coding = { system: OBS_CATEGORY, code: 'survey', display: 'Survey' };
  if (category === 'exam') coding = { system: OBS_CATEGORY, code: 'exam', display: 'Exam' };
  if (category === 'vital-signs') coding = { system: OBS_CATEGORY, code: 'vital-signs', display: 'Vital Signs' };

  const base: FhirResource = {
    resourceType: 'Observation',
    status: 'final',
    category: [{ coding: [coding] }],
    subject: { reference: patientRef },
    encounter: { reference: encounterRef },
    performer: [{ reference: practitionerRef }],
    effectiveDateTime,
    issued
  };

  if (focus) base.focus = [{ reference: focus }];

  return base;
}

function intervalComponent(code: Coding, interval?: IntervalVal): FhirResource {
  const component: FhirResource = { code: { coding: [code] } };
  const numeric = interval?.mode === 'angka' && interval.val !== undefined && interval.val !== '' && !Number.isNaN(Number(interval.val));

  if (numeric) {
    const unit = interval?.unit || 'a';
    component.valueQuantity = {
      value: Number(interval?.val),
      unit: INTERVAL_UNIT_LABEL[unit] ?? unit,
      system: UCUM,
      code: unit
    };
  } else if (interval?.mode === 'teks' && interval.teks?.trim()) {
    component.valueString = interval.teks.trim();
  } else {
    component.dataAbsentReason = {
      coding: [{ system: DATA_ABSENT, code: 'asked-unknown', display: 'Asked But Unknown' }]
    };
  }

  return component;
}

export interface SmpkBundleContext {
  organizationId: string;
}

/**
 * Membangun Bundle transaksi sesuai playbook SMPK v1.5:
 * Encounter -> Observation (informasi kematian, penyebab, data medis lainnya) -> Composition.
 * Penyebab kematian dikirim sebagai teks (valueString); ICD-10 opsional dikirim
 * sebagai komponen `verify-code` bila diisi.
 */
export function buildSmpkBundle(
  form: SmpkFormState,
  derived: DerivedState,
  context: SmpkBundleContext
): FhirResource {
  const organizationId = context.organizationId;
  const organizationRef = `Organization/${organizationId}`;
  const patientRef = form.ihs?.trim() ? `Patient/${form.ihs.trim()}` : 'Patient/unknown';
  const practitionerRef = form.dokter_ihs?.trim() ? `Practitioner/${form.dokter_ihs.trim()}` : 'Practitioner/unknown';
  const encounterRef = form.kunj_id?.trim() ? `Encounter/${form.kunj_id.trim()}` : 'Encounter/unknown';
  const deathTime = toUtcDateTime(form.waktu_mati);
  const now = new Date().toISOString();

  const entry: FhirResource[] = [];

  /* ---------------------------------------------- Data Informasi Kematian */

  const infoRefs: { reference: string }[] = [{ reference: '#tempat-meninggal' }];

  const ageValue = ageInYears(derived.usia);
  if (ageValue !== null) {
    const urn = bundleUrn('cb21');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [{ system: LOINC, code: '39016-1', display: 'Age at Death' }] };
    observation.valueQuantity = { value: ageValue, unit: 'years', system: UCUM, code: 'a' };
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    infoRefs.push({ reference: urn });
  }

  if (deathTime) {
    const urn = bundleUrn('cb22');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [{ system: LOINC, code: '81956-5', display: 'Date and time of death [TimeStamp]' }] };
    observation.valueDateTime = deathTime;
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    infoRefs.push({ reference: urn });
  }

  if (form.doa === 'ya' || form.doa === 'tidak') {
    const urn = bundleUrn('cb23');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [{ system: SNOMED, code: '63238001', display: 'Dead on arrival at hospital' }] };
    observation.valueBoolean = form.doa === 'ya';
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    infoRefs.push({ reference: urn });
  }

  const manner = form.cara_mati ? MANNER_OF_DEATH[form.cara_mati] : undefined;
  if (manner) {
    const urn = bundleUrn('cb24');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [{ system: LOINC, code: '69449-7', display: 'Manner of death' }] };
    observation.valueCodeableConcept = { coding: [manner] };
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    infoRefs.push({ reference: urn });
  }

  /* ------------------------------------------------- Penyebab Eksternal */

  const externalRefs: string[] = [];
  const externalDate = toUtcDateTime(form.eksternal_tanggal);

  if (externalDate) {
    const urn = bundleUrn('cb41');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, externalDate, now);
    observation.code = { coding: [{ system: KEMKES, code: 'TK000253', display: 'Tanggal kejadian penyebab eksternal' }] };
    observation.valueDateTime = externalDate;
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    externalRefs.push(urn);
  }

  if (form.eksternal_deskripsi?.trim()) {
    const urn = bundleUrn('cb42');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = {
      coding: [{ system: KEMKES, code: 'TK000254', display: 'Deskripsi penyebab eksternal/jenis racun' }]
    };
    observation.valueString = form.eksternal_deskripsi.trim();
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    externalRefs.push(urn);
  }

  if (form.eksternal_tempat) {
    const urn = bundleUrn('cb43');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [{ system: KEMKES, code: 'TK000255', display: 'Tempat kejadian penyebab eksternal' }] };
    observation.valueCodeableConcept = {
      coding: [
        {
          system: SNOMED,
          code: form.eksternal_tempat,
          display: EXTERNAL_PLACE[form.eksternal_tempat] ?? form.eksternal_tempat
        }
      ]
    };
    if (form.eksternal_note?.trim()) observation.note = [{ text: form.eksternal_note.trim() }];
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    externalRefs.push(urn);
  }

  /* ---------------------------------------------- Kematian Janin/Bayi */

  const janinRefs: string[] = [];
  const motherRef = form.ibu_ihs?.trim() ? `Patient/${form.ibu_ihs.trim()}` : undefined;

  if (form.janin_kembar && YES_NO[form.janin_kembar]) {
    const urn = bundleUrn('cb51');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now, motherRef);
    observation.code = { coding: [{ system: LOINC, code: '45371-2', display: 'Multiple pregnancy' }] };
    observation.valueCodeableConcept = { coding: [YES_NO[form.janin_kembar]] };
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    janinRefs.push(urn);
  }

  if (form.janin_lahir_mati && YES_NO[form.janin_lahir_mati]) {
    const urn = bundleUrn('cb52');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [{ system: SNOMED, code: '237364002', display: 'Stillbirth' }] };
    observation.valueCodeableConcept = { coding: [YES_NO[form.janin_lahir_mati]] };
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    janinRefs.push(urn);
  }

  const survivalHours = numberValue(form.janin_bertahan_jam);
  if (survivalHours !== null) {
    const urn = bundleUrn('cb53');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = {
      coding: [{ system: KEMKES, code: 'TK000256', display: 'Lama bertahan hidup jika <24 jam' }]
    };
    observation.valueQuantity = { value: survivalHours, unit: 'hour', system: UCUM, code: 'h' };
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    janinRefs.push(urn);
  }

  if (form.janin_waktu_lahir) {
    const urn = bundleUrn('cb54');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [{ system: LOINC, code: '57715-5', display: 'Birth time' }] };
    observation.valueTime =
      form.janin_waktu_lahir.length === 5 ? `${form.janin_waktu_lahir}:00` : form.janin_waktu_lahir;
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    janinRefs.push(urn);
  }

  const birthWeight = numberValue(form.janin_berat);
  if (birthWeight !== null) {
    const urn = bundleUrn('cb55');
    const observation = observationBase('vital-signs', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [{ system: LOINC, code: '8339-4', display: 'Birth weight Measured' }] };
    observation.valueQuantity = { value: birthWeight, unit: 'gram', system: UCUM, code: 'g' };
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    janinRefs.push(urn);
  }

  const gestationalAge = numberValue(form.janin_usia_kehamilan);
  if (gestationalAge !== null) {
    const urn = bundleUrn('cb56');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now, motherRef);
    observation.code = { coding: [{ system: LOINC, code: '18185-9', display: 'Gestational age' }] };
    observation.valueQuantity = { value: gestationalAge, unit: 'week', system: UCUM, code: 'wk' };
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    janinRefs.push(urn);
  }

  const motherAge = numberValue(form.ibu_umur);
  if (motherAge !== null) {
    const urn = bundleUrn('cb57');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now, motherRef);
    observation.code = { coding: [{ system: LOINC, code: '30525-0', display: 'Age' }] };
    observation.valueQuantity = { value: motherAge, unit: 'year', system: UCUM, code: 'a' };
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    janinRefs.push(urn);
  }

  if (form.ibu_kondisi) {
    const urn = bundleUrn('cb58');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now, motherRef);
    observation.code = {
      coding: [{ system: KEMKES, code: 'TK000257', display: 'Kondisi ibu mempengaruhi janin/neonatal' }]
    };
    if (form.ibu_kondisi === 'M6') {
      observation.valueString = form.ibu_kondisi_lain?.trim() || 'M6';
    } else {
      observation.valueCodeableConcept = {
        coding: [
          {
            system: MATERNAL_IMPACT_SYSTEM,
            code: form.ibu_kondisi,
            display: MATERNAL_IMPACT_LABEL[form.ibu_kondisi] ?? form.ibu_kondisi
          }
        ]
      };
    }
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    janinRefs.push(urn);
  }

  /* --------------------------------------------- Kematian Perempuan */

  const maternalRefs: string[] = [];

  if (form.hamil_riwayat && YES_NO[form.hamil_riwayat]) {
    const urn = bundleUrn('cb61');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [{ system: KEMKES, code: 'TK000263', display: 'Riwayat hamil 1 tahun terakhir' }] };
    observation.valueCodeableConcept = { coding: [YES_NO[form.hamil_riwayat]] };
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    maternalRefs.push(urn);
  }

  const maternalCondition = form.hamil_kondisi ? MATERNAL_CONDITION[form.hamil_kondisi] : undefined;
  if (maternalCondition) {
    const urn = bundleUrn('cb62');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = {
      coding: [{ system: KEMKES, code: 'TK000264', display: 'Kondisi saat meninggal (jika pernah hamil)' }]
    };
    observation.valueCodeableConcept = { coding: [maternalCondition] };
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    maternalRefs.push(urn);
  }

  if (form.hamil_kontribusi && YES_NO[form.hamil_kontribusi]) {
    const urn = bundleUrn('cb63');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = {
      coding: [{ system: KEMKES, code: 'TK000266', display: 'Kehamilan berkontribusi pada kematian' }]
    };
    observation.valueCodeableConcept = { coding: [YES_NO[form.hamil_kontribusi]] };
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    maternalRefs.push(urn);
  }

  /* ------------------------------------- Data Medis Penyebab Kematian */

  const causeRefs: string[] = [];

  for (const row of CAUSE_ROWS) {
    const value = form[row.key];
    if (typeof value !== 'string' || value.trim() === '') continue;

    const observation = observationBase('exam', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [row.code] };
    observation.valueString = value.trim();
    if (deathTime) observation.effectiveDateTime = deathTime;

    const components: FhirResource[] = [];

    if (row.line !== undefined) {
      components.push({
        code: { coding: [{ system: KEMKES, code: 'line-number', display: 'Line Number' }] },
        valueInteger: row.line
      });
    }

    components.push(intervalComponent(row.interval, form[row.ivKey]));

    const icd = form[row.icdKey];
    if (typeof icd === 'string' && icd.trim() !== '') {
      components.push({
        code: { coding: [{ system: KEMKES, code: 'verify-code', display: 'Verify code' }] },
        valueCodeableConcept: { coding: [{ system: ICD10, code: icd.trim() }] }
      });
    }

    observation.component = components;
    entry.push({ fullUrl: row.urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    causeRefs.push(row.urn);
  }

  /* ------------------------------------------------ Data Medis Lainnya */

  const otherRefs: string[] = [];

  if (form.operasi === 'ya' || form.operasi === 'tidak') {
    const urn = bundleUrn('cb31');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [{ system: KEMKES, code: 'TK000267', display: 'Operasi 4 minggu sebelum kematian' }] };
    observation.valueCodeableConcept = { coding: [YES_NO[form.operasi]] };
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    otherRefs.push(urn);
  }

  const surgeryDate = toUtcDateTime(form.operasi_tgl);
  if (form.operasi === 'ya' && surgeryDate) {
    const urn = bundleUrn('cb32');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [{ system: KEMKES, code: 'TK000268', display: 'Tanggal operasi (sebelum kematian)' }] };
    observation.valueDateTime = surgeryDate;
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    otherRefs.push(urn);
  }

  if (form.operasi === 'ya' && form.operasi_alasan?.trim()) {
    const urn = bundleUrn('cb33');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [{ system: KEMKES, code: 'TK000269', display: 'Alasan operasi (sebelum kematian)' }] };
    observation.valueString = form.operasi_alasan.trim();
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    otherRefs.push(urn);
  }

  const basis = form.dasar ?? [];
  if (basis.length > 0) {
    const urn = bundleUrn('cb34');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [{ system: KEMKES, code: 'TK000635', display: 'Dasar diagnosis penyebab kematian' }] };
    observation.component = DIAGNOSIS_BASIS.map((coding) => ({
      code: { coding: [coding] },
      valueBoolean: basis.includes(coding.code)
    }));
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    otherRefs.push(urn);
  }

  const autopsyUsed = form.autopsi_hasil ? YES_NO[form.autopsi_hasil] : undefined;
  if (autopsyUsed) {
    const urn = bundleUrn('cb35');
    const observation = observationBase('survey', patientRef, practitionerRef, encounterRef, deathTime ?? now, now);
    observation.code = { coding: [{ system: KEMKES, code: 'TK000270', display: 'Hasil autopsi digunakan untuk SMPK' }] };
    observation.valueCodeableConcept = { coding: [autopsyUsed] };
    entry.push({ fullUrl: urn, resource: observation, request: { method: 'POST', url: 'Observation' } });
    otherRefs.push(urn);
  }

  /* -------------------------------------------------------- Composition */

  const containedLocation: FhirResource = {
    resourceType: 'Location',
    id: 'tempat-meninggal',
    type: [
      { coding: [{ system: LOCATION_TYPE, code: 'LT000002', display: 'Tempat Meninggal Faskes' }] },
      { coding: [{ system: LOCATION_TYPE, code: 'LT000005', display: 'Alamat Mati' }] }
    ],
    address: {
      text: form.alamat_mati?.trim() || undefined,
      city: form.kab_mati?.trim() || undefined
    }
  };

  const sections: FhirResource[] = [];

  if (infoRefs.length > 0) {
    sections.push({
      title: 'Data Informasi Kematian',
      code: { coding: [{ system: KEMKES, code: 'TK000258', display: 'Data informasi kematian' }] },
      entry: infoRefs
    });
  }

  if (externalRefs.length > 0) {
    sections.push({
      title: 'Penyebab Eksternal',
      code: { coding: [{ system: LOINC, code: '11374-6', display: 'Injury incident description Narrative' }] },
      entry: externalRefs.map((reference) => ({ reference }))
    });
  }

  if (janinRefs.length > 0) {
    sections.push({
      title: 'Kematian Janin/Bayi',
      code: { coding: [{ system: SNOMED, code: '276507005', display: 'Fetal death' }] },
      entry: janinRefs.map((reference) => ({ reference }))
    });
  }

  if (maternalRefs.length > 0) {
    sections.push({
      title: 'Kematian Perempuan',
      code: { coding: [{ system: KEMKES, code: 'TK000271', display: 'Kematian perempuan' }] },
      entry: maternalRefs.map((reference) => ({ reference }))
    });
  }

  if (causeRefs.length > 0) {
    sections.push({
      title: 'Data Medis Penyebab Kematian',
      code: { coding: [{ system: LOINC, code: '79378-6', display: 'Cause of death' }] },
      entry: causeRefs.map((reference) => ({ reference }))
    });
  }

  if (otherRefs.length > 0) {
    sections.push({
      title: 'Data Medis Lainnya',
      code: { coding: [{ system: LOINC, code: '69441-4', display: 'Other significant causes or conditions of death' }] },
      entry: otherRefs.map((reference) => ({ reference }))
    });
  }

  const composition: FhirResource = {
    resourceType: 'Composition',
    identifier: {
      system: `http://sys-ids.kemkes.go.id/composition/${organizationId}`,
      use: 'official',
      value: form.no_rm?.trim() ? `SMPK-${form.no_rm.trim()}` : `SMPK-${Date.now()}`
    },
    status: 'final',
    type: { coding: [{ system: LOINC, code: '64297-5', display: 'Death certificate' }] },
    title: 'Sertifikat Medis Penyebab Kematian',
    subject: { reference: patientRef, display: form.nama || undefined },
    encounter: { reference: encounterRef },
    date: toUtcDateTime(form.tgl_isi) ?? now,
    author: [{ reference: practitionerRef, display: form.dokter_nama || undefined }],
    attester: [
      {
        mode: 'official',
        party: { reference: organizationRef },
        time: toUtcDateTime(form.tgl_isi) ?? now
      }
    ],
    contained: [containedLocation],
    section: sections
  };

  entry.push({ fullUrl: bundleUrn('cbf1'), resource: composition, request: { method: 'POST', url: 'Composition' } });

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry
  };
}
