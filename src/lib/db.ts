/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Profile,
  ActivationCode,
  ActivationCodeUsage,
  Madrasah,
  Guru,
  Murid,
  TimKokurikuler,
  AnalisisMadrasah,
  PerencanaanKokurikuler,
  CatatanPengawas,
  ActivityLog,
  UserRole
} from '../types';

// Storage keys for Supabase config
const URL_STORAGE_KEY = 'pkmg_supabase_url';
const KEY_STORAGE_KEY = 'pkmg_supabase_anon_key';

// Initialize Supabase if credentials exist
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseCredentials() {
  const url = localStorage.getItem(URL_STORAGE_KEY) || (import.meta as any).env.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem(KEY_STORAGE_KEY) || (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (url && key) {
    localStorage.setItem(URL_STORAGE_KEY, url);
    localStorage.setItem(KEY_STORAGE_KEY, key);
    try {
      supabaseClient = createClient(url, key);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
    }
  } else {
    localStorage.removeItem(URL_STORAGE_KEY);
    localStorage.removeItem(KEY_STORAGE_KEY);
    supabaseClient = null;
  }
}

// Try initial load
const { url: initUrl, key: initKey } = getSupabaseCredentials();
if (initUrl && initKey) {
  try {
    supabaseClient = createClient(initUrl, initKey);
  } catch (e) {
    console.error('Init Supabase Client Error:', e);
  }
}

export function isSupabaseConnected(): boolean {
  return supabaseClient !== null;
}

// ----------------------------------------------------
// LOCAL STORAGE MOCK DATABASE (RELATIONAL EMULATOR)
// ----------------------------------------------------

const MOCK_STORAGE_PREFIX = 'pkmg_tbl_';

function getLocalData<T>(table: string, defaultData: T[] = []): T[] {
  const key = MOCK_STORAGE_PREFIX + table;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    const parsed = JSON.parse(stored) as T[];
    if (table === 'profiles') {
      const profiles = parsed as unknown as Profile[];
      const defaultProfiles = defaultData as unknown as Profile[];
      let changed = false;
      defaultProfiles.forEach(def => {
        const foundIndex = profiles.findIndex(p => p.id === def.id || p.username.toLowerCase() === def.username.toLowerCase());
        if (foundIndex === -1) {
          profiles.push(def);
          changed = true;
        } else {
          // If the entry exists but has a different ID or is missing some fields, align them
          const existing = profiles[foundIndex];
          if (def.username === 'admin' && (
            existing.nama_lengkap !== def.nama_lengkap ||
            existing.nomor_hp !== def.nomor_hp ||
            existing.email !== def.email ||
            existing.password_hash !== def.password_hash
          )) {
            profiles[foundIndex] = { ...existing, ...def };
            changed = true;
          } else if (existing.id !== def.id || existing.username !== def.username || !existing.nama_madrasah) {
            profiles[foundIndex] = { ...def, ...existing, id: def.id, username: def.username };
            changed = true;
          }
        }
      });
      if (changed) {
        localStorage.setItem(key, JSON.stringify(profiles));
      }
    }
    return parsed;
  } catch (e) {
    console.error(`Error parsing table ${table}:`, e);
    return defaultData;
  }
}

function saveLocalData<T>(table: string, data: T[]): void {
  const key = MOCK_STORAGE_PREFIX + table;
  localStorage.setItem(key, JSON.stringify(data));
}

// PRE-SEEDING VALUES
const INITIAL_ACTIVATION_CODES: ActivationCode[] = [
  {
    id: 'code-1',
    kode: 'PKMG-G7K2-C3R8',
    nama_paket: 'Paket Koordinator Kokurikuler',
    role_tujuan: UserRole.KOORDINATOR_KOKURIKULER,
    nama_madrasah_tujuan: 'MTs Al-Madinah',
    status: 'Aktif',
    tanggal_mulai: '2026-01-01',
    tanggal_kedaluwarsa: '2030-12-31',
    jenis_penggunaan: 'Bisa Dipakai Beberapa Kali',
    batas_maksimal_penggunaan: 500,
    jumlah_terpakai: 0,
    dibuat_oleh: 'system',
    catatan: 'Kode resmi Koordinator Madrasah'
  },
  {
    id: 'code-2',
    kode: 'PKMG-FULL-2026',
    nama_paket: 'Paket Full Lisensi Permanen Kemenag 2026',
    role_tujuan: UserRole.KOORDINATOR_KOKURIKULER,
    nama_madrasah_tujuan: 'Madrasah Kemenag Kab. Jember',
    status: 'Aktif',
    tanggal_mulai: '2026-01-01',
    tanggal_kedaluwarsa: '2030-12-31',
    jenis_penggunaan: 'Bisa Dipakai Beberapa Kali',
    batas_maksimal_penggunaan: 1000,
    jumlah_terpakai: 0,
    dibuat_oleh: 'system',
    catatan: 'Kode Lisensi Utama Madrasah'
  },
  {
    id: 'code-3',
    kode: 'PKMG-JEMBER-2026',
    nama_paket: 'Paket Lisensi Madrasah Kab. Jember',
    role_tujuan: UserRole.KOORDINATOR_KOKURIKULER,
    nama_madrasah_tujuan: 'Madrasah Binaan Pokjawas Jember',
    status: 'Aktif',
    tanggal_mulai: '2026-01-01',
    tanggal_kedaluwarsa: '2030-12-31',
    jenis_penggunaan: 'Bisa Dipakai Beberapa Kali',
    batas_maksimal_penggunaan: 1000,
    jumlah_terpakai: 0,
    dibuat_oleh: 'system',
    catatan: 'Kode Lisensi Wilayah Jember'
  }
];

const INITIAL_MADRASAH: Madrasah[] = [
  {
    id: 'madr-1',
    nama_madrasah: 'MTS Al-Madinah',
    nsm: '121233740015',
    npsn: '20363412',
    jenjang: 'MTs',
    alamat: 'Jl. Untung Suropati No. 12, Kalipancur, Ngaliyan',
    kecamatan: 'Ngaliyan',
    kabupaten_kota: 'Kota Semarang',
    provinsi: 'Jawa Tengah',
    kepala_madrasah: 'Muhtasit, M.S.I.',
    nip_kepala: '197511082005011002',
    tahun_pelajaran: '2026/2027',
    semester: 'Ganjil',
    logo_url: '',
    created_by: 'system'
  }
];

const INITIAL_GURU: Guru[] = [
  {
    id: 'guru-1',
    nama_guru: 'Ustadzah Uchi, S.Pd.',
    nip_nuptk: '198804152015032004',
    jabatan: 'Waka Kurikulum / Guru IPA',
    mata_pelajaran_muatan: 'Ilmu Pengetahuan Alam (IPA)',
    kelas_diampu: 'VII, VIII',
    nomor_hp: '081234567890',
    email: 'uchi.almadinah@kemenag.go.id',
    madrasah_id: 'madr-1',
    created_by: 'system'
  },
  {
    id: 'guru-2',
    nama_guru: 'Ustadz Ahmad, S.Ag.',
    nip_nuptk: '198112102011011003',
    jabatan: 'Guru Fiqih / Akidah Akhlak',
    mata_pelajaran_muatan: 'Fiqih dan Al-Qur\'an Hadis',
    kelas_diampu: 'VII, IX',
    nomor_hp: '081298765432',
    email: 'ahmad.fiqih@kemenag.go.id',
    madrasah_id: 'madr-1',
    created_by: 'system'
  },
  {
    id: 'guru-3',
    nama_guru: 'Lina Marlina, S.Hum.',
    nip_nuptk: '199205122019042008',
    jabatan: 'Guru Bahasa Indonesia',
    mata_pelajaran_muatan: 'Bahasa Indonesia',
    kelas_diampu: 'VII',
    nomor_hp: '081345671122',
    email: 'lina.bindo@gmail.com',
    madrasah_id: 'madr-1',
    created_by: 'system'
  }
];

