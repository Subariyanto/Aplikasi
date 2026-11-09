/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Clock, 
  Calendar, 
  User, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { CatatanPengawas, PerencanaanKokurikuler, Profile, UserRole } from '../types';
import { db } from '../lib/db';

interface CatatanPengawasViewProps {
  user: Profile;
}

export default function CatatanPengawasView({ user }: CatatanPengawasViewProps) {
  const [notes, setNotes] = useState<CatatanPengawas[]>([]);
  const [plans, setPlans] = useState<PerencanaanKokurikuler[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formPlanId, setFormPlanId] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  const [formRekomendasi, setFormRekomendasi] = useState('');
  const [formStatusTL, setFormStatusTL] = useState<'Belum Ditindaklanjuti' | 'Sedang Ditindaklanjuti' | 'Selesai'>('Belum Ditindaklanjuti');
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick state update for status
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Load notes and plans
  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedNotes = await db.catatanPengawas.list();
      const fetchedPlans = await db.perencanaanKokurikuler.list();
      setNotes(fetchedNotes);
      setPlans(fetchedPlans);
    } catch (e) {
      console.error('Failed to load supervisor notes data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(true);
    setEditingId(null);
    setFormPlanId(plans[0]?.id || '');
    setFormCatatan('');
    setFormRekomendasi('');
    setFormStatusTL('Belum Ditindaklanjuti');
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setErrorMsg(null);
  };

  const handleOpenEdit = (note: CatatanPengawas) => {
    setIsEditing(true);
    setEditingId(note.id);
    setFormPlanId(note.perencanaan_id);
    setFormCatatan(note.catatan);
    setFormRekomendasi(note.rekomendasi);
    setFormStatusTL(note.status_tindak_lanjut);
    setFormTanggal(note.tanggal_pembinaan);
    setErrorMsg(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan pengawas ini?')) return;
    try {
      await db.catatanPengawas.delete(id);
      
      // Log activity
      await db.logs.create({
        user_id: user.id,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        aktivitas: 'Hapus Catatan Pengawas',
        keterangan: `Menghapus catatan pembinaan pengawas`
      });

      setSuccessMsg('Catatan pengawas berhasil dihapus.');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadData();
    } catch (e) {
      console.error(e);
      setErrorMsg('Gagal menghapus catatan.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formPlanId) {
      setErrorMsg('Pilih Rencana Proyek terlebih dahulu.');
      return;
    }
    if (!formCatatan.trim()) {
      setErrorMsg('Catatan pembinaan tidak boleh kosong.');
      return;
    }
    if (!formRekomendasi.trim()) {
      setErrorMsg('Rekomendasi tindak lanjut tidak boleh kosong.');
      return;
    }

    try {
      const selectedPlan = plans.find(p => p.id === formPlanId);
      const planTitle = selectedPlan ? selectedPlan.nama_kegiatan : 'Proyek';

      const saved = await db.catatanPengawas.save({
        id: editingId || undefined,
        perencanaan_id: formPlanId,
        pengawas_id: user.id,
        nama_pengawas: user.nama_lengkap,
        catatan: formCatatan.trim(),
        rekomendasi: formRekomendasi.trim(),
        status_tindak_lanjut: formStatusTL,
        tanggal_pembinaan: formTanggal
      });

      // Log activity
      await db.logs.create({
        user_id: user.id,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        aktivitas: editingId ? 'Update Catatan Pengawas' : 'Tambah Catatan Pengawas',
        keterangan: `${editingId ? 'Memperbarui' : 'Menambahkan'} catatan pembinaan pengawas pada perencanaan: "${planTitle}"`
      });

      setSuccessMsg(editingId ? 'Catatan berhasil diperbarui!' : 'Catatan baru berhasil ditambahkan!');
      setIsEditing(false);
      setEditingId(null);
      setTimeout(() => setSuccessMsg(null), 3000);
      loadData();
    } catch (e) {
      console.error(e);
      setErrorMsg('Gagal menyimpan catatan pengawas.');
    }
  };

  const handleQuickStatusUpdate = async (note: CatatanPengawas, newStatus: 'Belum Ditindaklanjuti' | 'Sedang Ditindaklanjuti' | 'Selesai') => {
    try {
      setUpdatingStatusId(note.id);
      await db.catatanPengawas.save({
        ...note,
        status_tindak_lanjut: newStatus
      });

      // Log activity
      await db.logs.create({
        user_id: user.id,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        aktivitas: 'Update Status Tindak Lanjut',
        keterangan: `Mengubah status tindak lanjut catatan pengawas ${note.nama_pengawas} menjadi "${newStatus}"`
      });

      setSuccessMsg(`Status tindak lanjut berhasil diubah menjadi: ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter(n => {
    const plan = plans.find(p => p.id === n.perencanaan_id);
    const planTitle = plan ? plan.nama_kegiatan.toLowerCase() : '';
    const planTema = plan ? plan.tema_kegiatan.toLowerCase() : '';
    const pengawasName = n.nama_pengawas.toLowerCase();
    const catatanText = n.catatan.toLowerCase();
    const rekomendasiText = n.rekomendasi.toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = 
      planTitle.includes(query) || 
      planTema.includes(query) ||
      pengawasName.includes(query) || 
      catatanText.includes(query) || 
      rekomendasiText.includes(query);

    const matchesPlan = selectedPlanId === 'all' || n.perencanaan_id === selectedPlanId;
    const matchesStatus = selectedStatus === 'all' || n.status_tindak_lanjut === selectedStatus;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const canAddOrEdit = user.role === UserRole.KOORDINATOR_KOKURIKULER || user.role === UserRole.ADMIN;

  // Stats calculation
  const totalNotes = notes.length;
  const countBelum = notes.filter(n => n.status_tindak_lanjut === 'Belum Ditindaklanjuti').length;
  const countSedang = notes.filter(n => n.status_tindak_lanjut === 'Sedang Ditindaklanjuti').length;
  const countSelesai = notes.filter(n => n.status_tindak_lanjut === 'Selesai').length;

  if (loading) {
    return <div className="text-center py-20 text-slate-500 text-xs">Memuat data pembinaan dan catatan pengawas...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-2">
            <ClipboardCheck className="w-5.5 h-5.5 text-indigo-600 shrink-0" />
            <span>Catatan & Rekomendasi Pengawas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau arahan, catatan adab, dan rekomendasi pembinaan resmi dari Pengawas Kemenag RI terkait Rencana Proyek Kokurikuler.
          </p>
        </div>
        
        {canAddOrEdit && !isEditing && (
          <button
            onClick={handleOpenAdd}
            id="btn-tambah-catatan"
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Catatan Pembinaan</span>
          </button>
        )}
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

      {/* 2. Visual Statistics Widgets */}
      {!isEditing && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
            <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Catatan</p>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">{totalNotes}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
            <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Belum Ditindaklanjuti</p>
              <h3 className="text-lg font-black text-rose-700 mt-0.5">{countBelum}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Proses Tindak Lanjut</p>
              <h3 className="text-lg font-black text-amber-700 mt-0.5">{countSedang}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center space-x-3.5">
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Selesai Diverifikasi</p>
              <h3 className="text-lg font-black text-emerald-700 mt-0.5">{countSelesai}</h3>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Form Area (Add or Edit) */}
      {isEditing ? (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
        >
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              {editingId ? 'Edit Catatan Pembinaan' : 'Formulir Catatan Pengawas Baru'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Isikan detail hasil pembinaan, observasi keselarasan kurikulum adab (KBC), dan rekomendasi resmi di bawah ini.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  1. Pilih Rencana Proyek Kokurikuler <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formPlanId}
                  onChange={e => setFormPlanId(e.target.value)}
                  className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                >
                  <option value="" disabled>-- Pilih Dokumen Rencana --</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.status_dokumen}] {p.nama_kegiatan} — Fase {p.kelas_fase} ({p.tahun_pelajaran})
                    </option>
                  ))}
                </select>
                {plans.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    *Belum ada data perencanaan di arsip. Silakan buat dokumen perencanaan di menu generator terlebih dahulu.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  2. Tanggal Pembinaan / Kunjungan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={e => setFormTanggal(e.target.value)}
                    className="block w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                3. Catatan Pembinaan & Evaluasi Karakter <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formCatatan}
                onChange={e => setFormCatatan(e.target.value)}
                placeholder="Tuliskan temuan di lapangan, kesesuaian instrumen penilaian, penerapan adab Panca Cinta, atau hambatan pengajaran..."
                className="block w-full text-xs border border-slate-200 rounded-lg p-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                4. Rekomendasi Tindak Lanjut Pengawas <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formRekomendasi}
                onChange={e => setFormRekomendasi(e.target.value)}
                placeholder="Rekomendasi langkah perbaikan konkret untuk kepala madrasah, koordinator tim kokurikuler, atau fasilitator kelas..."
                className="block w-full text-xs border border-slate-200 rounded-lg p-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                5. Status Tindak Lanjut Awal <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formStatusTL}
                onChange={e => setFormStatusTL(e.target.value as any)}
                className="block w-full md:w-64 text-xs border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              >
                <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                <option value="Sedang Ditindaklanjuti">Sedang Ditindaklanjuti</option>
                <option value="Selesai">Selesai (Terverifikasi)</option>
              </select>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditingId(null); }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all"
              >
                Batalkan
              </button>
              <button
                type="submit"
                id="btn-simpan-catatan"
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
              >
                {editingId ? 'Simpan Perubahan' : 'Terbitkan Catatan'}
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        <>
          {/* 4. Filter and Search Controls */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kata kunci, nama pengawas, tema proyek..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.target.value)}
                className="text-xs border border-slate-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              >
                <option value="all">Semua Proyek</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.nama_kegiatan}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="text-xs border border-slate-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              >
                <option value="all">Semua Status</option>
                <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                <option value="Sedang Ditindaklanjuti">Sedang Ditindaklanjuti</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>

          {/* 5. Catatan Cards Container */}
          <div className="space-y-4">
            {filteredNotes.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 text-center py-12 px-4">
                <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700">Belum Ada Catatan Pembinaan</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Tidak ditemukan catatan pengawas yang cocok dengan kriteria pencarian atau memang belum ada kunjungan supervisi yang tercatat.
                </p>
                {canAddOrEdit && (
                  <button
                    onClick={handleOpenAdd}
                    className="mt-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold px-3.5 py-2 rounded-lg transition-all"
                  >
                    Mulai Tulis Catatan Pertama
                  </button>
                )}
              </div>
            ) : (
              filteredNotes.map((note, index) => {
                const plan = plans.find(p => p.id === note.perencanaan_id);
                
                // Color configuration for status
                let badgeClass = 'bg-rose-50 text-rose-700 border-rose-100';
                if (note.status_tindak_lanjut === 'Sedang Ditindaklanjuti') {
                  badgeClass = 'bg-amber-50 text-amber-700 border-amber-100';
                } else if (note.status_tindak_lanjut === 'Selesai') {
                  badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                }

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={note.id}
                    className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden"
                  >
                    {/* Upper Header strip */}
                    <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs font-extrabold text-slate-800 truncate">
                          {note.nama_pengawas}
                        </span>
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{note.tanggal_pembinaan}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                          {note.status_tindak_lanjut}
                        </span>
                        
                        {/* Admin/Pengawas Edit/Delete button strip */}
                        {canAddOrEdit && (
                          <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
                            <button
                              onClick={() => handleOpenEdit(note)}
                              title="Edit Catatan"
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(note.id)}
                              title="Hapus Catatan"
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Card Content */}
                    <div className="p-5 space-y-4">
                      
                      {/* Referenced Plan details */}
                      <div className="bg-slate-50/50 rounded-lg border border-slate-100 p-3 flex items-start space-x-3 text-xs">
                        <FileText className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="font-bold text-slate-800 block">
                            Rencana: {plan ? plan.nama_kegiatan : 'Proyek Kokurikuler'}
                          </span>
                          <p className="text-slate-500 leading-relaxed text-[11px]">
                            Tema: {plan ? plan.tema_kegiatan : 'Tidak teridentifikasi'} {plan?.subtema ? `— ${plan.subtema}` : ''} | Semester {plan ? plan.semester : '-'}
                          </p>
                        </div>
                      </div>

                      {/* Notes and Recommendations row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                        <div className="space-y-1 bg-amber-50/20 border border-amber-50 rounded-lg p-3">
                          <span className="font-extrabold text-amber-800 uppercase tracking-wide text-[10px] block">
                            Catatan Temuan Pengawas:
                          </span>
                          <p className="text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">
                            {note.catatan}
                          </p>
                        </div>

                        <div className="space-y-1 bg-indigo-50/20 border border-indigo-50 rounded-lg p-3">
                          <span className="font-extrabold text-indigo-800 uppercase tracking-wide text-[10px] block">
                            Rekomendasi Tindak Lanjut:
                          </span>
                          <p className="text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">
                            {note.rekomendasi}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Footer Progress Action strip (Anyone can view, but role-driven to update progress!) */}
                    <div className="bg-slate-50/50 border-t border-slate-100 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>KBC Pilar: Cinta Ilmu & Akhlak Mulia</span>
                      </div>

                      {/* Collaborative Status Changer dropdown for convenience */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400 font-bold">Ubah Progress Tindak Lanjut:</span>
                        <select
                          disabled={updatingStatusId === note.id}
                          value={note.status_tindak_lanjut}
                          onChange={e => handleQuickStatusUpdate(note, e.target.value as any)}
                          className="bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                          <option value="Sedang Ditindaklanjuti">Sedang Ditindaklanjuti</option>
                          <option value="Selesai">Selesai (Diverifikasi)</option>
                        </select>
                      </div>
                    </div>

                  </motion.div>
                );
              })
            )}
          </div>
        </>
      )}

    </div>
  );
}
