import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  School, 
  Users, 
  UserSquare2, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Printer, 
  HelpCircle, 
  Play, 
  ChevronRight,
  ChevronDown,
  Layers,
  Award,
  Clock,
  Search,
  Zap,
  Info
} from 'lucide-react';
import { Profile, UserRole } from '../types';

interface PanduanViewProps {
  user: Profile;
  onNavigate: (view: string) => void;
}

export default function PanduanView({ user, onNavigate }: PanduanViewProps) {
  const [activeTab, setActiveTab] = useState<'langkah' | 'role' | 'faq' | 'tips'>('langkah');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const steps = [
    {
      num: '1',
      title: 'Pengisian Data Master Madrasah',
      tag: 'Prasyarat Utama',
      icon: School,
      color: 'bg-amber-500 text-slate-950',
      borderColor: 'border-amber-300',
      description: 'Lengkapi data identitas madrasah, pendidik/fasilitator, serta rombel murid sebelum menyusun perencanaan.',
      details: [
        'Buka menu Data Master > Data Madrasah: Isi Nama Madrasah, NSM, NPSN, Alamat, serta Nama Kepala Madrasah.',
        'Buka Data Guru: Tambahkan data guru pendidik/fasilitator projek kokurikuler.',
        'Buka Data Murid: Tambahkan daftar murid & rombel kelas untuk lembar asesmen & observasi.',
        'Buka Tim Kerja: Tentukan SK Tim Kerja Kokurikuler & struktur penanggung jawab.'
      ],
      actionView: 'madrasah',
      actionLabel: 'Buka Data Master'
    },
    {
      num: '2',
      title: 'Analisis Kebutuhan & Pemetaan Karakter (KBC)',
      tag: 'Penyesuaian Konteks',
      icon: Zap,
      color: 'bg-blue-600 text-white',
      borderColor: 'border-blue-300',
      description: 'Gunakan instrumen analisis madrasah untuk memetakan potensi lokal, kebutuhan murid, dan panca cinta.',
      details: [
        'Buka menu Perencanaan > Analisis Madrasah.',
        'Isi kondisi awal murid, kearifan lokal lingkungan sekitar, serta sarana pendukung.',
        'Pilih prioritas Panca Cinta (Cinta Allah & Rasul, Cinta Diri & Sesama, Cinta Ilmu, Cinta Tanah Air, Cinta Lingkungan).',
        'Hasil analisis akan secara otomatis menjadi rekomendasi saat menyusun modul.'
      ],
      actionView: 'analisis',
      actionLabel: 'Buka Analisis'
    },
    {
      num: '3',
      title: 'Penyusunan Modul di Generator Perencanaan',
      tag: 'Core Feature',
      icon: Sparkles,
      color: 'bg-emerald-600 text-white',
      borderColor: 'border-emerald-300',
      description: 'Modul perencanaan disusun secara sistematis melalui 9 Tab Generator dengan fitur bantuan otomatis.',
      details: [
        'Informasi Umum: Tentukan judul proyek, fase/kelas, alokasi waktu, tema utama, & Panca Cinta.',
        'Tujuan & Capaian: Tentukan target karakter dan indikator keberhasilan.',
        'Aktivitas Proyek: Susun tahapan Pengenalan, Kontekstualisasi, Aksi Nyata, Refleksi, & Tindak Lanjut.',
        'Rubrik & Observasi: Tentukan kriteria penilaian (Sangat Baik, Baik, Cukup, Perlu Bimbingan).',
        'Evaluasi & RTL: Klik tombol "Generate RTL & Evaluasi Otomatis" untuk merefleksikan capaian secara instant.'
      ],
      actionView: 'generator',
      actionLabel: 'Buka Generator'
    },
    {
      num: '4',
      title: 'Pengajuan & Verifikasi Status Modul',
      tag: 'Workflow Validasi',
      icon: CheckCircle2,
      color: 'bg-purple-600 text-white',
      borderColor: 'border-purple-300',
      description: 'Alur persetujuan dokumen dari Penyusun (Guru/Koordinator) ke Kepala Madrasah.',
      details: [
        'Draft: Dokumen masih dalam tahap pengisian awal dan bisa diedit kapan saja.',
        'Diajukan: Tim Fasilitator/Guru mengajukan modul ke Koordinator / Kepala Madrasah.',
        'Disetujui: Kepala Madrasah menyetujui modul dan siap diterapkan serta dicetak resmi.'
      ],
      actionView: 'arsip',
      actionLabel: 'Buka Arsip Dokumen'
    },
    {
      num: '5',
      title: 'Cetak Dokumen & Lembar Asesmen',
      tag: 'Output Resmi',
      icon: Printer,
      color: 'bg-rose-600 text-white',
      borderColor: 'border-rose-300',
      description: 'Cetak hasil modul perencanaan berformat standar resmi A4 Kemenag beserta lembar observasi murid.',
      details: [
        'Buka Arsip Dokumen > Klik tombol "Preview / Cetak".',
        'Pilih opsi cetak yang diinginkan: Modul Lengkap A4, Rubrik Asesmen, Lembar Observasi Murid, atau Raport Kokurikuler.',
        'Dokumen siap diunduh PDF / dicetak langsung untuk kebutuhan akreditasi & supervisi pengawas.'
      ],
      actionView: 'arsip',
      actionLabel: 'Cetak Dokumen'
    }
  ];

  const faqs = [
    {
      q: 'Siapa saja yang membutuhkan Kode Aktivasi dari Pemilik Aplikasi?',
      a: 'Hanya Kepala Madrasah yang memerlukan Kode Aktivasi resmi dari Pemilik Aplikasi untuk mengaktifkan lisensi madrasah. Anggota tim (Koordinator Kokurikuler, Guru/Fasilitator, dan Pengawas) tidak memerlukan kode aktivasi terpisah dan dapat langsung dibuatkan akun oleh Admin atau Kepala Madrasah.'
    },
    {
      q: 'Bagaimana jika data murid atau guru belum diisi secara lengkap?',
      a: 'Aplikasi tetap mengizinkan Anda membuat Modul Perencanaan. Namun, untuk mencetak Lembar Observasi Murid dan Raport Kokurikuler secara otomatis, Anda disarankan melengkapi Data Guru dan Data Murid di menu Data Master terlebih dahulu.'
    },
    {
      q: 'Apa itu Sistem Perencanaan Kokurikuler - KBC dan Panca Cinta dalam perencanaan ini?',
      a: 'KBC adalah pendekatan pembelajaran khas Kementerian Agama yang mengedepankan suasana belajar yang menyejukkan, membahagiakan, dan berpusat pada kasih sayang. Panca Cinta mencakup: (1) Cinta Allah & Rasul, (2) Cinta Diri & Sesama, (3) Cinta Ilmu & Karya, (4) Cinta Tanah Air, dan (5) Cinta Lingkungan.'
    },
    {
      q: 'Apakah isi modul perencanaan di Generator dapat dibuat otomatis?',
      a: 'Ya! Generator dilengkapi fitur "Generate RTL & Evaluasi Otomatis" serta opsi pengisian cepat pada setiap tab untuk membantu penyusunan dokumen yang komprehensif tanpa harus mengetik dari nol.'
    },
    {
      q: 'Siapa saja yang memiliki wewenang untuk menyetujui dokumen?',
      a: 'Kepala Madrasah dan Koordinator Kokurikuler memiliki akses penuh untuk mengubah status dokumen menjadi "Disetujui". Guru/Fasilitator dapat membuat dan mengajukan dokumen.'
    },
    {
      q: 'Bagaimana cara mencetak lembar observasi bulanan atau jurnal murid?',
      a: 'Buka menu Arsip Dokumen, cari dokumen proyek yang sudah dibuat, klik icon Printer (Preview/Cetak), lalu pilih tab "Lembar Observasi Murid" atau "Jurnal Murid".'
    }
  ];

  const roleGuides = [
    {
      role: UserRole.ADMIN,
      title: 'Panduan untuk Administrator / Pemilik Aplikasi',
      badge: 'Akses Penuh',
      items: [
        'Menerbitkan dan mengelola Kode Aktivasi aplikasi.',
        'Menambah dan mengatur akun pengguna (User Management).',
        'Memantau seluruh aktivitas penggunaan melalui menu Logs Aktivitas.',
        'Melengkapi master data awal madrasah, guru, dan rombel murid.'
      ]
    },
    {
      role: UserRole.KOORDINATOR_KOKURIKULER,
      title: 'Panduan untuk Koordinator Kokurikuler',
      badge: 'Perancang Utama',
      items: [
        'Melakukan Analisis Madrasah & pemetaan potensi karakter murid.',
        'Menyusun dan menyimpan modul perencanaan di Generator Perencanaan.',
        'Membagi tugas tim fasilitator dan alokasi jam projek.',
        'Mencetak Modul Perencanaan, Rubrik, dan Dokumen Kokurikuler.'
      ]
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12" id="panduan-view">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 rounded-2xl p-6 sm:p-8 text-slate-950 shadow-md relative overflow-hidden border border-amber-500/30">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-15 translate-x-8 pointer-events-none">
          <BookOpen className="w-72 h-72 text-slate-950" />
        </div>
        <div className="relative z-10 space-y-2.5 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 bg-slate-950 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>PANDUAN LENGKAP PENGGUNAAN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-slate-950">
            Cara Mengisi & Menggunakan Aplikasi Perencanaan Kokurikuler
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
            Panduan praktis langkah demi langkah untuk menyusun modul kokurikuler madrasah berbasis Sistem Perencanaan Kokurikuler - KBC dan standar Kemenag RI 2025.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 bg-white rounded-xl p-1 shadow-2xs space-x-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('langkah')}
          className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'langkah'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Alur 5 Langkah Utama</span>
        </button>
        <button
          onClick={() => setActiveTab('role')}
          className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'role'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Panduan Per Peran (Role)</span>
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'faq'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Pertanyaan Sering Diajukan (FAQ)</span>
        </button>
      </div>

      {/* TAB 1: 5 LANGKAH UTAMA */}
      {activeTab === 'langkah' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-blue-900">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-blue-950 mb-0.5">Ringkasan Alur Kerja Pengisian</p>
              <p className="leading-relaxed">
                Untuk hasil dokumen yang optimal, lakukan pengisian secara berurutan mulai dari <strong>Data Master</strong>, dilanjutkan ke <strong>Analisis Madrasah</strong>, lalu buat modul di <strong>Generator Perencanaan</strong>, minta pengesahan, dan cetak hasilnya.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => {
              const IconComp = step.icon;
              return (
                <div 
                  key={idx} 
                  className={`bg-white rounded-2xl border ${step.borderColor} p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`w-9 h-9 rounded-xl ${step.color} font-black text-sm flex items-center justify-center shadow-xs shrink-0`}>
                        {step.num}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-extrabold text-sm text-slate-900">{step.title}</h3>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                            {step.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate(step.actionView)}
                      className="inline-flex items-center space-x-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer"
                    >
                      <span>{step.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    <p className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Langkah Pengisian Detail:</span>
                    </p>
                    <ul className="space-y-1.5 pl-2">
                      {step.details.map((detail, dIdx) => (
                        <li key={dIdx} className="text-xs text-slate-600 flex items-start space-x-2 leading-relaxed">
                          <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PANDUAN PER PERAN (ROLE) */}
      {activeTab === 'role' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roleGuides.map((guide, idx) => (
            <div 
              key={idx}
              className={`bg-white rounded-2xl border p-5 shadow-xs space-y-3 ${
                guide.role === user.role ? 'border-amber-400 ring-2 ring-amber-200 bg-amber-50/20' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-sm text-slate-900">{guide.title}</h3>
                    {guide.role === user.role && (
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 uppercase">
                        PERAN ANDA
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-amber-700">{guide.badge}</span>
                </div>
              </div>

              <ul className="space-y-2">
                {guide.items.map((item, iIdx) => (
                  <li key={iIdx} className="text-xs text-slate-700 flex items-start space-x-2 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: FAQ */}
      {activeTab === 'faq' && (
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4 flex items-center justify-between space-x-3 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="font-extrabold text-xs text-slate-900 flex items-center space-x-2">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
                </button>
                {isOpen && (
                  <div className="p-4 bg-slate-50 border-t border-gray-100 text-xs text-slate-700 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Action Footer */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-sm text-amber-400">Siap Mulai Menyusun Perencanaan?</h3>
          <p className="text-xs text-slate-300 mt-1">
            Buka Generator Perencanaan untuk membuat atau mengedit Modul Proyek Kokurikuler sekarang.
          </p>
        </div>
        <button
          onClick={() => onNavigate('generator')}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>Buka Generator Sekarang</span>
        </button>
      </div>

    </div>
  );
}