const INITIAL_MURID: Murid[] = [
  {
    id: 'murid-1',
    nama_murid: 'Ahmad Jaelani',
    nis_nisn: '121233740015001 / 3110293456',
    kelas: 'VII A',
    fase: 'D',
    jenjang: 'MTs',
    jenis_kelamin: 'Laki-laki',
    nama_orang_tua: 'Bambang Jaelani',
    nomor_hp_orang_tua: '08122334455',
    madrasah_id: 'madr-1',
    created_by: 'system'
  },
  {
    id: 'murid-2',
    nama_murid: 'Naya Ramadhani',
    nis_nisn: '121233740015002 / 3110582910',
    kelas: 'VII A',
    fase: 'D',
    jenjang: 'MTs',
    jenis_kelamin: 'Perempuan',
    nama_orang_tua: 'Surya Ramadhan',
    nomor_hp_orang_tua: '08133445566',
    madrasah_id: 'madr-1',
    created_by: 'system'
  },
  {
    id: 'murid-3',
    nama_murid: 'Ananda Putra',
    nis_nisn: '121233740015003 / 3110651829',
    kelas: 'VII B',
    fase: 'D',
    jenjang: 'MTs',
    jenis_kelamin: 'Laki-laki',
    nama_orang_tua: 'Rudi Wijaya',
    nomor_hp_orang_tua: '08155667788',
    madrasah_id: 'madr-1',
    created_by: 'system'
  },
  {
    id: 'murid-4',
    nama_murid: 'Putri Salsabila',
    nis_nisn: '121233740015004 / 3110992381',
    kelas: 'VII B',
    fase: 'D',
    jenjang: 'MTs',
    jenis_kelamin: 'Perempuan',
    nama_orang_tua: 'Aris Salsabila',
    nomor_hp_orang_tua: '08166778899',
    madrasah_id: 'madr-1',
    created_by: 'system'
  }
];

const INITIAL_TIM: TimKokurikuler[] = [
  {
    id: 'tim-1',
    tahun_pelajaran: '2026/2027',
    nama_kepala_madrasah: 'Muhtasit, M.S.I.',
    koordinator_kokurikuler: 'Ustadzah Uchi, S.Pd.',
    guru_fasilitator: ['Ustadz Ahmad, S.Ag.', 'Lina Marlina, S.Hum.'],
    tenaga_kependidikan: ['Arif Ridho, S.Sos. (TU)', 'Zulkifli, M.Si.'],
    warga_madrasah_lainnya: ['Komite Madrasah', 'Paguyuban Orang Tua VII A'],
    mitra_eksternal: ['Puskesmas Ngaliyan', 'Dinas Lingkungan Hidup Kota Semarang'],
    madrasah_id: 'madr-1',
    created_by: 'system'
  }
];

const INITIAL_ANALISIS: AnalisisMadrasah[] = [
  {
    id: 'analisis-1',
    madrasah_id: 'madr-1',
    kesesuaian_kurikulum: 'Sangat sesuai dengan Sistem Perencanaan Kokurikuler - KBC Madrasah yang memprioritaskan akhlak terpuji dan kepedulian lingkungan.',
    minat_bakat_murid: 'Murid memiliki minat besar dalam aktivitas luar kelas, praktek langsung (gardening), dan pembuatan video kreatif.',
    capaian_belum_optimal: 'Kemampuan berpikir kritis dalam pemecahan masalah sampah dan kerja sama tim yang berkesadaran masih perlu ditingkatkan.',
    dimensi_perlu_diperkuat: ['Penalaran kritis', 'Kolaborasi', 'Kesehatan'],
    panca_cinta_perlu_diperkuat: ['Cinta Lingkungan', 'Cinta Diri dan Sesama Manusia'],
    sumber_daya_fisik: ['Ruang kelas VII', 'Halaman belakang madrasah yang kosong', 'Tempat wudu dan mushalla'],
    sumber_daya_manusia: ['Guru IPA (Uchi)', 'Guru Agama (Ahmad)', 'Orang tua murid', 'Petugas kebersihan'],
    sumber_daya_finansial: ['Dana BOS Madrasah', 'Dukungan paguyuban komite'],
    sumber_daya_lingkungan: ['Kebun madrasah', 'Puskesmas terdekat', 'Penjual bibit tanaman lokal'],
    kondisi_sosial_budaya: 'Kondisi sosial ekonomi orang tua dominan menengah ke bawah, berada di lingkungan perkotaan yang padat.',
    masalah_aktual: 'Kurangnya kesadaran membuang sampah pada tempatnya, kurangnya area hijau, dan kebiasaan makanan kurang sehat di kantin.',
    potensi_lokal: 'Semarang memiliki iklim tropis yang cocok untuk vertical garden, dan terdapat pengolahan kompos di sekitar wilayah.',
    alasan_pemilihan_kegiatan: 'Vertical garden dipilih untuk menjawab masalah area hijau sempit, mengasah pemahaman IPA/ekosistem, menguatkan adab peduli alam, dan dilakukan secara kolaboratif.',
    narasi_otomatis: 'Berdasarkan hasil analisis madrasah, kegiatan kokurikuler ini dirancang untuk memperkuat dimensi kolaborasi, penalaran kritis, dan cinta lingkungan. Kegiatan dipilih karena murid perlu memperoleh pengalaman nyata dalam menjaga kebersihan lingkungan madrasah, bekerja sama dengan teman, serta membuat vertical garden sebagai wujud kepedulian terhadap alam.',
    created_by: 'system'
  }
];

