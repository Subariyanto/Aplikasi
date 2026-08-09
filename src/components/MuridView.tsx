/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserSquare2, Plus, Edit2, Trash2, Search, Save, X, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Murid, UserRole, Profile } from '../types';
import { db } from '../lib/db';

interface MuridViewProps {
  user: Profile;
}

export default function MuridView({ user }: MuridViewProps) {
  const [students, setStudents] = useState<Murid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Murid | null>(null);

  // Form states
  const [namaMurid, setNamaMurid] = useState('');
  const [nisNisn, setNisNisn] = useState('');
  const [kelas, setKelas] = useState('');
  const [fase, setFase] = useState('D');
  const [jenjang, setJenjang] = useState('MTs');
  const [jenisKelamin, setJenisKelamin] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [namaOrangTua, setNamaOrangTua] = useState('');
  const [hpOrangTua, setNomorHpOrangTua] = useState('');

  // Bulk input paste state
  const [bulkInput, setBulkInput] = useState('');

  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [schoolId, setSchoolId] = useState('');

  const isReadOnly = ![UserRole.ADMIN, UserRole.KOORDINATOR_KOKURIKULER].includes(user.role);

  useEffect(() => {
    async function loadStudents() {
      try {
        const sch = await db.madrasah.getFirst();
        if (sch) {
          setSchoolId(sch.id);
          const list = await db.murid.list(sch.id);
          setStudents(list);
        } else {
          const list = await db.murid.list();
          setStudents(list);
        }
      } catch (e) {
        console.error('Failed to load students:', e);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, []);

  const handleOpenAddModal = () => {
    if (isReadOnly) return;
    setEditingStudent(null);
    setNamaMurid('');
    setNisNisn('');
    setKelas('');
    setFase('D');
    setJenjang('MTs');
    setJenisKelamin('Laki-laki');
    setNamaOrangTua('');
    setNomorHpOrangTua('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student: Murid) => {
    if (isReadOnly) return;
    setEditingStudent(student);
    setNamaMurid(student.nama_murid);
    setNisNisn(student.nis_nisn);
    setKelas(student.kelas);
    setFase(student.fase);
    setJenjang(student.jenjang);
    setJenisKelamin(student.jenis_kelamin);
    setNamaOrangTua(student.nama_orang_tua);
    setNomorHpOrangTua(student.nomor_hp_orang_tua);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMurid.trim()) {
      setErrorMsg('Nama lengkap murid wajib diisi.');
      return;
    }

    try {
      const payload: Omit<Murid, 'id'> = {
        nama_murid: namaMurid,
        nis_nisn: nisNisn,
        kelas,
        fase,
        jenjang,
        jenis_kelamin: jenisKelamin,
        nama_orang_tua: namaOrangTua,
        nomor_hp_orang_tua: hpOrangTua,
        madrasah_id: schoolId || 'madr-1',
        created_by: user.id
      };

      if (editingStudent) {
        await db.murid.update(editingStudent.id, payload);
        setMsg('Data profil murid berhasil diperbarui.');
      } else {
        await db.murid.create(payload);
        setMsg('Berhasil mendaftarkan murid baru.');
      }

      // Refresh
      const list = await db.murid.list(schoolId || undefined);
      setStudents(list);
      setIsModalOpen(false);

      await db.logs.create({
        user_id: user.id,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        aktivitas: editingStudent ? 'Edit Murid' : 'Tambah Murid',
        keterangan: `${editingStudent ? 'Mengedit' : 'Mendaftarkan'} murid: ${namaMurid}`
      });

      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal menyimpan data.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (isReadOnly) return;
    if (window.confirm(`Hapus data murid "${name}"? Tindakan ini permanen.`)) {
      try {
        await db.murid.delete(id);
        setMsg('Data murid berhasil dihapus.');
        const list = await db.murid.list(schoolId || undefined);
        setStudents(list);

        await db.logs.create({
          user_id: user.id,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          aktivitas: 'Hapus Murid',
          keterangan: `Menghapus data murid: ${name}`
        });

        setTimeout(() => setMsg(''), 3000);
      } catch (e) {
        alert('Gagal menghapus.');
      }
    }
  };

  // CSV paste importer
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInput.trim()) {
      setErrorMsg('Teks input CSV masih kosong.');
      return;
    }

    try {
      const lines = bulkInput.split('\n');
      let importCount = 0;

      for (let line of lines) {
        if (!line.trim()) continue;
        // Parse CSV columns: Nama, NISN, Kelas, Gender(L/P), OrangTua, Kontak
        const cols = line.split(',').map(s => s.trim());
        if (cols.length > 0 && cols[0]) {
          const parsedGender = cols[3] && cols[3].toUpperCase().startsWith('P') ? 'Perempuan' : 'Laki-laki';
          
          await db.murid.create({
            nama_murid: cols[0],
            nis_nisn: cols[1] || '',
            kelas: cols[2] || 'VII A',
            fase: 'D',
            jenjang: 'MTs',
            jenis_kelamin: parsedGender as any,
            nama_orang_tua: cols[4] || '',
            nomor_hp_orang_tua: cols[5] || '',
            madrasah_id: schoolId || 'madr-1',
            created_by: user.id
          });
          importCount++;
        }
      }

      setMsg(`Berhasil mengimpor ${importCount} data murid.`);
      const list = await db.murid.list(schoolId || undefined);
      setStudents(list);
      setIsBulkOpen(false);
      setBulkInput('');

      await db.logs.create({
        user_id: user.id,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        aktivitas: 'Import Murid CSV',
        keterangan: `Berhasil mengimpor ${importCount} murid secara massal.`
      });

      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      setErrorMsg('Format parsing CSV gagal. Pastikan pemisah menggunakan koma.');
    }
  };

  // Extract class list for dropdown filters
  const classesList = ['Semua', ...Array.from(new Set(students.map(s => s.kelas))).sort()];

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.nama_murid.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.nis_nisn.includes(searchQuery) ||
                          s.nama_orang_tua.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'Semua' || s.kelas === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6" id="murid-view">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Daftar Murid Madrasah</h2>
          <p className="text-xs text-slate-400">Pengelolaan profil murid, fase perkembangan, kelas diampu, dan monitoring karakter</p>
        </div>
        {!isReadOnly && (
          <div className="flex gap-2.5 shrink-0">
            <button
              onClick={() => setIsBulkOpen(true)}
              id="btn-bulk-murid"
              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Impor Massal (CSV)</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              id="btn-add-murid"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Murid</span>
            </button>
          </div>
        )}
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-sm font-medium">
          {msg}
        </div>
      )}

      {/* Control panel and table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search and Filters */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari murid berdasarkan nama, NISN, wali murid..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-semibold">Filter Kelas:</span>
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              {classesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-xs">Memuat data murid...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">Tidak ada data murid ditemukan.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/40 text-slate-700 text-xs uppercase font-bold border-b border-slate-100">
                  <th className="px-5 py-3">Nama Murid</th>
                  <th>NIS/NISN</th>
                  <th>Kelas/Fase</th>
                  <th>Jenis Kelamin</th>
                  <th>Wali Murid / HP</th>
                  <th className="text-right px-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-800">{student.nama_murid}</td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-[11px]">{student.nis_nisn}</td>
                    <td className="px-5 py-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {student.kelas} ({student.jenjang})
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">Fase {student.fase || 'D'}</td>
                    <td className="px-5 py-3 text-slate-600">{student.jenis_kelamin}</td>
                    <td className="px-5 py-3 space-y-0.5">
                      <div className="font-medium text-slate-700">{student.nama_orang_tua || '-'}</div>
                      <div className="text-[10px] text-slate-400">{student.nomor_hp_orang_tua || '-'}</div>
                    </td>
                    <td className="px-5 py-3 text-right space-x-1 whitespace-nowrap">
                      {!isReadOnly && (
                        <>
                          <button 
                            onClick={() => handleOpenEditModal(student)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors inline-block"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id, student.nama_murid)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors inline-block"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CRUD Modal dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingStudent ? 'Edit Profil Murid' : 'Pendaftaran Murid Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Nama Murid */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nama Murid Lengkap <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={namaMurid}
                  onChange={e => setNamaMurid(e.target.value)}
                  placeholder="Contoh: Muhammad Kafeel"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* NIS/NISN */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">NIS / NISN</label>
                <input 
                  type="text" 
                  value={nisNisn}
                  onChange={e => setNisNisn(e.target.value)}
                  placeholder="Contoh: 121233740015001 / 3110293456"
                  className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Kelas */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Kelas</label>
                  <input 
                    type="text" 
                    value={kelas}
                    onChange={e => setKelas(e.target.value)}
                    placeholder="Contoh: VII A, VIII B"
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                {/* Fase */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Fase Perkembangan</label>
                  <select 
                    value={fase}
                    onChange={e => setFase(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="A">Fase A (Kelas I-II)</option>
                    <option value="B">Fase B (Kelas III-IV)</option>
                    <option value="C">Fase C (Kelas V-VI)</option>
                    <option value="D">Fase D (Kelas VII-IX)</option>
                    <option value="E">Fase E (Kelas X)</option>
                    <option value="F">Fase F (Kelas XI-XII)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Jenjang */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Jenjang</label>
                  <select 
                    value={jenjang}
                    onChange={e => setJenjang(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="RA">RA</option>
                    <option value="MI">MI</option>
                    <option value="MTs">MTs</option>
                    <option value="MA">MA</option>
                    <option value="MAK">MAK</option>
                  </select>
                </div>
                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Jenis Kelamin</label>
                  <select 
                    value={jenisKelamin}
                    onChange={e => setJenisKelamin(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* Orang Tua / Wali */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nama Orang Tua / Wali</label>
                <input 
                  type="text" 
                  value={namaOrangTua}
                  onChange={e => setNamaOrangTua(e.target.value)}
                  placeholder="Nama Ibu atau Ayah Kandung"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* No HP Wali */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">No HP / WhatsApp Orang Tua</label>
                <input 
                  type="text" 
                  value={hpOrangTua}
                  onChange={e => setNomorHpOrangTua(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Contoh: 0812345"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Footer Save */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center space-x-2 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Importer Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Impor Massal Data Murid (Copy-Paste)</h3>
              <button onClick={() => setIsBulkOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="p-5 space-y-4">
              <div className="text-xs text-slate-500 bg-amber-50 border border-amber-100 p-3 rounded-lg space-y-1">
                <p className="font-bold text-amber-800">Petunjuk Format Masukan:</p>
                <p>Salin baris teks di bawah ini dan paste pada kotak textarea. Setiap murid dipisahkan baris baru. Kolom dipisahkan dengan tanda koma (,).</p>
                <p className="font-mono text-[10px] bg-white p-1.5 border rounded border-amber-200 mt-1">
                  Nama Lengkap, NISN, Kelas, Gender(L/P), Orang Tua, No HP Wali
                </p>
                <p className="font-bold text-amber-800 mt-1">Contoh Baris:</p>
                <p className="font-mono text-[10px] bg-white p-1 border rounded border-amber-200">
                  Ahmad Dhani, 311055621, VII A, L, Bambang Dhani, 081223344<br/>
                  Siti Nurhaliza, 311099234, VII A, P, Haliza Ahmad, 081556677
                </p>
              </div>

              <textarea
                rows={8}
                value={bulkInput}
                onChange={e => setBulkInput(e.target.value)}
                placeholder="Tempel baris CSV Anda di sini..."
                className="w-full text-xs font-mono border border-slate-200 rounded-lg p-3 focus:border-emerald-600 focus:outline-none"
              ></textarea>

              <div className="flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setIsBulkOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center space-x-2 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Mulai Impor Murid</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
