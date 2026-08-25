/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  Menu, 
  Heart, 
  Sparkles,
  Info,
  ChevronDown
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import MadrasahView from './components/MadrasahView';
import GuruView from './components/GuruView';
import MuridView from './components/MuridView';
import TimView from './components/TimView';
import AnalisisView from './components/AnalisisView';
import BankView from './components/BankView';
import GeneratorView from './components/GeneratorView';
import ArsipView from './components/ArsipView';
import PreviewCetakView from './components/PreviewCetakView';
import LogsView from './components/LogsView';
import LoginView from './components/LoginView';
import CatatanPengawasView from './components/CatatanPengawasView';
import PengaturanView from './components/PengaturanView';
import KodeAktivasiView from './components/KodeAktivasiView';
import UserManagementView from './components/UserManagementView';
import PanduanView from './components/PanduanView';
import AudioActionItemsView from './components/AudioActionItemsView';
import { ProgramLengkapView } from './components/ProgramLengkapView';
import { Profile, UserRole } from './types';
import { db } from './lib/db';
import { isTrialUser, getTrialRemainingTime, FULL_LICENSE_PRICE, CONTACT_PERSON_NAME, CONTACT_PERSON_PHONE } from './lib/trial';
import { KeyRound, Zap, Clock, ShieldAlert, CheckCircle2, X } from 'lucide-react';

// Simulated users list for easy role testing
const SIMULATED_PROFILES: Profile[] = [
  {
    id: 'usr-1',
    nama_lengkap: 'SUBARIYANTO, S.Pd, M.Pd.I.',
    username: 'admin',
    password_hash: 'sha256$admin$779ab6ba378eb12ca7c2495b5e2eb793753e1c71b3e04651a9bae88c205a5fce',
    role: UserRole.ADMIN,
    nama_madrasah: 'Kementerian Agama Kab. Jember',
    nomor_hp: '082330647698',
    email: 'subariyantoss@gmail.com',
    status_user: 'Aktif',
    tanggal_aktivasi: new Date().toISOString()
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
  }
];

