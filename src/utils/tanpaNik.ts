/**
 * Membentuk NIK sementara untuk jenazah tanpa identitas (SMPK):
 * [0]-[Org ID 10 digit]-[2 digit tahun meninggal]-[3 digit nomor urut]
 *
 * Org ID 9 digit dilengkapi checksum sesuai playbook SATUSEHAT.
 */
export function normalizeOrgId(orgId: string): string {
  const digits = orgId.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length !== 9) return '';

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits[i]) * (10 - i);
  }

  return digits + String(sum % 10);
}

export function buildTanpaNikNik(
  orgId: string,
  deathDate: string | undefined,
  sequence: number | string = 1
): string {
  const organization = normalizeOrgId(orgId);
  if (!organization) return '';

  const date = deathDate ? new Date(deathDate) : new Date();
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  const shortYear = String(year % 100).padStart(2, '0');
  const order = String(sequence).replace(/\D/g, '').padStart(3, '0').slice(-3);

  return `0-${organization}-${shortYear}-${order}`;
}
