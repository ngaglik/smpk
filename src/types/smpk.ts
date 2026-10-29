export type SourceType = 'simrs' | 'hitung' | 'dokter' | 'koder';

export interface OptionItem {
  v: string;
  l: string;
  d?: string;
  c?: string;
}

export interface IntervalVal {
  mode: 'angka' | 'teks' | 'tt';
  val?: string;
  unit?: string;
  teks?: string;
}

export interface SmpkFormState {
  tgl_isi?: string;
  no_rm?: string;
  id_jenis?: string;
  id_nilai?: string;
  ihs?: string;
  nama?: string;
  jk?: 'female' | 'male' | 'unknown';
  tempat_lahir?: string;
  tempat_lahir_tt?: boolean;
  tgl_lahir?: string;
  tgl_lahir_tt?: boolean;
  usia_manual?: string;
  usia_unit?: string;
  agama?: string;
  domisili?: string;
  kunj_jenis?: string;
  reg_id?: string;
  kunj_id?: string;
  kunj_lokasi?: string;
  kunj_masuk?: string;
  kunj_ruang?: string;
  kunj_dpjp?: string;
  doa?: string;
  petugas_jenazah?: string;
  waktu_mati?: string;
  tempat_mati?: string;
  alamat_mati?: string;
  kab_mati?: string;
  cara_mati?: string;
  eks_ada?: 'ya' | 'tidak';
  eksternal_tanggal?: string;
  eksternal_deskripsi?: string;
  eksternal_tempat?: string;
  eksternal_note?: string;
  janin_kembar?: string;
  janin_lahir_mati?: string;
  janin_bertahan_jam?: string;
  janin_waktu_lahir?: string;
  janin_berat?: string;
  janin_usia_kehamilan?: string;
  ibu_ihs?: string;
  ibu_umur?: string;
  ibu_kondisi?: string;
  ibu_kondisi_lain?: string;
  hamil_riwayat?: string;
  hamil_kondisi?: string;
  hamil_kontribusi?: string;
  pa?: string;
  iva?: IntervalVal;
  pb?: string;
  ivb?: IntervalVal;
  pc?: string;
  ivc?: IntervalVal;
  pd?: string;
  ivd?: IntervalVal;
  kl?: string;
  ivk?: IntervalVal;
  operasi?: string;
  operasi_tgl?: string;
  operasi_alasan?: string;
  dasar?: string[];
  autopsi_hasil?: string;
  dokter_nama?: string;
  dokter_sip?: string;
  dokter_ihs?: string;
  pernyataan?: boolean;
  [key: string]: any;
}

export interface DerivedState {
  lahir: Date | null;
  mati: Date | null;
  masuk: Date | null;
  usia: { n: number; u: string } | null;
  bayi: boolean | null;
  perempuan: boolean | null;
  eks: 'wajib' | 'tanya' | 'tidak' | null;
  eksAktif: boolean;
  dasarKey: string | null;
  autopsi: boolean;
}