const INITIAL_PERENCANAAN: PerencanaanKokurikuler[] = [
  {
    id: 'plan-1',
    madrasah_id: 'madr-1',
    nama_kegiatan: 'Penyusunan Vertical Garden Berbasis Cinta Lingkungan',
    jenjang: 'MTs',
    kelas_fase: 'VII / Fase D',
    semester: 'Ganjil',
    tahun_pelajaran: '2026/2027',
    tema_kegiatan: 'Cinta Lingkungan Madrasah',
    subtema: 'Vertical Garden dan Pengolahan Sampah Plastik',
    jenis_kokurikuler: 'Pembelajaran Kolaboratif Lintas Disiplin Ilmu',
    alokasi_waktu: '104 JP (3 Bulan)',
    lokasi_kegiatan: 'Halaman Belakang Madrasah',
    guru_koordinator: 'Ustadzah Uchi, S.Pd.',
    mata_pelajaran_muatan: 'IPA (Ekosistem), Matematika (Data & Pengukuran), Al-Qur\'an Hadis (Adab terhadap Alam)',
    jumlah_murid: 60,
    produk_hasil: 'Taman Vertikal Indah dan Laporan Sederhana Pengukuran Pertumbuhan Tanaman',
    dimensi_profil_lulusan: ['Penalaran kritis', 'Kolaborasi', 'Kesehatan'],
    topik_panca_cinta: ['Cinta Lingkungan', 'Cinta Allah Swt. dan Rasul-Nya'],
    materi_integrasi_kbc: [
      'Larangan merusak lingkungan (QS. Al-A\'raf: 56)',
      'Adab terhadap alam dan lingkungan',
      'Mensyukuri nikmat Allah Swt. melalui kelestarian ekosistem'
    ],
    analisis_kebutuhan: 'Madrasah memiliki lahan sempit namun gersang. Diperlukan inovasi penanaman vertikal menggunakan botol plastik bekas yang sekaligus menekan sampah plastik.',
    tujuan_pembelajaran: [
      'Murid mampu menganalisis interaksi antar komponen ekosistem serta dampak pencemaran plastik (IPA - Penalaran Kritis).',
      'Murid mampu bekerja sama mengumpulkan botol bekas dan merakit rak taman vertikal secara gotong royong (Kolaborasi).',
      'Murid mampu menerapkan adab peduli lingkungan sebagai refleksi keimanan terhadap Allah Maha Pencipta (Cinta Lingkungan).'
    ],
    praktik_pedagogis: ['Pembelajaran berbasis proyek', 'Praktik langsung', 'Observasi lingkungan'],
    lingkungan_pembelajaran: ['Halaman madrasah', 'Kebun madrasah', 'Ruang digital'],
    teknologi_digital: ['Video pembelajaran', 'Canva (poster)', 'Aplikasi spreadsheet'],
    kemitraan_pembelajaran: {
      madrasah: 'Guru memfasilitasi bibit, pupuk, tali pengikat, dan perkakas.',
      keluarga: 'Orang tua mengumpulkan botol plastik bekas 1.5L dari rumah.',
      masyarakat: 'Menghadirkan penyuluh pertanian kota atau dinas lingkungan hidup.',
      media: 'Publikasi hasil garden di Instagram dan YouTube madrasah.'
    },
    alur_kegiatan: [
      {
        tahap: 'Pembukaan & Apersepsi',
        aktivitas_guru: 'Menjelaskan tujuan proyek, memutar video kerusakan ekosistem akibat plastik, dan membacakan QS. Al-A\'raf: 56.',
        aktivitas_murid: 'Menyimak materi, merenungkan nilai cinta alam, dan bertanya jawab.',
        nilai_kbc: 'Cinta Allah & Rasul, Cinta Lingkungan',
        alokasi_waktu: '10 JP',
        bukti: 'Daftar Hadir, Catatan Refleksi'
      },
      {
        tahap: 'Eksplorasi Lahan',
        aktivitas_guru: 'Membimbing murid mengukur luas dinding halaman belakang dan menghitung kebutuhan botol plastik.',
        aktivitas_murid: 'Melakukan pengukuran matematika di lapangan, mencatat data di formulir.',
        nilai_kbc: 'Cinta Ilmu, Penalaran Kritis',
        alokasi_waktu: '14 JP',
        bukti: 'Tabel Ukuran Lahan'
      },
      {
        tahap: 'Pengumpulan & Modifikasi Botol',
        aktivitas_guru: 'Mengarahkan murid memotong botol, melubangi drainase, dan mengecat agar estetis.',
        aktivitas_murid: 'Bekerja sama dalam kelompok memotong, mengecat botol, memasukkan tanah kompos.',
        nilai_kbc: 'Kolaborasi, Kreativitas',
        alokasi_waktu: '30 JP',
        bukti: 'Foto Hasil Rakitan Botol'
      },
      {
        tahap: 'Penanaman & Pemeliharaan',
        aktivitas_guru: 'Mencontohkan cara memindahkan bibit sayur/bunga ke dalam pot vertikal.',
        aktivitas_murid: 'Menanam bibit, menyiram terjadwal bergantian, mencatat pertumbuhan tinggi daun.',
        nilai_kbc: 'Kemandirian, Kesehatan',
        alokasi_waktu: '30 JP',
        bukti: 'Jurnal Pertumbuhan Tanaman'
      },
      {
        tahap: 'Gelar Karya & Refleksi',
        aktivitas_guru: 'Mengadakan mini pameran Vertical Garden saat pembagian rapor bayangan.',
        aktivitas_murid: 'Mempresentasikan taman vertikal ke kepala madrasah dan pengawas.',
        nilai_kbc: 'Komunikasi, Keimanan',
        alokasi_waktu: '20 JP',
        bukti: 'Dokumen Taman Selesai, Sertifikat Proyek'
      }
    ],
    asesmen: {
      formatif: 'Observasi harian keaktifan kelompok, jurnal refleksi mingguan.',
      sumatif: 'Kualitas kerapian Vertical Garden, kelengkapan laporan pertumbuhan, dan video kampanye digital.',
      teknik: ['Observasi', 'Penilaian proses', 'Penilaian produk', 'Refleksi murid']
    },
    rubrik: [
      {
        dimensi: 'Penalaran kritis',
        indikator: 'Menganalisis interaksi ekosistem dan pengolahan data pertumbuhan',
        sb: 'Mampu menjelaskan interaksi ekosistem secara ilmiah mendalam dan menyusun tabel data tanpa kekeliruan.',
        b: 'Mampu menjelaskan interaksi ekosistem dengan baik dan menyusun tabel data dengan sedikit koreksi.',
        c: 'Cukup memahami interaksi ekosistem namun data tabel kurang lengkap.',
        k: 'Belum memahami interaksi ekosistem dan data tabel salah atau tidak dikerjakan.'
      },
      {
        dimensi: 'Kolaborasi',
        indikator: 'Bekerja sama dalam merakit dan merawat Vertical Garden',
        sb: 'Sangat aktif membantu teman, membagi tugas dengan adil, dan konsisten merawat tanaman.',
        b: 'Aktif berpartisipasi dan menjalankan peran yang didelegasikan dengan tanggung jawab.',
        c: 'Hanya bekerja jika didorong atau diingatkan oleh guru/teman.',
        k: 'Pasif, tidak ikut bekerja atau mengganggu ketenangan kelompok.'
      }
    ],
    lembar_observasi: [
      {
        id: 'obs-1',
        nama_murid: 'Ahmad Jaelani',
        dimensi_yang_diamati: 'Kemandirian',
        topik_panca_cinta_yang_diamati: 'Cinta Lingkungan',
        predikat: 'SB',
        catatan_perilaku: 'Ahmad berinisiatif menyiram tanaman vertikal setiap pagi sebelum masuk kelas tanpa harus disuruh.',
        tindak_lanjut: 'Apresiasi di depan kelas dan berikan peran sebagai koordinator siram pagi.'
      },
      {
        id: 'obs-2',
        nama_murid: 'Naya Ramadhani',
        dimensi_yang_diamati: 'Kolaborasi',
        topik_panca_cinta_yang_diamati: 'Cinta Diri dan Sesama',
        predikat: 'B',
        catatan_perilaku: 'Naya aktif berdiskusi mendesain warna botol, membantu membersihkan cat yang tumpah.',
        tindak_lanjut: 'Pertahankan keaktifan dan bimbing untuk berani melakukan presentasi.'
      }
    ],
    jurnal_pelaksanaan: [
      {
        hari_tanggal: 'Senin, 2026-07-06',
        aktivitas: 'Sosialisasi proyek Vertical Garden dan pemutaran video ekoteologi Islam.',
        respon_murid: 'Murid menyimak dengan antusias. Banyak yang kaget melihat tumpukan sampah plastik di laut.',
        dimensi_tampak: ['Penalaran kritis'],
        panca_cinta_tampak: ['Cinta Allah Swt. dan Rasul-Nya', 'Cinta Lingkungan'],
        kendala: 'Koneksi internet proyektor sempat tersendat.',
        solusi: 'Menggunakan video offline yang sudah diunduh sebelumnya.',
        tindak_lanjut: 'Membagikan form pengumpulan botol plastik kepada murid untuk dibawa minggu depan.'
      }
    ],
    pelaporan_hasil: [
      {
        student_id: 'murid-1',
        nama_murid: 'Ahmad Jaelani',
        deskripsi: 'Ahmad Jaelani menunjukkan perkembangan yang Sangat Baik dalam proyek Vertical Garden. Ia menunjukkan rasa Cinta Lingkungan yang tinggi, terbukti dengan kedisiplinannya menyiram tanaman. Kerja sama kelompok terjalin sangat erat.'
      },
      {
        student_id: 'murid-2',
        nama_murid: 'Naya Ramadhani',
        deskripsi: 'Naya Ramadhani menunjukkan perkembangan Baik. Ia mampu berkolaborasi aktif merakit pot vertikal dan menuangkan kreativitasnya saat mengecat pot botol bekas. Sikap ramah dan santun terus dipertahankan.'
      }
    ],
    evaluasi_tindak_lanjut: {
      ketercapaian_tujuan: '90% murid mencapai kompetensi dasar IPA dan menunjukkan karakter gotong royong yang meningkat.',
      faktor_pendukung: 'Antusiasme murid tinggi, botol plastik melimpah dari rumah, dan guru koordinator berdedikasi.',
      hambatan: 'Beberapa tanaman layu di minggu kedua karena cuaca Jember yang sangat terik.',
      solusi: 'Memasang jaring peneduh (paranet) di atas rak vertical garden.',
      dampak_murid: 'Murid lebih peduli kebersihan dan tidak lagi membuang botol air kemasan sembarangan.',
      dampak_madrasah: 'Madrasah memiliki sudut botani yang indah dan asri yang disukai oleh tamu/wali murid.',
      rencana_tindak_lanjut: 'Melanjutkan perawatan secara bergilir antar kelas, dan mulai menanam sayur hidroponik skala kecil.',
      rekomendasi_berikutnya: 'Tema berikutnya bisa bertema Market Day untuk menjual sayur organik hasil vertical garden.'
    },
    status_dokumen: 'Disetujui',
    created_by: 'system'
  }
];

