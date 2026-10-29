const env = import.meta.env;

const SANDBOX_HOST = 'https://api-satusehat-stg.dto.kemkes.go.id';

export type SatusehatEnvironment = 'sandbox' | 'production';

export interface SatusehatConfig {
  environment: SatusehatEnvironment;
  authUrl: string;
  baseUrl: string;
  consentUrl: string;
  baseUrlKptl: string;
  organizationId: string;
  orgIdNumeric: string;
  locationId: string;
  clientId: string;
  token: string;
}

/**
 * Konfigurasi yang aman dipakai di browser.
 * `clientSecret` sengaja tidak ada di sini: pertukaran token harus dilakukan
 * backend memakai `SATUSEHAT_CLIENT_SECRET` dari environment server.
 */
export const satusehatConfig: SatusehatConfig = {
  environment: env.VITE_SATUSEHAT_ENV === 'production' ? 'production' : 'sandbox',
  authUrl: env.VITE_SATUSEHAT_AUTH_URL ?? `${SANDBOX_HOST}/oauth2/v1`,
  baseUrl: env.VITE_SATUSEHAT_BASE_URL ?? `${SANDBOX_HOST}/fhir-r4/v1`,
  consentUrl: env.VITE_SATUSEHAT_CONSENT_URL ?? `${SANDBOX_HOST}/consent/v1`,
  baseUrlKptl: env.VITE_SATUSEHAT_BASE_URL_KPTL ?? `${SANDBOX_HOST}/kptl-api-v1`,
  organizationId: env.VITE_SATUSEHAT_ORG_ID ?? '',
  orgIdNumeric: env.VITE_SATUSEHAT_ORG_ID_NUMERIC ?? '',
  locationId: env.VITE_SATUSEHAT_LOCATION_ID ?? '',
  clientId: env.VITE_SATUSEHAT_CLIENT_ID ?? '',
  token: env.VITE_SATUSEHAT_TOKEN ?? ''
};

export const satusehatEnvironmentLabel =
  satusehatConfig.environment === 'sandbox' ? 'Sandbox (staging)' : 'Production';
