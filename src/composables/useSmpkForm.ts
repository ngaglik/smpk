import { ref, reactive } from 'vue';
import { satusehatConfig } from '../config/satusehat';
import type { IntervalVal, SmpkFormState } from '../types/smpk';

function emptyInterval(): IntervalVal {
  return { mode: 'angka', val: '', unit: 'h' };
}

function localDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function localDateTime(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function createEmptyForm(): SmpkFormState {
  return {
    tgl_isi: localDate(),
    kunj_masuk: localDateTime(),
    waktu_mati: localDateTime(),
    eksternal_tanggal: localDateTime(),
    jk: 'unknown',
    reg_id: '',
    kunj_id: '',
    kunj_lokasi: satusehatConfig.locationId,
    dasar: [],
    iva: emptyInterval(),
    ivb: emptyInterval(),
    ivc: emptyInterval(),
    ivd: emptyInterval(),
    ivk: emptyInterval()
  };
}

export function useSmpkForm() {
  const activeTab = ref<'form' | 'asal'>('form');
  const showFhir = ref(false);
  const activeSkenario = ref('');
  const isSubmitted = ref(false);
  const isSent = ref(false);
  const sentTime = ref<Date | null>(null);

  const form = ref<SmpkFormState>(createEmptyForm());
  const simKeys = reactive(new Set<string>());
  const corrections = reactive(new Set<string>());
  const touched = reactive(new Set<string>());

  function submitForm() {
    isSubmitted.value = true;
    isSent.value = true;
    sentTime.value = new Date();
  }

  function resetForm() {
    form.value = createEmptyForm();
    simKeys.clear();
    corrections.clear();
    touched.clear();
    isSubmitted.value = false;
    isSent.value = false;
    sentTime.value = null;
  }

  return {
    activeTab,
    showFhir,
    activeSkenario,
    isSubmitted,
    isSent,
    sentTime,
    form,
    simKeys,
    corrections,
    touched,
    submitForm,
    resetForm
  };
}
