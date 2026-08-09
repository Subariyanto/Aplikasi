/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  HelpCircle,
  Calendar,
  Building,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { ActivationCode, UserRole } from '../types';
import { db } from '../lib/db';
import { isTrialUser, FULL_LICENSE_PRICE, CONTACT_PERSON_NAME, CONTACT_PERSON_PHONE } from '../lib/trial';

interface KodeAktivasiViewProps {
  user: any;
}

export default function KodeAktivasiView({ user }: KodeAktivasiViewProps) {
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states for Create/Edit
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<ActivationCode | null>(null);
  
  const [namaPaket, setNamaPaket] = useState('');
  const [roleTujuan, setRoleTujuan] = useState<UserRole>(UserRole.KOORDINATOR_KOKURIKULER);
  const [namaMadrasahTujuan, setNamaMadrasahTujuan] = useState('');
  const [jenisPenggunaan, setJenisPenggunaan] = useState<'Sekali Pakai' | 'Bisa Dipakai Beberapa Kali'>('Sekali Pakai');
  const [batasMaksimalPenggunaan, setBatasMaksimalPenggunaan] = useState<number>(1);
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalKedaluwarsa, setTanggalKedaluwarsa] = useState('');
  const [catatan, setCatatan] = useState('');
  const [customKode, setCustomKode] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Tidak Aktif' | 'Kedaluwarsa'>('Aktif');

  // Load activation codes
  const loadCodes = async () => {
    setLoading(true);
    try {
      const data = await db.activationCodes.list();
      setCodes(data);
    } catch (e) {
      console.error('Gagal mengambil data kode aktivasi:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
    
    // Default dates
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);
    
    setTanggalMulai(today.toISOString().split('T')[0]);
    setTanggalKedaluwarsa(nextYear.toISOString().split('T')[0]);
  }, []);

  // Set default max limit based on usage type
  useEffect(() => {
    if (jenisPenggunaan === 'Sekali Pakai') {
      setBatasMaksimalPenggunaan(1);
    } else if (batasMaksimalPenggunaan === 1) {
      setBatasMaksimalPenggunaan(10);
    }
  }, [jenisPenggunaan]);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like O, I, 0, 1
    const randSegment = (len: number) => {
      let str = '';
      for (let i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return str;
    };
    return `PKMG-${randSegment(4)}-${randSegment(4)}`;
  };

  const handleGenerateCodeClick = () => {
    setCustomKode(generateRandomCode());
  };

  const handleCopyCode = (id: string, kode: string) => {
    navigator.clipboard.writeText(kode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenCreate = () => {
    if (isTrialUser(user)) {
      alert(`🔒 Hak Akses Terbatas untuk Akun Trial:\n\nAkun Trial memiliki hak akses penuh untuk seluruh penyusunan dokumen, generator, dan cetak rapor, KECUALI menerbitkan Kode Aktivasi baru.\n\nUntuk mendapatkan Hak Akses FULL tanpa watermark dan menerbitkan kode, silakan beli Kode Aktivasi Lisensi seharga ${FULL_LICENSE_PRICE} melalui ${CONTACT_PERSON_NAME} (${CONTACT_PERSON_PHONE}).`);
      return;
    }
    setEditingCode(null);
    setNamaPaket('');
    setRoleTujuan(UserRole.KOORDINATOR_KOKURIKULER);
    setNamaMadrasahTujuan('');
    setJenisPenggunaan('Sekali Pakai');
    setBatasMaksimalPenggunaan(1);
    
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);
    setTanggalMulai(today.toISOString().split('T')[0]);
    setTanggalKedaluwarsa(nextYear.toISOString().split('T')[0]);
    
    setCatatan('');
    setCustomKode(generateRandomCode());
    setStatus('Aktif');
    setShowForm(true);
  };

  const handleOpenEdit = (code: ActivationCode) => {
    setEditingCode(code);
    setNamaPaket(code.nama_paket);
    setRoleTujuan(code.role_tujuan);
    setNamaMadrasahTujuan(code.nama_madrasah_tujuan);
    setJenisPenggunaan(code.jenis_penggunaan);
    setBatasMaksimalPenggunaan(code.batas_maksimal_penggunaan);
    setTanggalMulai(code.tanggal_mulai);
    setTanggalKedaluwarsa(code.tanggal_kedaluwarsa);
    setCatatan(code.catatan);
    setCustomKode(code.kode);
    setStatus(code.status);
    setShowForm(true);
  };

  const handleDelete = async (id: string, kode: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Kode Aktivasi ${kode}?`)) {
      try {
        await db.activationCodes.delete(id);
        
        // Log action
        await db.logs.create({
          user_id: user.id,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          aktivitas: 'Hapus Kode Aktivasi',
          keterangan: `Menghapus kode aktivasi ${kode} (${namaPaket})`
        });

        loadCodes();
      } catch (e) {
        console.error('Gagal menghapus kode:', e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customKode.trim()) {
      alert('Kode aktivasi tidak boleh kosong');
      return;
    }

    try {
      if (editingCode) {
        // Edit
        await db.activationCodes.update(editingCode.id, {
          kode: customKode.toUpperCase(),
          nama_paket: namaPaket,
          role_tujuan: roleTujuan,
          nama_madrasah_tujuan: namaMadrasahTujuan,
          status: status,
          tanggal_mulai: tanggalMulai,
          tanggal_kedaluwarsa: tanggalKedaluwarsa,
          jenis_penggunaan: jenisPenggunaan,
          batas_maksimal_penggunaan: batasMaksimalPenggunaan,
          catatan: catatan
        });

        // Log action
        await db.logs.create({
          user_id: user.id,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          aktivitas: 'Edit Kode Aktivasi',
          keterangan: `Mengubah kode aktivasi ${customKode} (${namaPaket})`
        });
      } else {
        // Create
        await db.activationCodes.create({
          kode: customKode.toUpperCase(),
          nama_paket: namaPaket,
          role_tujuan: roleTujuan,
          nama_madrasah_tujuan: namaMadrasahTujuan,
          status: status,
          tanggal_mulai: tanggalMulai,
          tanggal_kedaluwarsa: tanggalKedaluwarsa,
          jenis_penggunaan: jenisPenggunaan,
          batas_maksimal_penggunaan: batasMaksimalPenggunaan,
          catatan: catatan,
          dibuat_oleh: user.id
        });

        // Log action
        await db.logs.create({
          user_id: user.id,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          aktivitas: 'Buat Kode Aktivasi',
          keterangan: `Membuat kode aktivasi baru: ${customKode} untuk ${namaMadrasahTujuan}`
        });
      }

      setShowForm(false);
      loadCodes();
    } catch (err) {
      console.error('Gagal menyimpan kode aktivasi:', err);
      alert('Gagal menyimpan kode aktivasi. Silakan coba lagi.');
    }
  };

  const filteredCodes = codes.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.kode.toLowerCase().includes(term) ||
      c.nama_paket.toLowerCase().includes(term) ||
      c.nama_madrasah_tujuan.toLowerCase().includes(term) ||
      c.role_tujuan.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Manajemen Kode Aktivasi</h1>
            <p className="text-slate-500 text-xs mt-0.5 font-sans">
              Terbitkan kode lisensi aktivasi dari Pemilik Aplikasi khusus untuk Kepala Madrasah penanggung jawab.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm select-none"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Kode Lisensi Baru</span>
        </button>
      </div>

      {/* Trial Restricted Banner */}
      {isTrialUser(user) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold shrink-0 mt-0.5">
              TRIAL
            </div>
            <div className="space-y-1">
              <p className="font-black text-slate-900 text-sm">
                Akses Terbatas: Akun Trial 3 Hari
              </p>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                Anda sedang menggunakan <strong>Akun Trial</strong>. Anda memiliki hak akses penuh ke seluruh fitur penyusunan dokumen, generator, & rapor. <strong>Kecuali</strong> fitur menerbitkan kode aktivasi baru.
              </p>
              <p className="text-slate-800 font-extrabold text-[11px]">
                Untuk mendapatkan Hak Akses FULL tanpa watermark & membuka fitur terbit kode, silakan beli Kode Aktivasi seharga <span className="text-amber-900 underline font-black">{FULL_LICENSE_PRICE}</span>.
              </p>
            </div>
          </div>
          <div className="bg-white/80 border border-amber-200 p-3 rounded-xl text-right shrink-0 w-full md:w-auto">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Kontak Pembelian:</span>
            <span className="font-extrabold text-slate-900 text-xs block">{CONTACT_PERSON_NAME}</span>
            <span className="text-emerald-700 font-extrabold text-xs block">WA: {CONTACT_PERSON_PHONE}</span>
          </div>
        </div>
      )}

      {/* Policy Notice Banner */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-900 shadow-2xs">
        <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-amber-950">Aturan Kode Aktivasi Pemilik Aplikasi</p>
          <p className="text-slate-700 leading-relaxed">
            Kode Aktivasi diterbitkan secara resmi oleh <strong>Pemilik Aplikasi</strong> dan <strong>hanya diberikan kepada Kepala Madrasah</strong> untuk mengaktifkan lisensi sekolah. Anggota tim madrasah (Koordinator Kokurikuler, Guru/Fasilitator, dan Pengawas) <strong>tidak memerlukan kode aktivasi</strong> dan dapat langsung terhubung di bawah madrasah yang telah diaktivasi.
          </p>
        </div>
      </div>

      {/* Main Form Overlay modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-800">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-xs uppercase tracking-wide">
                  {editingCode ? 'Ubah Kode Aktivasi' : 'Buat Kode Aktivasi Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Form Input Kode */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kode Lisensi Aktivasi
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customKode}
                    onChange={e => setCustomKode(e.target.value.toUpperCase())}
                    placeholder="PKMG-XXXX-XXXX"
                    className="block flex-1 bg-slate-50 font-mono font-bold text-sm tracking-widest text-slate-950 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                  {!editingCode && (
                    <button
                      type="button"
                      onClick={handleGenerateCodeClick}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 rounded-lg border border-slate-200 transition-colors flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Acak</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Format disarankan: PKMG-XXXX-XXXX (menggunakan karakter alfanumerik tanpa O, I, 0, 1).
                </p>
              </div>

              {/* Nama Paket */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Paket Lisensi
                </label>
                <input
                  type="text"
                  value={namaPaket}
                  onChange={e => setNamaPaket(e.target.value)}
                  placeholder="Contoh: Paket Aktivasi Koordinator MTs"
                  className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Target Madrasah & Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Role Penerima Lisensi
                  </label>
                  <select
                    value={roleTujuan}
                    onChange={e => setRoleTujuan(e.target.value as UserRole)}
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    {Object.values(UserRole).filter(r => r !== UserRole.ADMIN).map(role => (
                      <option key={role} value={role}>
                        {role} (Penerima Lisensi)
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-indigo-600 font-medium mt-1">
                    * Kode Aktivasi diutamakan untuk Kepala Madrasah penanggung jawab sekolah.
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Madrasah Penerima
                  </label>
                  <input
                    type="text"
                    value={namaMadrasahTujuan}
                    onChange={e => setNamaMadrasahTujuan(e.target.value)}
                    placeholder="Contoh: MTs Al-Madinah"
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Jenis Penggunaan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jenis Penggunaan
                  </label>
                  <select
                    value={jenisPenggunaan}
                    onChange={e => setJenisPenggunaan(e.target.value as any)}
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="Sekali Pakai">Sekali Pakai (Single Use)</option>
                    <option value="Bisa Dipakai Beberapa Kali">Multi-Pengguna (Multi Use)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Batas Maksimal Penggunaan
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={batasMaksimalPenggunaan}
                    onChange={e => setBatasMaksimalPenggunaan(parseInt(e.target.value) || 1)}
                    disabled={jenisPenggunaan === 'Sekali Pakai'}
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Tanggal Aktif / Kedaluwarsa */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Mulai Aktif
                  </label>
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={e => setTanggalMulai(e.target.value)}
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Kedaluwarsa
                  </label>
                  <input
                    type="date"
                    value={tanggalKedaluwarsa}
                    onChange={e => setTanggalKedaluwarsa(e.target.value)}
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Status */}
              {editingCode && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status Lisensi
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                    <option value="Kedaluwarsa">Kedaluwarsa</option>
                  </select>
                </div>
              )}

              {/* Catatan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Admin / Deskripsi
                </label>
                <textarea
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder="Tuliskan catatan internal mengenai kode aktivasi ini..."
                  rows={2}
                  className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 px-4 rounded-lg border border-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors"
                >
                  {editingCode ? 'Simpan Perubahan' : 'Terbitkan Kode'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Main Table Panel */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Search & Statistics Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row gap-3 justify-between items-center">
          
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan Kode, Paket, atau Madrasah..."
              className="bg-white border border-slate-200 text-xs text-slate-800 rounded-lg pl-9 pr-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Quick Info Counts */}
          <div className="flex space-x-4 text-xs font-semibold text-slate-500">
            <div>
              Total: <span className="text-slate-850 font-bold">{codes.length}</span>
            </div>
            <div className="text-green-600">
              Aktif: <span className="font-bold">{codes.filter(c => c.status === 'Aktif').length}</span>
            </div>
            <div className="text-rose-500">
              Tidak Aktif/Kedaluwarsa: <span className="font-bold">{codes.filter(c => c.status !== 'Aktif').length}</span>
            </div>
          </div>
        </div>

        {/* Content table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-slate-500 text-xs font-bold font-sans">Memuat data kode lisensi...</p>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-center px-4">
            <KeyRound className="w-10 h-10 text-slate-300" />
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Data Tidak Ditemukan</h3>
            <p className="text-slate-400 text-xs max-w-sm">
              Tidak ada data kode aktivasi yang cocok dengan pencarian Anda atau belum ada data yang dibuat.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Kode Aktivasi</th>
                  <th className="py-3 px-4">Nama Paket & Catatan</th>
                  <th className="py-3 px-4">Tujuan Pengguna</th>
                  <th className="py-3 px-4">Status & Tanggal</th>
                  <th className="py-3 px-4">Jumlah Penggunaan</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCodes.map(c => {
                  const isCopied = copiedId === c.id;
                  const isExpired = new Date(c.tanggal_kedaluwarsa) < new Date();
                  const showStatus = isExpired ? 'Kedaluwarsa' : c.status;

                  return (
                    <tr key={c.id} className="hover:bg-slate-55/20 transition-colors">
                      {/* Code column with copy button */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sm tracking-widest text-slate-900">
                        <div className="flex items-center space-x-2">
                          <span>{c.kode}</span>
                          <button
                            onClick={() => handleCopyCode(c.id, c.kode)}
                            title="Salin Kode"
                            className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Package Name column */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-800 truncate" title={c.nama_paket}>
                          {c.nama_paket}
                        </p>
                        {c.catatan && (
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 italic" title={c.catatan}>
                            "{c.catatan}"
                          </p>
                        )}
                      </td>

                      {/* Destination User & Madrasah */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col space-y-1">
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 w-fit uppercase">
                            <UserCheck className="w-2.5 h-2.5 mr-0.5" />
                            {c.role_tujuan}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center">
                            <Building className="w-3 h-3 text-slate-400 mr-1 shrink-0" />
                            {c.nama_madrasah_tujuan}
                          </span>
                        </div>
                      </td>

                      {/* Status and dates */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col space-y-1.5">
                          {showStatus === 'Aktif' ? (
                            <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded w-fit">
                              <CheckCircle className="w-2.5 h-2.5" />
                              <span>AKTIF</span>
                            </span>
                          ) : showStatus === 'Kedaluwarsa' ? (
                            <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-150 px-1.5 py-0.5 rounded w-fit">
                              <Clock className="w-2.5 h-2.5" />
                              <span>KEDALUWARSA</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded w-fit">
                              <XCircle className="w-2.5 h-2.5" />
                              <span>NON-AKTIF</span>
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 flex items-center">
                            <Calendar className="w-3 h-3 text-slate-350 mr-1" />
                            Exp: {c.tanggal_kedaluwarsa}
                          </span>
                        </div>
                      </td>

                      {/* Usage details */}
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-600">
                        <div className="flex flex-col space-y-0.5">
                          <span className="font-bold text-slate-800">
                            {c.jumlah_terpakai} / {c.batas_maksimal_penggunaan}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">
                            {c.jenis_penggunaan}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Edit"
                            className="p-1 rounded bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-all cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.kode)}
                            title="Hapus"
                            className="p-1 rounded bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-55/10 border border-slate-200 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