const INITIAL_CATATAN: CatatanPengawas[] = [
  {
    id: 'note-1',
    perencanaan_id: 'plan-1',
    pengawas_id: 'usr-5',
    nama_pengawas: 'H. Muhaimin, M.Pd.I.',
    catatan: 'Dokumen perencanaan luar biasa lengkap dan terintegrasi baik dengan mapel IPA, Matematika, dan Agama.',
    rekomendasi: 'Sangat disarankan untuk mengundang pengawas madrasah saat Gelar Karya/panen raya sayur nanti, agar dapat menjadi contoh (pilot project) bagi madrasah binaan lainnya.',
    status_tindak_lanjut: 'Selesai',
    tanggal_pembinaan: '2026-07-15'
  }
];

const INITIAL_USERS: Profile[] = [
  {
    id: 'usr-1',
    nama_lengkap: 'SUBARIYANTO, S.Pd, M.Pd.I.',
    username: 'admin',
    password_hash: 'sha256$admin$779ab6ba378eb12ca7c2495b5e2eb793753e1c71b3e04651a9bae88c205a5fce',
    role: UserRole.ADMIN,
    nama_madrasah: 'Kementerian Agama Kab. Jember',
    nomor_hp: '082330647698',
    email: 'admin@pokjawasjember.com',
    status_user: 'Aktif',
    tanggal_aktivasi: new Date().toISOString(),
    terakhir_login: new Date().toISOString()
  },
  {
    id: 'usr-2',
    nama_lengkap: 'Hj. Siti Aminah, M.Pd.',
    username: 'koor',
    password_hash: 'sha256$koor$ec6b2f64fa38ce7ab41e29b78444041aaa1c6f20847cb87f653ecad2fef535c4',
    role: UserRole.KOORDINATOR_KOKURIKULER,
    nama_madrasah: 'MTS Al-Madinah',
    nomor_hp: '081234567890',
    email: 'sitiaminah@gmail.com',
    status_user: 'Aktif',
    kode_aktivasi: 'PKMG-G7K2-C3R8',
    tanggal_aktivasi: new Date().toISOString()
  },
  {
    id: 'usr-3',
    nama_lengkap: 'Pengguna Trial 3 Hari',
    username: 'trial',
    password_hash: 'sha256$trial$4bca2e73d8b5f7ec68ae825ae3dcff88492749891c28a8ab16f7626dd4e65fe2',
    role: UserRole.TRIAL,
    nama_madrasah: 'MTs Model Trial Kemenag',
    nomor_hp: '081234567899',
    email: 'trial@madrasah.sch.id',
    status_user: 'Trial',
    is_trial: true,
    tanggal_aktivasi: new Date().toISOString(),
    trial_expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    user_id: 'usr-1',
    nama_lengkap: 'Dwi Astuti, S.Pd.',
    role: 'Admin',
    aktivitas: 'Inisialisasi Aplikasi',
    keterangan: 'Menyiapkan database sistem PKMG versi 2026',
    tanggal: new Date().toISOString()
  }
];

// Helper to generate IDs
export function generateUUID(): string {
  return 'pkmg-' + Math.random().toString(36).substring(2, 11) + '-' + Math.random().toString(36).substring(2, 11);
}

// ----------------------------------------------------
// DUAL MODE QUERY API IMPLEMENTATION
// ----------------------------------------------------

