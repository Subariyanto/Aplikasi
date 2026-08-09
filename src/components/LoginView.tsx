/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  User, 
  ShieldCheck, 
  Heart, 
  ChevronRight, 
  BookOpen, 
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
  Award,
  CheckCircle2,
  GraduationCap,
  Building2,
  Zap,
  Clock,
  PhoneCall,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { Profile, UserRole } from '../types';
import { db } from '../lib/db';
import { FULL_LICENSE_PRICE, CONTACT_PERSON_NAME, CONTACT_PERSON_PHONE } from '../lib/trial';

interface LoginViewProps {
  simulatedProfiles?: any[];
  onLoginSuccess: (user: Profile) => void;
}

export default function LoginView({ simulatedProfiles = [], onLoginSuccess }: LoginViewProps) {
  // Login form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  // Registration / Activation form state
  const [regCode, setRegCode] = useState('');
  const [regNamaLengkap, setRegNamaLengkap] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [activeTab, setActiveTab] = useState<'code' | 'trial' | 'login'>('code');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isTrialLoading, setIsTrialLoading] = useState(false);

  // Check if user has activated before or logged in previously, so they return directly to Login tab
  useEffect(() => {
    try {
      const hasActivated = localStorage.getItem('pkm_has_activated');
      const lastUser = localStorage.getItem('pkm_last_username');
      if (hasActivated === 'true' || lastUser) {
        setActiveTab('login');
        if (lastUser) {
          setUsernameInput(lastUser);
        }
      }
    } catch (e) {
      console.warn('Error reading localStorage in LoginView:', e);
    }
  }, []);

  // Handle Account Registration & Activation with Activation Code
  const handleRegisterAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCode = regCode.trim();
    const cleanNama = regNamaLengkap.trim();
    const cleanUser = regUsername.trim().toLowerCase();
    const cleanPass = regPassword.trim();
    const cleanConfirmPass = regConfirmPassword.trim();

    if (!cleanCode) {
      setErrorMsg('Silakan masukkan Kode Aktivasi Anda.');
      return;
    }
    if (!cleanNama) {
      setErrorMsg('Silakan masukkan Nama Lengkap Anda.');
      return;
    }
    if (!cleanUser) {
      setErrorMsg('Silakan buat Nama User (Username) untuk login.');
      return;
    }
    if (!cleanPass) {
      setErrorMsg('Silakan buat Password (Kata Sandi) akun Anda.');
      return;
    }
    if (cleanPass.length < 4) {
      setErrorMsg('Password minimal 4 karakter.');
      return;
    }
    if (cleanPass !== cleanConfirmPass) {
      setErrorMsg('Password dan Ulangi Password tidak cocok. Silakan periksa kembali.');
      return;
    }

    setIsActivating(true);

    try {
      // 1. Verify activation code
      const codeRecord = await db.activationCodes.getByCode(cleanCode);
      if (!codeRecord || codeRecord.status !== 'Aktif') {
        setErrorMsg(`Kode Aktivasi "${cleanCode}" tidak ditemukan atau tidak aktif. Pastikan penulisan sudah benar atau hubungi Pak Subariyanto (${CONTACT_PERSON_PHONE}).`);
        setIsActivating(false);
        return;
      }

      // 2. Check if username is already registered in DB
      const existingDbUser = await db.profiles.getByUsername(cleanUser);
      if (existingDbUser && existingDbUser.username.toLowerCase() === cleanUser) {
        setErrorMsg(`Nama User "${cleanUser}" sudah digunakan. Silakan pilih Nama User lain.`);
        setIsActivating(false);
        return;
      }

      // 3. Create new activated profile
      const newActivatedProfile: Profile = await db.profiles.create({
        nama_lengkap: cleanNama,
        username: cleanUser,
        password_hash: cleanPass,
        role: codeRecord.role_tujuan || UserRole.KOORDINATOR_KOKURIKULER,
        nama_madrasah: codeRecord.nama_madrasah_tujuan || 'Madrasah Kemenag Kab. Jember',
        nomor_hp: '081234567890',
        email: `${cleanUser}@madrasah.kemenag.go.id`,
        status_user: 'Aktif',
        is_trial: false,
        kode_aktivasi: codeRecord.kode,
        tanggal_aktivasi: new Date().toISOString()
      });

      // Save activation marker so user lands on login tab next time
      try {
        localStorage.setItem('pkm_has_activated', 'true');
        localStorage.setItem('pkm_last_username', cleanUser);
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }

      // 4. Update code usage
      await db.activationCodes.incrementUsage(codeRecord.id);

      // 5. Log activation event
      await db.logs.create({
        user_id: newActivatedProfile.id,
        nama_lengkap: newActivatedProfile.nama_lengkap,
        role: newActivatedProfile.role,
        aktivitas: 'Pendaftaran & Aktivasi Akun Baru',
        keterangan: `Akun "${cleanUser}" berhasil diaktivasi dengan kode: ${codeRecord.kode}`
      });

      setSuccessMsg('Pendaftaran & Aktivasi Berhasil! Mengarahkan ke aplikasi...');

      // 6. Login immediately
      setTimeout(() => {
        onLoginSuccess(newActivatedProfile);
      }, 500);

    } catch (err) {
      console.error('Error activating code:', err);
      setErrorMsg('Gagal memproses pendaftaran dan aktivasi akun. Silakan coba lagi.');
    } finally {
      setIsActivating(false);
    }
  };

  // Handle Login with Username & Password
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const normalizedUsername = usernameInput.trim().toLowerCase();
    
    if (!normalizedUsername) {
      setErrorMsg('Silakan masukkan Username Anda.');
      setIsLoading(false);
      return;
    }

    if (!passwordInput) {
      setErrorMsg('Silakan masukkan kata sandi Anda.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. First check in DB profiles (including newly registered users)
      const dbProfile = await db.profiles.getByUsername(normalizedUsername);
      if (dbProfile) {
        if (dbProfile.password_hash !== passwordInput) {
          setErrorMsg('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
          setIsLoading(false);
          return;
        }

        try {
          localStorage.setItem('pkm_has_activated', 'true');
          localStorage.setItem('pkm_last_username', dbProfile.username);
        } catch (e) {
          console.warn('LocalStorage save error:', e);
        }

        await db.logs.create({
          user_id: dbProfile.id,
          nama_lengkap: dbProfile.nama_lengkap,
          role: dbProfile.role,
          aktivitas: 'Login Akun',
          keterangan: `Pengguna berhasil login: ${dbProfile.username}`
        });

        onLoginSuccess(dbProfile);
        return;
      }

      // 2. Check in simulated profiles fallback
      const foundSimulated = simulatedProfiles.find(p => p.username.toLowerCase() === normalizedUsername);
      if (foundSimulated) {
        if (foundSimulated.password_hash !== passwordInput) {
          setErrorMsg('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
          setIsLoading(false);
          return;
        }

        await db.logs.create({
          user_id: foundSimulated.id,
          nama_lengkap: foundSimulated.nama_lengkap,
          role: foundSimulated.role,
          aktivitas: 'Login Akun',
          keterangan: `Pengguna berhasil login: ${foundSimulated.username}`
        });

        onLoginSuccess(foundSimulated);
        return;
      }

      // 3. Check if user typed an activation code into username field
      const codeCheck = await db.activationCodes.getByCode(usernameInput.trim());
      if (codeCheck && codeCheck.status === 'Aktif') {
        setActiveTab('code');
        setRegCode(usernameInput.trim().toUpperCase());
        setErrorMsg('Silakan lengkapi pendaftaran akun Anda di bawah ini dengan Kode Aktivasi tersebut.');
        setIsLoading(false);
        return;
      }

      setErrorMsg(`Nama User "${usernameInput}" belum terdaftar. Silakan lakukan Aktivasi Akun Baru terlebih dahulu.`);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Terjadi kesalahan saat verifikasi login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrialLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsTrialLoading(true);

    try {
      let trialUser = await db.profiles.getByUsername('trial');
      
      if (!trialUser) {
        trialUser = await db.profiles.create({
          nama_lengkap: 'Pengguna Trial 3 Hari',
          username: 'trial',
          password_hash: 'trial123',
          role: UserRole.TRIAL,
          nama_madrasah: 'Madrasah Trial Kemenag',
          nomor_hp: '081234567899',
          email: 'trial@madrasah.sch.id',
          status_user: 'Trial',
          is_trial: true,
          tanggal_aktivasi: new Date().toISOString(),
          trial_expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        });
      } else {
        trialUser = {
          ...trialUser,
          is_trial: true,
          status_user: 'Trial',
          trial_expires_at: trialUser.trial_expires_at || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        };
      }

      await db.logs.create({
        user_id: trialUser.id,
        nama_lengkap: trialUser.nama_lengkap,
        role: trialUser.role,
        aktivitas: 'Akses Akun Trial',
        keterangan: 'Memulai sesi coba gratis Akun Trial 3 hari'
      });

      onLoginSuccess(trialUser);
    } catch (err) {
      console.error('Failed entering trial mode:', err);
      setErrorMsg('Gagal masuk ke mode Trial. Silakan coba lagi.');
    } finally {
      setIsTrialLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-emerald-600 selection:text-white">
      
      {/* Ambient background soft light glows */}
      <div className="absolute top-0 left-1/4 w-[32rem] h-[32rem] bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-300/50 overflow-hidden">
          
          {/* LEFT SIDE: Brand & Feature Highlights (Rich Emerald Prestige) */}
          <div className="lg:col-span-6 p-8 sm:p-10 lg:p-12 bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 text-white flex flex-col justify-between relative">
            
            {/* Subtle decorative pattern background */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            <div className="space-y-8 relative z-10">
              
              {/* Header Badge */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-md shadow-amber-400/20 shrink-0">
                  PKM
                </div>
                <div>
                  <span className="bg-amber-400/20 text-amber-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-amber-400/30">
                    PORTAL PENGAWAS MADRASAH
                  </span>
                  <h2 className="text-xs font-bold text-emerald-100 mt-0.5">Sistem Perencanaan Kokurikuler</h2>
                </div>
              </div>

              {/* Title & Tagline */}
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                  Kurikulum Berbasis Cinta <span className="text-amber-300 font-extrabold">(KBC)</span>
                </h1>
                <p className="text-xs text-emerald-100/90 leading-relaxed font-normal">
                  Platform perencanaan kokurikuler, integrasi 7 Kebiasaan Anak Indonesia Hebat, serta penyusunan modul & dokumen utuh berbasis nilai Panca Cinta Kemenag.
                </p>
              </div>

              {/* Key Highlights */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-3 bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-xl">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-white block">Generator Modul PKM Otomatis</span>
                    <span className="text-emerald-100/80 text-[11px]">Rakit modul perencanaan proyek kokurikuler lengkap hanya dalam hitungan detik.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-xl">
                  <BookOpen className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-white block">Buku Dokumen Program Utuh</span>
                    <span className="text-emerald-100/80 text-[11px]">Integrasi Cover, Pengesahan, Kata Pengantar, BAB I–V, dan Cetak Raport A4.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-white block">Lisensi & Otoritas Resmi</span>
                    <span className="text-emerald-100/80 text-[11px]">Akses terkontrol untuk Kepala Madrasah, Pengawas, dan Tim Kerja Kokurikuler.</span>
                  </div>
                </div>
              </div>

            </div>



          </div>

          {/* RIGHT SIDE: Login Form (Bright & Clean Light Mode) */}
          <div className="lg:col-span-6 p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
            
            <div className="space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Masuk Portal</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Masukkan kode aktivasi akun untuk mengakses sistem.</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center space-x-1.5 text-emerald-800 text-[10px] font-extrabold uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Sistem Aktif</span>
                </div>
              </div>

              {/* TAB 1: Pendaftaran & Aktivasi Akun Baru */}
              {activeTab === 'code' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center space-x-2 text-emerald-950 font-black text-xs">
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
                      <span className="uppercase">Formulir Pendaftaran & Aktivasi Akun</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      Masukkan Kode Aktivasi yang Anda dapatkan, lalu buat Nama User dan Password untuk mendaftar.
                    </p>

                    <form onSubmit={handleRegisterAndActivate} className="space-y-3 pt-1">
                      {/* Kode Aktivasi Input */}
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                          1. Kode Aktivasi Akun <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-xl shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                            <KeyRound className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={regCode}
                            onChange={e => setRegCode(e.target.value.toUpperCase())}
                            placeholder="Contoh: PKMG-FULL-2026 atau PKMG-G7K2-C3R8"
                            className="block w-full pl-9 pr-3 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold tracking-wider text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all uppercase"
                          />
                        </div>
                      </div>

                      {/* Nama Lengkap Input */}
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                          2. Nama Lengkap (Beserta Gelar) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-xl shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <User className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={regNamaLengkap}
                            onChange={e => setRegNamaLengkap(e.target.value)}
                            placeholder="Contoh: Subariyanto, S.Pd, M.Pd.I."
                            className="block w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                          />
                        </div>
                      </div>

                      {/* Username Input */}
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                          3. Buat Nama User (Username) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative rounded-xl shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <input
                            type="text"
                            required
                            value={regUsername}
                            onChange={e => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                            placeholder="Contoh: subariyanto"
                            className="block w-full pl-8 pr-2 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                          />
                        </div>
                      </div>

                      {/* Password & Confirm Password Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                            4. Buat Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative rounded-xl shadow-xs">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Lock className="h-3.5 w-3.5" />
                            </div>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={regPassword}
                              onChange={e => setRegPassword(e.target.value)}
                              placeholder="Buat kata sandi"
                              className="block w-full pl-8 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showPassword ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                            5. Ulangi Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative rounded-xl shadow-xs">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Lock className="h-3.5 w-3.5" />
                            </div>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={regConfirmPassword}
                              onChange={e => setRegConfirmPassword(e.target.value)}
                              placeholder="Ulangi kata sandi"
                              className={`block w-full pl-8 pr-8 py-2.5 bg-white border ${
                                regConfirmPassword && regPassword !== regConfirmPassword
                                  ? 'border-red-400 focus:ring-red-500/20'
                                  : 'border-slate-300 focus:ring-emerald-500/20'
                              } rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showPassword ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {errorMsg && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5"
                        >
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span className="leading-normal font-medium">{errorMsg}</span>
                        </motion.div>
                      )}

                      {successMsg && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-emerald-100 border border-emerald-300 p-3 rounded-xl text-xs text-emerald-950 flex items-start space-x-2.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <span className="leading-normal font-extrabold">{successMsg}</span>
                        </motion.div>
                      )}

                      <button
                        type="submit"
                        disabled={isActivating}
                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md shadow-emerald-700/20 cursor-pointer mt-2"
                      >
                        {isActivating ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Memproses Pendaftaran...</span>
                          </div>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-amber-300" />
                            <span>AKTIVASI & MASUK APLIKASI</span>
                          </>
                        )}
                      </button>

                      {/* Button Trial & Link Login di bawah tombol Aktivasi */}
                      <div className="pt-2.5 border-t border-emerald-200/80 mt-3 space-y-2">
                        <button
                          type="button"
                          onClick={handleStartTrialLogin}
                          disabled={isTrialLoading}
                          className="w-full bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
                        >
                          {isTrialLoading ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-3.5 h-3.5 border-2 border-teal-700 border-t-transparent rounded-full animate-spin" />
                              <span>Menyiapkan Akun Trial...</span>
                            </div>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-teal-600" />
                              <span>Masuk dengan Akun Trial (Coba Gratis 3 Hari)</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => { setActiveTab('login'); setErrorMsg(null); setSuccessMsg(null); }}
                          className="w-full text-center text-[11px] font-bold text-slate-600 hover:text-emerald-800 py-1 transition-colors cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>Sudah Pernah Aktivasi Akun? Masuk di sini</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Info Pembelian Lisensi */}
                  <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-amber-950 font-black text-[11px]">
                      <span className="uppercase">Belum Memiliki Kode Aktivasi?</span>
                      <span className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded text-[10px]">{FULL_LICENSE_PRICE}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[10px]">
                      Dapatkan Kode Aktivasi Full Lisensi Permanen tanpa watermark dokumen melalui:
                    </p>
                    <div className="text-[11px] font-bold text-slate-900 pt-1 flex justify-between items-center border-t border-amber-200/60">
                      <span>{CONTACT_PERSON_NAME}</span>
                      <span className="text-emerald-800 font-extrabold">WA: {CONTACT_PERSON_PHONE}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Login Manual Username/Password */}
              {activeTab === 'login' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900 font-black text-xs">
                      <User className="w-4.5 h-4.5 text-slate-700 shrink-0" />
                      <span className="uppercase">Masuk dengan Akun Terdaftar</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      Masukkan Nama User (Username) dan Password yang telah Anda buat saat aktivasi sebelumnya.
                    </p>

                    <form onSubmit={handleManualLogin} className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                          Nama User (Username)
                        </label>
                        <div className="relative rounded-xl shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <User className="h-4 w-4" />
                          </div>
                          <input
                            type="text"
                            required
                            value={usernameInput}
                            onChange={e => setUsernameInput(e.target.value)}
                            placeholder="Masukkan username Anda"
                            className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                          Kata Sandi (Password)
                        </label>
                        <div className="relative rounded-xl shadow-xs">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={passwordInput}
                            onChange={e => setPasswordInput(e.target.value)}
                            placeholder="Masukkan kata sandi"
                            className="block w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPassword ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {errorMsg && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5"
                        >
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span className="leading-normal font-medium">{errorMsg}</span>
                        </motion.div>
                      )}

                      <button
                        type="submit"
                        id="btn-submit-login"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md shadow-emerald-700/20 text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all cursor-pointer"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Memverifikasi Akun...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5">
                            <span>MASUK APLIKASI</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </button>

                      <div className="pt-2 border-t border-slate-200/80 mt-2">
                        <button
                          type="button"
                          onClick={() => { setActiveTab('code'); setErrorMsg(null); setSuccessMsg(null); }}
                          className="w-full text-center text-xs font-bold text-emerald-700 hover:text-emerald-900 py-1 transition-colors cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Belum Punya Akun? Formulir Aktivasi Akun Baru</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>

            {/* Footer inside login panel */}
            <div className="pt-8 mt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-500 font-semibold">
                Sistem Perencanaan Kokurikuler Madrasah (PKM) &copy; 2026
              </p>
              <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                Dibuat oleh : SUBARIYANTO, S.Pd, M.Pd.I.
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Ketua Pokjawas Madrasah Kabupaten Jember
              </p>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}

