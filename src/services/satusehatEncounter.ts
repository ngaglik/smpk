import type { SmpkFormState } from '../types/smpk';
import { describeFhirError } from './satusehatFhir';
import { toUtcDateTime } from './smpkBundle';

type FhirResource = Record<string, unknown>;

const ICD10 = 'http://hl7.org/fhir/sid/icd-10';
const CONDITION_CLINICAL = 'http://terminology.hl7.org/CodeSystem/condition-clinical';
const CONDITION_VER_STATUS = 'http://terminology.hl7.org/CodeSystem/condition-ver-status';
const CONDITION_CATEGORY = 'http://terminology.hl7.org/CodeSystem/condition-category';
const ACT_CODE = 'http://terminology.hl7.org/CodeSystem/v3-ActCode';
const PARTICIPATION_TYPE = 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType';
const DIAGNOSIS_ROLE = 'http://terminology.hl7.org/CodeSystem/diagnosis-role';

const URN_ENCOUNTER = 'urn:uuid:7c9e5a7a-4c2d-4f3b-8a11-00000000e001';
const URN_CONDITION = 'urn:uuid:7c9e5a7a-4c2d-4f3b-8a11-00000000e002';

export interface EncounterRegistration {
  encounterId: string;
  conditionId?: string;
  status: number;
  reused: boolean;
}

function encounterClass(jenis?: string) {
  if (jenis === 'ranap') return { system: ACT_CODE, code: 'IMP', display: 'inpatient encounter' };
  if (jenis === 'igd' || jenis === 'rujukan') return { system: ACT_CODE, code: 'EMER', display: 'emergency' };
  return { system: ACT_CODE, code: 'AMB', display: 'ambulatory' };
}

export function buildEncounterRegistrationBundle(
  form: SmpkFormState,
  organizationId: string,
  icdCode: string
): FhirResource {
  const patientRef = `Patient/${form.ihs?.trim()}`;
  const practitionerRef = `Practitioner/${form.dokter_ihs?.trim()}`;
  const organizationRef = `Organization/${organizationId}`;
  const locationRef = `Location/${form.kunj_lokasi?.trim()}`;
  const start = toUtcDateTime(form.kunj_masuk);
  const end = toUtcDateTime(form.waktu_mati);
  const now = new Date().toISOString();
  const coding = encounterClass(form.kunj_jenis);

  const condition: FhirResource = {
    resourceType: 'Condition',
    clinicalStatus: { coding: [{ system: CONDITION_CLINICAL, code: 'active', display: 'Active' }] },
    verificationStatus: { coding: [{ system: CONDITION_VER_STATUS, code: 'confirmed', display: 'Confirmed' }] },
    category: [
      { coding: [{ system: CONDITION_CATEGORY, code: 'encounter-diagnosis', display: 'Encounter Diagnosis' }] }
    ],
    code: { coding: [{ system: ICD10, code: icdCode }] },
    subject: { reference: patientRef, display: form.nama || undefined },
    encounter: { reference: URN_ENCOUNTER },
    recordedDate: now
  };

  const encounter: FhirResource = {
    resourceType: 'Encounter',
    identifier: [
      {
        system: `http://sys-ids.kemkes.go.id/encounter/${organizationId}`,
        use: 'official',
        value: form.reg_id?.trim() || form.no_rm?.trim() || `ENC-${Date.now()}`
      }
    ],
    status: 'finished',
    statusHistory: [
      { status: 'arrived', period: { start, end: start } },
      { status: 'in-progress', period: { start, end } },
      { status: 'finished', period: { start: end, end } }
    ],
    class: coding,
    classHistory: [{ class: coding, period: { start, end } }],
    subject: { reference: patientRef, display: form.nama || undefined },
    participant: [
      {
        type: [{ coding: [{ system: PARTICIPATION_TYPE, code: 'ATND', display: 'attender' }] }],
        individual: { reference: practitionerRef, display: form.dokter_nama || undefined }
      }
    ],
    period: { start, end },
    diagnosis: [
      {
        condition: { reference: URN_CONDITION },
        use: { coding: [{ system: DIAGNOSIS_ROLE, code: 'AD', display: 'Admission diagnosis' }] },
        rank: 1
      }
    ],
    location: [{ location: { reference: locationRef }, period: { start, end } }],
    hospitalization: {
      dischargeDisposition: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/discharge-disposition',
            code: 'exp',
            display: 'Expired'
          }
        ]
      }
    },
    serviceProvider: { reference: organizationRef }
  };

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: [
      { fullUrl: URN_CONDITION, resource: condition, request: { method: 'POST', url: 'Condition' } },
      { fullUrl: URN_ENCOUNTER, resource: encounter, request: { method: 'POST', url: 'Encounter' } }
    ]
  };
}