export const db = {
  // Profiles/Users
  profiles: {
    async list(): Promise<Profile[]> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('profiles').select('*').order('created_at', { ascending: false });
        if (!error && data) return data as Profile[];
      }
      return getLocalData<Profile>('profiles', INITIAL_USERS);
    },
    async get(id: string): Promise<Profile | null> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', id).single();
        if (!error && data) return data as Profile;
      }
      const list = getLocalData<Profile>('profiles', INITIAL_USERS);
      return list.find(u => u.id === id) || null;
    },
    async getByUsername(username: string): Promise<Profile | null> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('profiles').select('*').eq('username', username).single();
        if (!error && data) return data as Profile;
      }
      const list = getLocalData<Profile>('profiles', INITIAL_USERS);
      return list.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    },
    async create(profile: Omit<Profile, 'id' | 'created_at'>): Promise<Profile> {
      const newProfile: Profile = {
        ...profile,
        id: generateUUID(),
        status_user: profile.status_user || 'Aktif',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('profiles').insert([newProfile]).select().single();
        if (!error && data) return data as Profile;
      }
      const list = getLocalData<Profile>('profiles', INITIAL_USERS);
      list.push(newProfile);
      saveLocalData('profiles', list);
      return newProfile;
    },
    async update(id: string, updates: Partial<Profile>): Promise<Profile> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (!error && data) return data as Profile;
      }
      const list = getLocalData<Profile>('profiles', INITIAL_USERS);
      const idx = list.findIndex(u => u.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
        saveLocalData('profiles', list);
        return list[idx];
      }
      throw new Error('User not found');
    },
    async delete(id: string): Promise<boolean> {
      if (supabaseClient) {
        const { error } = await supabaseClient.from('profiles').delete().eq('id', id);
        if (!error) return true;
      }
      const list = getLocalData<Profile>('profiles', INITIAL_USERS);
      const filtered = list.filter(u => u.id !== id);
      if (filtered.length !== list.length) {
        saveLocalData('profiles', filtered);
        return true;
      }
      return false;
    }
  },

  // Activation Codes
  activationCodes: {
    async list(): Promise<ActivationCode[]> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('activation_codes').select('*').order('created_at', { ascending: false });
        if (!error && data) return data as ActivationCode[];
      }
      return getLocalData<ActivationCode>('activation_codes', INITIAL_ACTIVATION_CODES);
    },
    async getByCode(kode: string): Promise<ActivationCode | null> {
      if (!kode) return null;
      const cleanInput = kode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (!cleanInput) return null;

      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('activation_codes').select('*');
        if (!error && data) {
          const found = (data as ActivationCode[]).find(c => c.kode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === cleanInput);
          if (found) return found;
        }
      }
      const list = getLocalData<ActivationCode>('activation_codes', INITIAL_ACTIVATION_CODES);
      const foundLocal = list.find(c => c.kode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === cleanInput);
      if (foundLocal) return foundLocal;

      // SECURITY: Only codes that actually exist in the active store may be
      // validated. The previous “dynamic valid license” fallback (accepting any
      // code that started with PKMG or was >=8 chars) let anyone mint a valid
      // full-license with a made-up string — rendering every admin-issued code
      // meaningless. That bypass is removed. Only admin-issued codes stored in
      // Supabase (server-side) or local data now validate.

      return null;
    },
    async create(code: Omit<ActivationCode, 'id' | 'created_at' | 'jumlah_terpakai'>): Promise<ActivationCode> {
      const newCode: ActivationCode = {
        ...code,
        id: generateUUID(),
        jumlah_terpakai: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('activation_codes').insert([newCode]).select().single();
        if (!error && data) return data as ActivationCode;
      }
      const list = getLocalData<ActivationCode>('activation_codes', INITIAL_ACTIVATION_CODES);
      list.push(newCode);
      saveLocalData('activation_codes', list);
      return newCode;
    },
    async update(id: string, updates: Partial<ActivationCode>): Promise<ActivationCode> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('activation_codes').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (!error && data) return data as ActivationCode;
      }
      const list = getLocalData<ActivationCode>('activation_codes', INITIAL_ACTIVATION_CODES);
      const idx = list.findIndex(c => c.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
        saveLocalData('activation_codes', list);
        return list[idx];
      }
      throw new Error('Activation code not found');
    },
    async incrementUsage(id: string): Promise<void> {
      const list = getLocalData<ActivationCode>('activation_codes', INITIAL_ACTIVATION_CODES);
      const idx = list.findIndex(c => c.id === id);
      if (idx !== -1) {
        const nextUsed = list[idx].jumlah_terpakai + 1;
        let nextStatus = list[idx].status;
        if (list[idx].jenis_penggunaan === 'Sekali Pakai' && nextUsed >= 1) {
          nextStatus = 'Tidak Aktif';
        } else if (nextUsed >= list[idx].batas_maksimal_penggunaan) {
          nextStatus = 'Tidak Aktif';
        }
        list[idx] = {
          ...list[idx],
          jumlah_terpakai: nextUsed,
          status: nextStatus,
          updated_at: new Date().toISOString()
        };
        saveLocalData('activation_codes', list);

        if (supabaseClient) {
          await supabaseClient.from('activation_codes').update({
            jumlah_terpakai: nextUsed,
            status: nextStatus,
            updated_at: new Date().toISOString()
          }).eq('id', id);
        }
      }
    },
    async delete(id: string): Promise<boolean> {
      if (supabaseClient) {
        const { error } = await supabaseClient.from('activation_codes').delete().eq('id', id);
        if (!error) return true;
      }
      const list = getLocalData<ActivationCode>('activation_codes', INITIAL_ACTIVATION_CODES);
      const filtered = list.filter(c => c.id !== id);
      if (filtered.length !== list.length) {
        saveLocalData('activation_codes', filtered);
        return true;
      }
      return false;
    }
  },

  // Activation Code Usage
  activationCodeUsage: {
    async list(): Promise<ActivationCodeUsage[]> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('activation_code_usage').select('*');
        if (!error && data) return data as ActivationCodeUsage[];
      }
      return getLocalData<ActivationCodeUsage>('activation_code_usage');
    },
    async create(usage: Omit<ActivationCodeUsage, 'id' | 'tanggal_penggunaan'>): Promise<ActivationCodeUsage> {
      const newUsage: ActivationCodeUsage = {
        ...usage,
        id: generateUUID(),
        tanggal_penggunaan: new Date().toISOString()
      };
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('activation_code_usage').insert([newUsage]).select().single();
        if (!error && data) return data as ActivationCodeUsage;
      }
      const list = getLocalData<ActivationCodeUsage>('activation_code_usage');
      list.push(newUsage);
      saveLocalData('activation_code_usage', list);
      return newUsage;
    }
  },

  // Madrasah Info
  madrasah: {
    async list(): Promise<Madrasah[]> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('madrasah').select('*').order('created_at', { ascending: false });
        if (!error && data) return data as Madrasah[];
      }
      return getLocalData<Madrasah>('madrasah', INITIAL_MADRASAH);
    },
    async get(id: string): Promise<Madrasah | null> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('madrasah').select('*').eq('id', id).single();
        if (!error && data) return data as Madrasah;
      }
      const list = getLocalData<Madrasah>('madrasah', INITIAL_MADRASAH);
      return list.find(m => m.id === id) || null;
    },
    async getFirst(): Promise<Madrasah | null> {
      const list = await this.list();
      return list.length > 0 ? list[0] : null;
    },
    async create(school: Omit<Madrasah, 'id' | 'created_at'>): Promise<Madrasah> {
      const newSchool: Madrasah = {
        ...school,
        id: generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('madrasah').insert([newSchool]).select().single();
        if (!error && data) return data as Madrasah;
      }
      const list = getLocalData<Madrasah>('madrasah', INITIAL_MADRASAH);
      list.push(newSchool);
      saveLocalData('madrasah', list);
      return newSchool;
    },
    async update(id: string, updates: Partial<Madrasah>): Promise<Madrasah> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('madrasah').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (!error && data) return data as Madrasah;
      }
      const list = getLocalData<Madrasah>('madrasah', INITIAL_MADRASAH);
      const idx = list.findIndex(m => m.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
        saveLocalData('madrasah', list);
        return list[idx];
      }
      throw new Error('Madrasah not found');
    },
    async delete(id: string): Promise<boolean> {
      if (supabaseClient) {
        const { error } = await supabaseClient.from('madrasah').delete().eq('id', id);
        if (!error) return true;
      }
      const list = getLocalData<Madrasah>('madrasah', INITIAL_MADRASAH);
      const filtered = list.filter(m => m.id !== id);
      if (filtered.length !== list.length) {
        saveLocalData('madrasah', filtered);
        return true;
      }
      return false;
    }
  },

  // Guru
  guru: {
    async list(madrasahId?: string): Promise<Guru[]> {
      if (supabaseClient) {
        let q = supabaseClient.from('guru').select('*');
        if (madrasahId) q = q.eq('madrasah_id', madrasahId);
        const { data, error } = await q;
        if (!error && data) return data as Guru[];
      }
      const list = getLocalData<Guru>('guru', INITIAL_GURU);
      return madrasahId ? list.filter(g => g.madrasah_id === madrasahId) : list;
    },
    async create(guru: Omit<Guru, 'id' | 'created_at'>): Promise<Guru> {
      const newGuru: Guru = {
        ...guru,
        id: generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('guru').insert([newGuru]).select().single();
        if (!error && data) return data as Guru;
      }
      const list = getLocalData<Guru>('guru', INITIAL_GURU);
      list.push(newGuru);
      saveLocalData('guru', list);
      return newGuru;
    },
    async update(id: string, updates: Partial<Guru>): Promise<Guru> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('guru').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (!error && data) return data as Guru;
      }
      const list = getLocalData<Guru>('guru', INITIAL_GURU);
      const idx = list.findIndex(g => g.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
        saveLocalData('guru', list);
        return list[idx];
      }
      throw new Error('Guru not found');
    },
    async delete(id: string): Promise<boolean> {
      if (supabaseClient) {
        const { error } = await supabaseClient.from('guru').delete().eq('id', id);
        if (!error) return true;
      }
      const list = getLocalData<Guru>('guru', INITIAL_GURU);
      const filtered = list.filter(g => g.id !== id);
      if (filtered.length !== list.length) {
        saveLocalData('guru', filtered);
        return true;
      }
      return false;
    }
  },

  // Murid
  murid: {
    async list(madrasahId?: string): Promise<Murid[]> {
      if (supabaseClient) {
        let q = supabaseClient.from('murid').select('*');
        if (madrasahId) q = q.eq('madrasah_id', madrasahId);
        const { data, error } = await q;
        if (!error && data) return data as Murid[];
      }
      const list = getLocalData<Murid>('murid', INITIAL_MURID);
      return madrasahId ? list.filter(m => m.madrasah_id === madrasahId) : list;
    },
    async create(murid: Omit<Murid, 'id' | 'created_at'>): Promise<Murid> {
      const newMurid: Murid = {
        ...murid,
        id: generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('murid').insert([newMurid]).select().single();
        if (!error && data) return data as Murid;
      }
      const list = getLocalData<Murid>('murid', INITIAL_MURID);
      list.push(newMurid);
      saveLocalData('murid', list);
      return newMurid;
    },
    async update(id: string, updates: Partial<Murid>): Promise<Murid> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('murid').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (!error && data) return data as Murid;
      }
      const list = getLocalData<Murid>('murid', INITIAL_MURID);
      const idx = list.findIndex(m => m.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
        saveLocalData('murid', list);
        return list[idx];
      }
      throw new Error('Murid not found');
    },
    async delete(id: string): Promise<boolean> {
      if (supabaseClient) {
        const { error } = await supabaseClient.from('murid').delete().eq('id', id);
        if (!error) return true;
      }
      const list = getLocalData<Murid>('murid', INITIAL_MURID);
      const filtered = list.filter(m => m.id !== id);
      if (filtered.length !== list.length) {
        saveLocalData('murid', filtered);
        return true;
      }
      return false;
    }
  },

  // Tim Kerja Kokurikuler
  timKokurikuler: {
    async list(madrasahId?: string): Promise<TimKokurikuler[]> {
      if (supabaseClient) {
        let q = supabaseClient.from('tim_kokurikuler').select('*');
        if (madrasahId) q = q.eq('madrasah_id', madrasahId);
        const { data, error } = await q;
        if (!error && data) return data as TimKokurikuler[];
      }
      const list = getLocalData<TimKokurikuler>('tim_kokurikuler', INITIAL_TIM);
      return madrasahId ? list.filter(t => g(t.madrasah_id) === madrasahId) : list;
    },
    async getFirst(madrasahId?: string): Promise<TimKokurikuler | null> {
      const list = await this.list(madrasahId);
      return list.length > 0 ? list[0] : null;
    },
    async save(tim: Omit<TimKokurikuler, 'id'> & { id?: string }): Promise<TimKokurikuler> {
      const id = tim.id || generateUUID();
      const updatedTim: TimKokurikuler = {
        ...tim,
        id,
        updated_at: new Date().toISOString(),
        created_at: tim.created_at || new Date().toISOString()
      };

      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('tim_kokurikuler').upsert([updatedTim]).select().single();
        if (!error && data) return data as TimKokurikuler;
      }

      const list = getLocalData<TimKokurikuler>('tim_kokurikuler', INITIAL_TIM);
      const idx = list.findIndex(t => t.id === id);
      if (idx !== -1) {
        list[idx] = updatedTim;
      } else {
        list.push(updatedTim);
      }
      saveLocalData('tim_kokurikuler', list);
      return updatedTim;
    }
  },

  // Analisis Madrasah
  analisisMadrasah: {
    async list(madrasahId?: string): Promise<AnalisisMadrasah[]> {
      if (supabaseClient) {
        let q = supabaseClient.from('analisis_madrasah').select('*');
        if (madrasahId) q = q.eq('madrasah_id', madrasahId);
        const { data, error } = await q;
        if (!error && data) return data as AnalisisMadrasah[];
      }
      const list = getLocalData<AnalisisMadrasah>('analisis_madrasah', INITIAL_ANALISIS);
      return madrasahId ? list.filter(a => a.madrasah_id === madrasahId) : list;
    },
    async getFirst(madrasahId?: string): Promise<AnalisisMadrasah | null> {
      const list = await this.list(madrasahId);
      return list.length > 0 ? list[0] : null;
    },
    async save(analisis: Omit<AnalisisMadrasah, 'id'> & { id?: string }): Promise<AnalisisMadrasah> {
      const id = analisis.id || generateUUID();
      const updatedAnalisis: AnalisisMadrasah = {
        ...analisis,
        id,
        updated_at: new Date().toISOString(),
        created_at: analisis.created_at || new Date().toISOString()
      };

      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('analisis_madrasah').upsert([updatedAnalisis]).select().single();
        if (!error && data) return data as AnalisisMadrasah;
      }

      const list = getLocalData<AnalisisMadrasah>('analisis_madrasah', INITIAL_ANALISIS);
      const idx = list.findIndex(a => a.id === id);
      if (idx !== -1) {
        list[idx] = updatedAnalisis;
      } else {
        list.push(updatedAnalisis);
      }
      saveLocalData('analisis_madrasah', list);
      return updatedAnalisis;
    }
  },

  // Perencanaan Kokurikuler (Main documents)
  perencanaanKokurikuler: {
    async list(madrasahId?: string): Promise<PerencanaanKokurikuler[]> {
      if (supabaseClient) {
        let q = supabaseClient.from('perencanaan_kokurikuler').select('*').order('created_at', { ascending: false });
        if (madrasahId) q = q.eq('madrasah_id', madrasahId);
        const { data, error } = await q;
        if (!error && data) return data as PerencanaanKokurikuler[];
      }
      const list = getLocalData<PerencanaanKokurikuler>('perencanaan_kokurikuler', INITIAL_PERENCANAAN);
      return madrasahId ? list.filter(p => p.madrasah_id === madrasahId) : list;
    },
    async get(id: string): Promise<PerencanaanKokurikuler | null> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('perencanaan_kokurikuler').select('*').eq('id', id).single();
        if (!error && data) return data as PerencanaanKokurikuler;
      }
      const list = getLocalData<PerencanaanKokurikuler>('perencanaan_kokurikuler', INITIAL_PERENCANAAN);
      return list.find(p => p.id === id) || null;
    },
    async create(plan: Omit<PerencanaanKokurikuler, 'id' | 'created_at'>): Promise<PerencanaanKokurikuler> {
      const newPlan: PerencanaanKokurikuler = {
        ...plan,
        id: generateUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('perencanaan_kokurikuler').insert([newPlan]).select().single();
        if (!error && data) return data as PerencanaanKokurikuler;
      }
      const list = getLocalData<PerencanaanKokurikuler>('perencanaan_kokurikuler', INITIAL_PERENCANAAN);
      list.push(newPlan);
      saveLocalData('perencanaan_kokurikuler', list);
      return newPlan;
    },
    async update(id: string, updates: Partial<PerencanaanKokurikuler>): Promise<PerencanaanKokurikuler> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('perencanaan_kokurikuler').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (!error && data) return data as PerencanaanKokurikuler;
      }
      const list = getLocalData<PerencanaanKokurikuler>('perencanaan_kokurikuler', INITIAL_PERENCANAAN);
      const idx = list.findIndex(p => p.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
        saveLocalData('perencanaan_kokurikuler', list);
        return list[idx];
      }
      throw new Error('Perencanaan not found');
    },
    async delete(id: string): Promise<boolean> {
      if (supabaseClient) {
        const { error } = await supabaseClient.from('perencanaan_kokurikuler').delete().eq('id', id);
        if (!error) return true;
      }
      const list = getLocalData<PerencanaanKokurikuler>('perencanaan_kokurikuler', INITIAL_PERENCANAAN);
      const filtered = list.filter(p => p.id !== id);
      if (filtered.length !== list.length) {
        saveLocalData('perencanaan_kokurikuler', filtered);
        return true;
      }
      return false;
    }
  },

  // Catatan Pengawas
  catatanPengawas: {
    async list(perencanaanId?: string): Promise<CatatanPengawas[]> {
      if (supabaseClient) {
        let q = supabaseClient.from('catatan_pengawas').select('*').order('created_at', { ascending: false });
        if (perencanaanId) q = q.eq('perencanaan_id', perencanaanId);
        const { data, error } = await q;
        if (!error && data) return data as CatatanPengawas[];
      }
      const list = getLocalData<CatatanPengawas>('catatan_pengawas', INITIAL_CATATAN);
      return perencanaanId ? list.filter(n => n.perencanaan_id === perencanaanId) : list;
    },
    async save(note: Omit<CatatanPengawas, 'id'> & { id?: string }): Promise<CatatanPengawas> {
      const id = note.id || generateUUID();
      const updatedNote: CatatanPengawas = {
        ...note,
        id,
        created_at: note.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('catatan_pengawas').upsert([updatedNote]).select().single();
        if (!error && data) return data as CatatanPengawas;
      }

      const list = getLocalData<CatatanPengawas>('catatan_pengawas', INITIAL_CATATAN);
      const idx = list.findIndex(n => n.id === id);
      if (idx !== -1) {
        list[idx] = updatedNote;
      } else {
        list.push(updatedNote);
      }
      saveLocalData('catatan_pengawas', list);
      return updatedNote;
    },
    async delete(id: string): Promise<boolean> {
      if (supabaseClient) {
        const { error } = await supabaseClient.from('catatan_pengawas').delete().eq('id', id);
        if (!error) return true;
      }
      const list = getLocalData<CatatanPengawas>('catatan_pengawas', INITIAL_CATATAN);
      const filtered = list.filter(n => n.id !== id);
      if (filtered.length !== list.length) {
        saveLocalData('catatan_pengawas', filtered);
        return true;
      }
      return false;
    }
  },

  // Activity Logs
  logs: {
    async list(): Promise<ActivityLog[]> {
      if (supabaseClient) {
        const { data, error } = await supabaseClient.from('activity_logs').select('*').order('tanggal', { ascending: false });
        if (!error && data) return data as ActivityLog[];
      }
      return getLocalData<ActivityLog>('activity_logs', INITIAL_LOGS);
    },
    async create(log: Omit<ActivityLog, 'id' | 'tanggal'>): Promise<ActivityLog> {
      const newLog: ActivityLog = {
        ...log,
        id: generateUUID(),
        tanggal: new Date().toISOString()
      };
      if (supabaseClient) {
        await supabaseClient.from('activity_logs').insert([newLog]);
      }
      const list = getLocalData<ActivityLog>('activity_logs', INITIAL_LOGS);
      list.unshift(newLog); // Put at start
      saveLocalData('activity_logs', list);
      return newLog;
    }
  }
};

