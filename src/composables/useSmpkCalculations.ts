import { computed, Ref } from 'vue';
import type { SmpkFormState, DerivedState } from '../types/smpk';

const FAKTOR: Record<string, number> = {
  min: 1 / 525960,
  h: 1 / 8766,
  d: 1 / 365.25,
  wk: 7 / 365.25,
  mo: 1 / 12,
  a: 1
};

export function useSmpkCalculations(form: Ref<SmpkFormState>) {
  const derived = computed<DerivedState>(() => {
    const lahir = form.value.tgl_lahir_tt || !form.value.tgl_lahir 
      ? null 
      : new Date(form.value.tgl_lahir.length === 10 ? form.value.tgl_lahir + 'T00:00' : form.value.tgl_lahir);
    
    const mati = form.value.waktu_mati ? new Date(form.value.waktu_mati) : null;
    const masuk = form.value.kunj_masuk ? new Date(form.value.kunj_masuk) : null;

    let usia: { n: number; u: string } | null = null;
    let usiaTahun: number | null = null;
    let tahunPenuh: number | null = null;

    if (lahir && mati && mati >= lahir) {
      let th = mati.getFullYear() - lahir.getFullYear();
      if (mati.getMonth() < lahir.getMonth() || (mati.getMonth() === lahir.getMonth() && mati.getDate() < lahir.getDate())) th--;
      let bl = (mati.getFullYear() - lahir.getFullYear()) * 12 + mati.getMonth() - lahir.getMonth();
      if (mati.getDate() < lahir.getDate()) bl--;
      const hari = Math.floor((mati.getTime() - lahir.getTime()) / 864e5);

      if (th >= 1) usia = { n: th, u: 'a' };
      else if (bl >= 1) usia = { n: bl, u: 'mo' };
      else if (hari >= 7) usia = { n: Math.floor(hari / 7), u: 'wk' };
      else usia = { n: hari, u: 'd' };

      usiaTahun = (mati.getTime() - lahir.getTime()) / (365.25 * 864e5);
      tahunPenuh = th;
    } else if (!lahir && form.value.usia_manual != null && +form.value.usia_manual >= 0) {
      const u = form.value.usia_unit || 'a';
      usia = { n: +form.value.usia_manual, u };
      usiaTahun = +form.value.usia_manual * FAKTOR[u];
      tahunPenuh = Math.floor(usiaTahun + 1e-9);
    }

    const bayi = usiaTahun == null ? null : usiaTahun < 1;
    const perempuan = form.value.jk !== 'female' 
      ? false 
      : (tahunPenuh == null ? null : tahunPenuh >= 10 && tahunPenuh <= 54);

    const caraMati = form.value.cara_mati;
    const eksWajib = ['LA18034-1', 'LA18036-6', '417928002', '219290002', '15863006'];
    const eksTanya = ['LA11137-9', 'TK000252', '87309006'];
    const eks = !caraMati ? null : eksWajib.includes(caraMati) ? 'wajib' : eksTanya.includes(caraMati) ? 'tanya' : 'tidak';
    const eksAktif = eks === 'wajib' || (eks === 'tanya' && form.value.eks_ada === 'ya');

    const terisi = ['pa', 'pb', 'pc', 'pd'].filter(k => form.value[k] && String(form.value[k]).trim() !== '');
    const dasarKey = terisi.length ? terisi[terisi.length - 1] : null;
    const autopsi = (form.value.dasar || []).some((v: string) => v === '5785009' || v === 'TK000637');

    return {
      lahir,
      mati,
      masuk,
      usia,
      bayi,
      perempuan,
      eks,
      eksAktif,
      dasarKey,
      autopsi
    };
  });

  const usiaTeks = computed(() => {
    if (!derived.value.usia) return '';
    return `${derived.value.usia.n} ${derived.value.usia.u}`;
  });

  return {
    derived,
    usiaTeks
  };
}