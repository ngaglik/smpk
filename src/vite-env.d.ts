/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SATUSEHAT_ENV?: 'sandbox' | 'production';
  readonly VITE_SATUSEHAT_AUTH_URL?: string;
  readonly VITE_SATUSEHAT_BASE_URL?: string;
  readonly VITE_SATUSEHAT_CONSENT_URL?: string;
  readonly VITE_SATUSEHAT_BASE_URL_KPTL?: string;
  readonly VITE_SATUSEHAT_CLIENT_ID?: string;
  readonly VITE_SATUSEHAT_ORG_ID?: string;
  readonly VITE_SATUSEHAT_LOCATION_ID?: string;
  readonly VITE_SATUSEHAT_TOKEN?: string;
}
