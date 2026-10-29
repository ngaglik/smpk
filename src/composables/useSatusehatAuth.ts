import { computed, ref } from 'vue';

export type SatusehatAuthStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number | string;
  issued_at?: number | string;
  error?: string;
  error_description?: string;
  message?: string;
}

/** Refresh dijadwalkan satu menit sebelum token kedaluwarsa. */
const REFRESH_MARGIN_MS = 60_000;

const status = ref<SatusehatAuthStatus>('idle');
const accessToken = ref('');
const expiresAt = ref<Date | null>(null);
const errorMessage = ref('');

let refreshTimer: number | undefined;
let refreshing = false;

const isConnected = computed(() => status.value === 'connected' && accessToken.value !== '');

const tokenPreview = computed(() => {
  if (!accessToken.value) return '';
  const token = accessToken.value;
  return token.length > 24 ? `${token.slice(0, 10)}…${token.slice(-6)}` : '••••••';
});

const expiresAtText = computed(() =>
  expiresAt.value ? expiresAt.value.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : ''
);

const statusLabel = computed(() => {
  switch (status.value) {
    case 'connecting':
      return 'Menghubungkan…';
    case 'connected':
      return 'Terhubung';
    case 'error':
      return 'Gagal terhubung';
    default:
      return 'Belum terhubung';
  }
});

const statusVariant = computed(() => {
  switch (status.value) {
    case 'connecting':
      return 'info';
    case 'connected':
      return 'success';
    case 'error':
      return 'destructive';
    default:
      return 'neutral';
  }
});

function clearRefreshTimer() {
  if (refreshTimer !== undefined) {
    window.clearTimeout(refreshTimer);
    refreshTimer = undefined;
  }
}

function scheduleRefresh() {
  clearRefreshTimer();
  if (!expiresAt.value) return;

  const remaining = expiresAt.value.getTime() - Date.now();
  const margin = Math.min(REFRESH_MARGIN_MS, Math.max(remaining / 2, 0));
  const delay = Math.max(remaining - margin, 0);

  refreshTimer = window.setTimeout(() => {
    void login({ silent: true });
  }, delay);
}

/**
 * Timer di background bisa ditahan browser saat tab tidak aktif.
 * Begitu tab kembali terlihat, refresh langsung dijalankan bila token
 * sudah mendekati/melewati kedaluwarsa.
 */
function handleVisibilityChange() {
  if (document.visibilityState !== 'visible') return;
  if (status.value !== 'connected' || !expiresAt.value) return;
  if (expiresAt.value.getTime() - Date.now() <= REFRESH_MARGIN_MS) {
    void login({ silent: true });
  }
}

let visibilityBound = false;

function bindVisibilityRefresh() {
  if (visibilityBound || typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', handleVisibilityChange);
  visibilityBound = true;
}

async function login(options: { silent?: boolean } = {}) {
  if (refreshing || status.value === 'connecting') return;

  const silent = options.silent === true;
  refreshing = true;
  if (!silent) {
    status.value = 'connecting';
    accessToken.value = '';
    expiresAt.value = null;
  }
  errorMessage.value = '';
  clearRefreshTimer();

  try {
    const response = await fetch('/api/satusehat/token', {
      method: 'POST',
      headers: { Accept: 'application/json' }
    });
    const payload = (await response.json().catch(() => ({}))) as TokenResponse;

    if (!response.ok || !payload.access_token) {
      const detail =
        payload.error_description || payload.message || payload.error || `Permintaan token gagal (HTTP ${response.status}).`;
      throw new Error(detail);
    }

    accessToken.value = payload.access_token;
    const ttl = Number(payload.expires_in ?? 3600);
    const lifetimeMs = (Number.isFinite(ttl) && ttl > 0 ? ttl : 3600) * 1000;
    expiresAt.value = new Date(Date.now() + lifetimeMs);
    status.value = 'connected';
    scheduleRefresh();
  } catch (error) {
    status.value = 'error';
    errorMessage.value = error instanceof Error ? error.message : 'Gagal menghubungkan ke SATUSEHAT.';
  } finally {
    refreshing = false;
  }
}

function logout() {
  clearRefreshTimer();
  status.value = 'idle';
  accessToken.value = '';
  expiresAt.value = null;
  errorMessage.value = '';
}

export function useSatusehatAuth() {
  bindVisibilityRefresh();

  return {
    status,
    isConnected,
    accessToken,
    tokenPreview,
    expiresAtText,
    errorMessage,
    statusLabel,
    statusVariant,
    login,
    logout
  };
}