// Pure Helper to get madrasah list for type checking
function g(v: any) { return typeof v === 'string' ? v : ''; }

// ----------------------------------------------------
// STATIC BANK KNOWLEDGE SEED (SECTIONS P, Q, R, O)
// ----------------------------------------------------

export interface BankTheme {
  id: string;
  nama: string;
  deskripsi: string;
}

export interface BankHabit {
  id: string;
  kebiasaan: string;
  contoh_kegiatan: string;
}

export interface BankCcLov {
  id: string;
  nama_kegiatan: string;
  deskripsi: string;
}

export const BANK_THEMES: BankTheme[] = [
  { id: '1', nama: 'Aku Sayang Diriku dan Temanku', deskripsi: 'Membina empati, peduli sesama, dan pengenalan emosi diri secara santun.' },
  { id: '2', nama: 'Hidup Bersih dan Sehat', deskripsi: 'Penerapan kebiasaan mandi, membuang sampah, cuci tangan, dan adab thaharah.' },
  { id: '3', nama: 'Cinta Lingkungan Madrasah', deskripsi: 'Menghijaukan madrasah, mengumpulkan sampah daur ulang, dan merawat tanaman.' },
  { id: '4', nama: 'Madrasahku Bersih dan Indah', deskripsi: 'Menata kelas, menghias dinding dengan kaligrafi kreatif, dan mengelola sudut baca.' },
  { id: '5', nama: 'Gerakan Hemat Air dan Listrik', deskripsi: 'Kampanye menghemat energi sebagai bentuk kesadaran adab di bumi.' },
  { id: '6', nama: 'Kantin Sehat Madrasah', deskripsi: 'Menjamin konsumsi makanan halalan thayyiban yang bernutrisi tinggi.' },
  { id: '7', nama: 'Market Day Berbasis Akhlak', deskripsi: 'Latihan kewirausahaan jujur meneladani sifat amanah Rasulullah.' },
  { id: '8', nama: 'Ekoteologi Madrasah', deskripsi: 'Mengintegrasikan ajaran Al-Qur\'an tentang bumi dan manusia sebagai khalifah.' },
  { id: '9', nama: 'Peduli dan Berbagi', deskripsi: 'Membagikan makanan kepada dhuafa, donasi buku bekas, dan program sapa anak yatim.' },
  { id: '10', nama: 'Aku Cinta Indonesia', deskripsi: 'Mengenal pahlawan Islam, keragaman budaya nusantara, dan menyanyikan lagu nasional.' },
  { id: '11', nama: 'Kearifan Lokal Daerahku', deskripsi: 'Belajar membatik, menganyam bambu, atau membuat kuliner tradisional madrasah.' },
  { id: '12', nama: 'Literasi Cinta Ilmu', deskripsi: 'Gerakan membaca 15 menit, kunjungan perpustakaan daerah, dan menyusun kamus mini.' },
  { id: '13', nama: 'Adab kepada Guru dan Orang Tua', deskripsi: 'Praktik bersalaman, berkata sopan, mendoakan orang tua, dan menghargai nasehat guru.' },
  { id: '14', nama: 'Moderasi Beragama', deskripsi: 'Menguatkan toleransi, cinta tanah air, dan mencegah paham ekstrim/perundungan.' },
  { id: '15', nama: 'Toleransi dan Persaudaraan', deskripsi: 'Menjalin ukhuwah Islamiyah, ukhuwah insaniyah, dan ukhuwah wathaniyah.' },
  { id: '16', nama: 'Sampah Jadi Berkah', deskripsi: 'Pembuatan kompos dan kerajinan tangan bernilai jual dari botol bekas.' },
  { id: '17', nama: 'Kebun Madrasah', deskripsi: 'Menanam sayuran organik seperti kangkung, bayam, dan cabai di lingkungan madrasah.' },
  { id: '18', nama: 'Jumat Bersih', deskripsi: 'Aksi gotong royong membersihkan mushalla, laci kelas, dan selokan air madrasah.' },
  { id: '19', nama: 'Bakti Sosial', deskripsi: 'Penyaluran sembako murah untuk warga sekitar lingkungan madrasah.' },
  { id: '20', nama: 'Kampanye Anti Bullying', deskripsi: 'Deklarasi sahabat madrasah aman, ramah, bebas ejekan dan kekerasan fisik.' },
  { id: '21', nama: 'Bijak Bermedia Digital', deskripsi: 'Edukasi memilah hoaks, adab berkomentar di media sosial, dan kampanye digital santun.' },
  { id: '22', nama: 'Cinta Produk Lokal', deskripsi: 'Mengonsumsi kuliner UMKM lokal dan menghargai kerajinan nusantara.' },
  { id: '23', nama: 'Sehat Jiwa dan Raga', deskripsi: 'Olahraga tradisional, menjaga kesehatan mental, serta zikir penenang jiwa.' },
  { id: '24', nama: 'Ramadan Penuh Cinta', deskripsi: 'Kegiatan pesantren kilat, tadarus bergilir, pengumpulan zakat fitrah, dan bagi takjil.' },
  { id: '25', nama: 'Harianku Penuh Cinta', deskripsi: 'Mencatat perbuatan baik harian, pembiasaan sapa salam senyum, dan muhasabah diri.' }
];

