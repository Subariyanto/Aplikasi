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
  HelpCircle
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
    <div className="space-y-5" id="dashboard-view">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-[#171b56] via-[#1c2269] to-[#0f123c] rounded-2xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        {/* Large subtle book icon watermark on right side */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 translate-x-10 pointer-events-none select-none">
          <BookOpen className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 space-y-3 max-w-3xl">
          <div>
            <span className="bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider inline-block">
              SELAMAT DATANG DI PORTAL ADMIN KOKURIKULER
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-snug">
            Perencanaan Kokurikuler Madrasah Generator
          </h2>

          <p className="text-blue-100/80 text-xs sm:text-sm font-normal leading-relaxed max-w-2xl">
            Penyusunan otomatis dokumen kurikulum, rubrik asesmen, dan lembar observasi sesuai Panduan Kementerian Agama 2025.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            {(user.role === UserRole.ADMIN || user.role === UserRole.KOORDINATOR_KOKURIKULER) && (
              <button 
                onClick={() => onNavigate('generator')} 
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
              >
                + Buat Perencanaan Baru
              </button>
            )}
            <button 
              onClick={() => onNavigate('program_lengkap')} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer flex items-center space-x-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-white" />
              <span>Program Kokurikuler Lengkap</span>
            </button>
            <button 
              onClick={() => onNavigate('bank')} 
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer backdrop-blur-xs"
            >
              Buka Bank Tema
            </button>
            <button 
              onClick={() => onNavigate('panduan')} 
              className="bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer backdrop-blur-xs flex items-center space-x-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Panduan Penggunaan</span>
            </button>
            <button 
              onClick={() => onNavigate('audio_action_items')} 
              className="bg-emerald-500/30 hover:bg-emerald-500/40 border border-emerald-400/50 text-emerald-200 font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer backdrop-blur-xs flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Peninjau Audio & Action Items</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Counter Grid (High Density metrics bar style) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
        {/* Total Plans */}
        <div className="p-4 border-r border-b lg:border-b-0 border-gray-100 flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded text-indigo-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total Rencana</p>
            <h3 className="text-lg font-black text-slate-800 leading-none">{totalPlans}</h3>
            <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 inline-block mt-1">
              {approvedPlans} Disetujui
            </span>
          </div>
        </div>

        {/* Teachers */}
        <div className="p-4 border-r border-b lg:border-b-0 border-gray-100 flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded text-indigo-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Pendidik/Guru</p>
            <h3 className="text-lg font-black text-slate-800 leading-none">{teachersCount}</h3>
            <span className="text-[9px] font-bold text-slate-500 inline-block mt-1">Aktif Pengajar</span>
          </div>
        </div>

        {/* Students */}
        <div className="p-4 border-r border-b lg:border-b-0 border-gray-100 flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded text-indigo-600 shrink-0">
            <UserSquare2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Murid Terdaftar</p>
            <h3 className="text-lg font-black text-slate-800 leading-none">{studentsCount}</h3>
            <span className="text-[9px] font-bold text-slate-500 inline-block mt-1">Jenjang RA-MA</span>
          </div>
        </div>

        {/* Active Serial codes / Need Review */}
        <div className="p-4 border-r border-b lg:border-b-0 border-gray-100 flex items-center space-x-3">
          {user.role === UserRole.ADMIN ? (
            <>
              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded text-indigo-600 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Kode Aktivasi</p>
                <h3 className="text-lg font-black text-slate-800 leading-none">{activeCodesCount}</h3>
                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 inline-block mt-1">
                  Status Aktif
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 bg-indigo-50 border border-indigo-100 rounded text-indigo-600 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Butuh Review</p>
                <h3 className="text-lg font-black text-slate-800 leading-none">{pendingPlans}</h3>
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-1">
                  Approval Pending
                </span>
              </div>
            </>
          )}
        </div>

        {/* Jenis Kokurikuler */}
        <div className="p-4 flex flex-col justify-center min-w-0">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Jenis Kokurikuler</p>
          <div className="space-y-1 text-[9px] font-bold text-slate-600">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 text-slate-500 truncate">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" /> Lintas Disiplin
              </span>
              <span className="text-slate-900 font-black">{countLintasDisiplin}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 text-slate-500 truncate">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" /> G7KAIH
              </span>
              <span className="text-slate-900 font-black">{countG7KAIH}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1 text-slate-500 truncate">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" /> KKBC
              </span>
              <span className="text-slate-900 font-black">{countKKBC}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Information Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: Dimension Metrics (Custom Modern SVG Bar Chart) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Fokus Penguatan 8 Dimensi Lulusan</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Distribusi indikator karakter pada perencanaan kokurikuler</p>
            </div>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="space-y-2.5">
            {Object.entries(dimensionCounts).map(([dimension, count]) => {
              const maxVal = Math.max(...Object.values(dimensionCounts), 1);
              const percent = Math.min((count / maxVal) * 100, 100);
              return (
                <div key={dimension} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                    <span>{dimension}</span>
                    <span className="font-bold text-indigo-700">{count} Dokumen</span>
                  </div>
                  <div className="w-full bg-slate-50 h-2 rounded border border-gray-100 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded transition-all duration-500 ease-out" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Panca Cinta Metrics + Quick Access logs */}
        <div className="space-y-5">
          {/* Panca Cinta Card */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-gray-100 pb-2.5 flex items-center space-x-2">
              <Heart className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Keterpaduan Panca Cinta</span>
            </h3>

            <div className="space-y-2">
              {Object.entries(pancaCintaCounts).map(([topic, count]) => {
                const maxCintaVal = Math.max(...Object.values(pancaCintaCounts), 1);
                const percentCinta = Math.min((count / maxCintaVal) * 100, 100);
                return (
                  <div key={topic} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>{topic}</span>
                      <span className="font-bold text-slate-800">{count}</span>
                    </div>
                    <div className="w-full bg-slate-50 h-1.5 rounded overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded" 
                        style={{ width: `${percentCinta}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick logs */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-gray-100 pb-2.5 flex items-center justify-between">
              <span>Log Aktivitas Terbaru</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </h3>
            <div className="space-y-2.5 max-h-52 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-4">Belum ada aktivitas terekam.</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="text-[11px] flex items-start space-x-2 border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                    <div className="mt-0.5 p-1 bg-slate-50 border border-gray-100 rounded text-slate-400 shrink-0">
                      <Activity className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate leading-snug">{log.aktivitas}</p>
                      <p className="text-slate-500 text-[10px] leading-tight mt-0.5">{log.keterangan}</p>
                      <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
                        <span>{log.nama_lengkap} ({log.role})</span>
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
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-gray-100 pb-2">
          Prinsip Dasar Kokurikuler Madrasah 2025 (Kurikulum Berbasis Cinta)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50/20 p-3.5 rounded border border-indigo-100/30 space-y-1.5">
            <span className="w-6 h-6 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">1</span>
            <h4 className="font-bold text-slate-950 text-xs">Pembelajaran Bermakna (Meaningful)</h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Kegiatan bukan pengisi waktu luang atau hafalan formal, melainkan melatih murid memahami fenomena, merefleksikan hikmah ketuhanan, dan bertindak mulia.
            </p>
          </div>
          <div className="bg-amber-50/20 p-3.5 rounded border border-amber-100/30 space-y-1.5">
            <span className="w-6 h-6 bg-amber-50 border border-amber-100 text-amber-800 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">2</span>
            <h4 className="font-bold text-slate-950 text-xs">Pembiasaan Karakter (Mindful)</h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Dilaksanakan terencana dengan asesmen berkesinambungan melalui instrumen observasi karakter harian murid, menanamkan pilar adab terhadap guru, alam, dan sesama.
            </p>
          </div>
          <div className="bg-slate-50/40 p-3.5 rounded border border-gray-200/50 space-y-1.5">
            <span className="w-6 h-6 bg-slate-50 border border-gray-200 text-slate-700 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">3</span>
            <h4 className="font-bold text-slate-950 text-xs">Kemitraan Catur Pusat Pendidikan</h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Mengkolaborasikan lingkungan madrasah, bimbingan keluarga di rumah, tokoh masyarakat/praktisi di lapangan, serta pemanfaatan media digital secara bijak.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
