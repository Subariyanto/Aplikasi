/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  Trash2, 
  Eye, 
  CheckSquare, 
  BookOpen, 
  Heart, 
  Users, 
  ArrowRight, 
  Plus, 
  X, 
  FileCheck, 
  Layers,
  AlertCircle,
  HelpCircle,
  Copy
} from 'lucide-react';
import { PerencanaanKokurikuler, Profile, UserRole } from '../types';
import { db, RECOMMENDED_MATERIALS } from '../lib/db';

interface GeneratorViewProps {
  user: Profile;
  onNavigate: (view: string, docId?: string) => void;
  activeDocId?: string | null;
}

export default function GeneratorView({ user, onNavigate, activeDocId }: GeneratorViewProps) {
  const [activeTab, setActiveTab] = useState<'identitas' | 'kbc' | 'pedagogi' | 'alur' | 'rubrik' | 'observasi' | 'jurnal' | 'laporan' | 'evaluasi'>('identitas');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // MAIN DOCUMENT STATE
  const [docId, setDocId] = useState<string | null>(activeDocId || null);
  const [namaKegiatan, setNamaKegiatan] = useState('');
  const [jenjang, setJenjang] = useState('MTs');
  const [kelasFase, setKelasFase] = useState('VII / Fase D');
  const [semester, setSemester] = useState('Ganjil');
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  const [temaKegiatan, setTemaKegiatan] = useState('Cinta Lingkungan Madrasah');
  const [subtema, setSubtema] = useState('');
  const [jenisKokurikuler, setJenisKokurikuler] = useState('Pembelajaran Kolaboratif Lintas Disiplin Ilmu');
  const [alokasiWaktu, setAlokasiWaktu] = useState('104 JP');
  const [lokasiKegiatan, setLokasiKegiatan] = useState('Lingkungan Madrasah');
  const [guruKoordinator, setGuruKoordinator] = useState(user.nama_lengkap);
  const [mapelMuatan, setMapelMuatan] = useState('');
  const [jumlahMurid, setJumlahMurid] = useState(30);
  const [produkHasil, setProdukHasil] = useState('');

  // Checkboxes
  const [dimensi, setDimensi] = useState<string[]>([]);
  const [pancaCinta, setPancaCinta] = useState<string[]>([]);
  const [materiKbc, setMateriKbc] = useState<string[]>([]);
  const [analisisKebutuhan, setAnalisisKebutuhan] = useState('');
  const [tujuan, setTujuan] = useState<string[]>([]);
  const [pedagogis, setPedagogis] = useState<string[]>([]);
  const [lingkungan, setLingkungan] = useState<string[]>([]);
  const [teknologi, setTeknologi] = useState<string[]>([]);

  // Kemitraan
  const [mitraMadrasah, setMitraMadrasah] = useState('');
  const [mitraKeluarga, setMitraKeluarga] = useState('');
  const [mitraMasyarakat, setMitraMasyarakat] = useState('');
  const [mitraMedia, setMitraMedia] = useState('');

  // Alur
  const [alur, setAlur] = useState<any[]>([]);

  // Asesmen Formatif / Sumatif
  const [formatif, setFormatif] = useState('Observasi keaktifan kelompok harian, catatan anekdot.');
  const [sumatif, setSumatif] = useState('Penilaian karya produk akhir, rubrik presentasi.');
  const [teknikAsesmen, setTeknikAsesmen] = useState<string[]>(['Observasi', 'Penilaian proses']);

  // Rubrik (dimension -> rubric descriptors)
  const [rubrik, setRubrik] = useState<any[]>([]);

  // Lembar Observasi
  const [observasi, setObservasi] = useState<any[]>([]);

  // Jurnal Pelaksanaan
  const [jurnal, setJurnal] = useState<any[]>([]);

  // Pelaporan Rapor Deskripsi
  const [pelaporan, setPelaporan] = useState<any[]>([]);

  // Evaluasi
  const [evalKetercapaian, setEvalKetercapaian] = useState('');
  const [evalPendukung, setEvalPendukung] = useState('');
  const [evalHambatan, setEvalHambatan] = useState('');
  const [evalSolusi, setEvalSolusi] = useState('');
  const [evalDampakMurid, setEvalDampakMurid] = useState('');
  const [evalDampakMadrasah, setEvalDampakMadrasah] = useState('');
  const [evalRTL, setEvalRTL] = useState('');
  const [evalRekomendasi, setEvalRekomendasi] = useState('');

  const [statusDokumen, setStatusDokumen] = useState<'Draft' | 'Diajukan' | 'Disetujui'>('Draft');

  const [schoolId, setSchoolId] = useState('');

  const isReadOnly = false;

  // Load existing document if editing
  useEffect(() => {
    async function loadDoc() {
      const sch = await db.madrasah.getFirst();
      if (sch) setSchoolId(sch.id);

      if (activeDocId) {
        setLoading(true);
        try {
          const doc = await db.perencanaanKokurikuler.get(activeDocId);
          if (doc) {
            setDocId(doc.id);
            setNamaKegiatan(doc.nama_kegiatan);
            setJenjang(doc.jenjang);
            setKelasFase(doc.kelas_fase);
            setSemester(doc.semester);
            setTahunPelajaran(doc.tahun_pelajaran);
            setTemaKegiatan(doc.tema_kegiatan);
            setSubtema(doc.subtema || '');
            setJenisKokurikuler(doc.jenis_kokurikuler);
            setAlokasiWaktu(doc.alokasi_waktu);
            setLokasiKegiatan(doc.lokasi_kegiatan);
            setGuruKoordinator(doc.guru_koordinator);
            setMapelMuatan(doc.mata_pelajaran_muatan);
            setJumlahMurid(doc.jumlah_murid);
            setProdukHasil(doc.produk_hasil);
            setDimensi(doc.dimensi_profil_lulusan || []);
            setPancaCinta(doc.topik_panca_cinta || []);
            setMateriKbc(doc.materi_integrasi_kbc || []);
            setAnalisisKebutuhan(doc.analisis_kebutuhan);
            setTujuan(doc.tujuan_pembelajaran || []);
            setPedagogis(doc.praktik_pedagogis || []);
            setLingkungan(doc.lingkungan_pembelajaran || []);
            setTeknologi(doc.teknologi_digital || []);
            
            if (doc.kemitraan_pembelajaran) {
              setMitraMadrasah(doc.kemitraan_pembelajaran.madrasah || '');
              setMitraKeluarga(doc.kemitraan_pembelajaran.keluarga || '');
              setMitraMasyarakat(doc.kemitraan_pembelajaran.masyarakat || '');
              setMitraMedia(doc.kemitraan_pembelajaran.media || '');
            }
            
            setAlur(doc.alur_kegiatan || []);
            
            if (doc.asesmen) {
              setFormatif(doc.asesmen.formatif || '');
              setSumatif(doc.asesmen.sumatif || '');
              setTeknikAsesmen(doc.asesmen.teknik || []);
            }
            
            setRubrik(doc.rubrik || []);
            setObservasi(doc.lembar_observasi || []);
            setJurnal(doc.jurnal_pelaksanaan || []);
            setPelaporan(doc.pelaporan_hasil || []);
            
            if (doc.evaluasi_tindak_lanjut) {
              setEvalKetercapaian(doc.evaluasi_tindak_lanjut.ketercapaian_tujuan || '');
              setEvalPendukung(doc.evaluasi_tindak_lanjut.faktor_pendukung || '');
              setEvalHambatan(doc.evaluasi_tindak_lanjut.hambatan || '');
              setEvalSolusi(doc.evaluasi_tindak_lanjut.solusi || '');
              setEvalDampakMurid(doc.evaluasi_tindak_lanjut.dampak_murid || '');
              setEvalDampakMadrasah(doc.evaluasi_tindak_lanjut.dampak_madrasah || '');
              setEvalRTL(doc.evaluasi_tindak_lanjut.rencana_tindak_lanjut || '');
              setEvalRekomendasi(doc.evaluasi_tindak_lanjut.rekomendasi_berikutnya || '');
            }

            setStatusDokumen(doc.status_dokumen);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        // default empty draft or seed with default alur
        setDefaultAlur();
      }
    }
    loadDoc();
  }, [activeDocId]);

  const setDefaultAlur = () => {
    setAlur([
      { tahap: 'Pembukaan & Apersepsi', aktivitas_guru: 'Menjelaskan tujuan proyek, memutarkan video pengenalan tema, dan memberikan pertanyaan pemantik.', aktivitas_murid: 'Menyimak, berdiskusi kelompok kecil, dan mencatat poin utama.', nilai_kbc: 'Cinta Ilmu', alokasi_waktu: '10 JP', bukti: 'Form Refleksi Awal' },
      { tahap: 'Eksplorasi Lapangan', aktivitas_guru: 'Membimbing murid melihat masalah nyata di lingkungan madrasah/rumah.', aktivitas_murid: 'Melakukan observasi, mewawancarai narasumber, menuliskan temuan.', nilai_kbc: 'Cinta Lingkungan', alokasi_waktu: '20 JP', bukti: 'Lembar Catatan Eksplorasi' },
      { tahap: 'Perancangan Aksi', aktivitas_guru: 'Mendampingi penyusunan desain solusi atau produk kreatif.', aktivitas_murid: 'Merakit desain, menghitung kebutuhan alat, dan membagi peran tim.', nilai_kbc: 'Kolaborasi, Kreativitas', alokasi_waktu: '20 JP', bukti: 'Sketsa Rencana Proyek' },
      { tahap: 'Pelaksanaan Aksi', aktivitas_guru: 'Memantau pengerjaan produk dan memberikan umpan balik berkala.', aktivitas_murid: 'Merealisasikan produk, menguji fungsionalitas, memelihara hasil.', nilai_kbc: 'Kemandirian, Kesehatan', alokasi_waktu: '34 JP', bukti: 'Produk Selesai, Jurnal' },
      { tahap: 'Gelar Karya & Penutup', aktivitas_guru: 'Menyiapkan ruang pameran karya atau presentasi bagi tim.', aktivitas_murid: 'Menjelaskan hasil, menjawab pertanyaan penguji, merefleksikan hikmah.', nilai_kbc: 'Komunikasi, Keimanan', alokasi_waktu: '20 JP', bukti: 'Sertifikat, Laporan Akhir' }
    ]);
  };

  // CHECKBOX SELECTION HELPERS
  const handleToggleDimension = (dimName: string) => {
    if (dimensi.includes(dimName)) {
      setDimensi(dimensi.filter(d => d !== dimName));
    } else {
      setDimensi([...dimensi, dimName]);
    }
  };

  const handleTogglePancaCinta = (topic: string) => {
    if (pancaCinta.includes(topic)) {
      setPancaCinta(pancaCinta.filter(c => c !== topic));
    } else {
      setPancaCinta([...pancaCinta, topic]);
    }
  };

  const handleToggleMateri = (mat: string) => {
    if (materiKbc.includes(mat)) {
      setMateriKbc(materiKbc.filter(m => m !== mat));
    } else {
      setMateriKbc([...materiKbc, mat]);
    }
  };

  const handleToggleTech = (tech: string) => {
    if (teknologi.includes(tech)) {
      setTeknologi(teknologi.filter(t => t !== tech));
    } else {
      setTeknologi([...teknologi, tech]);
    }
  };

  // QUICK SEED CONTOH CEPAT (SECTION S)
  const handleLoadContohCepat = (jenjangTujuan: 'RA' | 'MI' | 'MTs' | 'MA' | 'KBC') => {
    setErrorMsg('');
    if (jenjangTujuan === 'RA') {
      setNamaKegiatan('Harianku Penuh Kasih Sayang');
      setJenjang('RA');
      setKelasFase('Kelas A (5-6 Tahun)');
      setTemaKegiatan('Aku Sayang Diriku dan Temanku');
      setSubtema('Saling Menyapa dan Berbagi Mainan');
      setJenisKokurikuler('Kegiatan Kolaboratif Berbasis Cinta atau KKBC');
      setAlokasiWaktu('2 Minggu');
      setLokasiKegiatan('Sentra Bermain RA Al-Ikhlas');
      setMapelMuatan('Sosial Emosional, Nilai Agama & Moral');
      setJumlahMurid(15);
      setProdukHasil('Gambar kolase kebaikan bersama teman');
      setDimensi(['Keimanan dan ketakwaan terhadap Tuhan Yang Maha Esa', 'Kolaborasi', 'Komunikasi']);
      setPancaCinta(['Cinta Diri dan Sesama Manusia', 'Cinta Allah Swt. dan Rasul-Nya']);
      setMateriKbc([
        'Hadis tentang cinta kasih dan akhlak mulia',
        'Adab bersahabat, peduli, dan menyayangi sesama teman',
        'Ta\'awun (tolong-menolong), tasamuh (toleransi), dan husnuzhan'
      ]);
      setAnalisisKebutuhan('Beberapa murid baru masih malu berinteraksi dan berebut mainan di kelas sentra bermain.');
      setTujuan([
        'Murid mampu membagikan mainan secara bergantian dengan sabar (Kolaborasi).',
        'Murid mampu mendoakan kebaikan bagi temannya sebagai wujud syukur kepada Allah (Keimanan).'
      ]);
      setPedagogis(['Pembiasaan karakter', 'Praktik langsung']);
      setLingkungan(['Ruang kelas', 'Halaman madrasah']);
      setTeknologi(['Video pembelajaran']);
      setMitraMadrasah('Guru mendampingi sapa pagi.');
      setMitraKeluarga('Orang tua membiasakan menyapa salam.');
      setMitraMasyarakat('N/A');
      setMitraMedia('N/A');
      setFormatif('Observasi senyuman dan interaksi saat bermain.');
      setSumatif('Karya kolase dan cerita anak.');
    } else if (jenjangTujuan === 'MI') {
      setNamaKegiatan('Kampanye Madrasahku Bersih dan Hijau');
      setJenjang('MI');
      setKelasFase('Kelas III / Fase B');
      setTemaKegiatan('Madrasahku Bersih dan Indah');
      setSubtema('Pemilahan Sampah Organik & Pembuatan Kompos');
      setJenisKokurikuler('Gerakan 7 Kebiasaan Anak Indonesia Hebat atau G7KAIH');
      setAlokasiWaktu('4 Minggu (40 JP)');
      setLokasiKegiatan('Kompos Depan Kelas III');
      setMapelMuatan('IPAS, Bahasa Indonesia, Fiqih (Thaharah)');
      setJumlahMurid(28);
      setProdukHasil('Poster kampanye kebersihan dan pupuk kompos organik');
      setDimensi(['Kolaborasi', 'Kemandirian', 'Kesehatan']);
      setPancaCinta(['Cinta Lingkungan']);
      setMateriKbc([
        'Menjaga kebersihan madrasah sebagai bagian dari iman (thaharah)',
        'Larangan merusak lingkungan dan berbuat fasad di bumi (QS. Al-A\'raf: 56)',
        'Merawat lingkungan hidup sebagai amanah mulia khilafah'
      ]);
      setAnalisisKebutuhan('Ditemukan banyak laci meja penuh bungkus plastik jajanan dan sisa kertas kertas robek.');
      setTujuan([
        'Murid mampu memilah jenis sampah basah dan kering secara mandiri (Kemandirian).',
        'Murid mampu bekerja sama membuat media kompos organik dari daun kering (Kolaborasi).'
      ]);
      setPedagogis(['Pembelajaran berbasis proyek', 'Praktik langsung']);
      setLingkungan(['Halaman madrasah', 'Kebun madrasah']);
      setTeknologi(['Canva']);
      setMitraMadrasah('Guru menyediakan tempat sampah warna.');
      setMitraKeluarga('Membiasakan memilah sampah di rumah.');
      setMitraMasyarakat('Mendatangkan petugas pengolah kebersihan lingkungan.');
      setMitraMedia('Publikasi foto di mading.');
    } else if (jenjangTujuan === 'MTs') {
      setNamaKegiatan('Vertical Garden Indah dan Asri');
      setJenjang('MTs');
      setKelasFase('Kelas VII / Fase D');
      setTemaKegiatan('Cinta Lingkungan Madrasah');
      setSubtema('Pemanfaatan Botol Bekas Pengganti Pot Plastik');
      setJenisKokurikuler('Pembelajaran Kolaboratif Lintas Disiplin Ilmu');
      setAlokasiWaktu('104 JP (3 Bulan)');
      setLokasiKegiatan('Tembok halaman belakang madrasah');
      setMapelMuatan('IPA (Ekosistem), Matematika (Data & Pengukuran), Al-Qur\'an Hadis');
      setJumlahMurid(60);
      setProdukHasil('Rak Vertical Garden asri dari botol bekas');
      setDimensi(['Penalaran kritis', 'Kolaborasi', 'Kesehatan']);
      setPancaCinta(['Cinta Lingkungan', 'Cinta Ilmu']);
      setMateriKbc([
        'Larangan merusak lingkungan dan berbuat fasad di bumi (QS. Al-A\'raf: 56)',
        'Sumber ilmu qauliyah (wahyu) dan kauniyah (semesta alam)',
        'Adab terhadap alam, hewan, dan kelestarian tanaman'
      ]);
      setAnalisisKebutuhan('Madrasah memiliki area gersang sempit namun berpasir. Penanaman vertikal hemat lahan sangat dibutuhkan.');
      setTujuan([
        'Murid mampu menghitung volume tanah dan mengukur rasio tinggi tanaman mingguan (Penalaran Kritis).',
        'Murid mampu merakit gantungan botol secara gotong royong terbagi rata (Kolaborasi).'
      ]);
      setPedagogis(['Pembelajaran berbasis proyek', 'Observasi lingkungan']);
      setLingkungan(['Halaman madrasah', 'Kebun madrasah']);
      setTeknologi(['Aplikasi spreadsheet', 'Canva']);
    } else if (jenjangTujuan === 'MA') {
      setNamaKegiatan('Riset Mini Pengolahan Air Payau Terpadu');
      setJenjang('MA');
      setKelasFase('Kelas X / Fase E');
      setTemaKegiatan('Gaya Hidup Berkelanjutan');
      setSubtema('Filtrasi Karbon Aktif Sederhana untuk Wudu');
      setJenisKokurikuler('Pembelajaran Kolaboratif Lintas Disiplin Ilmu');
      setAlokasiWaktu('108 JP');
      setLokasiKegiatan('Laboratorium Kimia & Tempat Wudu');
      setMapelMuatan('Kimia (Koloid & Adsorpsi), Fiqih (Thaharah), Ekonomi (Analisis Biaya)');
      setJumlahMurid(32);
      setProdukHasil('Alat filtrasi penjernih air wudu & Laporan riset mini');
      setDimensi(['Penalaran kritis', 'Kreativitas', 'Komunikasi']);
      setPancaCinta(['Cinta Ilmu', 'Cinta Lingkungan']);
      setMateriKbc([
        'Sumber ilmu qauliyah (wahyu) dan kauniyah (semesta alam)',
        'Inovasi, nalar kritis, dan pemecahan masalah',
        'Gerakan hemat energi (air dan listrik)'
      ]);
      setAnalisisKebutuhan('Air sumur wudu madrasah berwarna agak kekuningan dan berbau zat besi tinggi sehingga kurang nyaman.');
      setTujuan([
        'Murid mampu menganalisis efektivitas pasir silika dan arang aktif dalam adsorpsi zat besi (Penalaran Kritis).',
        'Murid mampu mendesain prototipe saringan bertingkat hemat biaya (Kreativitas).',
        'Murid mampu mempresentasikan laporan riset di depan kepala madrasah dan pengawas (Komunikasi).'
      ]);
      setPedagogis(['Pembelajaran berbasis masalah', 'Inquiry/penyelidikan']);
      setLingkungan(['Laboratorium', 'Mushalla/Masjid']);
      setTeknologi(['PowerPoint', 'Google Drive']);
    } else if (jenjangTujuan === 'KBC') {
      // Harianku Penuh Cinta
      setNamaKegiatan('Kutubuku Kebaikan: Satu Murid Satu Kebaikan');
      setJenjang('Semua');
      setKelasFase('Semua Kelas');
      setTemaKegiatan('Harianku Penuh Cinta');
      setSubtema('Jurnal Kebaikan Sosial dan Refleksi Adab Harian');
      setJenisKokurikuler('Kegiatan Kolaboratif Berbasis Cinta atau KKBC');
      setAlokasiWaktu('1 Semester');
      setLokasiKegiatan('Lingkungan Madrasah dan Rumah');
      setMapelMuatan('Akidah Akhlak, Bahasa Indonesia (Menulis Jurnal)');
      setJumlahMurid(120);
      setProdukHasil('Buku Jurnal Saku Perbuatan Baik');
      setDimensi(['Keimanan dan ketakwaan terhadap Tuhan Yang Maha Esa', 'Kemandirian', 'Komunikasi']);
      setPancaCinta(['Cinta Allah Swt. dan Rasul-Nya', 'Cinta Diri dan Sesama Manusia']);
      setMateriKbc([
        'Hadis tentang cinta kasih dan akhlak mulia',
        'Akhlak terpuji kepada diri sendiri (self-respect, self-compassion)',
        'Sikap ta\'awun (tolong-menolong), tafahum, tasamuh (toleransi), dan husnuzhan'
      ]);
      setAnalisisKebutuhan('Pentingnya melatih kepekaan sosial harian dan merekam perbuatan jujur secara sadar.');
      setTujuan([
        'Murid mampu membiasakan diri menuliskan 1 perbuatan baik spontan setiap hari di jurnal saku (Kemandirian).',
        'Murid mampu merefleksikan makna tolong menolong meneladani hadis Rasulullah (Keimanan).'
      ]);
      setPedagogis(['Pembiasaan karakter', 'Diskusi reflektif']);
      setLingkungan(['Ruang kelas', 'Rumah']);
      setTeknologi(['Tidak menggunakan teknologi digital']);
    }

    setMsg('Templat Contoh Cepat berhasil dimuat. Silakan modifikasi isinya sesuai kebutuhan.');
    setTimeout(() => setMsg(''), 4000);
  };

  // AUTO GENERATE EXPLANATIONS
  const handleAutoFillObjectives = () => {
    const goals: string[] = [];
    if (dimensi.length === 0 || pancaCinta.length === 0) {
      setErrorMsg('Pilih minimal satu dimensi dan satu topik Panca Cinta terlebih dahulu untuk merakit tujuan.');
      return;
    }
    setErrorMsg('');
    dimensi.forEach((dim, idx) => {
      const cleanDim = dim.replace(/ terhadap Tuhan.*/, '');
      const ct = pancaCinta[idx % pancaCinta.length];
      goals.push(`Murid mampu mengembangkan kompetensi ${cleanDim} melalui aktivitas nyata bertema ${temaKegiatan} sebagai refleksi dari nilai luhur ${ct}.`);
    });
    setTujuan(goals);
  };

  const handleAutoFillPedagogyExp = () => {
    // autofill pedagis
    setPedagogis(['Pembelajaran berbasis proyek', 'Praktik langsung', 'Diskusi reflektif']);
    setLingkungan(['Halaman madrasah', 'Mushalla/Masjid']);
    setTeknologi(['Video pembelajaran', 'Canva']);
    setMitraMadrasah('Fasilitator dewan guru membimbing pengerjaan.');
    setMitraKeluarga('Orang tua memantau dan memberi motivasi di rumah.');
    setMitraMasyarakat('Melibatkan rukun tetangga dan praktisi lokal.');
    setMitraMedia('Menggunakan WhatsApp group dan instagram madrasah.');
  };

  // OBSERVATION SHEET GENERATOR (SECTION O.15)
  const handleGenerateStudentObsRows = async () => {
    const list = await db.murid.list();
    const activeSch = await db.madrasah.getFirst();
    const activeSchId = activeSch?.id || 'madr-1';
    const schStudents = list.filter(s => s.madrasah_id === activeSchId);
    
    if (schStudents.length === 0) {
      alert('Daftarkan siswa/murid di menu "Data Murid" terlebih dahulu agar dapat membuat lembar observasi.');
      return;
    }

    const selDim = dimensi[0] || 'Kolaborasi';
    const selCinta = pancaCinta[0] || 'Cinta Lingkungan';

    const obsRows = schStudents.map(s => ({
      id: s.id,
      nama_murid: s.nama_murid,
      dimensi_yang_diamati: selDim,
      topik_panca_cinta_yang_diamati: selCinta,
      predikat: 'B' as const,
      catatan_perilaku: `${s.nama_murid} sudah menunjukkan minat dan kebiasaan yang baik dalam ${selDim.toLowerCase()} (${selCinta}) secara konsisten.`,
      tindak_lanjut: 'Pertahankan kebiasaan baik dan bimbing terus secara berkala.'
    }));

    setObservasi(obsRows);
  };

  const handleUpdateStudentObsGrade = (index: number, val: 'SB' | 'B' | 'C' | 'K') => {
    const next = [...observasi];
    const obsItem = next[index];
    if (!obsItem) return;

    const nama = obsItem.nama_murid || 'Murid';
    const dim = obsItem.dimensi_yang_diamati || 'karakter';
    const cinta = obsItem.topik_panca_cinta_yang_diamati || 'Panca Cinta';

    let defaultCatatan = '';
    let defaultTindakLanjut = '';

    if (val === 'SB') {
      defaultCatatan = `${nama} menunjukkan konsistensi sangat tinggi dalam ${dim.toLowerCase()} (${cinta}), sangat mandiri dan menjadi teladan bagi teman-temannya.`;
      defaultTindakLanjut = 'Apresiasi tinggi dan berikan peran sebagai tutor sebaya / ketua kelompok proyek.';
    } else if (val === 'B') {
      defaultCatatan = `${nama} sudah menunjukkan minat dan kebiasaan yang baik dalam ${dim.toLowerCase()} (${cinta}) secara konsisten.`;
      defaultTindakLanjut = 'Pertahankan kebiasaan baik dan bimbing terus secara berkala.';
    } else if (val === 'C') {
      defaultCatatan = `${nama} mulai menunjukkan perkembangan dalam ${dim.toLowerCase()} (${cinta}), namun masih perlu sering diingatkan oleh fasilitator.`;
      defaultTindakLanjut = 'Diberikan motivasi tambahan dan pendampingan berkala saat aktivitas kelompok.';
    } else {
      defaultCatatan = `${nama} belum terbiasa menunjukkan sikap dalam ${dim.toLowerCase()} (${cinta}) dan masih membutuhkan arahan khusus.`;
      defaultTindakLanjut = 'Pendampingan khusus secara individual serta jalin komunikasi khusus dengan orang tua/wali.';
    }

    next[index] = {
      ...obsItem,
      predikat: val,
      catatan_perilaku: defaultCatatan,
      tindak_lanjut: defaultTindakLanjut
    };

    setObservasi(next);

    // Auto update reporting list if reports exist so student report card narration stays in sync
    if (pelaporan && pelaporan.length > 0) {
      setPelaporan(prevReports => {
        return prevReports.map(rep => {
          if (rep.student_id === obsItem.id || rep.nama_murid === nama) {
            let desc = '';
            if (val === 'SB') {
              desc = `Ananda ${nama} menunjukkan perkembangan yang Sangat Baik dalam proyek ${namaKegiatan || 'kokurikuler'}. Ananda sangat konsisten mewujudkan dimensi ${dim} dan menginternalisasi nilai ${cinta}. Catatan perilaku: ${defaultCatatan} Sangat direkomendasikan untuk mempertahankan prestasi dan menginspirasi teman sekelas.`;
            } else if (val === 'B') {
              desc = `Ananda ${nama} berkembang Baik selama proyek. Ananda menunjukkan sikap kooperatif dalam ${dim} serta kepedulian terhadap ${cinta}. Catatan perilaku: ${defaultCatatan} Bimbingan berlanjut untuk meningkatkan inisiatif mandiri.`;
            } else if (val === 'C') {
              desc = `Ananda ${nama} mulai menunjukkan perkembangan Cukup/Sedang dalam ${dim}. Catatan perilaku: ${defaultCatatan} Masih memerlukan dorongan intensif dari pendidik dan orang tua di rumah agar nilai adab senantiasa diamalkan.`;
            } else {
              desc = `Ananda ${nama} memerlukan bimbingan lebih lanjut dalam ${dim}. Catatan perilaku: ${defaultCatatan} Diperlukan pendampingan khusus dan tindak lanjut: ${defaultTindakLanjut}`;
            }
            return { ...rep, deskripsi: desc };
          }
          return rep;
        });
      });
    }
  };

  const handleUpdateStudentObsNotes = (index: number, val: string) => {
    const next = [...observasi];
    next[index].catatan_perilaku = val;
    setObservasi(next);

    const obsItem = next[index];
    if (obsItem && pelaporan && pelaporan.length > 0) {
      setPelaporan(prevReports => {
        return prevReports.map(rep => {
          if (rep.student_id === obsItem.id || rep.nama_murid === obsItem.nama_murid) {
            let desc = '';
            const nama = obsItem.nama_murid;
            const dim = obsItem.dimensi_yang_diamati || 'karakter';
            const cinta = obsItem.topik_panca_cinta_yang_diamati || 'Panca Cinta';
            if (obsItem.predikat === 'SB') {
              desc = `Ananda ${nama} menunjukkan perkembangan yang Sangat Baik dalam proyek ${namaKegiatan || 'kokurikuler'}. Ananda sangat konsisten mewujudkan dimensi ${dim} dan menginternalisasi nilai ${cinta}. Catatan perilaku: ${val} Sangat direkomendasikan untuk mempertahankan prestasi dan menginspirasi teman sekelas.`;
            } else if (obsItem.predikat === 'B') {
              desc = `Ananda ${nama} berkembang Baik selama proyek. Ananda menunjukkan sikap kooperatif dalam ${dim} serta kepedulian terhadap ${cinta}. Catatan perilaku: ${val} Bimbingan berlanjut untuk meningkatkan inisiatif mandiri.`;
            } else if (obsItem.predikat === 'C') {
              desc = `Ananda ${nama} mulai menunjukkan perkembangan Cukup/Sedang dalam ${dim}. Catatan perilaku: ${val} Masih memerlukan dorongan intensif dari pendidik dan orang tua di rumah agar nilai adab senantiasa diamalkan.`;
            } else {
              desc = `Ananda ${nama} memerlukan bimbingan lebih lanjut dalam ${dim}. Catatan perilaku: ${val} Diperlukan pendampingan khusus dan tindak lanjut: ${obsItem.tindak_lanjut}`;
            }
            return { ...rep, deskripsi: desc };
          }
          return rep;
        });
      });
    }
  };

  const handleUpdateStudentObsAction = (index: number, val: string) => {
    const next = [...observasi];
    next[index].tindak_lanjut = val;
    setObservasi(next);
  };

  // REPORT DESCRIPTIONS GENERATOR (SECTION O.17)
  const handleGenerateStudentReports = () => {
    if (observasi.length === 0) {
      alert('Harap isi dan buat baris Lembar Observasi terlebih dahulu agar sistem dapat mengekstrak deskripsi otomatis.');
      return;
    }
    const reports = observasi.map(obs => {
      let desc = '';
      if (obs.predikat === 'SB') {
        desc = `Ananda ${obs.nama_murid} menunjukkan perkembangan yang Sangat Baik dalam proyek ${namaKegiatan}. Ananda sangat konsisten mewujudkan dimensi ${obs.dimensi_yang_diamati} dan menginternalisasi nilai ${obs.topik_panca_cinta_yang_diamati}. Catatan perilaku: ${obs.catatan_perilaku}. Sangat direkomendasikan untuk mempertahankan prestasi dan menginspirasi teman sekelas.`;
      } else if (obs.predikat === 'B') {
        desc = `Ananda ${obs.nama_murid} berkembang Baik selama proyek. Ananda menunjukkan sikap kooperatif dalam ${obs.dimensi_yang_diamati} serta kepedulian terhadap ${obs.topik_panca_cinta_yang_diamati}. Bimbingan berlanjut untuk meningkatkan inisiatif mandiri.`;
      } else {
        desc = `Ananda ${obs.nama_murid} mulai menunjukkan perkembangan Cukup/Sedang dalam ${obs.dimensi_yang_diamati}. Masih memerlukan dorongan intensif dari pendidik dan orang tua di rumah agar nilai adab senantiasa diamalkan.`;
      }
      return {
        student_id: obs.id,
        nama_murid: obs.nama_murid,
        deskripsi: desc
      };
    });
    setPelaporan(reports);
  };

  // GENERATE EVALUASI & RTL AUTOMATICALLY
  const handleGenerateEvaluasiRTL = () => {
    const kgt = namaKegiatan || 'Kegiatan Kokurikuler Projek KBC';
    const dimStr = dimensi.length > 0 ? dimensi.join(', ') : 'Penalaran Kritis & Gotong Royong';
    const cintaStr = pancaCinta.length > 0 ? pancaCinta.join(', ') : 'Cinta Lingkungan & Cinta Sesama';

    let totalObs = observasi.length;
    let sbCount = observasi.filter(o => o.predikat === 'SB').length;
    let bCount = observasi.filter(o => o.predikat === 'B').length;
    let pct = totalObs > 0 ? Math.round(((sbCount + bCount) / totalObs) * 100) : 92;

    setEvalKetercapaian(`${pct}% murid mencapai indikator ketercapaian target karakter (${dimStr}) dengan predikat Sangat Baik dan Baik.`);
    setEvalRTL(`1. Melanjutkan kegiatan pembiasaan harian/mingguan berbasis ${cintaStr}.\n2. Menjadwalkan piket monitoring dan pendampingan rutin oleh tim fasilitator.\n3. Mengintegrasikan hasil proyek ke dalam pameran karya/panen hasil belajar madrasah.`);
    setEvalPendukung(`- Antusiasme dan partisipasi aktif murid yang tinggi selama proyek ${kgt}.\n- Dukungan penuh dari Kepala Madrasah, Tim Kerja, serta orang tua murid.\n- Ketersediaan media pendukung dan lingkungan madrasah yang memadai.`);
    setEvalHambatan(`- Keterbatasan alokasi waktu pada beberapa sesi praktek lapangan.\n- Keragaman tingkat kesiapan dan pemahaman awal beberapa murid.`);
    setEvalDampakMurid(`- Murid menunjukkan peningkatan sikap disiplin, kepedulian sosial, serta kesadaran tinggi terhadap ${cintaStr}.\n- Terbentuknya kebiasaan bekerja sama dan saling menghargai antarteman kelompok.`);
    setEvalDampakMadrasah(`- Lingkungan madrasah menjadi lebih bersih, asri, kondusif, dan bernuansa islami.\n- Terwujudnya budaya kolaborasi yang makin erat di antara guru, murid, dan warga madrasah.`);
  };

  // SAVE MAIN DOCUMENT
  const handleSaveDocument = async (nextStatus?: 'Draft' | 'Diajukan' | 'Disetujui') => {
    if (isReadOnly) return;
    if (!namaKegiatan.trim()) {
      setErrorMsg('Nama kegiatan kokurikuler wajib diisi.');
      return;
    }
    if (dimensi.length === 0 || pancaCinta.length === 0) {
      setErrorMsg('Harap pilih minimal satu dimensi profil dan satu topik Panca Cinta.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setMsg('');

    try {
      const payload: Omit<PerencanaanKokurikuler, 'id'> & { id?: string } = {
        id: docId || undefined,
        madrasah_id: schoolId || 'madr-1',
        nama_kegiatan: namaKegiatan,
        jenjang,
        kelas_fase: kelasFase,
        semester,
        tahun_pelajaran: tahunPelajaran,
        tema_kegiatan: temaKegiatan,
        subtema,
        jenis_kokurikuler: jenisKokurikuler,
        alokasi_waktu: alokasiWaktu,
        lokasi_kegiatan: lokasiKegiatan,
        guru_koordinator: guruKoordinator,
        mata_pelajaran_muatan: mapelMuatan,
        jumlah_murid: jumlahMurid,
        produk_hasil: produkHasil,
        dimensi_profil_lulusan: dimensi,
        topik_panca_cinta: pancaCinta,
        materi_integrasi_kbc: materiKbc,
        analisis_kebutuhan: analisisKebutuhan,
        tujuan_pembelajaran: tujuan,
        praktik_pedagogis: pedagogis,
        lingkungan_pembelajaran: lingkungan,
        teknologi_digital: teknologi,
        kemitraan_pembelajaran: {
          madrasah: mitraMadrasah,
          keluarga: mitraKeluarga,
          masyarakat: mitraMasyarakat,
          media: mitraMedia
        },
        alur_kegiatan: alur,
        asesmen: {
          formatif,
          sumatif,
          teknik: teknikAsesmen
        },
        rubrik: rubrik.length > 0 ? rubrik : [
          { dimensi: dimensi[0] || 'Kolaborasi', indikator: 'Keaktifan gotong royong', sb: 'Sangat giat membantu dan berbagi peran secara adil.', b: 'Aktif berpartisipasi sesuai tugas kelompok.', c: 'Hanya bekerja jika didorong/diingatkan teman.', k: 'Pasif dan tidak ikut menyelesaikan tanggung jawab.' }
        ],
        lembar_observasi: observasi,
        jurnal_pelaksanaan: jurnal,
        pelaporan_hasil: pelaporan,
        evaluasi_tindak_lanjut: {
          ketercapaian_tujuan: evalKetercapaian,
          faktor_pendukung: evalPendukung,
          hambatan: evalHambatan,
          solusi: evalSolusi,
          dampak_murid: evalDampakMurid,
          dampak_madrasah: evalDampakMadrasah,
          rencana_tindak_lanjut: evalRTL,
          rekomendasi_berikutnya: evalRekomendasi,
          narasi_otomatis: `Proyek '${namaKegiatan}' diselesaikan dengan baik untuk tahun pelajaran ${tahunPelajaran}. RTL: ${evalRTL}`
        },
        status_dokumen: nextStatus || statusDokumen,
        created_by: user.id
      };

      let result;
      if (docId) {
        result = await db.perencanaanKokurikuler.update(docId, payload);
      } else {
        result = await db.perencanaanKokurikuler.create(payload as Omit<PerencanaanKokurikuler, 'id'>);
        setDocId(result.id);
      }

      setStatusDokumen(nextStatus || statusDokumen);
      setMsg(`Perencanaan Kokurikuler '${namaKegiatan}' berhasil disimpan online dengan status ${nextStatus || statusDokumen}.`);
      
      await db.logs.create({
        user_id: user.id,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        aktivitas: docId ? 'Update Rencana Kokurikuler' : 'Buat Rencana Kokurikuler',
        keterangan: `Menyimpan dokumen rencana proyek: ${namaKegiatan}`
      });

      setTimeout(() => setMsg(''), 4000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal menyimpan rencana.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="generator-view">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Rakit & Generate Rencana Kokurikuler</h2>
          <p className="text-xs text-slate-400">Rancang dokumen perencanaan proyek kokurikuler lengkap, alur modul, rubrik, penilaian, dan pelaporan</p>
        </div>
        
        {docId && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onNavigate('arsip')}
              className="bg-slate-100 hover:bg-slate-200 border text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-lg transition-colors"
            >
              Kembali ke Arsip
            </button>
            <button
              onClick={() => onNavigate('preview_cetak', docId)}
              className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs px-4 py-2.5 rounded-lg flex items-center space-x-1.5 shadow"
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span>Preview & Cetak A4</span>
            </button>
          </div>
        )}
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-sm font-semibold flex items-center gap-2">
          <FileCheck className="w-5 h-5 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-100 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Quick Examples Loader banner (Section S) */}
      {!isReadOnly && !docId && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-amber-900">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="font-bold text-xs">Pemuat Contoh Cepat Proyek (Sekali Klik)</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-normal">
            Pilih salah satu templat madrasah siap pakai di bawah ini. Formulir wizard akan terisi otomatis dan tetap dapat Anda modifikasi sepenuhnya sebelum disimpan.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={() => handleLoadContohCepat('RA')} className="bg-white hover:bg-slate-50 border border-amber-300/60 text-amber-900 font-bold text-[10px] px-3 py-1.5 rounded-lg">RA: Saling Berbagi (KKBC)</button>
            <button type="button" onClick={() => handleLoadContohCepat('MI')} className="bg-white hover:bg-slate-50 border border-amber-300/60 text-amber-900 font-bold text-[10px] px-3 py-1.5 rounded-lg">MI: Pilah Sampah (G7KAIH)</button>
            <button type="button" onClick={() => handleLoadContohCepat('MTs')} className="bg-white hover:bg-slate-50 border border-amber-300/60 text-amber-900 font-bold text-[10px] px-3 py-1.5 rounded-lg">MTs: Vertical Garden (Lintas Mapel)</button>
            <button type="button" onClick={() => handleLoadContohCepat('MA')} className="bg-white hover:bg-slate-50 border border-amber-300/60 text-amber-900 font-bold text-[10px] px-3 py-1.5 rounded-lg">MA: Filtrasi Air (Lintas Mapel)</button>
            <button type="button" onClick={() => handleLoadContohCepat('KBC')} className="bg-white hover:bg-slate-50 border border-amber-300/60 text-amber-900 font-bold text-[10px] px-3 py-1.5 rounded-lg">Semua: Harianku Penuh Cinta (KKBC)</button>
          </div>
        </div>
      )}

      {/* 2. Horizontal Mini Sub-Tabs inside planner */}
      <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap bg-white rounded-t-xl px-2">
        <button onClick={() => setActiveTab('identitas')} className={`px-4 py-3 text-xs font-bold border-b-2 ${activeTab === 'identitas' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'}`}>1. Identitas & Deskripsi</button>
        <button onClick={() => setActiveTab('kbc')} className={`px-4 py-3 text-xs font-bold border-b-2 ${activeTab === 'kbc' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'}`}>2. Karakter KBC</button>
        <button onClick={() => setActiveTab('pedagogi')} className={`px-4 py-3 text-xs font-bold border-b-2 ${activeTab === 'pedagogi' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'}`}>3. Kemitraan & Media</button>
        <button onClick={() => setActiveTab('alur')} className={`px-4 py-3 text-xs font-bold border-b-2 ${activeTab === 'alur' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'}`}>4. Alur Kegiatan</button>
        <button onClick={() => setActiveTab('rubrik')} className={`px-4 py-3 text-xs font-bold border-b-2 ${activeTab === 'rubrik' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'}`}>5. Rubrik Asesmen</button>
        <button onClick={() => setActiveTab('observasi')} className={`px-4 py-3 text-xs font-bold border-b-2 ${activeTab === 'observasi' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'}`}>6. Lembar Observasi</button>
        <button onClick={() => setActiveTab('jurnal')} className={`px-4 py-3 text-xs font-bold border-b-2 ${activeTab === 'jurnal' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'}`}>7. Jurnal Log</button>
        <button onClick={() => setActiveTab('laporan')} className={`px-4 py-3 text-xs font-bold border-b-2 ${activeTab === 'laporan' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'}`}>8. Cetak Rapor</button>
        <button onClick={() => setActiveTab('evaluasi')} className={`px-4 py-3 text-xs font-bold border-b-2 ${activeTab === 'evaluasi' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500'}`}>9. Evaluasi & RTL</button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs">Memuat dokumen rancangan...</div>
      ) : (
        <div className="bg-white border border-t-0 border-slate-100 rounded-b-xl shadow-sm p-6 space-y-6">
          {/* TAB 1: IDENTITAS */}
          {activeTab === 'identitas' && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-1.5 text-emerald-800">Identitas Utama Modul</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nama Kegiatan */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block">Nama / Judul Kegiatan Kokurikuler <span className="text-red-500">*</span></label>
                  <input type="text" value={namaKegiatan} onChange={e => setNamaKegiatan(e.target.value)} disabled={isReadOnly} placeholder="Contoh: Pembuatan Vertical Garden Asri" className="w-full text-xs border rounded-lg p-2 focus:border-emerald-600 focus:outline-none" />
                </div>
                {/* Jenjang */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Jenjang Sasaran</label>
                  <select value={jenjang} onChange={e => setJenjang(e.target.value)} disabled={isReadOnly} className="w-full text-xs border rounded-lg p-2 focus:outline-none">
                    <option value="RA">RA</option>
                    <option value="MI">MI</option>
                    <option value="MTs">MTs</option>
                    <option value="MA">MA</option>
                    <option value="MAK">MAK</option>
                  </select>
                </div>
                {/* Kelas / Fase */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Kelas & Fase Perkembangan <span className="text-red-500">*</span></label>
                  <input type="text" value={kelasFase} onChange={e => setKelasFase(e.target.value)} disabled={isReadOnly} placeholder="Contoh: VII / Fase D" className="w-full text-xs border rounded-lg p-2" />
                </div>
                {/* Semester */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Semester</label>
                  <select value={semester} onChange={e => setSemester(e.target.value)} disabled={isReadOnly} className="w-full text-xs border rounded-lg p-2">
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
                {/* Tahun Pelajaran */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Tahun Pelajaran</label>
                  <input type="text" value={tahunPelajaran} onChange={e => setTahunPelajaran(e.target.value)} disabled={isReadOnly} className="w-full text-xs border rounded-lg p-2" />
                </div>
                {/* Tema Utama */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Tema Kegiatan Kokurikuler <span className="text-red-500">*</span></label>
                  <select value={temaKegiatan} onChange={e => setTemaKegiatan(e.target.value)} disabled={isReadOnly} className="w-full text-xs border rounded-lg p-2">
                    <option value="Aku Sayang Diriku dan Temanku">Aku Sayang Diriku dan Temanku</option>
                    <option value="Hidup Bersih dan Sehat">Hidup Bersih dan Sehat</option>
                    <option value="Cinta Lingkungan Madrasah">Cinta Lingkungan Madrasah</option>
                    <option value="Madrasahku Bersih dan Indah">Madrasahku Bersih dan Indah</option>
                    <option value="Gerakan Hemat Air dan Listrik">Gerakan Hemat Air dan Listrik</option>
                    <option value="Kantin Sehat Madrasah">Kantin Sehat Madrasah</option>
                    <option value="Market Day Berbasis Akhlak">Market Day Berbasis Akhlak</option>
                    <option value="Ekoteologi Madrasah">Ekoteologi Madrasah</option>
                    <option value="Peduli dan Berbagi">Peduli dan Berbagi</option>
                    <option value="Aku Cinta Indonesia">Aku Cinta Indonesia</option>
                    <option value="Kearifan Lokal Daerahku">Kearifan Lokal Daerahku</option>
                    <option value="Harianku Penuh Cinta">Harianku Penuh Cinta</option>
                  </select>
                </div>
                {/* Subtema */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Subtema / Judul Topik Spesifik</label>
                  <input type="text" value={subtema} onChange={e => setSubtema(e.target.value)} disabled={isReadOnly} placeholder="Pemanfaatan pupuk alami" className="w-full text-xs border rounded-lg p-2" />
                </div>
                {/* Jenis Kokurikuler */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Jenis Kegiatan Kokurikuler <span className="text-red-500">*</span></label>
                  <select value={jenisKokurikuler} onChange={e => setJenisKokurikuler(e.target.value)} disabled={isReadOnly} className="w-full text-xs border rounded-lg p-2">
                    <option value="Pembelajaran Kolaboratif Lintas Disiplin Ilmu">Pembelajaran Lintas Disiplin Ilmu</option>
                    <option value="Gerakan 7 Kebiasaan Anak Indonesia Hebat atau G7KAIH">Gerakan G7KAIH (7 Kebiasaan)</option>
                    <option value="Kegiatan Kolaboratif Berbasis Cinta atau KKBC">Kegiatan KKBC (Berbasis Cinta)</option>
                    <option value="Cara lainnya sesuai kebijakan madrasah">Cara lainnya (Kustom Madrasah)</option>
                  </select>
                </div>
                {/* Alokasi Waktu */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Alokasi Waktu (JP / Durasi) <span className="text-red-500">*</span></label>
                  <input type="text" value={alokasiWaktu} onChange={e => setAlokasiWaktu(e.target.value)} disabled={isReadOnly} placeholder="Contoh: 104 JP (3 Bulan)" className="w-full text-xs border rounded-lg p-2" />
                </div>
                {/* Lokasi */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Lokasi Kegiatan</label>
                  <input type="text" value={lokasiKegiatan} onChange={e => setLokasiKegiatan(e.target.value)} disabled={isReadOnly} placeholder="Halaman madrasah" className="w-full text-xs border rounded-lg p-2" />
                </div>
                {/* Guru Koordinator */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Guru Koordinator Proyek <span className="text-red-500">*</span></label>
                  <input type="text" value={guruKoordinator} onChange={e => setGuruKoordinator(e.target.value)} disabled={isReadOnly} className="w-full text-xs border rounded-lg p-2" />
                </div>
                {/* Mapel Terkait */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Mata Pelajaran / Muatan Terkait</label>
                  <input type="text" value={mapelMuatan} onChange={e => setMapelMuatan(e.target.value)} disabled={isReadOnly} placeholder="IPA, Matematika, Fiqih, dll" className="w-full text-xs border rounded-lg p-2" />
                </div>
                {/* Jumlah Murid */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">Estimasi Jumlah Murid Terlibat</label>
                  <input type="number" value={jumlahMurid} onChange={e => setJumlahMurid(Number(e.target.value))} disabled={isReadOnly} className="w-full text-xs border rounded-lg p-2" />
                </div>
                {/* Produk Hasil */}
                <div className="space-y-1 md:col-span-3">
                  <label className="text-[11px] font-bold text-slate-700 block">Produk / Hasil Akhir Kegiatan</label>
                  <input type="text" value={produkHasil} onChange={e => setProdukHasil(e.target.value)} disabled={isReadOnly} placeholder="Contoh: Rak vertical garden, laporan, video kampanye sosial..." className="w-full text-xs border rounded-lg p-2" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KARAKTER KBC */}
          {activeTab === 'kbc' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dimensi Checklist */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 border-b pb-1.5 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-700" />
                    <span>8 Dimensi Karakter Profil Lulusan</span>
                  </h4>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {[
                      'Keimanan dan ketakwaan terhadap Tuhan Yang Maha Esa',
                      'Kewargaan',
                      'Penalaran kritis',
                      'Kreativitas',
                      'Kolaborasi',
                      'Kemandirian',
                      'Kesehatan',
                      'Komunikasi'
                    ].map(dim => (
                      <label key={dim} className="flex items-start space-x-2 text-xs text-slate-700 font-semibold cursor-pointer">
                        <input type="checkbox" checked={dimensi.includes(dim)} onChange={() => handleToggleDimension(dim)} disabled={isReadOnly} className="accent-emerald-700 w-4 h-4 shrink-0 mt-0.5" />
                        <span>{dim}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Panca Cinta Checklist */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 border-b pb-1.5 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>5 Prioritas Panca Cinta (KBC)</span>
                  </h4>
                  <div className="space-y-3">
                    {[
                      'Cinta Allah Swt. dan Rasul-Nya',
                      'Cinta Ilmu',
                      'Cinta Lingkungan',
                      'Cinta Diri dan Sesama Manusia',
                      'Cinta Tanah Air'
                    ].map(ct => (
                      <label key={ct} className="flex items-center space-x-2 text-xs text-slate-700 font-semibold cursor-pointer">
                        <input type="checkbox" checked={pancaCinta.includes(ct)} onChange={() => handleTogglePancaCinta(ct)} disabled={isReadOnly} className="accent-emerald-700 w-4 h-4 shrink-0" />
                        <span>{ct}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Materi Integrasi recommended check list based on chosen Panca Cinta */}
              <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 space-y-3">
                <h4 className="font-bold text-xs text-slate-800">Materi Integrasi Sistem Perencanaan Kokurikuler - KBC</h4>
                <p className="text-[10px] text-slate-400">Pilih rekomendasi hadis/ayat/pedagogi adab di bawah ini berdasarkan topik Panca Cinta terpilih:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {pancaCinta.map(cintaTopic => {
                    const materials = RECOMMENDED_MATERIALS[cintaTopic] || [];
                    return (
                      <div key={cintaTopic} className="bg-white p-3 rounded-lg border border-slate-100 space-y-1.5 shadow-sm">
                        <p className="font-bold text-[10px] text-emerald-800 uppercase tracking-wider">{cintaTopic}</p>
                        <div className="space-y-1">
                          {materials.map(mat => (
                            <label key={mat} className="flex items-start space-x-2 text-[11px] text-slate-600 font-medium cursor-pointer">
                              <input type="checkbox" checked={materiKbc.includes(mat)} onChange={() => handleToggleMateri(mat)} disabled={isReadOnly} className="accent-emerald-700 w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>{mat}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Analisis Kebutuhan & Konteks */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                <h4 className="font-bold text-xs text-slate-800">4. Analisis Kebutuhan Belajar & Pemilihan Tema</h4>
                <textarea 
                  rows={3}
                  value={analisisKebutuhan}
                  onChange={e => setAnalisisKebutuhan(e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Deskripsikan latar belakang pemilihan tema, masalah riil di madrasah, dan potensi lokal daerah..."
                  className="w-full text-xs border rounded-lg p-2.5 bg-white focus:outline-none"
                />
              </div>

              {/* Tujuan Pembelajaran Auto Constructor */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h4 className="font-bold text-xs text-slate-800">5. Rumusan Tujuan Pembelajaran Kokurikuler</h4>
                  {!isReadOnly && (
                    <button type="button" onClick={handleAutoFillObjectives} className="bg-amber-400 text-emerald-950 font-bold text-[10px] px-2.5 py-1 rounded">
                      Rakit Tujuan Otomatis
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {tujuan.map((g, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-emerald-800">{idx+1}.</span>
                      <input 
                        type="text" 
                        value={g} 
                        onChange={e => {
                          const next = [...tujuan];
                          next[idx] = e.target.value;
                          setTujuan(next);
                        }}
                        disabled={isReadOnly}
                        className="flex-1 text-xs border rounded p-1.5 bg-white" 
                      />
                      {!isReadOnly && (
                        <button type="button" onClick={() => setTujuan(tujuan.filter((_, i) => i !== idx))} className="text-red-500 font-bold">&times;</button>
                      )}
                    </div>
                  ))}
                  {!isReadOnly && (
                    <button type="button" onClick={() => setTujuan([...tujuan, ''])} className="text-[10px] text-emerald-700 font-bold underline">+ Tambah Baris Tujuan</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PEDAGOGI */}
          {activeTab === 'pedagogi' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Metode Pedagogis */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-xs text-slate-800 border-b pb-1">Metode Praktik Pedagogis</h4>
                  {['Pembelajaran berbasis proyek', 'Pembelajaran berbasis masalah', 'Inquiry/penyelidikan', 'Pembiasaan karakter', 'Praktik langsung', 'Diskusi reflektif'].map(m => (
                    <label key={m} className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                      <input type="checkbox" checked={pedagogis.includes(m)} onChange={() => setPedagogis(pedagogis.includes(m) ? pedagogis.filter(x => x !== m) : [...pedagogis, m])} disabled={isReadOnly} className="accent-emerald-700" />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>

                {/* Lingkungan */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-xs text-slate-800 border-b pb-1">Lingkungan Pembelajaran</h4>
                  {['Ruang kelas', 'Halaman madrasah', 'Mushalla/Masjid', 'Kebun madrasah', 'Lingkungan sekitar', 'Rumah & masyarakat'].map(l => (
                    <label key={l} className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                      <input type="checkbox" checked={lingkungan.includes(l)} onChange={() => setLingkungan(lingkungan.includes(l) ? lingkungan.filter(x => x !== l) : [...lingkungan, l])} disabled={isReadOnly} className="accent-emerald-700" />
                      <span>{l}</span>
                    </label>
                  ))}
                </div>

                {/* Pemanfaatan Digital */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-xs text-slate-800 border-b pb-1">Teknologi Digital Terpakai</h4>
                  {['Video pembelajaran', 'Canva (poster desain)', 'PowerPoint presentasi', 'Aplikasi spreadsheet', 'Tidak menggunakan teknologi'].map(t => (
                    <label key={t} className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
                      <input type="checkbox" checked={teknologi.includes(t)} onChange={() => handleToggleTech(t)} disabled={isReadOnly} className="accent-emerald-700" />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Kemitraan (Catur Pusat Pendidikan) */}
              <div className="bg-slate-50 p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b pb-1.5">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <span>Kemitraan Catur Pusat Pendidikan</span>
                  </h4>
                  {!isReadOnly && (
                    <button type="button" onClick={handleAutoFillPedagogyExp} className="bg-emerald-100 hover:bg-emerald-250 text-emerald-950 font-bold text-[10px] px-2.5 py-1 rounded">
                      Pre-Fill Cepat Kemitraan & Alat
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">A. Peran Madrasah (Fasilitasi & Sarpras)</label>
                    <input type="text" value={mitraMadrasah} onChange={e => setMitraMadrasah(e.target.value)} disabled={isReadOnly} placeholder="Pendidik menyediakan polybag, tali, gunting..." className="w-full text-xs border rounded px-2.5 py-1.5 bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">B. Peran Keluarga (Pembiasaan di Rumah)</label>
                    <input type="text" value={mitraKeluarga} onChange={e => setMitraKeluarga(e.target.value)} disabled={isReadOnly} placeholder="Orang tua mendukung pengumpulan botol mineral bekas..." className="w-full text-xs border rounded px-2.5 py-1.5 bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">C. Peran Masyarakat (Lingkungan Sosial)</label>
                    <input type="text" value={mitraMasyarakat} onChange={e => setMitraMasyarakat(e.target.value)} disabled={isReadOnly} placeholder="Melibatkan komite sekolah dan paguyuban kelas..." className="w-full text-xs border rounded px-2.5 py-1.5 bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">D. Peran Media (Publikasi & Narasi)</label>
                    <input type="text" value={mitraMedia} onChange={e => setMitraMedia(e.target.value)} disabled={isReadOnly} placeholder="Dokumentasi dishare di Instagram madrasah..." className="w-full text-xs border rounded px-2.5 py-1.5 bg-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ALUR KEGIATAN */}
          {activeTab === 'alur' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b pb-1.5 text-emerald-800">Alur Rencana Proyek Kokurikuler</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border text-left text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 uppercase font-bold text-[10px] border-b">
                      <th className="p-2 border">Tahap / Alur</th>
                      <th className="p-2 border">Aktivitas Guru</th>
                      <th className="p-2 border">Aktivitas Murid</th>
                      <th className="p-2 border">Nilai KBC</th>
                      <th className="p-2 border">Waktu</th>
                      <th className="p-2 border">Bukti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alur.map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border font-bold bg-slate-50/50">{row.tahap}</td>
                        <td className="p-2 border">
                          <textarea rows={2} value={row.aktivitas_guru} onChange={e => {
                            const next = [...alur]; next[idx].aktivitas_guru = e.target.value; setAlur(next);
                          }} disabled={isReadOnly} className="w-full border-0 focus:outline-none text-xs p-1" />
                        </td>
                        <td className="p-2 border">
                          <textarea rows={2} value={row.aktivitas_murid} onChange={e => {
                            const next = [...alur]; next[idx].aktivitas_murid = e.target.value; setAlur(next);
                          }} disabled={isReadOnly} className="w-full border-0 focus:outline-none text-xs p-1" />
                        </td>
                        <td className="p-2 border">
                          <input type="text" value={row.nilai_kbc} onChange={e => {
                            const next = [...alur]; next[idx].nilai_kbc = e.target.value; setAlur(next);
                          }} disabled={isReadOnly} className="w-full border-0 text-xs p-1 focus:outline-none font-medium" />
                        </td>
                        <td className="p-2 border">
                          <input type="text" value={row.alokasi_waktu} onChange={e => {
                            const next = [...alur]; next[idx].alokasi_waktu = e.target.value; setAlur(next);
                          }} disabled={isReadOnly} className="w-full border-0 text-xs p-1 focus:outline-none" />
                        </td>
                        <td className="p-2 border">
                          <input type="text" value={row.bukti} onChange={e => {
                            const next = [...alur]; next[idx].bukti = e.target.value; setAlur(next);
                          }} disabled={isReadOnly} className="w-full border-0 text-xs p-1 focus:outline-none" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: RUBRIK ASESMEN */}
          {activeTab === 'rubrik' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b pb-1.5 text-emerald-800">Rubrik Kriteria Penilaian Ketercapaian (SB/B/C/K)</h3>
              
              <div className="space-y-4">
                {rubrik.length === 0 ? (
                  <div className="text-center py-6">
                    <button type="button" onClick={() => {
                      setRubrik(dimensi.map(dim => ({
                        dimensi: dim,
                        indikator: `Kesesuaian penerapan karakter ${dim}`,
                        sb: 'Konsisten melakukan perbuatan terpuji dan membimbing teman.',
                        b: 'Mampu mempraktikkan perilaku baik secara mandiri.',
                        c: 'Mempraktikkan perilaku baik hanya jika diperingatkan guru.',
                        k: 'Belum terbiasa menunjukkan perilaku baik sama sekali.'
                      })));
                    }} className="bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg">
                      Generate Rubrik Berdasarkan Dimensi Terpilih
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rubrik.map((r, idx) => (
                      <div key={idx} className="border p-4 rounded-xl bg-slate-50/50 space-y-2 text-xs">
                        <div className="font-bold text-emerald-800">{r.dimensi}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <span className="font-semibold text-slate-500 block mb-1">SB (Sangat Baik)</span>
                            <textarea value={r.sb} onChange={e => { const n=[...rubrik]; n[idx].sb=e.target.value; setRubrik(n); }} className="w-full p-2 bg-white border rounded" rows={2} />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500 block mb-1">B (Baik)</span>
                            <textarea value={r.b} onChange={e => { const n=[...rubrik]; n[idx].b=e.target.value; setRubrik(n); }} className="w-full p-2 bg-white border rounded" rows={2} />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500 block mb-1">C (Cukup)</span>
                            <textarea value={r.c} onChange={e => { const n=[...rubrik]; n[idx].c=e.target.value; setRubrik(n); }} className="w-full p-2 bg-white border rounded" rows={2} />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500 block mb-1">K (Kurang)</span>
                            <textarea value={r.k} onChange={e => { const n=[...rubrik]; n[idx].k=e.target.value; setRubrik(n); }} className="w-full p-2 bg-white border rounded" rows={2} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: LEMBAR OBSERVASI */}
          {activeTab === 'observasi' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-1.5">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-emerald-800">Lembar Observasi & Monitoring Karakter Murid</h3>
                {!isReadOnly && (
                  <button type="button" onClick={handleGenerateStudentObsRows} className="bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg">
                    Generate Baris Siswa Dari Database
                  </button>
                )}
              </div>

              {observasi.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">Belum ada baris lembar observasi. Klik tombol di atas untuk memuat daftar murid.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 uppercase font-bold text-[10px] border-b">
                        <th className="p-2.5 border">Nama Murid</th>
                        <th className="p-2.5 border">Aspek Karakter</th>
                        <th className="p-2.5 border">Predikat</th>
                        <th className="p-2.5 border">Catatan Perilaku</th>
                        <th className="p-2.5 border">Tindak Lanjut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {observasi.map((obs, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 border font-bold text-slate-800">{obs.nama_murid}</td>
                          <td className="p-2.5 border text-slate-500 text-[11px]">
                            {obs.dimensi_yang_diamati} ({obs.topik_panca_cinta_yang_diamati})
                          </td>
                          <td className="p-2.5 border">
                            <select 
                              value={obs.predikat} 
                              onChange={e => handleUpdateStudentObsGrade(idx, e.target.value as any)}
                              disabled={isReadOnly}
                              className="bg-white border rounded px-2 py-1 text-xs font-bold"
                            >
                              <option value="SB">SB (Sangat Baik)</option>
                              <option value="B">B (Baik)</option>
                              <option value="C">C (Cukup)</option>
                              <option value="K">K (Kurang)</option>
                            </select>
                          </td>
                          <td className="p-2.5 border">
                            <input 
                              type="text" 
                              value={obs.catatan_perilaku}
                              onChange={e => handleUpdateStudentObsNotes(idx, e.target.value)}
                              disabled={isReadOnly}
                              className="w-full bg-transparent border-0 p-1 text-xs focus:outline-none"
                            />
                          </td>
                          <td className="p-2.5 border">
                            <input 
                              type="text" 
                              value={obs.tindak_lanjut}
                              onChange={e => handleUpdateStudentObsAction(idx, e.target.value)}
                              disabled={isReadOnly}
                              className="w-full bg-transparent border-0 p-1 text-xs focus:outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: JURNAL LOG */}
          {activeTab === 'jurnal' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-1.5">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-emerald-800">Jurnal Pelaksanaan & Logbook Guru</h3>
                {!isReadOnly && (
                  <button type="button" onClick={() => {
                    setJurnal([...jurnal, {
                      hari_tanggal: 'Senin, ' + new Date().toISOString().split('T')[0],
                      aktivitas: 'Praktek langsung pembuatan kompos sayuran kering.',
                      respon_murid: 'Murid membawa sampah daun kering dengan gembira dan memilahnya.',
                      dimensi_tampak: dimensi.slice(0,2),
                      panca_cinta_tampak: pancaCinta.slice(0,2),
                      kendala: 'Kekurangan sarung tangan plastik.',
                      solusi: 'Guru membagi kelompok bergiliran mencuci tangan dengan sabun.',
                      tindak_lanjut: 'Melakukan penyiraman berkala kompos.'
                    }]);
                  }} className="bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center space-x-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris Jurnal</span>
                  </button>
                )}
              </div>

              {jurnal.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">Belum ada baris logbook jurnal. Klik tombol di atas untuk menambah.</p>
              ) : (
                <div className="space-y-4">
                  {jurnal.map((j, i) => (
                    <div key={i} className="border p-4 rounded-xl bg-slate-50/50 space-y-3 text-xs relative">
                      <button type="button" onClick={() => setJurnal(jurnal.filter((_, idx) => idx !== i))} className="absolute right-3 top-3 text-red-500 font-bold">&times;</button>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-bold text-slate-600 block mb-1">Hari & Tanggal</label>
                          <input type="text" value={j.hari_tanggal} onChange={e => { const n=[...jurnal]; n[i].hari_tanggal=e.target.value; setJurnal(n); }} className="w-full bg-white border p-1.5 rounded" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="font-bold text-slate-600 block mb-1">Aktivitas yang Dilakukan</label>
                          <input type="text" value={j.aktivitas} onChange={e => { const n=[...jurnal]; n[i].aktivitas=e.target.value; setJurnal(n); }} className="w-full bg-white border p-1.5 rounded" />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="font-bold text-slate-600 block mb-1">Respon & Antusiasme Murid</label>
                          <textarea value={j.respon_murid} onChange={e => { const n=[...jurnal]; n[i].respon_murid=e.target.value; setJurnal(n); }} className="w-full bg-white border p-1.5 rounded" rows={1} />
                        </div>
                        <div>
                          <label className="font-bold text-slate-600 block mb-1">Kendala</label>
                          <input type="text" value={j.kendala} onChange={e => { const n=[...jurnal]; n[i].kendala=e.target.value; setJurnal(n); }} className="w-full bg-white border p-1.5 rounded" />
                        </div>
                        <div>
                          <label className="font-bold text-slate-600 block mb-1">Solusi Guru</label>
                          <input type="text" value={j.solusi} onChange={e => { const n=[...jurnal]; n[i].solusi=e.target.value; setJurnal(n); }} className="w-full bg-white border p-1.5 rounded" />
                        </div>
                        <div>
                          <label className="font-bold text-slate-600 block mb-1">Tindak Lanjut RTL</label>
                          <input type="text" value={j.tindak_lanjut} onChange={e => { const n=[...jurnal]; n[i].tindak_lanjut=e.target.value; setJurnal(n); }} className="w-full bg-white border p-1.5 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: RAPOR PELAPORAN */}
          {activeTab === 'laporan' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-1.5">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-emerald-800">Cetak Narasi Pelaporan Rapor Kokurikuler</h3>
                  <p className="text-[10px] text-slate-400">Deskripsi pencapaian individu murid untuk dicetak pada lembar rapor akhir semester</p>
                </div>
                {!isReadOnly && (
                  <button type="button" onClick={handleGenerateStudentReports} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Narasi Otomatis Siswa</span>
                  </button>
                )}
              </div>

              {pelaporan.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">Belum ada baris pelaporan siswa. Harap buat Lembar Observasi terlebih dahulu kemudian klik tombol di atas.</div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {pelaporan.map((rep, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-800">{rep.nama_murid}</span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Rapor Modul</span>
                      </div>
                      <textarea
                        value={rep.deskripsi}
                        onChange={e => {
                          const next = [...pelaporan];
                          next[idx].deskripsi = e.target.value;
                          setPelaporan(next);
                        }}
                        disabled={isReadOnly}
                        className="w-full text-xs bg-white border border-slate-200 rounded p-2 focus:outline-none leading-relaxed mt-1"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 9: EVALUASI & RTL */}
          {activeTab === 'evaluasi' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-emerald-800">Evaluasi Akhir Modul & Tindak Lanjut (RTL)</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Refleksi capaian program, dampak nyata, serta rencana keberlanjutan projek</p>
                </div>
                {!isReadOnly && (
                  <button 
                    type="button" 
                    onClick={handleGenerateEvaluasiRTL} 
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate RTL & Evaluasi Otomatis</span>
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Ketercapaian */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ketercapaian Tujuan Pembelajaran (%)</label>
                  <input type="text" value={evalKetercapaian} onChange={e => setEvalKetercapaian(e.target.value)} disabled={isReadOnly} placeholder="Misal: 92% murid mencapai indikator Sangat Baik..." className="w-full p-2.5 border rounded-lg" />
                </div>
                {/* RTL */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Rencana Tindak Lanjut (RTL)</label>
                  <textarea value={evalRTL} onChange={e => setEvalRTL(e.target.value)} disabled={isReadOnly} placeholder="1. Melanjutkan pembiasaan...\n2. Menjadwalkan piket..." className="w-full p-2.5 border rounded-lg" rows={3} />
                </div>
                {/* Faktor pendukung */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Faktor Pendukung Keberhasilan</label>
                  <textarea value={evalPendukung} onChange={e => setEvalPendukung(e.target.value)} disabled={isReadOnly} placeholder="Antusiasme murid tinggi, botol plastik bekas melimpah..." className="w-full p-2.5 border rounded-lg" rows={2} />
                </div>
                {/* Hambatan */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Faktor Hambatan / Kendala</label>
                  <textarea value={evalHambatan} onChange={e => setEvalHambatan(e.target.value)} disabled={isReadOnly} placeholder="Beberapa tanaman layu akibat sengatan terik panas..." className="w-full p-2.5 border rounded-lg" rows={2} />
                </div>
                {/* Dampak Murid */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Dampak Nyata Terhadap Karakter Murid</label>
                  <textarea value={evalDampakMurid} onChange={e => setEvalDampakMurid(e.target.value)} disabled={isReadOnly} placeholder="Murid tidak lagi sembarangan membuang botol plastik di lingkungan..." className="w-full p-2.5 border rounded-lg" rows={2} />
                </div>
                {/* Dampak Madrasah */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Dampak Nyata Terhadap Madrasah</label>
                  <textarea value={evalDampakMadrasah} onChange={e => setEvalDampakMadrasah(e.target.value)} disabled={isReadOnly} placeholder="Sudut asri botani menjadi tempat bersantai favorit dan indah..." className="w-full p-2.5 border rounded-lg" rows={2} />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Common Save/Submit footer */}
          {!isReadOnly && (
            <div className="pt-5 border-t border-slate-100 flex flex-wrap justify-between gap-3">
              <span className="text-[11px] text-slate-400 font-semibold self-center">
                Status Dokumen Saat Ini: <span className={`font-extrabold uppercase px-2 py-0.5 rounded ${
                  statusDokumen === 'Disetujui' ? 'bg-emerald-50 text-emerald-800 border' : 'bg-slate-100 text-slate-700'
                }`}>{statusDokumen}</span>
              </span>

              <div className="flex gap-2">
                <button 
                  type="button" 
                  disabled={saving}
                  onClick={() => handleSaveDocument('Draft')} 
                  className="bg-slate-100 hover:bg-slate-200 border text-slate-700 font-bold text-xs px-4 py-2.5 rounded-lg"
                >
                  Simpan Draft
                </button>
                <button 
                  type="button" 
                  disabled={saving}
                  onClick={() => handleSaveDocument('Disetujui')} 
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center space-x-2 shadow cursor-pointer"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>Simpan Perencanaan Kokurikuler</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
