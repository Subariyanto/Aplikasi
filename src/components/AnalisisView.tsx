/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FileSearch, Save, Sparkles, Plus, X, AlertCircle } from 'lucide-react';
import { AnalisisMadrasah, UserRole, Profile } from '../types';
import { db } from '../lib/db';

interface AnalisisViewProps {
  user: Profile;
}

export default function AnalisisView({ user }: AnalisisViewProps) {
  const [analisis, setAnalisis] = useState<AnalisisMadrasah | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // States
  const [kesesuaian, setKesesuaian] = useState('');
  const [minat, setMinat] = useState('');
  const [capaian, setCapaian] = useState('');
  const [dimensi, setDimensi] = useState<string[]>([]);
  const [cinta, setCinta] = useState<string[]>([]);
  const [fisik, setFisik] = useState<string[]>([]);
  const [manusia, setManusia] = useState<string[]>([]);
  const [finansial, setFinansial] = useState<string[]>([]);
  const [lingkungan, setLingkungan] = useState<string[]>([]);
  const [sosbud, setSosbud] = useState('');
  const [masalah, setMasalah] = useState('');
  const [potensi, setPotensi] = useState('');
  const [alasan, setAlasan] = useState('');
  const [narasi, setNarasi] = useState('');

  // Individual helpers
  const [newFisik, setNewFisik] = useState('');
  const [newManusia, setNewManusia] = useState('');
  const [newFinansial, setNewFinansial] = useState('');
  const [newLingkungan, setNewLingkungan] = useState('');

  const [schoolId, setSchoolId] = useState('');

  const isReadOnly = ![UserRole.ADMIN, UserRole.KOORDINATOR_KOKURIKULER].includes(user.role);

  const availableDimensions = [
    'Keimanan dan ketakwaan terhadap Tuhan Yang Maha Esa',
    'Kewargaan',
    'Penalaran kritis',
    'Kreativitas',
    'Kolaborasi',
    'Kemandirian',
    'Kesehatan',
    'Komunikasi'
  ];

  const availablePancaCinta = [
    'Cinta Allah Swt. dan Rasul-Nya',
    'Cinta Ilmu',
    'Cinta Lingkungan',
    'Cinta Diri dan Sesama Manusia',
    'Cinta Tanah Air'
  ];

  useEffect(() => {
    async function loadAnalisis() {
      try {
        const sch = await db.madrasah.getFirst();
        if (sch) {
          setSchoolId(sch.id);
          const data = await db.analisisMadrasah.getFirst(sch.id);
          if (data) {
            setAnalisis(data);
            setKesesuaian(data.kesesuaian_kurikulum);
            setMinat(data.minat_bakat_murid);
            setCapaian(data.capaian_belum_optimal);
            setDimensi(data.dimensi_perlu_diperkuat || []);
            setCinta(data.panca_cinta_perlu_diperkuat || []);
            setFisik(data.sumber_daya_fisik || []);
            setManusia(data.sumber_daya_manusia || []);
            setFinansial(data.sumber_daya_finansial || []);
            setLingkungan(data.sumber_daya_lingkungan || []);
            setSosbud(data.kondisi_sosial_budaya);
            setMasalah(data.masalah_aktual);
            setPotensi(data.potensi_lokal);
            setAlasan(data.alasan_pemilihan_kegiatan);
            setNarasi(data.narasi_otomatis);
          }
        }
      } catch (e) {
        console.error('Failed to load analysis:', e);
      } finally {
        setLoading(false);
      }
    }
    loadAnalisis();
  }, []);

  const handleToggleDimension = (dim: string) => {
    if (isReadOnly) return;
    if (dimensi.includes(dim)) {
      setDimensi(dimensi.filter(d => d !== dim));
    } else {
      setDimensi([...dimensi, dim]);
    }
  };

  const handleToggleCinta = (ct: string) => {
    if (isReadOnly) return;
    if (cinta.includes(ct)) {
      setCinta(cinta.filter(c => c !== ct));
    } else {
      setCinta([...cinta, ct]);
    }
  };

  // Generate automated narrative
  const handleAutoNarrate = () => {
    const dimText = dimensi.length > 0 ? dimensi.map(d => d.replace(/ terhadap Tuhan.*/, '')).join(', ') : 'dimensi karakter terpilih';
    const cintaText = cinta.length > 0 ? cinta.join(' dan ') : 'nilai Panca Cinta';
    const assetSummary = `${fisik.slice(0,2).join(', ')} serta ${manusia.slice(0,2).join(', ')}`;
    
    const text = `Berdasarkan hasil identifikasi diagnostik madrasah, disimpulkan bahwa untuk memperkuat profil lulusan khususnya pada aspek ${dimText}, madrasah perlu menanamkan nilai-nilai ${cintaText}. Analisis sosial menunjukkan masalah utama berupa "${masalah || 'keterbatasan pembiasaan harian'}" yang terjadi di tengah potensi lokal "${potensi || 'potensi kerajinan & sosiokultural daerah'}". Dengan mengoptimalkan aset fisik dan manusia berupa ${assetSummary || 'fasilitas madrasah'}, maka kegiatan kokurikuler dipilih untuk dilaksanakan karena: ${alasan || 'memberikan ruang eksperiensial nyata bagi peningkatan kompetensi murid.'}`;
    setNarasi(text);
  };

  const handleAppendAsset = (type: 'fisik' | 'manusia' | 'finansial' | 'lingkungan') => {
    if (type === 'fisik' && newFisik.trim()) { setFisik([...fisik, newFisik.trim()]); setNewFisik(''); }
    if (type === 'manusia' && newManusia.trim()) { setManusia([...manusia, newManusia.trim()]); setNewManusia(''); }
    if (type === 'finansial' && newFinansial.trim()) { setFinansial([...finansial, newFinansial.trim()]); setNewFinansial(''); }
    if (type === 'lingkungan' && newLingkungan.trim()) { setLingkungan([...lingkungan, newLingkungan.trim()]); setNewLingkungan(''); }
  };

  const handleRemoveAsset = (type: 'fisik' | 'manusia' | 'finansial' | 'lingkungan', idx: number) => {
    if (isReadOnly) return;
    if (type === 'fisik') setFisik(fisik.filter((_, i) => i !== idx));
    if (type === 'manusia') setManusia(manusia.filter((_, i) => i !== idx));
    if (type === 'finansial') setFinansial(finansial.filter((_, i) => i !== idx));
    if (type === 'lingkungan') setLingkungan(lingkungan.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    setSaving(true);
    try {
      const payload: Omit<AnalisisMadrasah, 'id'> & { id?: string } = {
        id: analisis?.id || undefined,
        madrasah_id: schoolId || 'madr-1',
        kesesuaian_kurikulum: kesesuaian,
        minat_bakat_murid: minat,
        capaian_belum_optimal: capaian,
        dimensi_perlu_diperkuat: dimensi,
        panca_cinta_perlu_diperkuat: cinta,
        sumber_daya_fisik: fisik,
        sumber_daya_manusia: manusia,
        sumber_daya_finansial: finansial,
        sumber_daya_lingkungan: lingkungan,
        kondisi_sosial_budaya: sosbud,
        masalah_aktual: masalah,
        potensi_lokal: potensi,
        alasan_pemilihan_kegiatan: alasan,
        narasi_otomatis: narasi,
        created_by: user.id
      };

      const saved = await db.analisisMadrasah.save(payload);
      setAnalisis(saved);
      setMsg('Hasil Analisis Diagnostik Madrasah berhasil disimpan online.');

      await db.logs.create({
        user_id: user.id,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        aktivitas: 'Update Analisis Madrasah',
        keterangan: 'Memperbarui profil analisis diagnostik kekuatan lembaga'
      });

      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      alert('Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-slate-500 text-sm">Memuat analisis madrasah...</div>;
  }

  return (
    <div className="space-y-6" id="analisis-view">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Analisis Kebutuhan Madrasah</h2>
          <p className="text-xs text-slate-400">Kerangka analisis diagnostik kekuatan dan kelemahan lembaga sebagai dasar pemetaan kurikulum kokurikuler</p>
        </div>
        <FileSearch className="w-8 h-8 text-emerald-700" />
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-sm font-medium">
          {msg}
        </div>
      )}

      {/* Main Grid Forms */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Step 1: Diagnostik Kurikulum, Minat, dan Capaian */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">1. Profil Diagnostik Kompetensi Murid</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Kesesuaian Kurikulum */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Kesesuaian dengan Kurikulum Madrasah</label>
              <textarea 
                rows={3}
                value={kesesuaian}
                onChange={e => setKesesuaian(e.target.value)}
                disabled={isReadOnly}
                placeholder="Bagaimana kurikulum madrasah saat ini menunjang adab dan karakter..."
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {/* Minat & Bakat */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Minat & Bakat Dominan Murid</label>
              <textarea 
                rows={3}
                value={minat}
                onChange={e => setMinat(e.target.value)}
                disabled={isReadOnly}
                placeholder="Misal: Menyukai berkebun, praktek seni, olahraga memanah, dll..."
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {/* Capaian belum optimal */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Capaian Karakter yang Belum Optimal</label>
              <textarea 
                rows={3}
                value={capaian}
                onChange={e => setCapaian(e.target.value)}
                disabled={isReadOnly}
                placeholder="Aspek karakter mana yang sering dikeluhkan pendidik (misal: adab kebersihan, kurang kerja sama)..."
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Mapping Dimensi & Panca Cinta Checkbox */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dimensi */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">2. Prioritas 8 Dimensi Lulusan</h3>
            <p className="text-[11px] text-slate-400">Pilih dimensi karakter yang mendesak untuk diperkuat semester ini</p>
            <div className="space-y-2 pt-2">
              {availableDimensions.map(dim => {
                const checked = dimensi.includes(dim);
                return (
                  <label key={dim} className="flex items-start space-x-2.5 text-xs text-slate-700 font-medium cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleDimension(dim)}
                      disabled={isReadOnly}
                      className="accent-emerald-700 rounded w-4 h-4 mt-0.5 shrink-0"
                    />
                    <span>{dim}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Panca Cinta */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">3. Prioritas Topik Panca Cinta</h3>
            <p className="text-[11px] text-slate-400">Pilih pilar Kurikulum Berbasis Cinta (KBC) yang ingin diintegrasikan</p>
            <div className="space-y-3 pt-2">
              {availablePancaCinta.map(ct => {
                const checked = cinta.includes(ct);
                return (
                  <label key={ct} className="flex items-center space-x-2.5 text-xs text-slate-700 font-medium cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleCinta(ct)}
                      disabled={isReadOnly}
                      className="accent-emerald-700 rounded w-4 h-4 shrink-0"
                    />
                    <span>{ct}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 3: Sumber Daya Assets Array Tag list */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">4. Pemetaan Aset & Sumber Daya Lembaga</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Aset Fisik */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Aset Fisik (Ruangan, Lahan)</label>
              {!isReadOnly && (
                <div className="flex space-x-1.5">
                  <input type="text" value={newFisik} onChange={e => setNewFisik(e.target.value)} placeholder="Aset fisik..." className="flex-1 text-xs border rounded p-1.5" />
                  <button type="button" onClick={() => handleAppendAsset('fisik')} className="bg-slate-100 hover:bg-slate-200 px-2 rounded font-bold text-xs">+</button>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {fisik.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-slate-50 border text-[10px] px-2 py-0.5 rounded-full">
                    <span>{item}</span>
                    {!isReadOnly && <button type="button" onClick={() => handleRemoveAsset('fisik', i)} className="text-red-500 font-bold">&times;</button>}
                  </span>
                ))}
              </div>
            </div>

            {/* Aset Manusia */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Aset Manusia (Keahlian Guru)</label>
              {!isReadOnly && (
                <div className="flex space-x-1.5">
                  <input type="text" value={newManusia} onChange={e => setNewManusia(e.target.value)} placeholder="Aset guru..." className="flex-1 text-xs border rounded p-1.5" />
                  <button type="button" onClick={() => handleAppendAsset('manusia')} className="bg-slate-100 hover:bg-slate-200 px-2 rounded font-bold text-xs">+</button>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {manusia.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-slate-50 border text-[10px] px-2 py-0.5 rounded-full">
                    <span>{item}</span>
                    {!isReadOnly && <button type="button" onClick={() => handleRemoveAsset('manusia', i)} className="text-red-500 font-bold">&times;</button>}
                  </span>
                ))}
              </div>
            </div>

            {/* Aset Finansial */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Aset Finansial (Dana BOS)</label>
              {!isReadOnly && (
                <div className="flex space-x-1.5">
                  <input type="text" value={newFinansial} onChange={e => setNewFinansial(e.target.value)} placeholder="Keuangan..." className="flex-1 text-xs border rounded p-1.5" />
                  <button type="button" onClick={() => handleAppendAsset('finansial')} className="bg-slate-100 hover:bg-slate-200 px-2 rounded font-bold text-xs">+</button>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {finansial.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-slate-50 border text-[10px] px-2 py-0.5 rounded-full">
                    <span>{item}</span>
                    {!isReadOnly && <button type="button" onClick={() => handleRemoveAsset('finansial', i)} className="text-red-500 font-bold">&times;</button>}
                  </span>
                ))}
              </div>
            </div>

            {/* Aset Lingkungan */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Aset Lingkungan / Kemitraan</label>
              {!isReadOnly && (
                <div className="flex space-x-1.5">
                  <input type="text" value={newLingkungan} onChange={e => setNewLingkungan(e.target.value)} placeholder="Instansi luar..." className="flex-1 text-xs border rounded p-1.5" />
                  <button type="button" onClick={() => handleAppendAsset('lingkungan')} className="bg-slate-100 hover:bg-slate-200 px-2 rounded font-bold text-xs">+</button>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {lingkungan.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-slate-50 border text-[10px] px-2 py-0.5 rounded-full">
                    <span>{item}</span>
                    {!isReadOnly && <button type="button" onClick={() => handleRemoveAsset('lingkungan', i)} className="text-red-500 font-bold">&times;</button>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Analisis Kontekstual Masalah */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">5. Analisis Sosio-Kultural & Masalah Aktual</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Kondisi Sosial Budaya Wali Murid & Lingkungan</label>
              <input 
                type="text" 
                value={sosbud}
                onChange={e => setSosbud(e.target.value)}
                disabled={isReadOnly}
                placeholder="Contoh: Mayoritas bekerja sebagai wiraswasta di daerah perkotaan padat"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Masalah Aktual di Sekitar Murid <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={masalah}
                onChange={e => setMasalah(e.target.value)}
                disabled={isReadOnly}
                placeholder="Contoh: Rendahnya kepedulian terhadap pembuangan sampah plastik di madrasah"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Potensi Lokal yang Bisa Dikembangkan <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={potensi}
                onChange={e => setPotensi(e.target.value)}
                disabled={isReadOnly}
                placeholder="Contoh: Pemanfaatan botol plastik bekas 1.5L melimpah"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Alasan Pemilihan Kegiatan Kokurikuler Terpilih</label>
              <input 
                type="text" 
                value={alasan}
                onChange={e => setAlasan(e.target.value)}
                disabled={isReadOnly}
                placeholder="Contoh: Mengasah kreativitas melukis pot botol bekas dan menata area asri"
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 5: Narasi Otomatis Generator Block */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h3 className="font-bold text-slate-800 text-sm">6. Narasi Rekomendasi Pemilihan Dokumen</h3>
            {!isReadOnly && (
              <button 
                type="button" 
                onClick={handleAutoNarrate}
                className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Rakit Narasi Otomatis</span>
              </button>
            )}
          </div>

          <textarea 
            rows={4}
            value={narasi}
            onChange={e => setNarasi(e.target.value)}
            disabled={isReadOnly}
            placeholder="Klik tombol 'Rakit Narasi Otomatis' untuk memformulasikan deskripsi kurikulum resmi secara otomatis..."
            className="w-full text-xs bg-slate-50/50 border border-slate-200 rounded-lg p-3 focus:bg-white focus:border-emerald-600 focus:outline-none leading-relaxed"
          />
        </div>

        {/* Submit */}
        {!isReadOnly && (
          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={saving}
              id="btn-save-analisis"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center space-x-2 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Analisis Diagnostik'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
