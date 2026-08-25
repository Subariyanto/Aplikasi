/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Database, 
  Cloud, 
  CloudOff, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  KeyRound,
  FileJson,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { Profile, UserRole } from '../types';
import { db, getSupabaseCredentials, saveSupabaseCredentials, isSupabaseConnected } from '../lib/db';
import { hashPassword } from '../lib/password';

interface PengaturanViewProps {
  user: Profile;
  onProfileUpdate: (updatedUser: Profile) => void;
}

export default function PengaturanView({ user, onProfileUpdate }: PengaturanViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'supabase' | 'database'>('profile');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab 1: Profile Form State
  const [namaLengkap, setNamaLengkap] = useState(user.nama_lengkap);
  const [nomorHp, setNomorHp] = useState(user.nomor_hp || '');
  const [email, setEmail] = useState(user.email || '');
  const [username, setUsername] = useState(user.username);
  const [namaMadrasah, setNamaMadrasah] = useState(user.nama_madrasah || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Tab 2: Supabase Connection State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showAnonKey, setShowAnonKey] = useState(false);

  // Load database and credentials info
  useEffect(() => {
    const creds = getSupabaseCredentials();
    setSupabaseUrl(creds.url);
    setSupabaseAnonKey(creds.key);
    setIsConnected(isSupabaseConnected());
  }, []);

  // Update profile handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!namaLengkap.trim()) {
      setErrorMsg('Nama lengkap tidak boleh kosong.');
      return;
    }

    try {
      const updates: Partial<Profile> = {
        nama_lengkap: namaLengkap.trim(),
        nomor_hp: nomorHp.trim(),
        email: email.trim(),
        username: username.trim(),
        nama_madrasah: namaMadrasah.trim()
      };

      if (newPassword.trim()) {
        updates.password_hash = await hashPassword(newPassword.trim());
      }

      const updated = await db.profiles.update(user.id, updates);
      onProfileUpdate(updated);

      // Log activity
      await db.logs.create({
        user_id: user.id,
        nama_lengkap: updated.nama_lengkap,
        role: updated.role,
        aktivitas: 'Perbarui Profil',
        keterangan: 'Memperbarui informasi profil pengguna secara mandiri'
      });

      setSuccessMsg('Profil Anda berhasil diperbarui!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memperbarui profil.');
    }
  };

  // Supabase Save Handler
  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      saveSupabaseCredentials(supabaseUrl.trim(), supabaseAnonKey.trim());
      const connected = isSupabaseConnected();
      setIsConnected(connected);

      // Log activity
      db.logs.create({
        user_id: user.id,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        aktivitas: 'Perbarui Sinkronisasi Cloud',
        keterangan: connected 
          ? `Menghubungkan aplikasi ke Supabase Cloud: ${supabaseUrl.trim().slice(0, 30)}...`
          : 'Memutuskan sambungan Supabase Cloud (Beralih ke database lokal)'
      });

      if (connected) {
        setSuccessMsg('Supabase Cloud berhasil terhubung! Database beralih ke mode cloud.');
      } else {
        setSuccessMsg('Sambungan Supabase dihapus. Aplikasi kembali ke mode database lokal.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Konfigurasi gagal disimpan.');
    }
  };

  // Disconnect Supabase Cloud
  const handleDisconnectSupabase = () => {
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    saveSupabaseCredentials('', '');
    setIsConnected(false);
    setSuccessMsg('Supabase Cloud dinonaktifkan. Aplikasi kembali ke Database Offline lokal.');
  };

  // Tab 3: Local Backup Handler
  const handleBackup = () => {
    try {
      const backupData: Record<string, any> = {};
      const tables = [
        'profiles',
        'activation_codes',
        'madrasah',
        'guru',
        'murid',
        'tim_kokurikuler',
        'analisis_madrasah',
        'perencanaan_kokurikuler',
        'catatan_pengawas',
        'activity_logs'
      ];

      tables.forEach(table => {
        const key = 'pkmg_tbl_' + table;
        const raw = localStorage.getItem(key);
        if (raw) {
          backupData[table] = JSON.parse(raw);
        }
      });

      // Include connection variables
      backupData['_meta'] = {
        app: 'PKMG Perencanaan Kokurikuler',
        version: '2026.1',
        backup_date: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pkmg_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      setSuccessMsg('Backup data berhasil diunduh dalam file JSON.');
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal memproses backup database.');
    }
  };

  // Database Restore Handler
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data._meta || !data._meta.app.includes('PKMG')) {
          throw new Error('File JSON tidak valid. Bukan merupakan backup PKMG.');
        }

        // List tables
        const tables = [
          'profiles',
          'activation_codes',
          'madrasah',
          'guru',
          'murid',
          'tim_kokurikuler',
          'analisis_madrasah',
          'perencanaan_kokurikuler',
          'catatan_pengawas',
          'activity_logs'
        ];

        tables.forEach(table => {
          if (data[table]) {
            localStorage.setItem('pkmg_tbl_' + table, JSON.stringify(data[table]));
          }
        });

        setSuccessMsg('Restore database sukses! Silakan segarkan/muat ulang halaman untuk menerapkan semua data.');
        
        // Log activity
        db.logs.create({
          user_id: user.id,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          aktivitas: 'Restore Database',
          keterangan: 'Memulihkan database dari file backup JSON eksternal'
        });

      } catch (err: any) {
        console.error(err);
        setErrorMsg('Gagal restore database: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Reset to default
  const handleResetDatabase = () => {
    if (!window.confirm('PERINGATAN: Semua perencanaan, data guru, murid, dan catatan pengawas yang baru Anda buat akan dihapus dan dikembalikan ke data simulasi bawaan. Lanjutkan?')) {
      return;
    }

    try {
      const tables = [
        'profiles',
        'activation_codes',
        'madrasah',
        'guru',
        'murid',
        'tim_kokurikuler',
        'analisis_madrasah',
        'perencanaan_kokurikuler',
        'catatan_pengawas',
        'activity_logs'
      ];

      // Remove tables so they are seeded on next load
      tables.forEach(table => {
        localStorage.removeItem('pkmg_tbl_' + table);
      });

      setSuccessMsg('Database berhasil direset. Silakan reload aplikasi untuk inisialisasi ulang.');
      
      // Log activity
      db.logs.create({
        user_id: user.id,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        aktivitas: 'Reset Database',
        keterangan: 'Mereset semua tabel data ke kondisi bawaan'
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal mereset database.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Header */}
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-2">
          <Settings className="w-5.5 h-5.5 text-indigo-600 shrink-0" />
          <span>Pengaturan Sistem & Profil</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Atur data profil pribadi, tautkan koneksi cloud eksternal, atau lakukan backup cadangan database madrasah Anda.
        </p>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-lg flex items-center space-x-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-lg flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* 2. Menu Tabs Bar */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-xs font-bold px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <User className="w-4 h-4" />
            <span>Profil Pengguna</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`pb-3 text-xs font-bold px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'supabase' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <Database className="w-4 h-4" />
            <span>Integrasi Supabase Cloud</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`pb-3 text-xs font-bold px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'database' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <FileJson className="w-4 h-4" />
            <span>Pusat Manajemen Data</span>
          </div>
        </button>
      </div>

      {/* 3. Tab Contents */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        
        {/* TAB 1: USER PROFILE FORM */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Detail Akun & Peran</h3>
              <p className="text-xs text-slate-400 mt-1">Peran Anda ditentukan oleh kode aktivasi. Beberapa data dibekukan untuk integritas kepatuhan.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Peran Sistem (Role)</label>
                  <input
                    type="text"
                    disabled
                    value={user.role}
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 text-slate-400 font-bold uppercase tracking-wide cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                    <span>Instansi / Madrasah</span>
                    {user.role !== UserRole.ADMIN && (
                      <span className="text-[9px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        🔒 Terkunci Lisensi
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    disabled={user.role !== UserRole.ADMIN}
                    value={namaMadrasah}
                    onChange={e => setNamaMadrasah(e.target.value)}
                    className={`block w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 font-medium transition-all ${
                      user.role !== UserRole.ADMIN
                        ? 'bg-slate-100 text-slate-600 cursor-not-allowed'
                        : 'bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Username Akses</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    value={namaLengkap}
                    onChange={e => setNamaLengkap(e.target.value)}
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nomor WhatsApp Aktif</label>
                  <input
                    type="text"
                    value={nomorHp}
                    onChange={e => setNomorHp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Alamat Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nama@kemenag.go.id"
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/80 mt-6">
                <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span>Ubah Kata Sandi (Opsional)</span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 mb-3">Kosongkan kolom sandi jika Anda tidak ingin merubah sandi login saat ini.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Kata Sandi Baru</label>
                    <input
                      type="password"
                      placeholder="Masukkan sandi baru"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  id="btn-simpan-profil"
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* TAB 2: SUPABASE CLOUD CONNECTION */}
        {activeTab === 'supabase' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Dual-Mode Supabase Cloud</h3>
              <p className="text-xs text-slate-400 mt-1">
                Gunakan Supabase Postgres untuk melakukan sinkronisasi database awan (Cloud Serverless) secara real-time.
              </p>
            </div>

            {/* Connection Status Card */}
            <div className={`p-4 rounded-xl border flex items-start space-x-3.5 ${
              isConnected 
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              {isConnected ? (
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 bg-slate-200 rounded-lg text-slate-400 shrink-0">
                  <CloudOff className="w-5 h-5" />
                </div>
              )}
              <div className="text-xs space-y-1">
                <h4 className="font-extrabold uppercase tracking-wide">
                  Status Database: {isConnected ? 'SINKRONISASI CLOUD AKTIF' : 'MODE OFFLINE LOKAL (DEMO)'}
                </h4>
                <p className={isConnected ? 'text-emerald-700' : 'text-slate-500'}>
                  {isConnected 
                    ? 'Aplikasi berjalan di atas Supabase Cloud. Seluruh data (Perencanaan, Murid, Guru, Log, Catatan) tersimpan abadi di cloud.' 
                    : 'Aplikasi menyimpan seluruh data di browser local storage Anda. Aman, cepat, offline, namun akan hilang jika cache dibersihkan.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSupabase} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Supabase URL</label>
                <input
                  type="url"
                  placeholder="https://yourprojectid.supabase.co"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Supabase Anonymous (Anon) Key</span>
                  <button
                    type="button"
                    onClick={() => setShowAnonKey(!showAnonKey)}
                    className="text-indigo-600 hover:text-indigo-800 text-[10px] font-extrabold focus:outline-none cursor-pointer"
                  >
                    {showAnonKey ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                </label>
                <input
                  type={showAnonKey ? 'text' : 'password'}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.youranonkey..."
                  value={supabaseAnonKey}
                  onChange={e => setSupabaseAnonKey(e.target.value)}
                  className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-500 space-y-2 leading-relaxed">
                <span className="font-bold text-slate-800">Petunjuk Menghubungkan Supabase Cloud:</span>
                <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                  <li>Buat project baru di website resmi <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold">Supabase (Gratis)</a>.</li>
                  <li>Ambil URL & Anon Key di bagian <strong>Project Settings &gt; API</strong>.</li>
                  <li>Jalankan migration/blueprint query SQL PKMG untuk membuat tabel database di Supabase SQL Editor.</li>
                  <li>Salin dan paste nilainya di form di atas, lalu klik Simpan Koneksi.</li>
                </ol>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                {isConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnectSupabase}
                    className="px-4 py-2.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all cursor-pointer"
                  >
                    Putuskan Koneksi Cloud
                  </button>
                )}
                <button
                  type="submit"
                  id="btn-simpan-supabase"
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Hubungkan & Terapkan</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* TAB 3: DATA MANAGEMENT AND RESET */}
        {activeTab === 'database' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Manajemen Database & Ekspor</h3>
              <p className="text-xs text-slate-400 mt-1">Lakukan pencadangan (backup) lokal atau pemulihan data untuk keamanan arsip.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card 1: Backup */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                <div className="p-2 w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Backup Semua Data (JSON)</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Unduh file arsip cadangan berisi semua rencana kokurikuler, data madrasah, guru, murid, catatan pengawas, dan riwayat aktivitas logs Anda.
                  </p>
                </div>
                <button
                  onClick={handleBackup}
                  id="btn-backup"
                  className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Backup</span>
                </button>
              </div>

              {/* Card 2: Restore */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                <div className="p-2 w-10 h-10 bg-amber-50 border border-amber-100 rounded-lg text-amber-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Restore Database dari File</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Unggah file backup `.json` PKMG yang telah diunduh sebelumnya untuk memulihkan seluruh keadaan database madrasah Anda.
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestore}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                  <button className="inline-flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Unggah & Terapkan JSON</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom danger action block */}
            <div className="border-t border-slate-100 pt-6 mt-6">
              <div className="p-4 border border-rose-100 rounded-xl bg-rose-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-rose-800 flex items-center space-x-1.5">
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Database ke Keadaan Awal</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 max-w-xl">
                    Tindakan ini akan menghapus seluruh data kustom Anda (perencanaan, murid, guru, catatan) dan menggantikannya dengan akun demo bawaan Kemenag RI. Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
                <button
                  onClick={handleResetDatabase}
                  id="btn-reset-db"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  Reset Sekarang
                </button>
              </div>
            </div>

          </motion.div>
        )}

      </div>

    </div>
  );
}
