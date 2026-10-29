export interface FhirSendResult {
  status: number;
  payload: unknown;
}

interface OperationOutcomeIssue {
  severity?: string;
  code?: string;
  diagnostics?: string;
  details?: { text?: string };
}

export class FhirRequestError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super(describeFhirError(status, payload));
    this.name = 'FhirRequestError';
    this.status = status;
    this.payload = payload;
  }
}

export function describeFhirError(status: number, payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    if (Array.isArray(record.issue) && record.issue.length > 0) {
      const details = (record.issue as OperationOutcomeIssue[])
        .map((issue) => issue.diagnostics || issue.details?.text || issue.code)
        .filter((value): value is string => typeof value === 'string' && value !== '')
        .join('; ');
      if (details) return `SATUSEHAT menolak payload (HTTP ${status}): ${details}`;
    }

    const message = record.message ?? record.error_description ?? record.error;
    if (typeof message === 'string' && message !== '') {
      return `SATUSEHAT menolak payload (HTTP ${status}): ${message}`;
    }
  }

  if (typeof payload === 'string' && payload.trim() !== '') {
    return `SATUSEHAT menolak payload (HTTP ${status}): ${payload.slice(0, 300)}`;
  }

  return `SATUSEHAT menolak payload (HTTP ${status}).`;
}

/**
 * Mengirim resource/bundle FHIR lewat proxy dev server agar token tidak
 * mengirim request lintas origin langsung ke SATUSEHAT.
 */
export async function postFhir(path: string, payload: unknown, accessToken: string): Promise<FhirSendResult> {
  const normalizedPath = path === '' ? '' : path.startsWith('/') ? path : `/${path}`;

  const response = await fetch(`/api/satusehat/fhir${normalizedPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
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
    throw new FhirRequestError(response.status, parsed);
  }

  return { status: response.status, payload: parsed };
}