export default function App() {
  const [profiles, setProfiles] = useState<Profile[]>(SIMULATED_PROFILES);
  const [user, setUser] = useState<Profile | null>(null);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Activation modal state for Trial upgrade
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [inputActivationCode, setInputActivationCode] = useState('');
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError(null);
    setActivationSuccess(null);

    if (!user) return;

    const trimmedCode = inputActivationCode.trim().toUpperCase();
    if (!trimmedCode) {
      setActivationError('Silakan masukkan Kode Aktivasi.');
      return;
    }

    try {
      // Find code in DB
      const codeRecord = await db.activationCodes.getByCode(trimmedCode);
      if (codeRecord && codeRecord.status === 'Aktif') {
        const upgradedUser: Profile = {
          ...user,
          role: codeRecord.role_tujuan || UserRole.KOORDINATOR_KOKURIKULER,
          status_user: 'Aktif',
          is_trial: false,
          kode_aktivasi: codeRecord.kode,
          tanggal_aktivasi: new Date().toISOString()
        };

        await db.profiles.update(user.id, upgradedUser);
        setUser(upgradedUser);

        // Update code status/usage
        await db.activationCodes.incrementUsage(codeRecord.id);

        // Log activation activity
        await db.logs.create({
          user_id: user.id,
          nama_lengkap: user.nama_lengkap,
          role: upgradedUser.role,
          aktivitas: 'Aktivasi Lisensi Full',
          keterangan: `Berhasil aktivasi akun dari Trial ke FULL LISENSI menggunakan kode: ${codeRecord.kode}`
        });

        setActivationSuccess('🎉 Selamat! Akun Anda telah berhasil diaktivasi ke FULL LISENSI PERMANEN. Watermark dokumen kini telah dihapus!');
        setTimeout(() => {
          setShowActivationModal(false);
          setActivationSuccess(null);
          setInputActivationCode('');
        }, 2000);
      } else {
        setActivationError(`Kode Aktivasi "${trimmedCode}" tidak valid atau telah digunakan. Beli Kode Aktivasi Lisensi seharga ${FULL_LICENSE_PRICE} melalui ${CONTACT_PERSON_NAME} (${CONTACT_PERSON_PHONE}).`);
      }
    } catch (err) {
      console.error('Error activating code:', err);
      setActivationError('Terjadi kesalahan saat memproses kode aktivasi.');
    }
  };

  // Sync user state to localStorage
  useEffect(() => {
    if (!initialized) return;
    if (user) {
      localStorage.setItem('pkm_user_id', user.id);
    } else {
      localStorage.removeItem('pkm_user_id');
    }
  }, [user, initialized]);

  // Function to refresh profiles state
  const refreshProfiles = async () => {
    try {
      const list = await db.profiles.list();
      setProfiles(list);
      return list;
    } catch (err) {
      console.error('Failed to load profiles:', err);
      return SIMULATED_PROFILES;
    }
  };

  // Initialize and seed database if empty
  useEffect(() => {
    async function init() {
      // Load actual profiles from local storage DB
      const list = await refreshProfiles();
      
      // Try to restore previous session from localStorage
      const savedId = localStorage.getItem('pkm_user_id');
      if (savedId) {
        const found = list.find(p => p.id === savedId);
        if (found) {
          setUser(found);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setInitialized(true);
    }
    init();
  }, []);

  const handleLogout = () => {
    if (user) {
      try {
        db.logs.create({
          user_id: user.id,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          aktivitas: 'Logout',
          keterangan: 'Keluar dari aplikasi secara aman'
        }).catch(err => console.warn('Logout log error:', err));
      } catch (e) {
        console.warn('Logout log failed:', e);
      }
    }
    localStorage.removeItem('pkm_user_id');
    setUser(null);
    setActiveView('dashboard');
    setSidebarOpen(false);
  };

  const handleNavigate = (view: string, docId?: string) => {
    setActiveView(view);
    if (docId) {
      setActiveDocId(docId);
    } else {
      setActiveDocId(null);
    }
    setSidebarOpen(false); // Close mobile drawer
  };

  const handleRoleChange = (userId: string) => {
    const selected = profiles.find(p => p.id === userId);
    if (selected) {
      setUser(selected);
      // Log role change
      db.logs.create({
        user_id: selected.id,
        nama_lengkap: selected.nama_lengkap,
        role: selected.role,
        aktivitas: 'Ganti Peran Pengguna',
        keterangan: `Mengubah mode simulasi hak akses menjadi: ${selected.role}`
      });
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse space-y-3 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-700/20 text-emerald-800 flex items-center justify-center font-bold text-lg mx-auto">
            PKM
          </div>
          <p className="text-slate-600 text-xs font-bold font-sans">Menginisialisasi Sistem Perencanaan Madrasah...</p>
        </div>
      </div>
    );
  }

  // If user is logged out, show the beautiful LoginView
  if (!user) {
    return (
      <LoginView 
        simulatedProfiles={profiles} 
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setActiveView('dashboard');
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-900 selection:bg-emerald-500 selection:text-white">
      
      {/* 1. Header (Hidden during browser Print) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] print:hidden">
        
        {/* Left branding */}
        <div className="flex items-center space-x-3.5">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 rounded-xl lg:hidden transition-colors cursor-pointer"
            aria-label="Toggle Mobile Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-900/10 shrink-0 border border-emerald-500/30">
              <span className="tracking-tight text-amber-300 font-extrabold text-xs">PKM</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 leading-tight">
                  Sistem Perencanaan Kokurikuler
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  Kemenag 2025
                </span>
              </div>
              <p className="text-[10px] text-slate-600 font-bold hidden sm:block">
                Modul Integrasi 7 Kebiasaan Anak Indonesia Hebat & Panca Cinta
              </p>
            </div>
          </div>
        </div>

        {/* Center/Right controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-3 bg-slate-50/80 hover:bg-slate-100/80 transition-all border border-slate-200/70 py-1.5 px-3 rounded-2xl">
            <div className="text-right hidden sm:block min-w-0 max-w-[200px]">
              <p className="text-xs font-bold text-slate-900 leading-none truncate">{user.nama_lengkap}</p>
              <div className="flex items-center justify-end space-x-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <p className="text-[9px] text-slate-600 font-extrabold uppercase tracking-wider leading-none truncate">{user.role}</p>
              </div>
            </div>
            
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs border border-white/40 shrink-0">
              {user.nama_lengkap.slice(0, 2)}
            </div>

            <button
              onClick={handleLogout}
              id="btn-top-logout"
              className="ml-1 flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50/80 hover:bg-rose-100 hover:text-rose-800 border border-rose-200/70 transition-all cursor-pointer shadow-2xs"
              title="Keluar dari Aplikasi"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sticky Trial Account Banner */}
      {isTrialUser(user) && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 px-4 py-2.5 font-sans border-b border-amber-800 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs shrink-0 print:hidden">
          <div className="flex items-center space-x-2.5 text-xs font-bold">
            <span className="bg-slate-950 text-amber-300 font-extrabold px-2.5 py-0.5 rounded-lg text-[10px] tracking-wider uppercase shadow-xs">
              AKUN TRIAL (3 HARI)
            </span>
            <span className="text-slate-950 font-medium text-xs">
              Sisa Waktu Uji Coba: <strong className="text-white underline font-black">{getTrialRemainingTime(user).formatted}</strong> — Dokumen cetak disertai tanda pengenal trial.
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="hidden md:inline text-[11px] font-extrabold text-slate-950">
              Lisensi Full: {FULL_LICENSE_PRICE}
            </span>
            <button
              onClick={() => setShowActivationModal(true)}
              className="bg-slate-950 hover:bg-slate-900 text-amber-300 font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition-all border border-amber-400/40 shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Aktivasi Lisensi Permanen</span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-900 hover:bg-red-950 text-red-100 font-bold text-xs px-3 py-1.5 rounded-xl transition-all border border-red-700/50 flex items-center space-x-1 cursor-pointer"
              title="Keluar dari Akun Trial"
            >
              <LogOut className="w-3.5 h-3.5 text-red-300" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Website Navigation Bar */}
      <Sidebar 
        user={user} 
        currentView={activeView} 
        onNavigate={handleNavigate} 
        isOpenMobile={sidebarOpen}
        onToggleMobile={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      {/* 3. Main Work Area Workspace */}
      <div className="flex-1 overflow-y-auto print:overflow-visible print:block">
        <main className="max-w-7xl mx-auto w-full p-4 md:p-6 pb-20 print:p-0 print:overflow-visible print:block">
          {activeView === 'dashboard' && <DashboardView user={user} onNavigate={handleNavigate} />}
          {activeView === 'madrasah' && <MadrasahView user={user} />}
          {activeView === 'guru' && <GuruView user={user} />}
          {activeView === 'murid' && <MuridView user={user} />}
          {activeView === 'tim' && <TimView user={user} />}
          {activeView === 'analisis' && <AnalisisView user={user} />}
          {activeView === 'bank' && <BankView user={user} />}
          {activeView === 'panduan' && <PanduanView user={user} onNavigate={handleNavigate} />}
          {activeView === 'audio_action_items' && <AudioActionItemsView user={user} />}
          {activeView === 'program_lengkap' && <ProgramLengkapView user={user} onNavigate={handleNavigate} />}
          
          {activeView === 'generator' && (
            <GeneratorView 
              user={user} 
              onNavigate={handleNavigate} 
              activeDocId={activeDocId} 
            />
          )}
          
          {activeView === 'arsip' && <ArsipView user={user} onNavigate={handleNavigate} />}
          
          {(activeView === 'preview_cetak' || activeView === 'cetak_rpkm') && (
            <PreviewCetakView 
              docId={activeDocId} 
              user={user}
              onBack={() => handleNavigate('arsip')}
              onNavigate={handleNavigate}
            />
          )}
          
          {activeView === 'logs' && <LogsView user={user} />}
          {activeView === 'catatan_pengawas' && <CatatanPengawasView user={user} />}
          {activeView === 'kode_aktivasi' && <KodeAktivasiView user={user} />}
          {activeView === 'user_management' && <UserManagementView user={user} onNavigate={handleNavigate} />}
          {activeView === 'pengaturan' && (
            <PengaturanView 
              user={user} 
              onProfileUpdate={(updatedUser) => {
                setUser(updatedUser);
                refreshProfiles();
              }} 
            />
          )}
        </main>
      </div>

      {/* Activation Code Modal for Trial Users */}
      {showActivationModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <KeyRound className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wide">Aktivasi Kode Lisensi Full</h3>
                  <p className="text-[11px] text-emerald-100/80">Masukkan kode untuk menghapus watermark & batas trial</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowActivationModal(false);
                  setActivationError(null);
                  setActivationSuccess(null);
                }}
                className="text-emerald-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActivateLicense} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1.5">
                  Masukkan Kode Aktivasi (Contoh: PKMG-G7K2-C3R8)
                </label>
                <input
                  type="text"
                  required
                  value={inputActivationCode}
                  onChange={e => setInputActivationCode(e.target.value.toUpperCase())}
                  placeholder="PKMG-XXXX-XXXX"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-xs font-mono font-bold tracking-wider text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 uppercase"
                />
              </div>

              {activationError && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 leading-relaxed font-medium">
                  {activationError}
                </div>
              )}

              {activationSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{activationSuccess}</span>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 text-[11px]">
                <p className="font-extrabold text-slate-800">Belum Memiliki Kode Aktivasi?</p>
                <p className="text-slate-600 leading-normal">
                  Beli Kode Aktivasi Lisensi Resmi seharga <strong className="text-amber-800">{FULL_LICENSE_PRICE}</strong> dengan menghubungi:
                </p>
                <p className="font-black text-slate-900 pt-0.5">{CONTACT_PERSON_NAME}</p>
                <p className="text-emerald-700 font-extrabold">WhatsApp: {CONTACT_PERSON_PHONE}</p>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowActivationModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                >
                  Aktivasi Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Small informative bottom banner - Hidden in print */}
      <footer className="bg-white text-slate-500 text-[10px] py-1.5 px-4 flex justify-between items-center fixed bottom-0 left-0 right-0 z-20 shadow-sm border-t border-gray-200 print:hidden">
        <span>Sistem Perencanaan Kokurikuler Madrasah &copy; 2026. Sistem Perencanaan Kokurikuler - KBC.</span>
        <div className="flex items-center space-x-1 font-medium">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span className="text-slate-600">Joyful & Meaningful Learning</span>
        </div>
      </footer>

    </div>
  );
}
