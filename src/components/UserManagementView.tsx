/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  CheckCircle, 
  XCircle, 
  UserPlus, 
  RefreshCw, 
  Mail, 
  Phone, 
  Building, 
  ShieldAlert, 
  Lock, 
  KeyRound,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { Profile, UserRole } from '../types';
import { db } from '../lib/db';

interface UserManagementViewProps {
  user: any;
  onNavigate?: (view: string) => void;
}

export default function UserManagementView({ user, onNavigate }: UserManagementViewProps) {
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form modal states
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  // Form input fields
  const [namaLengkap, setNamaLengkap] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.KOORDINATOR_KOKURIKULER);
  const [namaMadrasah, setNamaMadrasah] = useState('');
  const [nomorHp, setNomorHp] = useState('');
  const [email, setEmail] = useState('');
  const [statusUser, setStatusUser] = useState<'Aktif' | 'Tidak Aktif'>('Aktif');
  const [kodeAktivasi, setKodeAktivasi] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await db.profiles.list();
      setUsersList(data);
    } catch (e) {
      console.error('Gagal memuat pengguna:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingProfile(null);
    setNamaLengkap('');
    setUsername('');
    setPassword('');
    setRole(UserRole.KOORDINATOR_KOKURIKULER);
    setNamaMadrasah('');
    setNomorHp('');
    setEmail('');
    setStatusUser('Aktif');
    setKodeAktivasi('');
    setShowForm(true);
  };

  const handleOpenEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setNamaLengkap(profile.nama_lengkap);
    setUsername(profile.username);
    setPassword('');
    setRole(profile.role);
    setNamaMadrasah(profile.nama_madrasah || '');
    setNomorHp(profile.nomor_hp || '');
    setEmail(profile.email || '');
    setStatusUser(profile.status_user);
    setKodeAktivasi(profile.kode_aktivasi || '');
    setShowForm(true);
  };

  const handleDelete = async (targetId: string, targetName: string) => {
    if (targetId === user.id) {
      alert('Anda tidak bisa menghapus akun Anda sendiri yang sedang aktif digunakan.');
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus akun user ${targetName}? Tindakan ini permanen.`)) {
      try {
        await db.profiles.delete(targetId);
        
        // Log action
        await db.logs.create({
          user_id: user.id,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          aktivitas: 'Hapus User',
          keterangan: `Menghapus akun pengguna ${targetName} (${targetId})`
        });

        loadUsers();
      } catch (e) {
        console.error('Gagal menghapus user:', e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      alert('Username tidak boleh kosong');
      return;
    }
    if (!editingProfile && !password.trim()) {
      alert('Password tidak boleh kosong untuk akun baru');
      return;
    }

    try {
      if (editingProfile) {
        // Edit User — password bersifat opsional; hash hanya jika diisi ulang
        const updates: any = {
          nama_lengkap: namaLengkap,
          username: username.toLowerCase().replace(/\s+/g, ''),
          role: role,
          nama_madrasah: namaMadrasah,
          nomor_hp: nomorHp,
          email: email,
          status_user: statusUser,
          kode_aktivasi: kodeAktivasi
        };
        if (password.trim()) {
          updates.password_hash = await hashPassword(password);
        }
        await db.profiles.update(editingProfile.id, updates);

        // Log action
        await db.logs.create({
          user_id: user.id,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          aktivitas: 'Edit User',
          keterangan: `Mengubah profil pengguna ${namaLengkap} (${username})`
        });
      } else {
        // Check for username conflict
        const existing = await db.profiles.getByUsername(username);
        if (existing) {
          alert('Username sudah terdaftar di sistem. Gunakan nama lain.');
          return;
        }

        // Create User
        await db.profiles.create({
          nama_lengkap: namaLengkap,
          username: username.toLowerCase().replace(/\s+/g, ''),
          password_hash: await hashPassword(password),
          role: role,
          nama_madrasah: namaMadrasah,
          nomor_hp: nomorHp,
          email: email,
          status_user: statusUser,
          kode_aktivasi: kodeAktivasi
        });

        // Log action
        await db.logs.create({
          user_id: user.id,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          aktivitas: 'Tambah User Baru',
          keterangan: `Mendaftarkan pengguna baru ${namaLengkap} dengan peran ${role}`
        });
      }

      setShowForm(false);
      loadUsers();
    } catch (err) {
      console.error('Gagal menyimpan pengguna:', err);
      alert('Gagal menyimpan data pengguna. Silakan coba lagi.');
    }
  };

  const filteredUsers = usersList.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.nama_lengkap.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      u.role.toLowerCase().includes(term) ||
      (u.nama_madrasah && u.nama_madrasah.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header card panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Manajemen Akun Pengguna (User)</h1>
            <p className="text-slate-500 text-xs mt-0.5 font-sans">
              Pantau pengguna aktif, kelola akun Kepala Madrasah penerima lisensi, dan daftarkan tim pendidik.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm select-none"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Info Banner for Activation Code Policy */}
      <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-4 flex items-start space-x-3 text-xs text-indigo-950">
        <KeyRound className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-indigo-950">Kebijakan Kode Aktivasi Pengguna</p>
          <p className="text-slate-700 leading-relaxed">
            Hanya akun <strong>Kepala Madrasah</strong> yang wajib mendapatkan dan menghubungkan <strong>Kode Aktivasi</strong> resmi dari Pemilik Aplikasi. Anggota tim (Koordinator, Guru/Fasilitator, dan Pengawas) <strong>tidak membutuhkan kode aktivasi terpisah</strong> dan dapat langsung terhubung dengan madrasah terkait.
          </p>
        </div>
      </div>

      {/* modal create/edit user form overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-800">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-xs uppercase tracking-wide">
                  {editingProfile ? 'Ubah Profil Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer animate-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Nama Lengkap */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={e => setNamaLengkap(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi, S.Pd., M.Si."
                  className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Username Akun
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Contoh: ahmadfauzi"
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                    disabled={!!editingProfile}
                    required
                  />
                  {!editingProfile && (
                    <p className="text-[9px] text-slate-400 mt-0.5">Hanya huruf kecil, tanpa spasi.</p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3 h-3 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="block w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Peran / Role & Madrasah */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hak Akses / Peran
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    {Object.values(UserRole).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Madrasah / Satker
                  </label>
                  <input
                    type="text"
                    value={namaMadrasah}
                    onChange={e => setNamaMadrasah(e.target.value)}
                    placeholder="Contoh: MTs Al-Madinah"
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* HP & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={nomorHp}
                      onChange={e => setNomorHp(e.target.value)}
                      placeholder="0812XXXXXXXX"
                      className="block w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="block w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Kode Aktivasi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status Akun
                  </label>
                  <select
                    value={statusUser}
                    onChange={e => setStatusUser(e.target.value as any)}
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Tidak Aktif">Tidak Aktif (Suspended)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hubungkan Kode Aktivasi (Opsional)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={kodeAktivasi}
                      onChange={e => setKodeAktivasi(e.target.value.toUpperCase())}
                      placeholder="PKMG-XXXX-XXXX (Opsional)"
                      className="block w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono tracking-wider"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-600 font-medium mt-1">
                    * Akun baru dapat dihubungkan dengan kode aktivasi jika ada.
                  </p>
                </div>
              </div>

              {/* Form Actions */}
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
                  {editingProfile ? 'Simpan Perubahan' : 'Daftarkan Akun'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Main content table container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Search & statistics */}
        <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row gap-3 justify-between items-center">
          
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari user berdasarkan nama, role, madrasah..."
              className="bg-white border border-slate-200 text-xs text-slate-800 rounded-lg pl-9 pr-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex space-x-4 text-xs font-semibold text-slate-500">
            <div>
              Total User: <span className="text-slate-850 font-bold">{usersList.length}</span>
            </div>
            <div className="text-green-600">
              Aktif: <span className="font-bold">{usersList.filter(u => u.status_user === 'Aktif').length}</span>
            </div>
            <div className="text-slate-500">
              Suspended: <span className="font-bold">{usersList.filter(u => u.status_user !== 'Aktif').length}</span>
            </div>
          </div>
        </div>

        {/* Content table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-slate-500 text-xs font-bold font-sans">Memuat data pengguna...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-center px-4">
            <Users className="w-10 h-10 text-slate-300" />
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Data Pengguna Kosong</h3>
            <p className="text-slate-400 text-xs max-w-sm">
              Tidak ada profil pengguna yang cocok dengan filter pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Pengguna (Profil)</th>
                  <th className="py-3 px-4">Identitas Akun</th>
                  <th className="py-3 px-4">Kontak & Madrasah</th>
                  <th className="py-3 px-4">Hak Akses / Peran</th>
                  <th className="py-3 px-4">Status Akun</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map(u => {
                  const isSelf = u.id === user.id;

                  return (
                    <tr key={u.id} className={`hover:bg-slate-55/20 transition-colors ${isSelf ? 'bg-indigo-50/10' : ''}`}>
                      {/* Name of user with initials */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center uppercase border border-indigo-100 shrink-0">
                            {u.nama_lengkap.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 flex items-center">
                              {u.nama_lengkap}
                              {isSelf && (
                                <span className="ml-1.5 px-1 py-0.1 bg-indigo-100 text-indigo-800 text-[8px] font-black uppercase rounded">
                                  Akun Anda
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              ID: {u.id.substring(0, 13)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Username and credentials */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex flex-col space-y-0.5">
                          <span className="text-slate-800 font-bold">@{u.username}</span>
                          <span className="text-[10px] text-slate-400 flex items-center">
                            <Lock className="w-2.5 h-2.5 mr-1" />
                            Password tersimpan aman (hashed)
                          </span>
                        </div>
                      </td>

                      {/* Madrasah, phone and email info */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col space-y-1">
                          <span className="text-slate-700 flex items-center font-semibold">
                            <Building className="w-3 h-3 text-slate-450 mr-1.5 shrink-0" />
                            {u.nama_madrasah || '-'}
                          </span>
                          <div className="flex flex-wrap gap-x-2 text-[10px] text-slate-400">
                            {u.nomor_hp && (
                              <span className="flex items-center">
                                <Phone className="w-2.5 h-2.5 mr-0.5" /> {u.nomor_hp}
                              </span>
                            )}
                            {u.email && (
                              <span className="flex items-center">
                                <Mail className="w-2.5 h-2.5 mr-0.5" /> {u.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Roles */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
                          <UserCheck className="w-2.5 h-2.5 mr-1" />
                          {u.role}
                        </span>
                      </td>

                      {/* Status user */}
                      <td className="py-3.5 px-4">
                        {u.status_user === 'Aktif' ? (
                          <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded">
                            <CheckCircle className="w-2.5 h-2.5" />
                            <span>AKTIF</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[9px] font-extrabold text-rose-700 bg-rose-50 border border-rose-150 px-1.5 py-0.5 rounded">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            <span>SUSPENDED</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Edit User"
                            className="p-1 rounded bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-all cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.nama_lengkap)}
                            disabled={isSelf}
                            title={isSelf ? 'Anda tidak bisa menghapus diri sendiri' : 'Hapus User'}
                            className="p-1 rounded bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-55/10 border border-slate-200 transition-all disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 cursor-pointer"
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