export const BANK_G7KAIH: BankHabit[] = [
  { id: '1', kebiasaan: 'Bangun pagi', contoh_kegiatan: 'Jurnal kebiasaan bangun subuh, salat berjamaah, berbenah kamar mandi.' },
  { id: '2', kebiasaan: 'Beribadah', contoh_kegiatan: 'Pembiasaan salat dhuha harian, hafalan surah pendek, zikir pagi bersama.' },
  { id: '3', kebiasaan: 'Berolahraga', contoh_kegiatan: 'Senam pagi bersama, latihan memanah, jalan sehat keliling kampung.' },
  { id: '4', kebiasaan: 'Makan sehat dan bergizi', contoh_kegiatan: 'Kampanye bekal makanan 4 sehat 5 sempurna, minum air putih cukup.' },
  { id: '5', kebiasaan: 'Gemar belajar', contoh_kegiatan: 'Klub sains sederhana, membaca buku fiksi/nonfiksi, teka-teki silang pengetahuan.' },
  { id: '6', kebiasaan: 'Bermasyarakat', contoh_kegiatan: 'Kerja bakti bersama rukun warga, kunjungan tokoh agama, ziarah makam pahlawan.' },
  { id: '7', kebiasaan: 'Tidur cepat', contoh_kegiatan: 'Penyusunan jadwal aktivitas harian, pembatasan screen time malam hari.' }
];

