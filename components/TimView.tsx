/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Save, Plus, X, Users, Printer, Heart } from 'lucide-react';
import { TimKokurikuler, UserRole, Profile } from '../types';
import { db } from '../lib/db';

interface TimViewProps {
  user: Profile;
}

export default function TimView({ user }: TimViewProps) {
  const [tim, setTim] = useState<TimKokurikuler | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Form inputs
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  const [kepalaMadrasah, setKepalaMadrasah] = useState('');
  const [koordinator, setKoordinator] = useState('');
  const [fasilitators, setFasilitators] = useState<string[]>([]);
  const [staff, setStaff] = useState<string[]>([]);
  const [warga, setWarga] = useState<string[]>([]);
  const [mitra, setMitra] = useState<string[]>([]);

  // Individual text inputs to append
  const [newFasilitator, setNewFasilitator] = useState('');
  const [newStaff, setNewStaff] = useState('');
  const [newWarga, setNewWarga] = useState('');
  const [newMitra, setNewMitra] = useState('');

  const [schoolId, setSchoolId] = useState('');

  const isReadOnly = ![UserRole.ADMIN, UserRole.KOORDINATOR_KOKURIKULER].includes(user.role);

  useEffect(() => {
    async function loadTim() {
      try {
        const sch = await db.madrasah.getFirst();
        if (sch) {
          setSchoolId(sch.id);
          setKepalaMadrasah(sch.kepala_madrasah);
          
          const existingTim = await db.timKokurikuler.getFirst(sch.id);
          if (existingTim) {
            setTim(existingTim);
            setTahunPelajaran(existingTim.tahun_pelajaran);
            setKepalaMadrasah(existingTim.nama_kepala_madrasah);
            setKoordinator(existingTim.koordinator_kokurikuler);
            setFasilitators(existingTim.guru_fasilitator || []);
            setStaff(existingTim.tenaga_kependidikan || []);
            setWarga(existingTim.warga_madrasah_lainnya || []);
            setMitra(existingTim.mitra_eksternal || []);
          } else {
            // Find a guru to set as coordinator default
            const gurus = await db.guru.list(sch.id);
            if (gurus.length > 0) {
              setKoordinator(gurus[0].nama_guru);
              setFasilitators(gurus.slice(1).map(g => g.nama_guru));
            }
          }
        }
      } catch (e) {
        console.error('Failed to load Tim Kerja:', e);
      } finally {
        setLoading(false);
      }
    }
    loadTim();
  }, []);

  const handleAppendItem = (type: 'fasilitator' | 'staff' | 'warga' | 'mitra') => {
    if (type === 'fasilitator' && newFasilitator.trim()) {
      setFasilitators([...fasilitators, newFasilitator.trim()]);
      setNewFasilitator('');
    }
    if (type === 'staff' && newStaff.trim()) {
      setStaff([...staff, newStaff.trim()]);
      setNewStaff('');
    }
    if (type === 'warga' && newWarga.trim()) {
      setWarga([...warga, newWarga.trim()]);
      setNewWarga('');
    }
    if (type === 'mitra' && newMitra.trim()) {
      setMitra([...mitra, newMitra.trim()]);
      setNewMitra('');
    }
  };

  const handleRemoveItem = (type: 'fasilitator' | 'staff' | 'warga' | 'mitra', index: number) => {
    if (isReadOnly) return;
    if (type === 'fasilitator') setFasilitators(fasilitators.filter((_, i) => i !== index));
    if (type === 'staff') setStaff(staff.filter((_, i) => i !== index));
    if (type === 'warga') setWarga(warga.filter((_, i) => i !== index));
    if (type === 'mitra') setMitra(mitra.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setSaving(true);
    try {
      const payload: Omit<TimKokurikuler, 'id'> & { id?: string } = {
        id: tim?.id || undefined,
        tahun_pelajaran: tahunPelajaran,
        nama_kepala_madrasah: kepalaMadrasah,
        koordinator_kokurikuler: koordinator,
        guru_fasilitator: fasilitators,
        tenaga_kependidikan: staff,
        warga_madrasah_lainnya: warga,
        mitra_eksternal: mitra,
        madrasah_id: schoolId || 'madr-1',
        created_by: user.id
      };

      const saved = await db.timKokurikuler.save(payload);
      setTim(saved);
      setMsg('Tim Kerja SK Panitia Kokurikuler berhasil disimpan online.');

      await db.logs.create({
        user_id: user.id,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        aktivitas: 'Update Tim Kokurikuler',
        keterangan: `Memperbarui SK Kepanitiaan Tim Kerja tahun pelajaran ${tahunPelajaran}`
      });

      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      alert('Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-slate-500 text-xs">Memuat Susunan Tim Kerja...</div>;
  }

  return (
    <div className="space-y-6" id="tim-view">
      {/* View Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Tim Kerja Kokurikuler Madrasah</h2>
          <p className="text-xs text-slate-400">Susunan kepanitiaan komite, penunjukan koordinator, fasilitator, serta kemitraan eksternal</p>
        </div>
        <ShieldCheck className="w-8 h-8 text-emerald-700" />
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-sm font-medium">
          {msg}
        </div>
      )}

      {/* Forms Susunan */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panitia inputs (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">Identitas & Penanggung Jawab</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tahun Pelajaran */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Tahun Pelajaran</label>
                <input 
                  type="text" 
                  value={tahunPelajaran}
                  onChange={e => setTahunPelajaran(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Penanggung Jawab (Kepala) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Penanggung Jawab (Kepala)</label>
                <input 
                  type="text" 
                  value={kepalaMadrasah}
                  onChange={e => setKepalaMadrasah(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Koordinator */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Koordinator Kokurikuler</label>
                <input 
                  type="text" 
                  value={koordinator}
                  onChange={e => setKoordinator(e.target.value)}
                  disabled={isReadOnly}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Members list block (Fasilitator, Staff, Warga, Mitra) */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">Dewan Guru & Mitra Komite</h3>

            {/* 1. Guru Fasilitator */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">1. Guru Pendamping / Fasilitator Proyek</label>
              {!isReadOnly && (
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={newFasilitator}
                    onChange={e => setNewFasilitator(e.target.value)}
                    placeholder="Contoh: Ustadz Ahmad, S.Ag."
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-600"
                  />
                  <button 
                    type="button" 
                    onClick={() => handleAppendItem('fasilitator')}
                    className="bg-slate-100 hover:bg-slate-200 border text-xs text-slate-700 font-bold px-3.5 rounded-lg"
                  >
                    Tambah
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {fasilitators.map((f, idx) => (
                  <span key={idx} className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-100">
                    <span>{f}</span>
                    {!isReadOnly && (
                      <button type="button" onClick={() => handleRemoveItem('fasilitator', idx)} className="text-emerald-500 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* 2. Tenaga Kependidikan */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">2. Tenaga Kependidikan (TU/Sarpras)</label>
              {!isReadOnly && (
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={newStaff}
                    onChange={e => setNewStaff(e.target.value)}
                    placeholder="Contoh: Didin (Administrasi TU)"
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-600"
                  />
                  <button 
                    type="button" 
                    onClick={() => handleAppendItem('staff')}
                    className="bg-slate-100 hover:bg-slate-200 border text-xs text-slate-700 font-bold px-3.5 rounded-lg"
                  >
                    Tambah
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {staff.map((s, idx) => (
                  <span key={idx} className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-semibold border border-blue-100">
                    <span>{s}</span>
                    {!isReadOnly && (
                      <button type="button" onClick={() => handleRemoveItem('staff', idx)} className="text-blue-500 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* 3. Warga Madrasah Lainnya */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">3. Warga Madrasah Lainnya (Komite / Wali Murid)</label>
              {!isReadOnly && (
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={newWarga}
                    onChange={e => setNewWarga(e.target.value)}
                    placeholder="Contoh: Paguyuban Wali Kelas VII"
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-600"
                  />
                  <button 
                    type="button" 
                    onClick={() => handleAppendItem('warga')}
                    className="bg-slate-100 hover:bg-slate-200 border text-xs text-slate-700 font-bold px-3.5 rounded-lg"
                  >
                    Tambah
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {warga.map((w, idx) => (
                  <span key={idx} className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-100">
                    <span>{w}</span>
                    {!isReadOnly && (
                      <button type="button" onClick={() => handleRemoveItem('warga', idx)} className="text-amber-500 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* 4. Mitra Eksternal */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">4. Mitra Pengembang Eksternal (Lembaga / Narasumber Tamu)</label>
              {!isReadOnly && (
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={newMitra}
                    onChange={e => setNewMitra(e.target.value)}
                    placeholder="Contoh: Puskesmas Ngaliyan, Dinas Pertanian"
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-600"
                  />
                  <button 
                    type="button" 
                    onClick={() => handleAppendItem('mitra')}
                    className="bg-slate-100 hover:bg-slate-200 border text-xs text-slate-700 font-bold px-3.5 rounded-lg"
                  >
                    Tambah
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {mitra.map((m, idx) => (
                  <span key={idx} className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 text-[11px] font-semibold border border-purple-100">
                    <span>{m}</span>
                    {!isReadOnly && (
                      <button type="button" onClick={() => handleRemoveItem('mitra', idx)} className="text-purple-500 hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                id="btn-save-tim"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center space-x-2 shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan SK Panitia'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Roles & Duties Guidelines (Right column) - Pure Section M Table */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Matriks Tugas & Peran Panitia</span>
            </h3>

            <div className="space-y-4 text-xs text-slate-600">
              {/* Kepala */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg">
                <p className="font-bold text-slate-800 text-[11px]">A. Kepala Madrasah (Penanggung Jawab)</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-500 leading-relaxed">
                  <li>Memimpin perumusan regulasi/SK pendukung</li>
                  <li>Mengatur alokasi waktu dan menetapkan koordinator</li>
                  <li>Memimpin analisis kebutuhan madrasah</li>
                  <li>Membangun jejaring kemitraan luar</li>
                </ul>
              </div>

              {/* Koordinator */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg">
                <p className="font-bold text-slate-800 text-[11px]">B. Koordinator Kokurikuler</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-500 leading-relaxed">
                  <li>Mengelola dan merancang jalannya kegiatan</li>
                  <li>Mengatur kolaborasi dengan narasumber tamu</li>
                  <li>Mensosialisasikan materi ke warga & orang tua</li>
                  <li>Memastikan instrumen asesmen terpenuhi</li>
                </ul>
              </div>

              {/* Fasilitator */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg">
                <p className="font-bold text-slate-800 text-[11px]">C. Guru Fasilitator</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-500 leading-relaxed">
                  <li>Menyusun rancangan Rencana Proyek (RPK)</li>
                  <li>Mendampingi serta memandu aktivitas murid harian</li>
                  <li>Mengisi lembar observasi & jurnal pelaksanaan</li>
                  <li>Melaporkan penilaian dalam rapor kokurikuler</li>
                </ul>
              </div>

              {/* Staff */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg">
                <p className="font-bold text-slate-800 text-[11px]">D. Tenaga Kependidikan & Staff</p>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-500 leading-relaxed">
                  <li>Menyiapkan sarana, prasarana, lahan & perkakas</li>
                  <li>Mengelola dokumentasi fisik kepanitiaan</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
