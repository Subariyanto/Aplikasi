/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Search, Save, X, AlertCircle } from 'lucide-react';
import { Guru, UserRole, Profile } from '../types';
import { db } from '../lib/db';

interface GuruViewProps {
  user: Profile;
}

export default function GuruView({ user }: GuruViewProps) {
  const [teachers, setTeachers] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null);

  // Form states
  const [namaGuru, setNamaGuru] = useState('');
  const [nipNuptk, setNipNuptk] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [mapel, setMapel] = useState('');
  const [kelas, setKelas] = useState('');
  const [nomorHp, setNomorHp] = useState('');
  const [email, setEmail] = useState('');

  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [schoolId, setSchoolId] = useState('');

  const isReadOnly = ![UserRole.ADMIN, UserRole.KOORDINATOR_KOKURIKULER].includes(user.role);

  useEffect(() => {
    async function loadTeachers() {
      try {
        const sch = await db.madrasah.getFirst();
        if (sch) {
          setSchoolId(sch.id);
          const list = await db.guru.list(sch.id);
          setTeachers(list);
        } else {
          const list = await db.guru.list();
          setTeachers(list);
        }
      } catch (e) {
        console.error('Failed to load teachers:', e);
      } finally {
        setLoading(false);
      }
    }
    loadTeachers();
  }, []);

  const handleOpenAddModal = () => {
    if (isReadOnly) return;
    setEditingGuru(null);
    setNamaGuru('');
    setNipNuptk('');
    setJabatan('');
    setMapel('');
    setKelas('');
    setNomorHp('');
    setEmail('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (guru: Guru) => {
    if (isReadOnly) return;
    setEditingGuru(guru);
    setNamaGuru(guru.nama_guru);
    setNipNuptk(guru.nip_nuptk);
    setJabatan(guru.jabatan);
    setMapel(guru.mata_pelajaran_muatan);
    setKelas(guru.kelas_diampu);
    setNomorHp(guru.nomor_hp);
    setEmail(guru.email);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaGuru.trim()) {
      setErrorMsg('Nama lengkap pendidik wajib diisi.');
      return;
    }

    try {
      const payload: Omit<Guru, 'id'> = {
        nama_guru: namaGuru,
        nip_nuptk: nipNuptk,
        jabatan,
        mata_pelajaran_muatan: mapel,
        kelas_diampu: kelas,
        nomor_hp: nomorHp,
        email,
        madrasah_id: schoolId || 'madr-1',
        created_by: user.id
      };

      if (editingGuru) {
        await db.guru.update(editingGuru.id, payload);
        setMsg('Berhasil memperbarui data guru.');
      } else {
        await db.guru.create(payload);
        setMsg('Berhasil mendaftarkan guru baru.');
      }

      // Reload
      const list = await db.guru.list(schoolId || undefined);
      setTeachers(list);
      setIsModalOpen(false);

      await db.logs.create({
        user_id: user.id,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        aktivitas: editingGuru ? 'Edit Data Guru' : 'Tambah Guru',
        keterangan: `${editingGuru ? 'Memperbarui' : 'Mendaftarkan'} guru: ${namaGuru}`
      });

      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal menyimpan.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (isReadOnly) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus data pendidik "${name}"?`)) {
      try {
        await db.guru.delete(id);
        setMsg('Data guru berhasil dihapus.');
        const list = await db.guru.list(schoolId || undefined);
        setTeachers(list);

        await db.logs.create({
          user_id: user.id,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          aktivitas: 'Hapus Guru',
          keterangan: `Menghapus data pendidik: ${name}`
        });

        setTimeout(() => setMsg(''), 3000);
      } catch (e) {
        alert('Gagal menghapus.');
      }
    }
  };

  const filteredTeachers = teachers.filter(g => 
    g.nama_guru.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.nip_nuptk.includes(searchQuery) ||
    g.jabatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.mata_pelajaran_muatan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="guru-view">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Daftar Pendidik & Guru</h2>
          <p className="text-xs text-slate-400">Pengelolaan dewan guru pendamping, fasilitator, dan koordinator tim kerja</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={handleOpenAddModal}
            id="btn-add-guru"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all shrink-0 shadow-md shadow-emerald-950/10"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pendidik</span>
          </button>
        )}
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-sm font-medium">
          {msg}
        </div>
      )}

      {/* Control panel and table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari guru berdasarkan nama, NIP, mapel..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-xs">Memuat data guru...</div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Tidak ada data guru ditemukan.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/40 text-slate-700 text-xs uppercase font-bold border-b border-slate-100">
                  <th className="px-5 py-3">Nama Lengkap & NIP</th>
                  <th className="px-5 py-3">Jabatan Struktural</th>
                  <th className="px-5 py-3">Mapel Utama</th>
                  <th className="px-5 py-3">Kelas Diampu</th>
                  <th className="px-5 py-3">Kontak Info</th>
                  {!isReadOnly && <th className="px-5 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-600">
                {filteredTeachers.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800">{g.nama_guru}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">NIP: {g.nip_nuptk || '-'}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{g.jabatan}</td>
                    <td className="px-5 py-3.5">{g.mata_pelajaran_muatan}</td>
                    <td className="px-5 py-3.5 font-mono">{g.kelas_diampu}</td>
                    <td className="px-5 py-3.5 space-y-0.5">
                      <div>{g.nomor_hp || '-'}</div>
                      <div className="text-[10px] text-slate-400">{g.email || '-'}</div>
                    </td>
                    {!isReadOnly && (
                      <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button 
                          onClick={() => handleOpenEditModal(g)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors inline-block"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(g.id, g.nama_guru)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors inline-block"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CRUD Modal dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingGuru ? 'Edit Profil Pendidik' : 'Pendaftaran Pendidik Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Nama Guru */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nama Guru Lengkap beserta Gelar <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={namaGuru}
                  onChange={e => setNamaGuru(e.target.value)}
                  placeholder="Contoh: Ustadzah Fatimah, S.Pd.I."
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* NIP/NUPTK */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">NIP / NUPTK</label>
                <input 
                  type="text" 
                  value={nipNuptk}
                  onChange={e => setNipNuptk(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Masukkan 18 digit NIP"
                  className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Jabatan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Jabatan Struktural / Tugas Tambahan</label>
                <input 
                  type="text" 
                  value={jabatan}
                  onChange={e => setJabatan(e.target.value)}
                  placeholder="Contoh: Guru Kelas, Waka Kesiswaan"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Mapel */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Mata Pelajaran yang Diampu</label>
                <input 
                  type="text" 
                  value={mapel}
                  onChange={e => setMapel(e.target.value)}
                  placeholder="Contoh: Fiqih / Bahasa Arab"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Kelas Diampu */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Kelas yang Diampu (Gunakan koma)</label>
                <input 
                  type="text" 
                  value={kelas}
                  onChange={e => setKelas(e.target.value)}
                  placeholder="Contoh: VII A, VII B, VIII C"
                  className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* HP */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">No HP / WhatsApp</label>
                  <input 
                    type="text" 
                    value={nomorHp}
                    onChange={e => setNomorHp(e.target.value.replace(/[^0-9+]/g, ''))}
                    placeholder="Contoh: 0812345"
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Email Pendidik</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Contoh: nama@kemenag.go.id"
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Save */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