async function findExistingEncounter(
  accessToken: string,
  organizationId: string,
  registrationValue: string
): Promise<{ encounterId: string; conditionId?: string } | null> {
  const identifier = `http://sys-ids.kemkes.go.id/encounter/${organizationId}|${registrationValue}`;
  const query = new URLSearchParams({ identifier }).toString();

  const response = await fetch(`/api/satusehat/fhir/Encounter?${query}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) return null;

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const entries = data?.entry;
  if (!Array.isArray(entries) || entries.length === 0) return null;

  const resource = (entries[0] as Record<string, unknown>).resource as Record<string, unknown> | undefined;
  const encounterId = typeof resource?.id === 'string' ? resource.id : '';
  if (!encounterId) return null;

  let conditionId: string | undefined;
  const diagnosis = resource?.diagnosis;
  if (Array.isArray(diagnosis) && diagnosis.length > 0) {
    const condition = (diagnosis[0] as Record<string, unknown>).condition as Record<string, unknown> | undefined;
    const reference = condition?.reference;
    if (typeof reference === 'string' && reference.startsWith('Condition/')) {
      conditionId = reference.slice('Condition/'.length).split('/')[0];
    }
  }

  return { encounterId, conditionId };
}

export async function registerEncounter(
  form: SmpkFormState,
  accessToken: string,
  organizationId: string,
  icdCode: string
): Promise<EncounterRegistration> {
  const registrationValue = form.reg_id?.trim() || form.no_rm?.trim() || '';

  if (registrationValue) {
    const existing = await findExistingEncounter(accessToken, organizationId, registrationValue);
    if (existing) {
      return { ...existing, status: 200, reused: true };
    }
  }

  const bundle = buildEncounterRegistrationBundle(form, organizationId, icdCode);

  const response = await fetch('/api/satusehat/fhir', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(bundle)
  });

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    if (registrationValue) {
      const existing = await findExistingEncounter(accessToken, organizationId, registrationValue);
      if (existing) {
        return { ...existing, status: 200, reused: true };
      }
    }
    throw new Error(describeFhirError(response.status, parsed));
  }

  let encounterId = '';
  let conditionId = '';

  const parseLocation = (location: unknown) => {
    if (typeof location !== 'string') return;
    const clean = location.split('/_history')[0];
    const segments = clean.split('/').filter(Boolean);
    const type = segments[segments.length - 2];
    const id = segments[segments.length - 1];
    if (type === 'Encounter') encounterId = id;
    if (type === 'Condition') conditionId = id;
  };

  const record = parsed as Record<string, unknown> | null;
  if (record && Array.isArray(record.entry)) {
    for (const item of record.entry as Record<string, unknown>[]) {
      const entryResponse = item.response as Record<string, unknown> | undefined;
      parseLocation(entryResponse?.location);

      const resourceType = entryResponse?.resourceType;
      const resourceId = entryResponse?.resourceID;
      if (typeof resourceId === 'string') {
        if (resourceType === 'Encounter') encounterId = resourceId;
        if (resourceType === 'Condition') conditionId = resourceId;
      }
    }
  }

  if (!encounterId && record?.resourceType === 'Encounter' && typeof record.id === 'string') {
    encounterId = record.id;
  }

  if (!encounterId) {
    throw new Error('Respons SATUSEHAT tidak memuat Encounter ID.');
  }

  return { encounterId, conditionId: conditionId || undefined, status: response.status, reused: false };
}
