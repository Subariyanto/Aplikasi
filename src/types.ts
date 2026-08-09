/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = 'Admin',
  KOORDINATOR_KOKURIKULER = 'Koordinator Kokurikuler',
  TRIAL = 'Pengguna Trial (3 Hari)'
}

export interface Profile {
  id: string; // UUID
  nama_lengkap: string;
  username: string;
  password_hash: string;
  role: UserRole;
  nama_madrasah: string;
  nomor_hp: string;
  email: string;
  status_user: 'Aktif' | 'Tidak Aktif' | 'Trial';
  kode_aktivasi?: string;
  tanggal_aktivasi?: string; // ISO String
  terakhir_login?: string; // ISO String
  is_trial?: boolean;
  trial_expires_at?: string; // ISO String (3 days limit)
  created_at?: string; // ISO String
  updated_at?: string; // ISO String
}

export interface ActivationCode {
  id: string;
  kode: string; // PKMG-XXXX-XXXX
  nama_paket: string;
  role_tujuan: UserRole;
  nama_madrasah_tujuan: string;
  status: 'Aktif' | 'Tidak Aktif' | 'Kedaluwarsa';
  tanggal_mulai: string; // YYYY-MM-DD
  tanggal_kedaluwarsa: string; // YYYY-MM-DD
  jenis_penggunaan: 'Sekali Pakai' | 'Bisa Dipakai Beberapa Kali';
  batas_maksimal_penggunaan: number;
  jumlah_terpakai: number;
  dibuat_oleh: string; // UUID
  catatan: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActivationCodeUsage {
  id: string;
  activation_code_id: string;
  kode: string;
  user_id: string;
  nama_lengkap: string;
  role: UserRole;
  nama_madrasah: string;
  perangkat: string;
  user_agent: string;
  tanggal_penggunaan?: string;
}

export interface Madrasah {
  id: string;
  nama_madrasah: string;
  nsm: string;
  npsn: string;
  jenjang: 'RA' | 'MI' | 'MTs' | 'MA' | 'MAK';
  alamat: string;
  kecamatan: string;
  kabupaten_kota: string;
  provinsi: string;
  kepala_madrasah: string;
  nip_kepala: string;
  tahun_pelajaran: string;
  semester: 'Ganjil' | 'Genap';
  logo_url?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface Guru {
  id: string;
  nama_guru: string;
  nip_nuptk: string;
  jabatan: string;
  mata_pelajaran_muatan: string;
  kelas_diampu: string;
  nomor_hp: string;
  email: string;
  madrasah_id: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface Murid {
  id: string;
  nama_murid: string;
  nis_nisn: string;
  kelas: string;
  fase: string;
  jenjang: string;
  jenis_kelamin: 'Laki-laki' | 'Perempuan';
  nama_orang_tua: string;
  nomor_hp_orang_tua: string;
  madrasah_id: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimKokurikuler {
  id: string;
  tahun_pelajaran: string;
  nama_kepala_madrasah: string;
  koordinator_kokurikuler: string;
  guru_fasilitator: string[]; // JSONB represented as string array
  tenaga_kependidikan: string[]; // JSONB
  warga_madrasah_lainnya: string[]; // JSONB
  mitra_eksternal: string[]; // JSONB
  madrasah_id: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnalisisMadrasah {
  id: string;
  madrasah_id: string;
  kesesuaian_kurikulum: string;
  minat_bakat_murid: string;
  capaian_belum_optimal: string;
  dimensi_perlu_diperkuat: string[]; // JSONB
  panca_cinta_perlu_diperkuat: string[]; // JSONB
  sumber_daya_fisik: string[]; // JSONB
  sumber_daya_manusia: string[]; // JSONB
  sumber_daya_finansial: string[]; // JSONB
  sumber_daya_lingkungan: string[]; // JSONB
  kondisi_sosial_budaya: string;
  masalah_aktual: string;
  potensi_lokal: string;
  alasan_pemilihan_kegiatan: string;
  narasi_otomatis: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface PerencanaanKokurikuler {
  id: string;
  madrasah_id: string;
  nama_kegiatan: string;
  jenjang: string;
  kelas_fase: string;
  semester: string;
  tahun_pelajaran: string;
  tema_kegiatan: string;
  subtema: string;
  jenis_kokurikuler: string;
  alokasi_waktu: string;
  lokasi_kegiatan: string;
  guru_koordinator: string;
  mata_pelajaran_muatan: string;
  jumlah_murid: number;
  produk_hasil: string;
  dimensi_profil_lulusan: string[]; // JSONB string array of dimensions
  topik_panca_cinta: string[]; // JSONB string array of panca cinta topics
  materi_integrasi_kbc: string[]; // JSONB string array of materials
  analisis_kebutuhan: string;
  tujuan_pembelajaran: string[]; // JSONB string array of objectives
  praktik_pedagogis: string[]; // JSONB string array of pedagogy practices
  lingkungan_pembelajaran: string[]; // JSONB string array of learning environments
  teknologi_digital: string[]; // JSONB string array of tech tools
  kemitraan_pembelajaran: {
    madrasah: string;
    keluarga: string;
    masyarakat: string;
    media: string;
  }; // JSONB object
  alur_kegiatan: {
    tahap: string;
    aktivitas_guru: string;
    aktivitas_murid: string;
    nilai_kbc: string;
    alokasi_waktu: string;
    bukti: string;
  }[]; // JSONB array of objects
  asesmen: {
    formatif: string;
    sumatif: string;
    teknik: string[];
  }; // JSONB object
  rubrik: {
    dimensi: string;
    indikator: string;
    sb: string;
    b: string;
    c: string;
    k: string;
  }[]; // JSONB array of rubrics
  lembar_observasi: {
    id: string;
    nama_murid: string;
    dimensi_yang_diamati: string;
    topik_panca_cinta_yang_diamati: string;
    predikat: 'SB' | 'B' | 'C' | 'K';
    catatan_perilaku: string;
    tindak_lanjut: string;
  }[]; // JSONB array of observation entries
  jurnal_pelaksanaan: {
    hari_tanggal: string;
    aktivitas: string;
    respon_murid: string;
    dimensi_tampak: string[];
    panca_cinta_tampak: string[];
    kendala: string;
    solusi: string;
    tindak_lanjut: string;
    dokumentasi?: string;
  }[]; // JSONB array of journal entries
  pelaporan_hasil: {
    student_id?: string;
    nama_murid: string;
    deskripsi: string;
  }[]; // JSONB array of student reports
  evaluasi_tindak_lanjut: {
    ketercapaian_tujuan: string;
    faktor_pendukung: string;
    hambatan: string;
    solusi: string;
    dampak_murid: string;
    dampak_madrasah: string;
    rencana_tindak_lanjut: string;
    rekomendasi_berikutnya: string;
    narasi_otomatis?: string;
  }; // JSONB object
  status_dokumen: 'Draft' | 'Diajukan' | 'Disetujui' | 'Revisi';
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface CatatanPengawas {
  id: string;
  perencanaan_id: string;
  pengawas_id: string;
  nama_pengawas: string;
  catatan: string;
  rekomendasi: string;
  status_tindak_lanjut: 'Belum Ditindaklanjuti' | 'Sedang Ditindaklanjuti' | 'Selesai';
  tanggal_pembinaan: string; // YYYY-MM-DD
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  nama_lengkap: string;
  role: string;
  aktivitas: string;
  keterangan: string;
  tanggal: string; // ISO String
}
