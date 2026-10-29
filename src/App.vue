<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="ttdk-container header-inner">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">S</span>
          <div class="brand-copy">
            <div class="brand-title">SIMRS <span class="brand-sep">/</span> SATUSEHAT</div>
            <div class="brand-sub">Formulir Kematian &middot; SMPK</div>
          </div>
        </div>
        <div class="header-actions">
          <span class="ttdk-badge" data-appearance="soft" data-variant="primary" data-size="sm" data-rounded="full">Mockup</span>
          <button
            type="button"
            class="ttdk-button oauth-btn"
            :data-variant="oauthConnected ? 'outline' : 'base'"
            data-size="sm"
            @click="oauthOpen = true"
          >
            <span class="oauth-dot" :data-status="oauthStatus" aria-hidden="true"></span>
            OAuth2
          </button>
        </div>
      </div>
    </header>

    <main class="ttdk-container app-main">
      <div class="page-head">
        <h1 class="page-title">Sertifikat Medis Penyebab Kematian</h1>
        <p class="page-desc">
          Pengisian formulir SMPK terintegrasi SIMRS dan SATUSEHAT. Data identitas dan kunjungan
          dapat ditarik otomatis dari SIMRS, sedangkan penyebab kematian diisi oleh dokter penanggung jawab.
        </p>
      </div>

      <section class="scenario-bar">
        <div class="scenario-head">
          <div class="scenario-copy">
            <div class="scenario-title">Skenario demo</div>
            <p class="scenario-desc">Isi formulir dengan contoh data pasien untuk mencoba logika turunan (usia, bayi, pemeriksaan luar).</p>
          </div>
          <button
            type="button"
            class="ttdk-button scenario-reset"
            data-variant="outline"
            data-size="sm"
            @click="onReset"
          >
            Atur ulang
          </button>
        </div>
        <div class="scenario-actions">
          <button
            v-for="scenario in scenarios"
            :key="scenario.key"
            type="button"
            class="ttdk-button"
            :data-variant="activeSkenario === scenario.key ? 'primary' : 'base'"
            data-size="sm"
            :title="scenario.hint"
            @click="applySkenario(scenario.key)"
          >
            {{ scenario.label }}
          </button>
          <div class="reg-id-field">
            <span class="reg-id-label">RegId</span>
            <TtdkInput
              v-model="form.reg_id"
              size="sm"
              placeholder="Nomor pendaftaran"
              class="reg-id-input"
            />
          </div>
          <button
            type="button"
            class="ttdk-button register-btn"
            data-variant="secondary"
            data-size="sm"
            :disabled="registering"
            @click="onRegisterEncounter"
          >
            {{ registering ? 'Mendaftarkan…' : 'Registrasi Encounter' }}
          </button>
        </div>
      </section>

      <p v-if="registerError" class="register-feedback register-feedback--error">{{ registerError }}</p>
      <p v-else-if="registerInfo" class="register-feedback register-feedback--ok">{{ registerInfo }}</p>

      <div class="derived-strip">
        <div class="derived-item">
          <span class="derived-label">Usia saat meninggal</span>
          <span class="derived-value">{{ usiaDisplay }}</span>
        </div>
        <div class="derived-item">
          <span class="derived-label">Kategori usia</span>
          <span class="derived-value">{{ derived.bayi === null ? '—' : derived.bayi ? 'Bayi (< 1 tahun)' : 'Bukan bayi' }}</span>
        </div>
        <div class="derived-item">
          <span class="derived-label">Perempuan usia subur</span>
          <span class="derived-value">{{ derived.perempuan === null ? '—' : derived.perempuan ? 'Ya (10–54 tahun)' : 'Tidak' }}</span>
        </div>
        <div class="derived-item">
          <span class="derived-label">Pemeriksaan luar</span>
          <span class="derived-value">
            <span class="ttdk-badge" data-appearance="soft" :data-variant="eksVariant" data-size="sm" data-rounded="sm">
              {{ eksLabel }}
            </span>
          </span>
        </div>
        <div class="derived-item">
          <span class="derived-label">Autopsi</span>
          <span class="derived-value">{{ derived.autopsi ? 'Ya' : 'Tidak' }}</span>
        </div>
      </div>

      <div
        v-if="submitAttempted && errorCount > 0"
        class="ttdk-alert notify"
        data-appearance="soft"
        data-variant="warning"
        data-block="true"
      >
        <span class="ttdk-alert-icon-wrapper" aria-hidden="true">
          <svg class="ttdk-alert-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        </span>
        <div class="ttdk-alert-content">
          <div class="ttdk-alert-title">Periksa kembali {{ errorCount }} kolom</div>
          <div class="ttdk-alert-desc">Kolom bertanda merah wajib dilengkapi sebelum sertifikat dikirim.</div>
        </div>
      </div>

      <div
        v-if="isSubmitted"
        class="ttdk-alert notify"
        data-appearance="soft"
        data-variant="success"
        data-block="true"
      >
        <span class="ttdk-alert-icon-wrapper" aria-hidden="true">
          <svg class="ttdk-alert-icon" viewBox="0 0 24 24" fill="none">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <div class="ttdk-alert-content">
          <div class="ttdk-alert-title">Sertifikat berhasil diproses</div>
          <div class="ttdk-alert-desc">
            {{ isSent ? 'Data terkirim ke SATUSEHAT' : 'Data tersimpan sebagai draf' }} pada {{ sentTimeText }}<template v-if="sendStatus"> (HTTP {{ sendStatus }})</template>.
          </div>
        </div>
      </div>

      <div
        v-if="sendError"
        class="ttdk-alert notify"
        data-appearance="soft"
        data-variant="destructive"
        data-block="true"
      >
        <span class="ttdk-alert-icon-wrapper" aria-hidden="true">
          <svg class="ttdk-alert-icon" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        </span>
        <div class="ttdk-alert-content">
          <div class="ttdk-alert-title">Pengiriman ke SATUSEHAT gagal</div>
          <div class="ttdk-alert-desc">{{ sendError }}</div>
        </div>
      </div>

      <div class="ttdk-tabs" data-orientation="horizontal" data-variant="line" data-size="md">
        <div class="ttdk-tabs-list">
          <button
            type="button"
            class="ttdk-tab-item"
            :data-state="activeTab === 'form' ? 'active' : 'inactive'"
            @click="activeTab = 'form'"
          >
            <span class="ttdk-tab-label">Formulir SMPK</span>
            <span v-if="activeTab === 'form'" class="ttdk-tab-indicator"></span>
          </button>
          <button
            type="button"
            class="ttdk-tab-item"
            :data-state="activeTab === 'asal' ? 'active' : 'inactive'"
            @click="activeTab = 'asal'"
          >
            <span class="ttdk-tab-label">Asal Data</span>
            <span class="ttdk-tab-badge">{{ totalTracked }}</span>
            <span v-if="activeTab === 'asal'" class="ttdk-tab-indicator"></span>
          </button>
        </div>

        <div class="ttdk-tabs-panels">
          <div v-if="activeTab === 'form'" class="ttdk-tab-panel">
            <div class="smpk-form" @input="onFormInput" @change="onFormInput">
              <SmpkSection
                step="1"
                title="Identitas Pasien"
                subtitle="Ditarik dari master pasien SIMRS. Perbaiki bila ada data yang tidak sesuai."
              >
                <div class="grid">
                  <TtdkField label="Tanggal pengisian" field="tgl_isi" required>
                    <TtdkInput v-model="form.tgl_isi" type="date" />
                  </TtdkField>
                  <TtdkField label="Nomor rekam medis" field="no_rm" required :error="errors.no_rm">
                    <TtdkInput v-model="form.no_rm" placeholder="mis. RM-102938" />
                  </TtdkField>
                  <TtdkField
                    label="Nomor IHS pasien"
                    field="ihs"
                    required
                    :error="errors.ihs"
                    helper="Dipakai sebagai subject Encounter, Observation, dan Composition."
                  >
                    <TtdkInput v-model="form.ihs" placeholder="mis. 100000030011" />
                  </TtdkField>

                  <TtdkField label="Jenis identitas" field="id_jenis">
                    <TtdkSelect v-model="form.id_jenis" :options="idJenisOptions" />
                  </TtdkField>
                  <TtdkField label="Nomor identitas" field="id_nilai" class="span-2">
                    <TtdkInput v-model="form.id_nilai" placeholder="Nomor sesuai jenis identitas" />
                  </TtdkField>

                  <TtdkField label="Nama lengkap" field="nama" required :error="errors.nama" class="span-2">
                    <TtdkInput v-model="form.nama" placeholder="Sesuai identitas" />
                  </TtdkField>
                  <TtdkField label="Jenis kelamin" field="jk" required>
                    <div class="radio-row">
                      <TtdkRadio
                        :model-value="form.jk ?? ''"
                        value="male"
                        label="Laki-laki"
                        name="jk"
                        @update:model-value="setJk"
                      />
                      <TtdkRadio
                        :model-value="form.jk ?? ''"
                        value="female"
                        label="Perempuan"
                        name="jk"
                        @update:model-value="setJk"
                      />
                      <TtdkRadio
                        :model-value="form.jk ?? ''"
                        value="unknown"
                        label="Tidak diketahui"
                        name="jk"
                        @update:model-value="setJk"
                      />
                    </div>
                  </TtdkField>

                  <TtdkField label="Tempat lahir" field="tempat_lahir">
                    <TtdkInput v-model="form.tempat_lahir" :disabled="form.tempat_lahir_tt" placeholder="Kota/kabupaten" />
                    <TtdkCheckbox
                      class="field-toggle"
                      size="sm"
                      :model-value="form.tempat_lahir_tt ?? false"
                      label="Tidak diketahui"
                      @update:model-value="onTempatLahirTT"
                    />
                  </TtdkField>
                  <TtdkField label="Tanggal lahir" field="tgl_lahir" required :error="errors.tgl_lahir">
                    <TtdkInput v-model="form.tgl_lahir" type="date" :disabled="form.tgl_lahir_tt" />
                    <TtdkCheckbox
                      class="field-toggle"
                      size="sm"
                      :model-value="form.tgl_lahir_tt ?? false"
                      label="Tidak diketahui"
                      @update:model-value="onTglLahirTT"
                    />
                  </TtdkField>
                  <TtdkField label="Agama" field="agama">
                    <TtdkSelect v-model="form.agama" :options="agamaOptions" />
                  </TtdkField>

                  <div v-if="form.tgl_lahir_tt" class="inline-fields span-2">
                    <TtdkField
                      label="Usia (manual)"
                      field="usia_manual"
                      helper="Dipakai untuk menghitung kategori usia bila tanggal lahir tidak diketahui."
                    >
                      <TtdkInput v-model="form.usia_manual" type="number" min="0" placeholder="0" />
                    </TtdkField>
                    <TtdkField label="Satuan usia" field="usia_unit">
                      <TtdkSelect v-model="form.usia_unit" :options="usiaUnitOptions" />
                    </TtdkField>
                  </div>

                  <TtdkField label="Domisili" field="domisili" class="span-3">
                    <TtdkInput v-model="form.domisili" placeholder="Alamat tempat tinggal saat ini" />
                  </TtdkField>
                </div>
              </SmpkSection>

              <SmpkSection step="2" title="Kunjungan Terakhir" subtitle="Kunjungan yang berhubungan dengan perawatan menjelang kematian.">
                <div class="grid">
                  <TtdkField label="Jenis kunjungan" field="kunj_jenis">
                    <TtdkSelect v-model="form.kunj_jenis" :options="kunjJenisOptions" />
                  </TtdkField>
                  <TtdkField label="Waktu masuk" field="kunj_masuk">
                    <TtdkInput v-model="form.kunj_masuk" type="datetime-local" />
                  </TtdkField>
                  <TtdkField label="Ruang perawatan" field="kunj_ruang">
                    <TtdkInput v-model="form.kunj_ruang" placeholder="mis. IGD - Bedah" />
                  </TtdkField>
                  <TtdkField label="Dokter penanggung jawab (DPJP)" field="kunj_dpjp" class="span-2">
                    <TtdkInput v-model="form.kunj_dpjp" placeholder="Nama dokter DPJP" />
                  </TtdkField>
                </div>

                <div class="encounter-id-row">
                  <span class="encounter-id-label">Encounter ID SATUSEHAT</span>
                  <code class="encounter-id-value" :data-empty="form.kunj_id ? 'false' : 'true'">
                    {{ form.kunj_id || 'Belum terdaftar' }}
                  </code>
                </div>
              </SmpkSection>

              <SmpkSection step="3" title="Waktu, Tempat, dan Cara Kematian" subtitle="Menentukan kewajiban pemeriksaan luar jenazah.">
                <div class="grid">
                  <TtdkField label="Datang sudah meninggal (DOA)" field="doa">
                    <TtdkSelect v-model="form.doa" :options="yaTidakOptions" />
                  </TtdkField>
                  <TtdkField label="Petugas pemeriksa jenazah" field="petugas_jenazah">
                    <TtdkInput v-model="form.petugas_jenazah" placeholder="Nama petugas" />
                  </TtdkField>
                  <TtdkField label="Waktu meninggal" field="waktu_mati" required :error="errors.waktu_mati">
                    <TtdkInput v-model="form.waktu_mati" type="datetime-local" />
                  </TtdkField>

                  <TtdkField label="Tempat meninggal" field="tempat_mati" required :error="errors.tempat_mati">
                    <TtdkSelect v-model="form.tempat_mati" :options="tempatMatiOptions" />
                  </TtdkField>
                  <TtdkField label="Alamat tempat meninggal" field="alamat_mati" class="span-2">
                    <TtdkInput v-model="form.alamat_mati" placeholder="Nama fasilitas / alamat lengkap" />
                  </TtdkField>

                  <TtdkField label="Kabupaten / Kota" field="kab_mati">
                    <TtdkInput v-model="form.kab_mati" placeholder="mis. Kota Bandung" />
                  </TtdkField>
                  <TtdkField
                    label="Cara kematian"
                    field="cara_mati"
                    required
                    :error="errors.cara_mati"
                    :helper="caraMatiHelper"
                    class="span-2"
                  >
                    <TtdkSelect v-model="form.cara_mati" :options="caraMatiOptions" />
                  </TtdkField>

                  <TtdkField
                    v-if="derived.eks === 'tanya'"
                    label="Apakah pemeriksaan luar dilakukan?"
                    field="eks_ada"
                    required
                    :error="errors.eks_ada"
                    helper="Diperlukan karena cara kematian belum dapat dipastikan."
                    class="span-2"
                  >
                    <div class="radio-row">
                      <TtdkRadio
                        :model-value="form.eks_ada ?? ''"
                        value="ya"
                        label="Ya, sudah dilakukan"
                        name="eks_ada"
                        @update:model-value="setEksAda"
                      />
                      <TtdkRadio
                        :model-value="form.eks_ada ?? ''"
                        value="tidak"
                        label="Belum dilakukan"
                        name="eks_ada"
                        @update:model-value="setEksAda"
                      />
                    </div>
                  </TtdkField>
                </div>
              </SmpkSection>

              <SmpkSection
                v-if="showExternal"
                step="3a"
                title="Penyebab Eksternal"
                subtitle="Diisi bila cara kematian bukan sakit/alamiah atau penyebabnya eksternal/racun."
              >
                <div class="grid">
                  <TtdkField label="Tanggal kejadian" field="eksternal_tanggal">
                    <TtdkInput v-model="form.eksternal_tanggal" type="datetime-local" />
                  </TtdkField>
                  <TtdkField label="Deskripsi penyebab eksternal / jenis racun" field="eksternal_deskripsi" class="span-2">
                    <TtdkInput v-model="form.eksternal_deskripsi" placeholder="mis. tabrakan sepeda motor dengan bus" />
                  </TtdkField>
                  <TtdkField label="Tempat kejadian" field="eksternal_tempat">
                    <TtdkSelect v-model="form.eksternal_tempat" :options="externalPlaceOptions" />
                  </TtdkField>
                  <TtdkField label="Detail tempat lainnya" field="eksternal_note" class="span-2" helper="Dikirim sebagai Observation.note.">
                    <TtdkInput v-model="form.eksternal_note" placeholder="mis. Jalan Raya Soreang KM 12" />
                  </TtdkField>
                </div>
              </SmpkSection>

              <SmpkSection
                v-if="showJanin"
                step="3b"
                title="Kematian Janin/Bayi"
                subtitle="Diisi untuk janin ≥28 minggu kehamilan hingga bayi berusia kurang dari 1 tahun."
              >
                <div class="grid">
                  <TtdkField label="Kehamilan kembar" field="janin_kembar">
                    <TtdkSelect v-model="form.janin_kembar" :options="yesNoUnknownOptions" />
                  </TtdkField>
                  <TtdkField label="Lahir mati" field="janin_lahir_mati">
                    <TtdkSelect v-model="form.janin_lahir_mati" :options="yesNoUnknownOptions" />
                  </TtdkField>
                  <TtdkField label="Waktu kelahiran" field="janin_waktu_lahir">
                    <TtdkInput v-model="form.janin_waktu_lahir" type="time" />
                  </TtdkField>
                  <TtdkField label="Lama bertahan hidup (jam)" field="janin_bertahan_jam" helper="Isi bila bayi bertahan kurang dari 24 jam.">
                    <TtdkInput v-model="form.janin_bertahan_jam" type="number" min="0" step="0.1" placeholder="0" />
                  </TtdkField>
                  <TtdkField label="Berat lahir (gram)" field="janin_berat">
                    <TtdkInput v-model="form.janin_berat" type="number" min="0" placeholder="0" />
                  </TtdkField>
                  <TtdkField label="Usia kehamilan (minggu)" field="janin_usia_kehamilan">
                    <TtdkInput v-model="form.janin_usia_kehamilan" type="number" min="0" placeholder="0" />
                  </TtdkField>
                  <TtdkField label="IHS pasien ibu" field="ibu_ihs" helper="Dipakai sebagai Observation.focus.">
                    <TtdkInput v-model="form.ibu_ihs" placeholder="mis. 100000030020" />
                  </TtdkField>
                  <TtdkField label="Usia ibu (tahun)" field="ibu_umur">
                    <TtdkInput v-model="form.ibu_umur" type="number" min="0" placeholder="0" />
                  </TtdkField>
                  <TtdkField label="Kondisi ibu mempengaruhi janin/neonatal" field="ibu_kondisi">
                    <TtdkSelect v-model="form.ibu_kondisi" :options="maternalImpactOptions" />
                  </TtdkField>
                  <TtdkField
                    v-if="form.ibu_kondisi === 'M6'"
                    label="Kondisi/penyakit lainnya"
                    field="ibu_kondisi_lain"
                    class="span-3"
                  >
                    <TtdkInput v-model="form.ibu_kondisi_lain" placeholder="Sebutkan kondisi/penyakit ibu" />
                  </TtdkField>
                </div>
              </SmpkSection>

              <SmpkSection
                v-if="showMaternal"
                step="3c"
                title="Kematian Perempuan"
                subtitle="Diisi untuk semua kematian perempuan usia 10–54 tahun."
              >
                <div class="grid">
                  <TtdkField label="Riwayat hamil 1 tahun terakhir" field="hamil_riwayat">
                    <TtdkSelect v-model="form.hamil_riwayat" :options="yesNoUnknownOptions" />
                  </TtdkField>
                  <TtdkField
                    v-if="form.hamil_riwayat === 'ya'"
                    label="Kondisi saat meninggal"
                    field="hamil_kondisi"
                  >
                    <TtdkSelect v-model="form.hamil_kondisi" :options="maternalConditionOptions" />
                  </TtdkField>
                  <TtdkField
                    v-if="form.hamil_riwayat === 'ya'"
                    label="Kehamilan berkontribusi pada kematian"
                    field="hamil_kontribusi"
                  >
                    <TtdkSelect v-model="form.hamil_kontribusi" :options="yesNoUnknownOptions" />
                  </TtdkField>
                </div>
              </SmpkSection>

              <SmpkSection
                step="4"
                title="Penyebab Kematian"
                subtitle="Tuliskan rangkaian sebab akibat dari penyebab langsung hingga penyebab dasar, beserta intervalnya."
              >
                <div class="cause-list">
                  <div v-for="row in causeRows" :key="row.key" class="cause-row">
                    <span class="cause-badge">{{ row.letter }}</span>
                    <TtdkField :label="row.label" :field="row.key" :error="row.key === 'pa' ? errors.pa : ''">
                      <TtdkInput v-model="form[row.key]" :placeholder="row.placeholder" />
                      <TtdkInput v-model="form[row.icdKey]" class="icd-input" placeholder="Kode ICD-10 (opsional)" />
                    </TtdkField>
                    <TtdkField label="Interval sebelum kematian" :field="row.ivKey">
                      <div class="interval-row">
                        <TtdkSelect
                          v-model="form[row.ivKey].mode"
                          class="interval-mode"
                          :options="intervalModeOptions"
                          placeholder="Mode"
                        />
                        <template v-if="form[row.ivKey].mode === 'angka'">
                          <TtdkInput
                            v-model="form[row.ivKey].val"
                            class="interval-value"
                            type="number"
                            min="0"
                            placeholder="0"
                          />
                          <TtdkSelect
                            v-model="form[row.ivKey].unit"
                            class="interval-unit"
                            :options="intervalUnitOptions"
                            placeholder="Satuan"
                          />
                        </template>
                        <TtdkInput
                          v-else-if="form[row.ivKey].mode === 'teks'"
                          v-model="form[row.ivKey].teks"
                          class="interval-text"
                          placeholder="mis. sejak 26 Oktober 2026"
                        />
                        <span v-else class="interval-unknown">Tidak diketahui</span>
                      </div>
                    </TtdkField>
                  </div>
                </div>

                <div class="cause-summary">
                  <span class="derived-label">Penyebab dasar terakhir terisi:</span>
                  <span class="ttdk-badge" data-appearance="soft" data-variant="info" data-size="sm" data-rounded="sm">
                    {{ derived.dasarKey ? `baris ${derived.dasarKey}` : 'belum ada' }}
                  </span>
                </div>
              </SmpkSection>

              <SmpkSection step="5" title="Operasi / Tindakan" subtitle="Riwayat tindakan operatif sebelum kematian.">
                <div class="grid">
                  <TtdkField label="Apakah dilakukan operasi?" field="operasi">
                    <TtdkSelect v-model="form.operasi" :options="yaTidakOptions" />
                  </TtdkField>
                  <template v-if="form.operasi === 'ya'">
                    <TtdkField label="Tanggal operasi" field="operasi_tgl">
                      <TtdkInput v-model="form.operasi_tgl" type="date" />
                    </TtdkField>
                    <TtdkField label="Alasan operasi" field="operasi_alasan" class="span-3">
                      <TtdkInput v-model="form.operasi_alasan" placeholder="Diagnosis / indikasi tindakan" />
                    </TtdkField>
                  </template>
                </div>
              </SmpkSection>

              <SmpkSection
                step="6"
                title="Dasar Diagnosis dan Autopsi"
                subtitle="Pilih sumber penegakan diagnosis. Bila autopsi dipilih, status penggunaan hasil autopsi akan muncul."
              >
                <div class="check-list">
                  <TtdkCheckbox
                    v-for="option in dasarOptions"
                    :key="option.v"
                    :model-value="(form.dasar ?? []).includes(option.v)"
                    :label="option.l"
                    :description="option.d"
                    @update:model-value="toggleDasar(option.v, $event)"
                  />
                </div>

                <TtdkField
                  v-if="derived.autopsi"
                  label="Hasil autopsi digunakan untuk SMPK"
                  field="autopsi_hasil"
                  helper="Pilih apakah temuan autopsi dipakai dalam menentukan penyebab kematian."
                >
                  <TtdkSelect v-model="form.autopsi_hasil" :options="autopsyUsedOptions" />
                </TtdkField>
              </SmpkSection>

              <SmpkSection step="7" title="Dokter dan Pernyataan" subtitle="Dokter yang berwenang menandatangani sertifikat kematian.">
                <div class="grid">
                  <TtdkField label="Nama dokter" field="dokter_nama" required :error="errors.dokter_nama" class="span-2">
                    <TtdkInput v-model="form.dokter_nama" placeholder="Nama lengkap dengan gelar" />
                  </TtdkField>
                  <TtdkField label="Nomor SIP" field="dokter_sip" required :error="errors.dokter_sip">
                    <TtdkInput v-model="form.dokter_sip" placeholder="Nomor izin praktik" />
                  </TtdkField>
                  <TtdkField label="Nomor IHS dokter" field="dokter_ihs" required :error="errors.dokter_ihs" helper="Dipakai sebagai author Composition dan performer Observation.">
                    <TtdkInput v-model="form.dokter_ihs" placeholder="Identifier SATUSEHAT dokter" />
                  </TtdkField>

                  <div class="statement span-3">
                    <TtdkField field="pernyataan" :error="errors.pernyataan">
                      <TtdkCheckbox
                        v-model="form.pernyataan"
                        label="Saya menyatakan bahwa data pada sertifikat ini benar dan dapat dipertanggungjawabkan."
                        description="Pernyataan ini menggantikan tanda tangan basah pada alur integrasi SATUSEHAT."
                      />
                    </TtdkField>
                  </div>
                </div>
              </SmpkSection>

              <div v-if="showFhir" class="fhir-panel">
                <div class="fhir-head">
                  <div>
                    <h2 class="fhir-title">Pratinjau payload SATUSEHAT</h2>
                    <p class="fhir-desc">
                      Bundle transaksi sesuai playbook SMPK v1.5: Encounter → Observation → Composition.
                      Waktu dikonversi dari WIB ke UTC, dan kode ICD-10 opsional dikirim sebagai komponen
                      <code>verify-code</code>.
                    </p>
                  </div>
                  <div class="fhir-actions">
                    <button
                      type="button"
                      class="ttdk-button"
                      :data-variant="payloadCopied ? 'secondary' : 'outline'"
                      data-size="sm"
                      @click="copyPayload"
                    >
                      {{ payloadCopied ? 'Tersalin' : 'Salin' }}
                    </button>
                    <button type="button" class="ttdk-button" data-variant="text" data-size="sm" @click="showFhir = false">
                      Tutup
                    </button>
                  </div>
                </div>
                <pre>{{ fhirPreview }}</pre>
              </div>

              <div class="submit-bar">
                <div class="submit-info">
                  <strong>{{ filledTracked }} dari {{ totalTracked }}</strong> data terisi
                  <span class="submit-dot">&middot;</span>
                  <span>{{ errorCount > 0 && submitAttempted ? `${errorCount} kolom perlu diperbaiki` : 'Siap dikirim' }}</span>
                  <div v-if="logInfo" class="submit-log">{{ logInfo }}</div>
                </div>
                <div class="submit-actions">
                  <button type="button" class="ttdk-button" data-variant="base" data-size="md" @click="showFhir = !showFhir">
                    {{ showFhir ? 'Sembunyikan payload' : 'Pratinjau payload' }}
                  </button>
                  <button
                    type="button"
                    class="ttdk-button"
                    data-variant="primary"
                    data-size="md"
                    :disabled="sending"
                    @click="onSubmit"
                  >
                    {{ sending ? 'Mengirim…' : 'Kirim ke SATUSEHAT' }}
                  </button>
                  <button
                    type="button"
                    class="ttdk-button"
                    data-variant="base"
                    data-size="md"
                    :disabled="savingLog || !lastRequest"
                    :title="lastRequest ? 'Simpan request dan response ke folder logs' : 'Kirim payload terlebih dahulu'"
                    @click="onSaveLog"
                  >
                    {{ savingLog ? 'Menyimpan…' : 'Simpan' }}
                  </button>
                  <button
                    type="button"
                    class="ttdk-button"
                    data-variant="base"
                    data-size="md"
                    :disabled="printing"
                    @click="onPrintSkk"
                  >
                    {{ printing ? 'Menyiapkan…' : 'Print SKK' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="ttdk-tab-panel">
            <div class="asal-intro">
              <h2 class="asal-title">Asal data setiap kolom</h2>
              <p class="asal-desc">
                Data dari SIMRS ditandai otomatis. Kolom yang diubah manual akan tercatat sebagai koreksi,
                sedangkan nilai turunan dihitung dari tanggal lahir dan waktu meninggal.
              </p>
            </div>

            <div class="ttdk-table-wrapper" data-rounded="md">
              <table class="ttdk-table" data-size="md" data-hoverable="true">
                <thead>
                  <tr>
                    <th>Kelompok</th>
                    <th>Data</th>
                    <th>Nilai</th>
                    <th>Sumber</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in provenanceRows" :key="`${row.group}-${row.label}`" class="ttdk-table-row">
                    <td class="cell-muted">{{ row.group }}</td>
                    <td class="cell-label">{{ row.label }}</td>
                    <td class="cell-value">{{ row.value || '—' }}</td>
                    <td>
                      <span
                        class="ttdk-badge"
                        data-appearance="soft"
                        :data-variant="row.source.variant"
                        data-size="sm"
                        data-rounded="sm"
                      >
                        {{ row.source.label }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="oauthOpen" class="modal-overlay" @click.self="oauthOpen = false">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="oauth-title">
        <div class="modal-head">
          <div>
            <h2 id="oauth-title" class="modal-title">Otorisasi OAuth2 SATUSEHAT</h2>
            <p class="modal-desc">
              Mockup alur otorisasi untuk integrasi SIMRS ke SATUSEHAT. Pertukaran token dilakukan backend;
              client secret tidak dikirim ke browser.
            </p>
          </div>
          <button type="button" class="modal-close" aria-label="Tutup" @click="oauthOpen = false">&times;</button>
        </div>

        <div class="modal-body">
          <div class="oauth-row">
            <span class="oauth-key">Status</span>
            <span
              class="ttdk-badge"
              data-appearance="soft"
              :data-variant="oauthStatusVariant"
              data-size="sm"
              data-rounded="sm"
            >
              {{ oauthStatusLabel }}
            </span>
          </div>
          <div class="oauth-row oauth-row--stack">
            <span class="oauth-key">Client ID</span>
            <code class="oauth-value">{{ satusehatConfig.clientId || 'belum diatur' }}</code>
          </div>
          <div class="oauth-row oauth-row--stack">
            <span class="oauth-key">Organization ID</span>
            <code class="oauth-value">{{ satusehatConfig.organizationId || 'belum diatur' }}</code>
          </div>
          <div class="oauth-row">
            <span class="oauth-key">Scope</span>
            <code class="oauth-value">patient.read condition.write</code>
          </div>
          <div class="oauth-row">
            <span class="oauth-key">Environment</span>
            <code class="oauth-value">{{ satusehatEnvironmentLabel }}</code>
          </div>
          <template v-if="oauthConnected">
            <div class="oauth-row">
              <span class="oauth-key">Access token</span>
              <code class="oauth-value">{{ oauthTokenPreview }}</code>
            </div>
            <div class="oauth-row">
              <span class="oauth-key">Berlaku sampai</span>
              <span class="oauth-value">{{ oauthExpiryText }}</span>
            </div>
            <div class="oauth-row">
              <span class="oauth-key">Auto-refresh</span>
              <span class="oauth-value">Aktif (± 1 menit sebelum kedaluwarsa)</span>
            </div>
          </template>

          <div v-if="oauthStatus === 'error' && oauthError" class="oauth-error">{{ oauthError }}</div>
        </div>

        <div class="modal-foot">
          <button type="button" class="ttdk-button" data-variant="base" data-size="sm" @click="oauthOpen = false">
            Tutup
          </button>
          <button v-if="oauthConnected"
            type="button"
            class="ttdk-button"
            data-variant="outline"
            data-size="sm"
            @click="logoutOauth"
          >
            Putuskan
          </button>
          <button
            v-else
            type="button"
            class="ttdk-button"
            data-variant="primary"
            data-size="sm"
            :disabled="oauthStatus === 'connecting'"
            @click="loginOauth()"
          >
            {{ oauthStatus === 'connecting' ? 'Menghubungkan…' : 'Hubungkan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import SmpkSection from './components/SmpkSection.vue';
import TtdkCheckbox from './components/TtdkCheckbox.vue';
import TtdkField from './components/TtdkField.vue';
import TtdkInput from './components/TtdkInput.vue';
import TtdkRadio from './components/TtdkRadio.vue';
import TtdkSelect from './components/TtdkSelect.vue';
import { useSmpkCalculations } from './composables/useSmpkCalculations';
import { createEmptyForm, useSmpkForm } from './composables/useSmpkForm';
import { useSatusehatAuth } from './composables/useSatusehatAuth';
import { satusehatConfig, satusehatEnvironmentLabel } from './config/satusehat';
import { postFhir, FhirRequestError } from './services/satusehatFhir';
import { registerEncounter } from './services/satusehatEncounter';
import { buildSmpkBundle } from './services/smpkBundle';
import { generateSkkDocx } from './services/skkDocument';
import type { OptionItem, SmpkFormState } from './types/smpk';

const {
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
} = useSmpkForm();

const { derived } = useSmpkCalculations(form);

/* ------------------------------------------------------------------- oauth */

const oauthOpen = ref(false);

const {
  isConnected: oauthConnected,
  accessToken: oauthAccessToken,
  tokenPreview: oauthTokenPreview,
  expiresAtText: oauthExpiryText,
  errorMessage: oauthError,
  status: oauthStatus,
  statusLabel: oauthStatusLabel,
  statusVariant: oauthStatusVariant,
  login: loginOauth,
  logout: logoutOauth
} = useSatusehatAuth();

/* ------------------------------------------------------------------ options */

const idJenisOptions: OptionItem[] = [
  { v: 'nik', l: 'NIK' },
  { v: 'paspor', l: 'Paspor' },
  { v: 'kitas', l: 'KITAS / KITAP' },
  { v: 'lainnya', l: 'Identitas lainnya' }
];

const agamaOptions: OptionItem[] = [
  { v: 'islam', l: 'Islam' },
  { v: 'kristen', l: 'Kristen' },
  { v: 'katolik', l: 'Katolik' },
  { v: 'hindu', l: 'Hindu' },
  { v: 'buddha', l: 'Buddha' },
  { v: 'konghucu', l: 'Konghucu' },
  { v: 'kepercayaan', l: 'Penghayat kepercayaan' },
  { v: 'lainnya', l: 'Lainnya' }
];

const kunjJenisOptions: OptionItem[] = [
  { v: 'igd', l: 'IGD' },
  { v: 'ranap', l: 'Rawat inap' },
  { v: 'rajal', l: 'Rawat jalan' },
  { v: 'rujukan', l: 'Rujukan masuk' }
];

const tempatMatiOptions: OptionItem[] = [
  { v: 'rs', l: 'Rumah sakit' },
  { v: 'rumah', l: 'Rumah tinggal' },
  { v: 'jalan', l: 'Jalan / tempat umum' },
  { v: 'lainnya', l: 'Lainnya' }
];

const yaTidakOptions: OptionItem[] = [
  { v: 'ya', l: 'Ya' },
  { v: 'tidak', l: 'Tidak' }
];

/**
 * Nilai mengacu pada Lampiran 3 playbook SMPK v1.5 (Cara mati).
 * Daftar kode ini juga dipakai `useSmpkCalculations` untuk menentukan kewajiban pemeriksaan luar.
 */
const caraMatiOptions: OptionItem[] = [
  { v: '39104002', l: 'Sakit', d: 'Sebab alamiah' },
  { v: 'LA18034-1', l: 'Kecelakaan', d: 'Pemeriksaan luar wajib' },
  { v: 'LA18036-6', l: 'Bunuh diri', d: 'Pemeriksaan luar wajib' },
  { v: '417928002', l: 'Kekerasan', d: 'Pemeriksaan luar wajib' },
  { v: '219290002', l: 'Keputusan hukum', d: 'Pemeriksaan luar wajib' },
  { v: '15863006', l: 'Perang/konflik', d: 'Pemeriksaan luar wajib' },
  { v: 'LA11137-9', l: 'Tidak dapat ditentukan', d: 'Perlu konfirmasi pemeriksaan luar' },
  { v: 'TK000252', l: 'Investigasi masih berjalan', d: 'Perlu konfirmasi pemeriksaan luar' },
  { v: '87309006', l: 'Tidak diketahui', d: 'Perlu konfirmasi pemeriksaan luar' },
  { v: '74964007', l: 'Lainnya', d: 'Perlu konfirmasi pemeriksaan luar' }
];

/** Dasar diagnosis penyebab kematian (kode resmi playbook SMPK). */
const dasarOptions: OptionItem[] = [
  { v: '129465004', l: 'Rekam medis', d: 'Berdasarkan rekam medis pasien' },
  { v: 'TK000636', l: 'Pemeriksaan luar', d: 'Pemeriksaan jenazah tanpa autopsi' },
  { v: '5785009', l: 'Autopsi forensik', d: 'Autopsi untuk kepentingan penyidikan' },
  { v: 'TK000637', l: 'Autopsi klinis', d: 'Autopsi untuk kepentingan medis' }
];

const autopsyUsedOptions: OptionItem[] = [
  { v: 'ya', l: 'Ya' },
  { v: 'tidak', l: 'Tidak' },
  { v: 'unknown', l: 'Tidak diketahui' }
];

const yesNoUnknownOptions: OptionItem[] = [
  { v: 'ya', l: 'Ya' },
  { v: 'tidak', l: 'Tidak' },
  { v: 'unknown', l: 'Tidak diketahui' }
];

/** Lampiran 4 playbook SMPK — tempat kejadian penyebab eksternal. */
const externalPlaceOptions: OptionItem[] = [
  { v: '264362003', l: 'Rumah' },
  { v: '257703003', l: 'Area olahraga' },
  { v: '272505000', l: 'Area industri' },
  { v: '75414001', l: 'Area konstruksi' },
  { v: '257573002', l: 'Asrama' },
  { v: '74056004', l: 'Panti' },
  { v: '257698009', l: 'Sekolah' },
  { v: '385437003', l: 'Institusi' },
  { v: '276052003', l: 'Tempat pelayanan publik' },
  { v: '272504001', l: 'Area pertanian' },
  { v: '272510001', l: 'Jalan raya' },
  { v: '272509006', l: 'Jalan tol' },
  { v: '284438004', l: 'Area perdagangan/jasa' },
  { v: '74964007', l: 'Tempat lainnya' }
];

/** Kondisi saat meninggal pada kematian perempuan. */
const maternalConditionOptions: OptionItem[] = [
  { v: '77386006', l: 'Sedang hamil' },
  { v: '255410009', l: 'Dalam 42 hari sebelum kematian (nifas)' },
  { v: 'TK000265', l: '43 hari - 1 tahun sebelum kematian' },
  { v: '261665006', l: 'Tidak diketahui' }
];

/** Lampiran 5 playbook SMPK — kondisi ibu mempengaruhi janin/neonatal. */
const maternalImpactOptions: OptionItem[] = [
  { v: 'M1', l: 'M1 - Komplikasi plasenta, tali pusat, selaput ketuban' },
  { v: 'M2', l: 'M2 - Komplikasi kehamilan ibu' },
  { v: 'M3', l: 'M3 - Komplikasi inpartu/persalinan' },
  { v: 'M4', l: 'M4 - Kondisi medis/operasi ibu' },
  { v: 'M5', l: 'M5 - Tidak ada komplikasi kondisi ibu' },
  { v: 'M6', l: 'M6 - Kondisi/penyakit lainnya' }
];

const intervalModeOptions: OptionItem[] = [
  { v: 'angka', l: 'Angka' },
  { v: 'teks', l: 'Uraian' },
  { v: 'tt', l: 'Tidak tahu' }
];

const intervalUnitOptions: OptionItem[] = [
  { v: 'min', l: 'Menit' },
  { v: 'h', l: 'Jam' },
  { v: 'd', l: 'Hari' },
  { v: 'wk', l: 'Minggu' },
  { v: 'mo', l: 'Bulan' },
  { v: 'a', l: 'Tahun' }
];

const usiaUnitOptions: OptionItem[] = [
  { v: 'a', l: 'Tahun' },
  { v: 'mo', l: 'Bulan' },
  { v: 'wk', l: 'Minggu' },
  { v: 'd', l: 'Hari' }
];

const unitLabels: Record<string, string> = {
  min: 'menit',
  h: 'jam',
  d: 'hari',
  wk: 'minggu',
  mo: 'bulan',
  a: 'tahun'
};

/* --------------------------------------------------------------- cause rows */

const causeRows = [
  {
    key: 'pa',
    icdKey: 'pa_icd',
    ivKey: 'iva',
    letter: 'a',
    label: 'Penyebab langsung (langsung mengakibatkan kematian)',
    placeholder: 'mis. Cedera kepala berat'
  },
  {
    key: 'pb',
    icdKey: 'pb_icd',
    ivKey: 'ivb',
    letter: 'b',
    label: 'Akibat dari (a)',
    placeholder: 'mis. Perdarahan intrakranial'
  },
  {
    key: 'pc',
    icdKey: 'pc_icd',
    ivKey: 'ivc',
    letter: 'c',
    label: 'Akibat dari (b)',
    placeholder: 'mis. Kecelakaan lalu lintas'
  },
  {
    key: 'pd',
    icdKey: 'pd_icd',
    ivKey: 'ivd',
    letter: 'd',
    label: 'Penyebab dasar',
    placeholder: 'Kondisi yang memulai rangkaian peristiwa'
  },
  {
    key: 'kl',
    icdKey: 'kl_icd',
    ivKey: 'ivk',
    letter: 'II',
    label: 'Kondisi lain yang berkontribusi (tidak langsung)',
    placeholder: 'mis. Diabetes melitus'
  }
];

/* --------------------------------------------------------------- validation */

const errors = reactive<Record<string, string>>({});
const submitAttempted = ref(false);
const sending = ref(false);
const sendError = ref('');
const sendStatus = ref<number | null>(null);
const printing = ref(false);
const savingLog = ref(false);
const logInfo = ref('');
const lastRequest = ref<unknown>(null);
const lastResponse = ref<unknown>(null);
const registering = ref(false);
const registerError = ref('');
const registerInfo = ref('');

const errorCount = computed(() => Object.keys(errors).length);

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key]);
}

function validate(): boolean {
  clearErrors();
  if (!form.value.no_rm?.trim()) errors.no_rm = 'Nomor rekam medis wajib diisi.';
  if (!form.value.nama?.trim()) errors.nama = 'Nama pasien wajib diisi.';
  if (!form.value.tgl_lahir_tt && !form.value.tgl_lahir) {
    errors.tgl_lahir = 'Isi tanggal lahir atau centang “tidak diketahui”.';
  }
  if (!form.value.waktu_mati) errors.waktu_mati = 'Waktu meninggal wajib diisi.';
  if (!form.value.tempat_mati) errors.tempat_mati = 'Tempat meninggal wajib dipilih.';
  if (!form.value.cara_mati) errors.cara_mati = 'Cara kematian wajib dipilih.';
  if (derived.value.eks === 'tanya' && !form.value.eks_ada) {
    errors.eks_ada = 'Pilih apakah pemeriksaan luar sudah dilakukan.';
  }
  if (!form.value.pa?.trim()) errors.pa = 'Penyebab langsung pada baris (a) wajib diisi.';
  if (!form.value.ihs?.trim()) errors.ihs = 'Nomor IHS pasien wajib diisi untuk pengiriman ke SATUSEHAT.';
  if (!form.value.dokter_nama?.trim()) errors.dokter_nama = 'Nama dokter wajib diisi.';
  if (!form.value.dokter_sip?.trim()) errors.dokter_sip = 'Nomor SIP wajib diisi.';
  if (!form.value.dokter_ihs?.trim()) errors.dokter_ihs = 'Nomor IHS dokter wajib diisi untuk pengiriman ke SATUSEHAT.';
  if (!form.value.pernyataan) errors.pernyataan = 'Pernyataan kebenaran data harus dicentang.';
  return Object.keys(errors).length === 0;
}

async function onSubmit() {
  submitAttempted.value = true;
  sendError.value = '';
  sendStatus.value = null;

  if (!validate()) {
    const firstKey = Object.keys(errors)[0];
    requestAnimationFrame(() => {
      document.querySelector(`[data-field="${firstKey}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return;
  }

  if (sending.value) return;

  if (!form.value.kunj_id?.trim()) {
    sendError.value = 'Encounter ID SATUSEHAT belum tersedia. Klik “Registrasi Encounter” pada bagian Skenario demo.';
    return;
  }

  sending.value = true;

  try {
    if (!satusehatConfig.organizationId) {
      sendError.value = 'Organization ID belum diatur di .env.local (VITE_SATUSEHAT_ORG_ID).';
      return;
    }

    if (!oauthConnected.value) {
      await loginOauth();
      if (!oauthConnected.value) {
        sendError.value = oauthError.value || 'Access token SATUSEHAT tidak tersedia.';
        return;
      }
    }

    const requestPayload = JSON.parse(JSON.stringify(fhirBundle.value)) as unknown;
    lastRequest.value = requestPayload;
    lastResponse.value = null;

    const result = await postFhir('', requestPayload, oauthAccessToken.value);
    lastResponse.value = result.payload ?? { status: result.status };
    sendStatus.value = result.status;
    submitForm();
  } catch (error) {
    lastResponse.value =
      error instanceof FhirRequestError
        ? { status: error.status, body: error.payload }
        : { error: error instanceof Error ? error.message : 'unknown' };
    sendError.value = error instanceof Error ? error.message : 'Gagal mengirim payload ke SATUSEHAT.';
  } finally {
    sending.value = false;
  }
}

/* -------------------------------------------------------------- form helpers */

async function onPrintSkk() {
  if (printing.value) return;
  sendError.value = '';

  if (!form.value.nama?.trim() && !form.value.no_rm?.trim()) {
    sendError.value = 'Isi identitas pasien sebelum mencetak SKK.';
    return;
  }

  printing.value = true;
  try {
    const blob = await generateSkkDocx(form.value, derived.value);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SKK-${form.value.no_rm?.trim() || 'draft'}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (error) {
    sendError.value = error instanceof Error ? error.message : 'Gagal membuat dokumen SKK.';
  } finally {
    printing.value = false;
  }
}

async function onRegisterEncounter() {
  registerError.value = '';
  registerInfo.value = '';

  const icd = form.value.pd_icd?.trim() || form.value.pc_icd?.trim() || form.value.pa_icd?.trim();

  if (!form.value.ihs?.trim()) {
    registerError.value = 'Nomor IHS pasien wajib diisi untuk registrasi Encounter.';
    return;
  }
  if (!form.value.dokter_ihs?.trim()) {
    registerError.value = 'Nomor IHS dokter wajib diisi untuk registrasi Encounter.';
    return;
  }
  if (!form.value.kunj_masuk) {
    registerError.value = 'Waktu masuk kunjungan wajib diisi.';
    return;
  }
  if (!form.value.waktu_mati) {
    registerError.value = 'Waktu meninggal wajib diisi.';
    return;
  }
  if (!form.value.kunj_lokasi?.trim()) {
    registerError.value = 'Location ID SATUSEHAT wajib diisi untuk registrasi Encounter.';
    return;
  }
  if (!satusehatConfig.organizationId) {
    registerError.value = 'Organization ID belum diatur di .env.local (VITE_SATUSEHAT_ORG_ID).';
    return;
  }
  if (!icd) {
    registerError.value = 'Isi kode ICD-10 pada penyebab langsung (a) atau penyebab dasar (d) untuk registrasi Encounter.';
    return;
  }
  if (registering.value) return;

  registering.value = true;
  try {
    if (!oauthConnected.value) {
      await loginOauth();
      if (!oauthConnected.value) {
        registerError.value = oauthError.value || 'Access token SATUSEHAT tidak tersedia.';
        return;
      }
    }

    const result = await registerEncounter(
      form.value,
      oauthAccessToken.value,
      satusehatConfig.organizationId,
      icd
    );
    form.value.kunj_id = result.encounterId;
    touched.add('kunj_id');
    const prefix = result.reused ? 'Encounter sudah terdaftar' : 'Encounter terdaftar';
    registerInfo.value = `${prefix}: ${result.encounterId}${result.conditionId ? ` · Condition: ${result.conditionId}` : ''}`;
  } catch (error) {
    registerError.value = error instanceof Error ? error.message : 'Registrasi Encounter gagal.';
  } finally {
    registering.value = false;
  }
}

async function onSaveLog() {
  if (savingLog.value) return;
  sendError.value = '';
  logInfo.value = '';

  if (!lastRequest.value) {
    sendError.value = 'Kirim payload ke SATUSEHAT terlebih dahulu sebelum menyimpan log.';
    return;
  }

  savingLog.value = true;
  try {
    const response = await fetch('/api/satusehat/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        label: form.value.no_rm?.trim() || form.value.reg_id?.trim() || '',
        request: lastRequest.value,
        response: lastResponse.value
      })
    });
    const payload = (await response.json().catch(() => ({}))) as { file?: string; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || `Gagal menyimpan log (HTTP ${response.status}).`);
    }
    logInfo.value = `Log tersimpan: ${payload.file ?? 'logs'}`;
  } catch (error) {
    sendError.value = error instanceof Error ? error.message : 'Gagal menyimpan log.';
  } finally {
    savingLog.value = false;
  }
}

function onFormInput(event: Event) {
  const target = event.target as HTMLElement | null;
  const holder = target?.closest('[data-field]');
  const key = holder?.getAttribute('data-field');
  if (!key) return;
  touched.add(key);
  if (simKeys.has(key)) corrections.add(key);
  if (errors[key]) delete errors[key];
}

function setJk(value: string) {
  form.value.jk = value as SmpkFormState['jk'];
}

function setEksAda(value: string) {
  form.value.eks_ada = value === 'ya' ? 'ya' : 'tidak';
}

function onTempatLahirTT(value: boolean) {
  form.value.tempat_lahir_tt = value;
  if (value) form.value.tempat_lahir = '';
}

function onTglLahirTT(value: boolean) {
  form.value.tgl_lahir_tt = value;
  if (value) {
    form.value.tgl_lahir = '';
    if (!form.value.usia_unit) form.value.usia_unit = 'a';
  }
}

function toggleDasar(code: string, checked: boolean) {
  const selected = new Set(form.value.dasar ?? []);
  if (checked) selected.add(code);
  else selected.delete(code);
  form.value.dasar = Array.from(selected);
  touched.add('dasar');
  if (simKeys.has('dasar')) corrections.add('dasar');
}

/* --------------------------------------------------------------- derivation */

const usiaDisplay = computed(() =>
  derived.value.usia ? `${derived.value.usia.n} ${unitLabels[derived.value.usia.u] ?? derived.value.usia.u}` : '—'
);

const eksLabel = computed(() => {
  switch (derived.value.eks) {
    case 'wajib':
      return 'Wajib';
    case 'tanya':
      return 'Perlu konfirmasi';
    case 'tidak':
      return 'Tidak wajib';
    default:
      return 'Belum ditentukan';
  }
});

const eksVariant = computed(() => {
  switch (derived.value.eks) {
    case 'wajib':
      return 'warning';
    case 'tanya':
      return 'info';
    case 'tidak':
      return 'success';
    default:
      return 'neutral';
  }
});

const caraMatiLabel = computed(() => labelOf(caraMatiOptions, form.value.cara_mati));

const showExternal = computed(() => !!form.value.cara_mati && form.value.cara_mati !== '39104002');
const showJanin = computed(() => derived.value.bayi === true);
const showMaternal = computed(() => derived.value.perempuan === true);

const caraMatiHelper = computed(() => {
  if (!form.value.cara_mati) return 'Pilih cara kematian untuk melihat kewajiban pemeriksaan luar.';
  const code = form.value.cara_mati === '39104002' ? 'sebab alamiah' : form.value.cara_mati;
  return `Kode: ${code} · ${eksLabel.value === 'Wajib' ? 'pemeriksaan luar wajib dilakukan' : eksLabel.value === 'Perlu konfirmasi' ? 'perlu konfirmasi pemeriksaan luar' : 'tidak wajib pemeriksaan luar'}.`;
});

const sentTimeText = computed(() =>
  sentTime.value ? sentTime.value.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : ''
);

/* ------------------------------------------------------------------ scenario */

interface Scenario {
  key: string;
  label: string;
  hint: string;
  data: Partial<SmpkFormState>;
}

const scenarios: Scenario[] = [
  {
    key: 'sakit',
    label: 'Kematian akibat sakit',
    hint: 'Laki-laki 58 tahun, infark miokard akut',
    data: {
      no_rm: 'RM-110452',
      id_jenis: 'nik',
      id_nilai: '3273011702680001',
      ihs: '100000030009',
      nama: 'AHMAD SUPARMAN',
      jk: 'male',
      tempat_lahir: 'Garut',
      tgl_lahir: '1968-02-17',
      agama: 'islam',
      domisili: 'Jl. Pasir Kaliki No. 21, Bandung',
      kunj_jenis: 'igd',
      kunj_ruang: 'IGD - Kardiovaskular',
      kunj_lokasi: '900f0f75-d5ae-411e-9c4e-e65edfae7247',
      pd_icd: 'I25.1',
      kunj_dpjp: 'dr. Ratna Puspita, Sp.JP',
      doa: 'tidak',
      petugas_jenazah: 'Dedi Kurniawan, A.Md.Kep',
      tempat_mati: 'rs',
      alamat_mati: 'RSUD Kota Bandung, Jl. Soreang No. 1',
      kab_mati: 'Kota Bandung',
      cara_mati: '39104002',
      pa: 'Syok kardiogenik',
      iva: { mode: 'angka', val: '2', unit: 'h' },
      pb: 'Infark miokard akut',
      ivb: { mode: 'angka', val: '7', unit: 'h' },
      pc: 'Penyakit jantung koroner',
      ivc: { mode: 'teks', teks: 'sejak beberapa tahun terakhir' },
      operasi: 'tidak',
      dasar: ['129465004'],
      dokter_nama: 'dr. Ratna Puspita, Sp.JP',
      dokter_sip: 'SIP/221/2019/RS',
      dokter_ihs: 'N10000001',
      pernyataan: true
    }
  },
  {
    key: 'infeksi',
    label: 'Kematian akibat infeksi',
    hint: 'Perempuan 52 tahun, syok septik akibat pneumonia',
    data: {
      no_rm: 'RM-221907',
      id_jenis: 'nik',
      id_nilai: '3273025804740002',
      ihs: '100000030010',
      nama: 'ENDANG SULASTRI',
      jk: 'female',
      tempat_lahir: 'Sumedang',
      tgl_lahir: '1974-04-18',
      agama: 'islam',
      domisili: 'Jl. Antapani Lama No. 9, Bandung',
      kunj_jenis: 'ranap',
      kunj_ruang: 'Ruang Interna Melati',
      kunj_lokasi: 'eb59fb23-bfa7-4029-b6b4-02b48fe7760b',
      pd_icd: 'J18.9',
      kunj_dpjp: 'dr. Bagus Setiawan, Sp.PD',
      doa: 'tidak',
      petugas_jenazah: 'Agus Firmansyah, A.Md.Kep',
      tempat_mati: 'rs',
      alamat_mati: 'RS Umum Kota Bandung, Jl. Pasir Kaliki No. 1',
      kab_mati: 'Kota Bandung',
      cara_mati: '39104002',
      pa: 'Syok septik',
      iva: { mode: 'angka', val: '6', unit: 'h' },
      pb: 'Sepsis',
      ivb: { mode: 'angka', val: '2', unit: 'd' },
      pc: 'Pneumonia komunitas',
      ivc: { mode: 'angka', val: '6', unit: 'd' },
      operasi: 'tidak',
      hamil_riwayat: 'tidak',
      dasar: ['129465004'],
      dokter_nama: 'dr. Bagus Setiawan, Sp.PD',
      dokter_sip: 'SIP/188/2018/RS',
      dokter_ihs: 'N10000002',
      pernyataan: true
    }
  },
  {
    key: 'eksternal',
    label: 'Kematian akibat kecelakaan',
    hint: 'Perempuan 36 tahun, kecelakaan lalu lintas',
    data: {
      no_rm: 'RM-102938',
      id_jenis: 'nik',
      id_nilai: '9104224509000003',
      ihs: 'P00805884304',
      nama: 'Elizabeth Dior',
      jk: 'female',
      tempat_lahir: 'Bandung',
      tgl_lahir: '1976-07-07',
      agama: 'islam',
      domisili: 'Jl. Cihampelas No. 88, Bandung',
      kunj_jenis: 'igd',
      kunj_ruang: 'IGD - Bedah',
      kunj_lokasi: '900f0f75-d5ae-411e-9c4e-e65edfae7247',
      pd_icd: 'S06.5',
      kunj_dpjp: 'dr. Andi Pratama, Sp.B',
      doa: 'tidak',
      petugas_jenazah: 'Rina Setiawati, A.Md.Kep',
      tempat_mati: 'rs',
      alamat_mati: 'RSUD Kota Bandung, Jl. Soreang No. 1',
      kab_mati: 'Kota Bandung',
      cara_mati: 'LA18034-1',
      eksternal_deskripsi: 'Tabrakan sepeda motor dengan bus',
      eksternal_tempat: '272510001',
      eksternal_note: 'Jalan Raya Soreang KM 12',
      pa: 'Cedera kepala berat',
      iva: { mode: 'angka', val: '3', unit: 'h' },
      pb: 'Perdarahan intrakranial',
      ivb: { mode: 'angka', val: '9', unit: 'h' },
      pc: 'Kecelakaan lalu lintas',
      ivc: { mode: 'teks', teks: '26 Oktober 2026, sekitar pukul 20.00 WIB' },
      operasi: 'tidak',
      hamil_riwayat: 'tidak',
      dasar: ['129465004', 'TK000636'],
      dokter_nama: 'dr. Nicholas Evan, Sp.B.',
      dokter_sip: 'SIP/447/2021/RS',
      dokter_ihs: '10010910332',
      pernyataan: true
    }
  },
  {
    key: 'hamil',
    label: 'Kematian perempuan hamil',
    hint: 'Perempuan 29 tahun hamil 34 minggu, perdarahan pascasalin',
    data: {
      no_rm: 'RM-330871',
      id_jenis: 'nik',
      id_nilai: '3273015201970003',
      ihs: '100000030012',
      nama: 'ANISA PUTRI',
      jk: 'female',
      tempat_lahir: 'Bandung',
      tgl_lahir: '1997-01-12',
      agama: 'islam',
      domisili: 'Jl. Cibiru Hilir No. 77, Bandung',
      kunj_jenis: 'igd',
      kunj_ruang: 'IGD - Obstetri',
      kunj_lokasi: '900f0f75-d5ae-411e-9c4e-e65edfae7247',
      pd_icd: 'O45.9',
      kunj_dpjp: 'dr. Sinta Maharani, Sp.OG',
      doa: 'tidak',
      petugas_jenazah: 'Rina Setiawati, A.Md.Kep',
      tempat_mati: 'rs',
      alamat_mati: 'RSUD Kota Bandung, Jl. Soreang No. 1',
      kab_mati: 'Kota Bandung',
      cara_mati: '39104002',
      pa: 'Syok hemoragik',
      iva: { mode: 'angka', val: '2', unit: 'h' },
      pb: 'Perdarahan pascasalin',
      ivb: { mode: 'angka', val: '3', unit: 'h' },
      pc: 'Solusio plasenta',
      ivc: { mode: 'angka', val: '5', unit: 'h' },
      operasi: 'ya',
      operasi_tgl: '2026-10-25',
      operasi_alasan: 'Seksio sesarea emergensi atas indikasi solusio plasenta',
      hamil_riwayat: 'ya',
      hamil_kondisi: '77386006',
      hamil_kontribusi: 'ya',
      dasar: ['129465004'],
      dokter_nama: 'dr. Sinta Maharani, Sp.OG',
      dokter_sip: 'SIP/355/2021/RS',
      dokter_ihs: 'N10000004',
      pernyataan: true
    }
  },
  {
    key: 'bayi',
    label: 'Kematian janin/bayi',
    hint: 'Bayi 12 hari, sepsis neonatal',
    data: {
      no_rm: 'RM-340215',
      id_jenis: 'nik',
      id_nilai: '3273016510260004',
      ihs: '100000030013',
      nama: 'BAYI NY. LESTARI',
      jk: 'female',
      tempat_lahir: 'Bandung',
      tgl_lahir: '2026-10-14',
      agama: 'islam',
      domisili: 'Jl. Kopo Sayati No. 45, Bandung',
      kunj_jenis: 'ranap',
      kunj_ruang: 'NICU',
      kunj_lokasi: 'eb59fb23-bfa7-4029-b6b4-02b48fe7760b',
      pd_icd: 'P07.2',
      kunj_dpjp: 'dr. Hendra Wijaya, Sp.A(K)',
      doa: 'ya',
      petugas_jenazah: 'Rina Setiawati, A.Md.Kep',
      tempat_mati: 'rs',
      alamat_mati: 'RSUD Kota Bandung, Jl. Soreang No. 1',
      kab_mati: 'Kota Bandung',
      cara_mati: '39104002',
      pa: 'Gagal napas',
      iva: { mode: 'angka', val: '1', unit: 'h' },
      pb: 'Sepsis neonatal',
      ivb: { mode: 'angka', val: '2', unit: 'd' },
      pc: 'Berat lahir sangat rendah',
      ivc: { mode: 'teks', teks: 'sejak lahir' },
      operasi: 'tidak',
      janin_kembar: 'tidak',
      janin_lahir_mati: 'tidak',
      janin_waktu_lahir: '04:10',
      janin_berat: '1450',
      janin_usia_kehamilan: '32',
      ibu_ihs: '100000030020',
      ibu_umur: '31',
      ibu_kondisi: 'M2',
      dasar: ['129465004'],
      dokter_nama: 'dr. Hendra Wijaya, Sp.A(K)',
      dokter_sip: 'SIP/309/2020/RS',
      dokter_ihs: 'N10000005',
      pernyataan: true
    }
  },
  {
    key: 'perjalanan',
    label: 'Kematian dalam perjalanan',
    hint: 'Laki-laki 67 tahun, henti jantung saat perjalanan menuju RS',
    data: {
      no_rm: 'RM-119003',
      id_jenis: 'nik',
      id_nilai: '3273010507590005',
      ihs: '100000030014',
      nama: 'HENDRA GUNAWAN',
      jk: 'male',
      tempat_lahir: 'Tasikmalaya',
      tgl_lahir: '1959-07-05',
      agama: 'islam',
      domisili: 'Jl. Soekarno-Hatta No. 310, Bandung',
      kunj_jenis: 'igd',
      kunj_ruang: 'IGD - Resusitasi',
      kunj_lokasi: '900f0f75-d5ae-411e-9c4e-e65edfae7247',
      pd_icd: 'I25.1',
      kunj_dpjp: 'dr. Fajar Nugraha, Sp.EM',
      doa: 'ya',
      petugas_jenazah: 'Dedi Kurniawan, A.Md.Kep',
      tempat_mati: 'jalan',
      alamat_mati: 'Jalan Raya Soekarno-Hatta KM 12, Bandung',
      kab_mati: 'Kota Bandung',
      cara_mati: '39104002',
      pa: 'Henti jantung',
      iva: { mode: 'angka', val: '30', unit: 'min' },
      pb: 'Sindrom koroner akut',
      ivb: { mode: 'angka', val: '2', unit: 'h' },
      pc: 'Penyakit jantung koroner',
      ivc: { mode: 'teks', teks: 'sejak beberapa tahun terakhir' },
      operasi: 'tidak',
      dasar: ['129465004', 'TK000636'],
      dokter_nama: 'dr. Fajar Nugraha, Sp.EM',
      dokter_sip: 'SIP/402/2022/RS',
      dokter_ihs: 'N10000006',
      pernyataan: true
    }
  }
];

function applySkenario(key: string) {
  const scenario = scenarios.find((item) => item.key === key);
  if (!scenario) return;
  activeSkenario.value = key;
  resetForm();
  form.value = { ...createEmptyForm(), ...structuredClone(scenario.data) };
  simKeys.clear();
  Object.keys(scenario.data).forEach((field) => simKeys.add(field));
  submitAttempted.value = false;
  showFhir.value = false;
  sendError.value = '';
  sendStatus.value = null;
  registerError.value = '';
  registerInfo.value = '';
  logInfo.value = '';
  lastRequest.value = null;
  lastResponse.value = null;
  clearErrors();
}

function onReset() {
  resetForm();
  activeSkenario.value = '';
  submitAttempted.value = false;
  showFhir.value = false;
  sendError.value = '';
  sendStatus.value = null;
  registerError.value = '';
  registerInfo.value = '';
  logInfo.value = '';
  lastRequest.value = null;
  lastResponse.value = null;
  clearErrors();
}

/* --------------------------------------------------------------- provenance */

const provenanceGroups: { group: string; items: [string, string][] }[] = [
  {
    group: 'Identitas',
    items: [
      ['no_rm', 'Nomor rekam medis'],
      ['nama', 'Nama pasien'],
      ['jk', 'Jenis kelamin'],
      ['tgl_lahir', 'Tanggal lahir'],
      ['agama', 'Agama'],
      ['domisili', 'Domisili']
    ]
  },
  {
    group: 'Kunjungan',
    items: [
      ['kunj_jenis', 'Jenis kunjungan'],
      ['kunj_masuk', 'Waktu masuk'],
      ['kunj_ruang', 'Ruang perawatan'],
      ['kunj_dpjp', 'DPJP']
    ]
  },
  {
    group: 'Kematian',
    items: [
      ['waktu_mati', 'Waktu meninggal'],
      ['tempat_mati', 'Tempat meninggal'],
      ['kab_mati', 'Kabupaten / kota'],
      ['cara_mati', 'Cara kematian'],
      ['usia', 'Usia saat meninggal']
    ]
  },
  {
    group: 'Penyebab eksternal',
    items: [
      ['eksternal_tanggal', 'Tanggal kejadian'],
      ['eksternal_deskripsi', 'Deskripsi / jenis racun'],
      ['eksternal_tempat', 'Tempat kejadian']
    ]
  },
  {
    group: 'Janin / bayi',
    items: [
      ['janin_kembar', 'Kehamilan kembar'],
      ['janin_lahir_mati', 'Lahir mati'],
      ['janin_bertahan_jam', 'Lama bertahan hidup'],
      ['janin_waktu_lahir', 'Waktu kelahiran'],
      ['janin_berat', 'Berat lahir'],
      ['janin_usia_kehamilan', 'Usia kehamilan'],
      ['ibu_umur', 'Usia ibu'],
      ['ibu_kondisi', 'Kondisi ibu']
    ]
  },
  {
    group: 'Kematian perempuan',
    items: [
      ['hamil_riwayat', 'Riwayat hamil 1 tahun terakhir'],
      ['hamil_kondisi', 'Kondisi saat meninggal'],
      ['hamil_kontribusi', 'Kehamilan berkontribusi']
    ]
  },
  {
    group: 'Penyebab',
    items: [
      ['pa', 'Penyebab langsung'],
      ['pb', 'Akibat dari (a)'],
      ['pc', 'Akibat dari (b)'],
      ['pd', 'Penyebab dasar'],
      ['kl', 'Kondisi lain']
    ]
  },
  {
    group: 'Dasar & autopsi',
    items: [
      ['dasar', 'Dasar diagnosis'],
      ['autopsi_hasil', 'Hasil autopsi']
    ]
  },
  {
    group: 'Dokter',
    items: [
      ['dokter_nama', 'Nama dokter'],
      ['dokter_sip', 'Nomor SIP'],
      ['dokter_ihs', 'Nomor IHS dokter']
    ]
  }
];

const dokterKeys = new Set([
  'cara_mati',
  'pa',
  'pb',
  'pc',
  'pd',
  'kl',
  'operasi',
  'operasi_tgl',
  'operasi_alasan',
  'autopsi_hasil',
  'dokter_nama',
  'dokter_sip',
  'dokter_ihs'
]);

const koderKeys = new Set(['dasar']);

type SourceBadge = { label: string; variant: string };

function sourceOf(key: string): SourceBadge {
  if (key === 'usia') return { label: 'Hitungan', variant: 'primary' };
  if (simKeys.has(key) && corrections.has(key)) return { label: 'Koreksi manual', variant: 'warning' };
  if (simKeys.has(key)) return { label: 'SIMRS', variant: 'info' };
  if (touched.has(key)) return { label: 'Input manual', variant: 'neutral' };
  if (dokterKeys.has(key)) return { label: 'Dokter', variant: 'success' };
  if (koderKeys.has(key)) return { label: 'Koder', variant: 'accent' };
  return { label: 'Input manual', variant: 'neutral' };
}

function labelOf(options: OptionItem[], value?: string): string {
  if (!value) return '';
  return options.find((option) => option.v === value)?.l ?? value;
}

function displayValue(key: string): string {
  if (key === 'usia') return usiaDisplay.value === '—' ? '' : usiaDisplay.value;
  if (key === 'jk') {
    return labelOf(
      [
        { v: 'male', l: 'Laki-laki' },
        { v: 'female', l: 'Perempuan' },
        { v: 'unknown', l: 'Tidak diketahui' }
      ],
      form.value.jk
    );
  }
  if (key === 'cara_mati') return caraMatiLabel.value;
  if (key === 'eksternal_tempat') return labelOf(externalPlaceOptions, form.value.eksternal_tempat);
  if (key === 'ibu_kondisi') return labelOf(maternalImpactOptions, form.value.ibu_kondisi);
  if (key === 'hamil_kondisi') return labelOf(maternalConditionOptions, form.value.hamil_kondisi);
  if (key === 'janin_kembar' || key === 'janin_lahir_mati' || key === 'hamil_riwayat' || key === 'hamil_kontribusi') {
    return labelOf(yesNoUnknownOptions, form.value[key] as string);
  }
  if (key === 'janin_bertahan_jam' && form.value.janin_bertahan_jam) return `${form.value.janin_bertahan_jam} jam`;
  if (key === 'janin_berat' && form.value.janin_berat) return `${form.value.janin_berat} gram`;
  if (key === 'janin_usia_kehamilan' && form.value.janin_usia_kehamilan) return `${form.value.janin_usia_kehamilan} minggu`;
  if (key === 'ibu_umur' && form.value.ibu_umur) return `${form.value.ibu_umur} tahun`;
  if (key === 'agama') return labelOf(agamaOptions, form.value.agama);
  if (key === 'kunj_jenis') return labelOf(kunjJenisOptions, form.value.kunj_jenis);
  if (key === 'tempat_mati') return labelOf(tempatMatiOptions, form.value.tempat_mati);
  if (key === 'dasar') {
    const selected = form.value.dasar ?? [];
    return selected.map((code) => labelOf(dasarOptions, code)).filter(Boolean).join(', ');
  }
  const raw = form.value[key];
  return raw === undefined || raw === null ? '' : String(raw);
}

const provenanceRows = computed(() =>
  provenanceGroups.flatMap((group) =>
    group.items.map(([key, label]) => ({
      group: group.group,
      label,
      value: displayValue(key),
      source: sourceOf(key)
    }))
  )
);

const totalTracked = computed(() => provenanceRows.value.length);
const filledTracked = computed(() => provenanceRows.value.filter((row) => row.value !== '').length);

/* -------------------------------------------------------------- FHIR preview */

const fhirBundle = computed(() =>
  buildSmpkBundle(form.value, derived.value, { organizationId: satusehatConfig.organizationId })
);

const fhirPreview = computed(() => JSON.stringify(fhirBundle.value, null, 2));

const payloadCopied = ref(false);
let copyTimer: number | undefined;

async function copyPayload() {
  const text = fhirPreview.value;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    payloadCopied.value = true;
    window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => {
      payloadCopied.value = false;
    }, 2000);
  } catch {
    payloadCopied.value = false;
  }
}

onMounted(() => {
  applySkenario('sakit');
});
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  padding-bottom: 40px;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--ttdk-surface-card);
  border-bottom: 1px solid var(--ttdk-stroke-default);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 12px;
  background: var(--ttdk-surface-action);
  color: #fff;
  font-size: 18px;
  font-weight: 800;
}

.brand-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--ttdk-content-heading);
  line-height: 1.3;
}

.brand-sep {
  color: var(--ttdk-content-placeholder);
  font-weight: 500;
}

.brand-sub {
  font-size: 12px;
  color: var(--ttdk-content-secondary-body);
  line-height: 1.4;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.oauth-btn {
  gap: 8px;
}

.oauth-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ttdk-stroke-default);
  flex-shrink: 0;
}

.oauth-dot[data-status='connected'] {
  background: var(--ttdk-surface-success);
}

.oauth-dot[data-status='connecting'] {
  background: var(--ttdk-surface-warning);
  animation: oauth-pulse 1s ease-in-out infinite;
}

.oauth-dot[data-status='error'] {
  background: var(--ttdk-surface-destructive);
}

@keyframes oauth-pulse {
  50% {
    opacity: 0.35;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(20, 19, 19, 0.45);
}

.modal-card {
  width: 100%;
  max-width: 480px;
  background: var(--ttdk-surface-card);
  border: 1px solid var(--ttdk-stroke-default);
  border-radius: var(--ttdk-radius-lg, 16px);
  box-shadow: var(--ttdk-shadow-lg, 0 16px 40px rgba(20, 19, 19, 0.18));
  overflow: hidden;
}

.modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 0;
}

.modal-title {
  font-size: 17px;
  font-weight: 700;
}

.modal-desc {
  margin-top: 4px;
  font-size: 13px;
  color: var(--ttdk-content-secondary-body);
  line-height: 1.5;
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--ttdk-radius-sm, 8px);
  background: transparent;
  color: var(--ttdk-content-secondary-body);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.modal-close:hover {
  background: var(--ttdk-surface-secondary);
  color: var(--ttdk-content-heading);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
}

.oauth-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--ttdk-stroke-divider-secondary, #e4e5e7);
}

.oauth-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.oauth-key {
  font-size: 13px;
  color: var(--ttdk-content-secondary-body);
  white-space: nowrap;
}

.oauth-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--ttdk-content-heading);
  font-family: var(--ttdk-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  text-align: right;
  word-break: break-word;
}

.oauth-row--stack {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.oauth-row--stack .oauth-value {
  text-align: left;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.oauth-error {
  padding: 10px 12px;
  border-radius: var(--ttdk-radius-sm, 8px);
  background: var(--ttdk-surface-destructive-light, #fdecec);
  color: var(--ttdk-content-error, #b42318);
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  background: var(--ttdk-surface-secondary);
  border-top: 1px solid var(--ttdk-stroke-default);
}

.app-main {
  padding-top: 24px;
}

.page-head {
  margin-bottom: 20px;
}

.page-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.page-desc {
  margin-top: 6px;
  max-width: 760px;
  font-size: 14px;
  color: var(--ttdk-content-secondary-body);
  line-height: 1.55;
}

.scenario-bar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  background: var(--ttdk-surface-card);
  border: 1px solid var(--ttdk-stroke-default);
  border-radius: var(--ttdk-radius-md, 12px);
}

.scenario-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.scenario-copy {
  min-width: 0;
}

.scenario-reset {
  flex-shrink: 0;
}

.scenario-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--ttdk-content-heading);
}

.scenario-desc {
  font-size: 12px;
  color: var(--ttdk-content-secondary-body);
  line-height: 1.5;
  margin-top: 2px;
}

.scenario-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.register-btn {
  margin-left: 8px;
}

.reg-id-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reg-id-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ttdk-content-secondary-body);
  white-space: nowrap;
}

.reg-id-input {
  width: 170px;
}

.register-feedback {
  margin: -8px 0 16px;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}

.register-feedback--error {
  color: var(--ttdk-content-error, #b42318);
}

.register-feedback--ok {
  color: var(--ttdk-content-success, #067647);
}

.derived-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.derived-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: var(--ttdk-surface-card);
  border: 1px solid var(--ttdk-stroke-default);
  border-radius: var(--ttdk-radius-md, 12px);
}

.derived-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--ttdk-content-secondary-body);
}

.derived-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--ttdk-content-heading);
}

.notify {
  margin-bottom: 16px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 20px;
}

.grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.span-2 {
  grid-column: span 2;
}

.span-3 {
  grid-column: 1 / -1;
}

.inline-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px 20px;
}

.radio-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  min-height: 48px;
  align-items: center;
}

.field-toggle {
  margin-top: 8px;
}

.encounter-id-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  padding: 10px 12px;
  border-radius: var(--ttdk-radius-sm, 8px);
  background: var(--ttdk-surface-secondary);
}

.encounter-id-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--ttdk-content-secondary-body);
}

.encounter-id-value {
  font-family: var(--ttdk-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
  font-size: 12px;
  font-weight: 600;
  color: var(--ttdk-content-heading);
  word-break: break-all;
}

.encounter-id-value[data-empty='true'] {
  font-family: var(--ttdk-font-sans);
  font-weight: 500;
  color: var(--ttdk-content-placeholder);
}

.check-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 24px;
}

.cause-list {
  display: flex;
  flex-direction: column;
}

.cause-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 3fr) minmax(0, 2fr);
  gap: 12px;
  align-items: start;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px dashed var(--ttdk-stroke-divider, #cacccf);
}

.cause-row:last-child {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: none;
}

.cause-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  min-width: 26px;
  margin-top: 26px;
  border-radius: 9999px;
  background: var(--ttdk-surface-action-light);
  color: var(--ttdk-content-action);
  font-size: 12px;
  font-weight: 700;
}

.interval-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.interval-mode {
  flex: 0 0 104px;
}

.interval-value {
  flex: 0 0 84px;
}

.interval-unit {
  flex: 0 0 104px;
}

.interval-text {
  flex: 1 1 160px;
}

.interval-unknown {
  display: inline-flex;
  align-items: center;
  height: 48px;
  padding: 0 12px;
  border-radius: var(--ttdk-radius-input-lg, 12px);
  background: var(--ttdk-surface-secondary);
  color: var(--ttdk-content-secondary-body);
  font-size: 13px;
}

.icd-input {
  margin-top: 6px;
}

.cause-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid var(--ttdk-stroke-divider-secondary, #e4e5e7);
}

.statement {
  padding-top: 4px;
}

.fhir-panel {
  margin-top: 8px;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--ttdk-surface-card);
  border: 1px solid var(--ttdk-stroke-default);
  border-radius: var(--ttdk-radius-md, 12px);
}

.fhir-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.fhir-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.fhir-title {
  font-size: 15px;
  font-weight: 700;
}

.fhir-desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--ttdk-content-secondary-body);
  line-height: 1.5;
}

.fhir-panel pre {
  margin: 0;
  max-height: 380px;
  overflow: auto;
  padding: 14px;
  border-radius: var(--ttdk-radius-sm, 8px);
  background: var(--ttdk-surface-secondary);
  color: var(--ttdk-content-body);
  font-size: 12px;
  line-height: 1.55;
}

.submit-bar {
  position: sticky;
  bottom: 16px;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
  padding: 12px 16px;
  background: var(--ttdk-surface-card);
  border: 1px solid var(--ttdk-stroke-default);
  border-radius: var(--ttdk-radius-md, 12px);
  box-shadow: 0 8px 24px rgba(20, 19, 19, 0.08);
}

.submit-info {
  font-size: 13px;
  color: var(--ttdk-content-secondary-body);
}

.submit-info strong {
  color: var(--ttdk-content-heading);
}

.submit-log {
  margin-top: 4px;
  font-size: 11px;
  color: var(--ttdk-content-success, #067647);
  word-break: break-all;
}

.submit-dot {
  margin: 0 6px;
}

.submit-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.asal-intro {
  margin-bottom: 16px;
}

.asal-title {
  font-size: 17px;
  font-weight: 700;
}

.asal-desc {
  margin-top: 4px;
  max-width: 720px;
  font-size: 13px;
  color: var(--ttdk-content-secondary-body);
  line-height: 1.55;
}

.cell-muted {
  color: var(--ttdk-content-secondary-body);
  white-space: nowrap;
}

.cell-label {
  font-weight: 600;
  color: var(--ttdk-content-heading);
}

.cell-value {
  color: var(--ttdk-content-body);
  word-break: break-word;
}

@media (max-width: 1024px) {
  .derived-strip {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .grid,
  .grid.two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cause-row {
    grid-template-columns: 28px minmax(0, 1fr);
  }

  .cause-row > :last-child {
    grid-column: 2;
  }
}

@media (max-width: 640px) {
  .page-title {
    font-size: 22px;
  }

  .scenario-head {
    flex-wrap: wrap;
  }

  .grid,
  .grid.two,
  .inline-fields,
  .check-list {
    grid-template-columns: minmax(0, 1fr);
  }

  .span-2,
  .span-3 {
    grid-column: auto;
  }

  .derived-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .submit-bar {
    position: static;
  }

  .submit-actions {
    width: 100%;
  }

  .submit-actions .ttdk-button {
    flex: 1;
  }
}
</style>