export const BANK_KKBC: BankCcLov[] = [
  { id: '1', nama_kegiatan: 'Aksi Cinta Lingkungan', deskripsi: 'Gotong royong membersihkan selokan, memilah sampah, dan membuat taman mini.' },
  { id: '2', nama_kegiatan: 'Berbagi untuk Sesama', deskripsi: 'Tukar kado ikhlas (tahadu tahabbu), mengumpulkan beras sejumput untuk yatim.' },
  { id: '3', nama_kegiatan: 'Madrasah Ramah Anak', deskripsi: 'Gerakan sapa salam senyum santun (4S) di pintu gerbang setiap pagi.' },
  { id: '4', nama_kegiatan: 'Sahabat Tanpa Bullying', deskripsi: 'Sumpah ukhuwah anti bullying, pembuatan banner tanda tangan cinta sahabat.' },
  { id: '5', nama_kegiatan: 'Kebun Cinta Madrasah', deskripsi: 'Setiap kelas merawat satu baris tanaman sayur atau bunga hias secara bergilir.' },
  { id: '6', nama_kegiatan: 'Literasi Cinta Ilmu', deskripsi: 'Majalah dinding kelas bertema pahlawan dan hadis keutamaan menuntut ilmu.' },
  { id: '7', nama_kegiatan: 'Doa dan Zikir Bersama', deskripsi: 'Istighosah dan muhasabah diri di akhir pekan menjelang ujian madrasah.' },
  { id: '8', nama_kegiatan: 'Bakti Sosial', deskripsi: 'Penyaluran zakat dan infaq kepada warga miskin sekitar wilayah madrasah.' },
  { id: '9', nama_kegiatan: 'Kunjungan Tokoh Inspiratif', deskripsi: 'Wawancara dengan kiai kharismatik, tentara, dokter, atau pengusaha muslim sukses.' },
  { id: '10', nama_kegiatan: 'Kampanye Cinta Tanah Air', deskripsi: 'Upacara bendera penuh khidmat, menceritakan kembali sejarah perjuangan ulama.' }
];

export const RECOMMENDED_MATERIALS: Record<string, string[]> = {
  'Cinta Allah Swt. dan Rasul-Nya': [
    'Keimanan dan ketakwaan kepada Allah Swt.',
    'Mengenal Asmaul Husna (Ar-Rahman, Ar-Rahim, Al-\'Adl)',
    'Ibadah sebagai wujud cinta kepada Allah Swt. (salat, zikir, membaca Al-Qur\'an)',
    'Mensyukuri nikmat Allah Swt. dalam perilaku sehari-hari',
    'Meneladani sifat Rasulullah saw. (Siddiq, Amanah, Fathonah, Tabligh)',
    'Hadis tentang cinta kasih dan akhlak mulia'
  ],
  'Cinta Ilmu': [
    'Pilar sukses mencari ilmu: niat, tekun, tawakal, wara\', yakin, dan syukur',
    'Literasi sebagai sumber ilmu utama',
    'Pembelajar sepanjang hayat (lifelong learning)',
    'Adab mulia kepada guru dan ulama',
    'Pemanfaatan teknologi digital secara bijak dan sehat',
    'Inovasi, nalar kritis, dan pemecahan masalah',
    'Sumber ilmu qauliyah (wahyu) dan kauniyah (semesta alam)'
  ],
  'Cinta Lingkungan': [
    'Islam sebagai rahmatan lil \'alamin (rahmat bagi alam semesta)',
    'Adab terhadap alam, hewan, dan kelestarian tanaman',
    'Larangan merusak lingkungan dan berbuat fasad di bumi (QS. Al-A\'raf: 56)',
    'Menjaga kebersihan madrasah sebagai bagian dari iman (thaharah)',
    'Gerakan hemat energi (air dan listrik)',
    'Menghindari perilaku berlebihan (ishraf dan tabdzir)',
    'Merawat lingkungan hidup sebagai amanah mulia khilafah'
  ],
  'Cinta Diri dan Sesama Manusia': [
    'Akhlak terpuji kepada diri sendiri (self-respect, self-compassion)',
    'Sikap tawakal, ikhtiar, syukur, sabar, qanaah, kreatif, dan produktif',
    'Menjaga kebersihan fisik, kesehatan mental, dan keselamatan diri',
    'Ukhuwah Islamiyah (persaudaraan sesama muslim)',
    'Ukhuwah Insaniyah (persaudaraan sesama manusia)',
    'Adab berbakti kepada orang tua (birrul walidain)',
    'Adab bersahabat, peduli, dan menyayangi sesama teman',
    'Sikap ta\'awun (tolong-menolong), tafahum, tasamuh (toleransi), dan husnuzhan'
  ],
  'Cinta Tanah Air': [
    'Ukhuwah Wathaniyah (persaudaraan sebangsa setanah air)',
    'Konsep Hubbul Wathan minal Iman (cinta tanah air sebagian dari iman)',
    'Menghormati perbedaan suku, budaya, dan agama (QS. Al-Hujurat: 13)',
    'Menjaga persatuan dan kesatuan bangsa dalam bingkai NKRI',
    'Berkontribusi nyata untuk kemajuan bangsa dan negara',
    'Menjaga kedaulatan, ketertiban, dan keamanan lingkungan madrasah'
  ]
};

// ----------------------------------------------------
// DATABASE BACKUP & RESTORE UTILITIES (SECTION Z)
// ----------------------------------------------------

export function backupDataToJSON(): string {
  const tables = [
    'profiles',
    'activation_codes',
    'activation_code_usage',
    'madrasah',
    'guru',
    'murid',
    'tim_kokurikuler',
    'analisis_madrasah',
    'perencanaan_kokurikuler',
    'catatan_pengawas',
    'activity_logs'
  ];
  
  const backup: Record<string, any> = {};
  for (const tbl of tables) {
    const key = MOCK_STORAGE_PREFIX + tbl;
    const stored = localStorage.getItem(key);
    backup[tbl] = stored ? JSON.parse(stored) : [];
  }
  
  return JSON.stringify(backup, null, 2);
}

export function restoreDataFromJSON(jsonString: string): boolean {
  try {
    const backup = JSON.parse(jsonString);
    const tables = [
      'profiles',
      'activation_codes',
      'activation_code_usage',
      'madrasah',
      'guru',
      'murid',
      'tim_kokurikuler',
      'analisis_madrasah',
      'perencanaan_kokurikuler',
      'catatan_pengawas',
      'activity_logs'
    ];
    
    for (const tbl of tables) {
      if (Array.isArray(backup[tbl])) {
        const key = MOCK_STORAGE_PREFIX + tbl;
        localStorage.setItem(key, JSON.stringify(backup[tbl]));
      }
    }
    return true;
  } catch (e) {
    console.error('Failed to restore database backup:', e);
    return false;
  }
}

export function resetDatabaseToDefault(): void {
  const tables = [
    'profiles',
    'activation_codes',
    'activation_code_usage',
    'madrasah',
    'guru',
    'murid',
    'tim_kokurikuler',
    'analisis_madrasah',
    'perencanaan_kokurikuler',
    'catatan_pengawas',
    'activity_logs'
  ];
  for (const tbl of tables) {
    localStorage.removeItem(MOCK_STORAGE_PREFIX + tbl);
  }
  // This will force re-initialization on next call
}
