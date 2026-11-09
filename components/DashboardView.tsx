/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  UserSquare2, 
  Layers, 
  Printer, 
  Sparkles, 
  Heart, 
  Smile, 
  KeyRound, 
  ShieldCheck, 
  Activity, 
  MapPin, 
  CalendarDays,
  FileCheck,
  BookOpen,
  HelpCircle,
  School,
  FileSearch,
  Database,
  FileAudio,
  ClipboardCheck,
  Settings,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import { Profile, PerencanaanKokurikuler, UserRole, ActivityLog } from '../types';
import { db } from '../lib/db';

interface DashboardViewProps {
  user: Profile;
  onNavigate: (view: string) => void;
}

export default function DashboardView({ user, onNavigate }: DashboardViewProps) {
  const [plans, setPlans] = useState<PerencanaanKokurikuler[]>([]);
  const [teachersCount, setTeachersCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [activeCodesCount, setActiveCodesCount] = useState(0);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    async function loadStats() {
      // Filter plans by user's madrasah unless Admin
      let allPlans = await db.perencanaanKokurikuler.list();
      let allTeachers = await db.guru.list();
      let allStudents = await db.murid.list();
      let allCodes = await db.activationCodes.list();
      let allLogs = await db.logs.list();

      if (user.role !== UserRole.ADMIN) {
        // Find user's school if any
        const m = await db.madrasah.getFirst();
        if (m) {
          allPlans = allPlans.filter(p => p.madrasah_id === m.id);
          allTeachers = allTeachers.filter(g => g.madrasah_id === m.id);
          allStudents = allStudents.filter(s => s.madrasah_id === m.id);
        }
      }

      setPlans(allPlans);
      setTeachersCount(allTeachers.length);
      setStudentsCount(allStudents.length);
      setActiveCodesCount(allCodes.filter(c => c.status === 'Aktif').length);
      setLogs(allLogs.slice(0, 5)); // top 5
    }
    loadStats();
  }, [user]);

  // Statistics calculation
  const totalPlans = plans.length;
  const draftPlans = plans.filter(p => p.status_dokumen === 'Draft').length;
  const approvedPlans = plans.filter(p => p.status_dokumen === 'Disetujui').length;
  const pendingPlans = plans.filter(p => p.status_dokumen === 'Diajukan').length;

  // Group by Jenis Kokurikuler
  const countLintasDisiplin = plans.filter(p => p.jenis_kokurikuler.includes('Disiplin')).length;
  const countG7KAIH = plans.filter(p => p.jenis_kokurikuler.includes('G7KAIH') || p.jenis_kokurikuler.includes('7 Kebiasaan')).length;
  const countKKBC = plans.filter(p => p.jenis_kokurikuler.includes('KKBC') || p.jenis_kokurikuler.includes('Cinta')).length;
  const countLainnya = totalPlans - countLintasDisiplin - countG7KAIH - countKKBC;

  // Group by Tema
  const themeCounts: Record<string, number> = {};
  plans.forEach(p => {
    themeCounts[p.tema_kegiatan] = (themeCounts[p.tema_kegiatan] || 0) + 1;
  });

  // Group by Dimension (dimensions are array of string)
  const dimensionCounts: Record<string, number> = {
    'Keimanan': 0, 'Kewargaan': 0, 'Penalaran kritis': 0, 'Kreativitas': 0, 
    'Kolaborasi': 0, 'Kemandirian': 0, 'Kesehatan': 0, 'Komunikasi': 0
  };
  plans.forEach(p => {
    if (Array.isArray(p.dimensi_profil_lulusan)) {
      p.dimensi_profil_lulusan.forEach(dim => {
        // match partial name or exact
        Object.keys(dimensionCounts).forEach(key => {
          if (dim.toLowerCase().includes(key.toLowerCase())) {
            dimensionCounts[key]++;
          }
        });
      });
    }
  });

  // Group by Panca Cinta
  const pancaCintaCounts: Record<string, number> = {
    'Cinta Allah': 0, 'Cinta Ilmu': 0, 'Cinta Lingkungan': 0, 
    'Cinta Diri & Sesama': 0, 'Cinta Tanah Air': 0
  };
  plans.forEach(p => {
    if (Array.isArray(p.topik_panca_cinta)) {
      p.topik_panca_cinta.forEach(cinta => {
        if (cinta.toLowerCase().includes('allah') || cinta.toLowerCase().includes('rasul')) pancaCintaCounts['Cinta Allah']++;
        if (cinta.toLowerCase().includes('ilmu')) pancaCintaCounts['Cinta Ilmu']++;
        if (cinta.toLowerCase().includes('lingkungan')) pancaCintaCounts['Cinta Lingkungan']++;
        if (cinta.toLowerCase().includes('diri') || cinta.toLowerCase().includes('sesama')) pancaCintaCounts['Cinta Diri & Sesama']++;
        if (cinta.toLowerCase().includes('tanah air')) pancaCintaCounts['Cinta Tanah Air']++;
      });
    }
  });

  return (
    <div className="space-y-6" id="dashboard-view">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-8 text-white shadow-xl border border-emerald-800/30">
        {/* Subtle decorative background glow and emblem */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none select-none">
          <BookOpen className="w-72 h-72 text-white" />
        </div>

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-extrabold px-3 py-1 rounded-full text-[10px] tracking-wider uppercase backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Portal Perencanaan Kokurikuler Kemenag 2025</span>
            </span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Sistem Perencanaan Kokurikuler - KBC
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
              Generator cerdas modul proyek kokurikuler madrasah, rubrik observasi 7 Kebiasaan Anak Indonesia Hebat, dan buku dokumen kurikulum resmi.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            {(user.role === UserRole.ADMIN || user.role === UserRole.KOORDINATOR_KOKURIKULER) && (
              <button 
                onClick={() => onNavigate('generator')} 
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-md shadow-amber-400/20 hover:shadow-lg cursor-pointer flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>+ Buat Perencanaan Baru</span>
              </button>
            )}
            <button 
              onClick={() => onNavigate('program_lengkap')} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-900/40 cursor-pointer flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4 text-white" />
              <span>Dokumen Program Lengkap</span>
            </button>
            <button 
              onClick={() => onNavigate('bank')} 
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer backdrop-blur-md"
            >
              Buka Bank Tema
            </button>
            <button 
              onClick={() => onNavigate('panduan')} 
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-emerald-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer backdrop-blur-md flex items-center space-x-1.5"
            >
              <HelpCircle className="w-4 h-4 text-amber-300" />
              <span>Panduan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Plans */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Rencana</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 leading-tight">{totalPlans}</h3>
          <div className="mt-2 flex items-center">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {approvedPlans} Disetujui
            </span>
          </div>
        </div>

        {/* Teachers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Pendidik/Guru</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 leading-tight">{teachersCount}</h3>
          <div className="mt-2">
            <span className="text-[10px] font-semibold text-slate-500">Pendidik & Fasilitator</span>
          </div>
        </div>

        {/* Students */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Murid Terdaftar</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <UserSquare2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 leading-tight">{studentsCount}</h3>
          <div className="mt-2">
            <span className="text-[10px] font-semibold text-slate-500">Jenjang RA s.d MA</span>
          </div>
        </div>

        {/* Active Codes / Pending review */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              {user.role === UserRole.ADMIN ? 'Kode Aktivasi' : 'Status Pengajuan'}
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              {user.role === UserRole.ADMIN ? <KeyRound className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 leading-tight">
            {user.role === UserRole.ADMIN ? activeCodesCount : pendingPlans}
          </h3>
          <div className="mt-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
              user.role === UserRole.ADMIN 
                ? 'bg-amber-50 text-amber-800 border-amber-200' 
                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
            }`}>
              {user.role === UserRole.ADMIN ? 'Lisensi Aktif' : `${draftPlans} Draf Modul`}
            </span>
          </div>
        </div>

        {/* Jenis Kokurikuler Mini Stats */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow col-span-2 md:col-span-1">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-2">Jenis Kokurikuler</span>
          <div className="space-y-1.5 text-[10px] font-semibold">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-600 truncate">
                <span className="w-2 h-2 bg-teal-500 rounded-full shrink-0" /> Lintas Disiplin
              </span>
              <span className="text-slate-900 font-extrabold">{countLintasDisiplin}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-600 truncate">
                <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0" /> G7KAIH
              </span>
              <span className="text-slate-900 font-extrabold">{countG7KAIH}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-slate-600 truncate">
                <span className="w-2 h-2 bg-emerald-600 rounded-full shrink-0" /> KKBC
              </span>
              <span className="text-slate-900 font-extrabold">{countKKBC}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DAFTAR MENU & MODUL UTAMA (ENLARGED & CRYSTAL CLEAR) */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100/80 text-emerald-800 rounded-2xl">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Daftar Menu & Modul Aplikasi
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Pilih menu di bawah ini untuk membuka modul yang ingin Anda gunakan:
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            {user.role}
          </span>
        </div>

        {/* Big Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
          
          {/* 1. Generator Perencanaan */}
          {(user.role === UserRole.ADMIN || user.role === UserRole.KOORDINATOR_KOKURIKULER) && (
            <button
              onClick={() => onNavigate('generator')}
              className="group text-left p-4.5 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl shadow-xs group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6 fill-slate-950" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-950 text-amber-300 uppercase tracking-wide">
                  UTAMA
                </span>
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 group-hover:text-amber-900 flex items-center justify-between">
                  <span>Generator Perencanaan</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-700 transition-all" />
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                  Rakit & generate modul proyek KBC, alokasi JP, dan rubrik observasi.
                </p>
              </div>
            </button>
          )}

          {/* 2. Program Kokurikuler Lengkap */}
          <button
            onClick={() => onNavigate('program_lengkap')}
            className="group text-left p-4.5 rounded-2xl border border-emerald-200/90 bg-emerald-50/30 hover:bg-emerald-50/70 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="p-3 bg-emerald-700 text-white rounded-2xl shadow-xs group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-950 uppercase tracking-wide">
                LENGKAP
              </span>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800 flex items-center justify-between">
                <span>Program Lengkap (Buku)</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-700 transition-all" />
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                Buku kurikulum utuh: Cover, Kata Pengantar, BAB I-V, & lampiran RPKM.
              </p>
            </div>
          </button>

          {/* 3. Cetak Dokumen & Rapor */}
          <button
            onClick={() => onNavigate('preview_cetak')}
            className="group text-left p-4.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl group-hover:scale-105 transition-transform">
                <Printer className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 uppercase tracking-wide">
                CETAK A4
              </span>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-teal-800 flex items-center justify-between">
                <span>Cetak RPKM & Rapor</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-teal-700 transition-all" />
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                Pratinjau siap cetak format A4 dokumen modul serta rapor siswa.
              </p>
            </div>
          </button>

          {/* 4. Data Madrasah */}
          <button
            onClick={() => onNavigate('madrasah')}
            className="group text-left p-4.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl group-hover:scale-105 transition-transform">
                <School className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-blue-800 flex items-center justify-between">
                <span>Data Madrasah</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-700 transition-all" />
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                Kelola profil lembaga, NSM, NPSN, sarpras, dan identitas madrasah.
              </p>
            </div>
          </button>

          {/* 5. Data Guru */}
          <button
            onClick={() => onNavigate('guru')}
            className="group text-left p-4.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-800 flex items-center justify-between">
                <span>Data Guru & Fasilitator</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-700 transition-all" />
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                Daftar tenaga pendidik, fasilitator proyek, dan pembagian tugas.
              </p>
            </div>
          </button>

          {/* 6. Data Murid */}
          <button
            onClick={() => onNavigate('murid')}
            className="group text-left p-4.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="p-3 bg-cyan-50 text-cyan-700 rounded-2xl group-hover:scale-105 transition-transform">
                <UserSquare2 className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-cyan-800 flex items-center justify-between">
                <span>Data Murid & Rombel</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-cyan-700 transition-all" />
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                Data siswa, rombongan belajar kelas, dan jenjang pendidikan.
              </p>
            </div>
          </button>

          {/* 7. Tim Kerja Kokurikuler */}
          <button
            onClick={() => onNavigate('tim')}
            className="group text-left p-4.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-purple-800 flex items-center justify-between">
                <span>Tim Kerja Kokurikuler</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-purple-700 transition-all" />
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                SK pembentukan tim, koordinator, dan penetapan fasilitator.
              </p>
            </div>
          </button>

          {/* 8. Analisis Madrasah */}
          <button
            onClick={() => onNavigate('analisis')}
            className="group text-left p-4.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="p-3 bg-rose-50 text-rose-700 rounded-2xl group-hover:scale-105 transition-transform">
                <FileSearch className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-rose-800 flex items-center justify-between">
                <span>Analisis Madrasah</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-rose-700 transition-all" />
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                Karakteristik peserta didik, potensi lingkungan, dan analisis SWOT.
              </p>
            </div>
          </button>

          {/* 9. Bank Tema & Program */}
          <button
            onClick={() => onNavigate('bank')}
            className="group text-left p-4.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl group-hover:scale-105 transition-transform">
                <Database className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800 flex items-center justify-between">
                <span>Bank Tema & Program</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-700 transition-all" />
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                Katalog tema, topik panduan Kemenag, dan inspirasi modul proyek.
              </p>
            </div>
          </button>

          {/* 10. Peninjau Audio & Tindak Lanjut */}
          <button
            onClick={() => onNavigate('audio_action_items')}
            className="group text-left p-4.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="p-3 bg-violet-50 text-violet-700 rounded-2xl group-hover:scale-105 transition-transform">
                <FileAudio className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-violet-100 text-violet-900 uppercase tracking-wide">
                AI AUDIO
              </span>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-violet-800 flex items-center justify-between">
                <span>Peninjau Audio & Rapat</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-violet-700 transition-all" />
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                Ekstrak kesepakatan, notula, dan action items dari rekaman suara/rapat.
              </p>
            </div>
          </button>

          {/* 11. Catatan Pengawas */}
          <button
            onClick={() => onNavigate('catatan_pengawas')}
            className="group text-left p-4.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl group-hover:scale-105 transition-transform">
                <ClipboardCheck className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-amber-800 flex items-center justify-between">
                <span>Catatan Pengawas</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-700 transition-all" />
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                Umpan balik, rekomendasi, dan supervisi pembina madrasah.
              </p>
            </div>
          </button>

          {/* 12. Panduan Penggunaan */}
          <button
            onClick={() => onNavigate('panduan')}
            className="group text-left p-4.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl group-hover:scale-105 transition-transform">
                <HelpCircle className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-800 flex items-center justify-between">
                <span>Panduan Penggunaan</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-700 transition-all" />
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                Petunjuk alur pengisian, panduan Kemenag, dan tata cara aplikasi.
              </p>
            </div>
          </button>

          {/* 13. Kode Aktivasi (Admin / Trial) */}
          {(user.role === UserRole.ADMIN || user.role === UserRole.TRIAL) && (
            <button
              onClick={() => onNavigate('kode_aktivasi')}
              className="group text-left p-4.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl group-hover:scale-105 transition-transform">
                  <KeyRound className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 group-hover:text-amber-800 flex items-center justify-between">
                  <span>Kode Aktivasi & Lisensi</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-700 transition-all" />
                </h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                  Kelola kode lisensi aktivasi madrasah dan status hak akses.
                </p>
              </div>
            </button>
          )}

          {/* 14. Pengaturan Sistem */}
          <button
            onClick={() => onNavigate('pengaturan')}
            className="group text-left p-4.5 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl group-hover:scale-105 transition-transform">
                <Settings className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 group-hover:text-slate-800 flex items-center justify-between">
                <span>Pengaturan & Cloud</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-slate-700 transition-all" />
              </h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1">
                Profil pengguna, database cloud Supabase, dan cadangan data.
              </p>
            </div>
          </button>

        </div>
      </div>

      {/* Main Charts & Information Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Dimension Metrics (Custom Modern Bar Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                Distribusi 8 Dimensi Profil Lulusan
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Frekuensi indikator karakter yang diintegrasikan dalam modul</p>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(dimensionCounts).map(([dimension, count]) => {
              const maxVal = Math.max(...Object.values(dimensionCounts), 1);
              const percent = Math.min((count / maxVal) * 100, 100);
              return (
                <div key={dimension} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="font-medium text-slate-800">{dimension}</span>
                    <span className="font-extrabold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-md text-[10px] border border-emerald-100">
                      {count} Modul
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-700 ease-out" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Panca Cinta Metrics + Quick Access logs */}
        <div className="space-y-6">
          {/* Panca Cinta Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-2">
                <Heart className="w-4 h-4 text-rose-500 shrink-0 fill-rose-500/20" />
                <span>Keterpaduan Panca Cinta</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                KBC
              </span>
            </div>

            <div className="space-y-2.5">
              {Object.entries(pancaCintaCounts).map(([topic, count]) => {
                const maxCintaVal = Math.max(...Object.values(pancaCintaCounts), 1);
                const percentCinta = Math.min((count / maxCintaVal) * 100, 100);
                return (
                  <div key={topic} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="text-slate-800 text-[11px]">{topic}</span>
                      <span className="font-bold text-slate-900 text-[11px]">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-teal-500 to-emerald-600 h-full rounded-full" 
                        style={{ width: `${percentCinta}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick logs */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Log Aktivitas Terkini
              </h3>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada aktivitas terekam.</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="text-xs flex items-start space-x-2.5 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                    <div className="mt-0.5 p-1.5 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                      <Activity className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate leading-snug">{log.aktivitas}</p>
                      <p className="text-slate-500 text-[11px] leading-tight mt-0.5">{log.keterangan}</p>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                        <span className="truncate max-w-[140px]">{log.nama_lengkap}</span>
                        <span>{new Date(log.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Madrasah Guidelines Info Cards (Quick learning) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
            3 Prinsip Utama Kokurikuler Madrasah 2025
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-b from-emerald-50/50 to-white p-4.5 rounded-xl border border-emerald-100 space-y-2">
            <div className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-xs">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-xs">Pembelajaran Bermakna (Meaningful)</h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Bukan sekadar hafalan tugas, melainkan sarana murid memahami fenomena nyata di lingkungan, meresapi hikmah ketuhanan, dan mengamalkan akhlak terpuji.
            </p>
          </div>
          
          <div className="bg-gradient-to-b from-amber-50/50 to-white p-4.5 rounded-xl border border-amber-100 space-y-2">
            <div className="w-7 h-7 bg-amber-500 text-slate-950 rounded-lg flex items-center justify-center font-black text-xs shadow-xs">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-xs">Habituasi Karakter (Mindful)</h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Dilaksanakan terencana dengan asesmen otentik melalui observasi harian 7 Kebiasaan Anak Indonesia Hebat dan penanaman adab islami.
            </p>
          </div>
          
          <div className="bg-gradient-to-b from-teal-50/50 to-white p-4.5 rounded-xl border border-teal-100 space-y-2">
            <div className="w-7 h-7 bg-teal-700 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-xs">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-xs">Kemitraan Catur Pusat Pendidikan</h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Kolaborasi harmonis antara madrasah, bimbingan orang tua di rumah, interaksi masyarakat/ahli, serta pemanfaatan media digital secara bijak.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
