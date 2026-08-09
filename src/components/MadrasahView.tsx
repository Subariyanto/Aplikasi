/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { School, Save, ShieldCheck, AlertCircle, Upload, Trash2, Lock, Unlock, ShieldAlert } from 'lucide-react';
import { Madrasah, UserRole, Profile } from '../types';
import { db } from '../lib/db';

interface MadrasahViewProps {
  user: Profile;
}

export default function MadrasahView({ user }: MadrasahViewProps) {
  const [school, setSchool] = useState<Madrasah | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [isMadrasahLocked, setIsMadrasahLocked] = useState(true);

  // Form states
  const [namaMadrasah, setNamaMadrasah] = useState('');
  const [nsm, setNsm] = useState('');
  const [npsn, setNpsn] = useState('');
  const [jenjang, setJenjang] = useState<'RA' | 'MI' | 'MTs' | 'MA' | 'MAK'>('MTs');
  const [alamat, setAlamat] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kabupatenKota, setKabupatenKota] = useState('');
  const [provinsi, setProvinsi] = useState('');
  const [kepalaMadrasah, setKepalaMadrasah] = useState('');
  const [nipKepala, setNipKepala] = useState('');
  const [tahunPelajaran, setTahunPelajaran] = useState('2026/2027');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [logoUrl, setLogoUrl] = useState('');
  
  // Drag and drop states for Logo File Upload
  const [dragActive, setDragActive] = useState(false);

  const isReadOnly = ![UserRole.ADMIN, UserRole.KOORDINATOR_KOKURIKULER].includes(user.role);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      setMsg({ text: 'Ukuran file gambar maksimal 2 MB', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        setMsg({ text: 'Logo berhasil diunggah! Jangan lupa klik Simpan di bawah.', type: 'success' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setMsg({ text: 'Format file tidak didukung. Harap pilih gambar (PNG, JPG, atau GIF)', type: 'error' });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setMsg({ text: 'Ukuran file gambar maksimal 2 MB', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
          setMsg({ text: 'Logo berhasil diunggah! Jangan lupa klik Simpan di bawah.', type: 'success' });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    async function loadSchool() {
      try {
        const item = await db.madrasah.getFirst();
        if (item) {
          setSchool(item);
          setNamaMadrasah(item.nama_madrasah);
          setNsm(item.nsm);
          setNpsn(item.npsn);
          setJenjang(item.jenjang);
          setAlamat(item.alamat);
          setKecamatan(item.kecamatan);
          setKabupatenKota(item.kabupaten_kota);
          setProvinsi(item.provinsi);
          setKepalaMadrasah(item.kepala_madrasah);
          setNipKepala(item.nip_kepala);
          setTahunPelajaran(item.tahun_pelajaran);
          setSemester(item.semester);
          setLogoUrl(item.logo_url || '');
        } else {
          // prefill default from user profile
          setNamaMadrasah(user.nama_madrasah || '');
        }
      } catch (e) {
        console.error('Failed to load madrasah info:', e);
      } finally {
        setLoading(false);
      }
    }
    loadSchool();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    // validation
    if (!namaMadrasah.trim()) {
      setMsg({ text: 'Nama Madrasah wajib diisi', type: 'error' });
      return;
    }
    if (!nsm.trim() || nsm.length < 12) {
      setMsg({ text: 'Nomor Statistik Madrasah (NSM) harus berisi 12 digit angka', type: 'error' });
      return;
    }

    setSaving(true);
    setMsg({ text: '', type: '' });

    try {
      const payload: Omit<Madrasah, 'id'> & { id?: string } = {
        id: school?.id || undefined,
        nama_madrasah: namaMadrasah,
        nsm,
        npsn,
        jenjang,
        alamat,
        kecamatan,
        kabupaten_kota: kabupatenKota,
        provinsi,
        kepala_madrasah: kepalaMadrasah,
        nip_kepala: nipKepala,
        tahun_pelajaran: tahunPelajaran,
        semester,
        logo_url: logoUrl,
        created_by: user.id
      };

      let result;
      if (school?.id) {
        result = await db.madrasah.update(school.id, payload);
      } else {
        result = await db.madrasah.create(payload as Omit<Madrasah, 'id'>);
      }

      setSchool(result);
      setMsg({ text: 'Profil Data Madrasah berhasil disimpan online.', type: 'success' });
      
      // Log activity
      await db.logs.create({
        user_id: user.id,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        aktivitas: 'Update Data Madrasah',
        keterangan: `Memperbarui profil madrasah: ${namaMadrasah}`
      });

    } catch (err: any) {
      setMsg({ text: err.message || 'Gagal menyimpan data.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Preset logo selection helper
  const handlePresetLogo = (color: string) => {
    setLogoUrl(color);
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-sm">Memuat profil madrasah...</div>;
  }

  return (
    <div className="space-y-6" id="madrasah-view">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Profil Lembaga Madrasah</h2>
          <p className="text-xs text-slate-400">Identitas institusi utama yang akan dicantumkan di seluruh dokumen administrasi resmi</p>
        </div>
        <School className="w-8 h-8 text-emerald-700" />
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl flex items-start space-x-3 text-sm ${
          msg.type === 'error' ? 'bg-red-50 text-red-800 border border-red-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
        }`}>
          {msg.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <ShieldCheck className="w-5 h-5 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nama Madrasah */}
            <div className="space-y-1 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black uppercase tracking-wide text-slate-800 flex items-center space-x-1.5">
                  <span>Nama Madrasah / Satuan Pendidikan</span>
                  <span className="text-red-500">*</span>
                  {isMadrasahLocked ? (
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>TERKUNCI LISENSI</span>
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                      <Unlock className="w-3 h-3" />
                      <span>TERBUKA (ADMIN)</span>
                    </span>
                  )}
                </label>
                {user.role === UserRole.ADMIN && (
                  <button
                    type="button"
                    onClick={() => setIsMadrasahLocked(!isMadrasahLocked)}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1 cursor-pointer underline"
                  >
                    {isMadrasahLocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Buka Kunci Nama Madrasah</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Kunci Kembali Field</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <input 
                type="text" 
                value={namaMadrasah}
                onChange={e => setNamaMadrasah(e.target.value)}
                disabled={isReadOnly || (user.role === UserRole.ADMIN ? isMadrasahLocked : true)}
                placeholder="Contoh: MTS Al-Madinah"
                className={`w-full text-sm font-bold border rounded-lg px-3.5 py-2.5 focus:outline-none transition-all ${
                  isMadrasahLocked
                    ? 'bg-slate-100 text-slate-700 border-slate-300 cursor-not-allowed opacity-90'
                    : 'bg-white text-slate-900 border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              />
              <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  Nama Madrasah diikat pada Lisensi Aplikasi ini untuk menjamin otentisitas dokumen dan mencegah penyalahgunaan pergantian nama lembaga.
                </span>
              </p>
            </div>

            {/* Jenjang */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Jenjang Madrasah <span className="text-red-500">*</span></label>
              <select 
                value={jenjang}
                onChange={e => setJenjang(e.target.value as any)}
                disabled={isReadOnly}
                className="w-full text-sm bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all disabled:opacity-60"
              >
                <option value="RA">Raudhatul Athfal (RA)</option>
                <option value="MI">Madrasah Ibtidaiyah (MI)</option>
                <option value="MTs">Madrasah Tsanawiyah (MTs)</option>
                <option value="MA">Madrasah Aliyah (MA)</option>
                <option value="MAK">Madrasah Aliyah Kejuruan (MAK)</option>
              </select>
            </div>

            {/* NSM */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">NSM (Nomor Statistik Madrasah) <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                maxLength={12}
                value={nsm}
                onChange={e => setNsm(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={isReadOnly}
                placeholder="Contoh: 121233740015"
                className="w-full text-sm font-mono bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all disabled:opacity-60"
              />
            </div>

            {/* NPSN */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">NPSN</label>
              <input 
                type="text" 
                maxLength={8}
                value={npsn}
                onChange={e => setNpsn(e.target.value.replace(/[^0-9]/g, ''))}
                disabled={isReadOnly}
                placeholder="Contoh: 20363412"
                className="w-full text-sm font-mono bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all disabled:opacity-60"
              />
            </div>

            {/* Tahun Pelajaran */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Tahun Pelajaran Terpilih</label>
              <select 
                value={tahunPelajaran}
                onChange={e => setTahunPelajaran(e.target.value)}
                disabled={isReadOnly}
                className="w-full text-sm bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all disabled:opacity-60"
              >
                <option value="2025/2026">2025/2026</option>
                <option value="2026/2027">2026/2027</option>
                <option value="2027/2028">2027/2028</option>
              </select>
            </div>

            {/* Semester */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Semester Aktif</label>
              <div className="flex space-x-4 pt-2">
                <label className="flex items-center space-x-2 text-sm text-slate-700 font-medium">
                  <input 
                    type="radio" 
                    name="semester" 
                    value="Ganjil" 
                    checked={semester === 'Ganjil'}
                    onChange={() => setSemester('Ganjil')}
                    disabled={isReadOnly}
                    className="accent-emerald-700 w-4 h-4"
                  />
                  <span>Semester Ganjil</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-slate-700 font-medium">
                  <input 
                    type="radio" 
                    name="semester" 
                    value="Genap" 
                    checked={semester === 'Genap'}
                    onChange={() => setSemester('Genap')}
                    disabled={isReadOnly}
                    className="accent-emerald-700 w-4 h-4"
                  />
                  <span>Semester Genap</span>
                </label>
              </div>
            </div>

            {/* Alamat Lengkap */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">Alamat Lengkap Madrasah</label>
              <textarea 
                rows={2}
                value={alamat}
                onChange={e => setAlamat(e.target.value)}
                disabled={isReadOnly}
                placeholder="Nama Jalan, No. Bangunan, Dusun, RT/RW, Kode Pos"
                className="w-full text-sm bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all disabled:opacity-60"
              />
            </div>

            {/* Kecamatan */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Kecamatan</label>
              <input 
                type="text" 
                value={kecamatan}
                onChange={e => setKecamatan(e.target.value)}
                disabled={isReadOnly}
                placeholder="Contoh: Ngaliyan"
                className="w-full text-sm bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all disabled:opacity-60"
              />
            </div>

            {/* Kabupaten/Kota */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Kabupaten / Kota</label>
              <input 
                type="text" 
                value={kabupatenKota}
                onChange={e => setKabupatenKota(e.target.value)}
                disabled={isReadOnly}
                placeholder="Contoh: Kota Semarang"
                className="w-full text-sm bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all disabled:opacity-60"
              />
            </div>

            {/* Provinsi */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Provinsi</label>
              <input 
                type="text" 
                value={provinsi}
                onChange={e => setProvinsi(e.target.value)}
                disabled={isReadOnly}
                placeholder="Contoh: Jawa Tengah"
                className="w-full text-sm bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all disabled:opacity-60"
              />
            </div>

            {/* Logo placeholder picker */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">Logo / Lambang Madrasah Resmi</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center bg-slate-50/20 border border-slate-100 p-4 rounded-xl">
                
                {/* Left: Logo Preview box */}
                <div className="flex flex-col items-center justify-center border border-slate-200/60 rounded-xl p-4 bg-white/90 shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Pratinjau Logo</span>
                  {logoUrl && logoUrl.startsWith('data:image') ? (
                    <div className="relative group inline-block">
                      <img 
                        src={logoUrl} 
                        alt="Logo Madrasah" 
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 object-contain mx-auto rounded-lg border bg-white p-1 shadow-sm" 
                      />
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow transition-colors"
                          title="Hapus Logo Kustom"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={`w-16 h-16 rounded-xl border-2 border-white flex items-center justify-center font-black text-lg uppercase text-white shadow-md mx-auto ${
                      logoUrl === 'emerald' ? 'bg-emerald-700' :
                      logoUrl === 'amber' ? 'bg-amber-500' :
                      logoUrl === 'blue' ? 'bg-blue-600' : 'bg-slate-700'
                    }`}>
                      {namaMadrasah ? namaMadrasah.slice(0,2) : 'M'}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-500 font-bold mt-2.5">
                    {logoUrl && logoUrl.startsWith('data:image') ? 'Logo Kustom Unggahan' : 'Logo Preset Sistem'}
                  </p>
                </div>

                {/* Right: Custom Image Upload Drag-Drop box */}
                <div className="md:col-span-2 space-y-3">
                  {!isReadOnly ? (
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                        dragActive 
                          ? 'border-indigo-600 bg-indigo-50/50' 
                          : 'border-slate-200 hover:border-indigo-500/50 hover:bg-slate-50/30'
                      }`}
                    >
                      <input 
                        type="file" 
                        id="logo-file-input"
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        className="hidden" 
                      />
                      <label htmlFor="logo-file-input" className="cursor-pointer block space-y-1.5">
                        <Upload className="w-7 h-7 text-indigo-500 mx-auto" />
                        <div className="text-xs font-bold text-slate-700">
                          <span className="text-indigo-600 hover:underline">Pilih file gambar</span> atau seret file ke sini
                        </div>
                        <p className="text-[10px] text-slate-400">Format PNG, JPG atau GIF (Maks. 2 MB)</p>
                      </label>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Hanya peran berwenang yang dapat mengunggah logo kustom.</p>
                  )}

                  {/* Preset Alternatives */}
                  <div className="flex items-center space-x-3 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preset Warna:</span>
                    <div className="flex space-x-2">
                      <button 
                        type="button" 
                        onClick={() => handlePresetLogo('emerald')} 
                        title="Hijau Emerald"
                        className={`w-5 h-5 rounded-full bg-emerald-700 border transition-all ${logoUrl === 'emerald' ? 'ring-2 ring-emerald-700/50 scale-110' : 'border-slate-200'}`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => handlePresetLogo('amber')} 
                        title="Kuning Amber"
                        className={`w-5 h-5 rounded-full bg-amber-500 border transition-all ${logoUrl === 'amber' ? 'ring-2 ring-amber-500/50 scale-110' : 'border-slate-200'}`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => handlePresetLogo('blue')} 
                        title="Biru Kobalt"
                        className={`w-5 h-5 rounded-full bg-blue-600 border transition-all ${logoUrl === 'blue' ? 'ring-2 ring-blue-600/50 scale-110' : 'border-slate-200'}`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => handlePresetLogo('slate')} 
                        title="Abu Slate"
                        className={`w-5 h-5 rounded-full bg-slate-700 border transition-all ${logoUrl === 'slate' || !logoUrl ? 'ring-2 ring-slate-700/50 scale-110' : 'border-slate-200'}`} 
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 md:col-span-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Tanda Tangan Pimpinan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama Kepala */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">Nama Kepala Madrasah</label>
                  <input 
                    type="text" 
                    value={kepalaMadrasah}
                    onChange={e => setKepalaMadrasah(e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Contoh: Muhtasit, M.S.I."
                    className="w-full text-sm bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all disabled:opacity-60"
                  />
                </div>

                {/* NIP Kepala */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">NIP Kepala Madrasah</label>
                  <input 
                    type="text" 
                    value={nipKepala}
                    onChange={e => setNipKepala(e.target.value.replace(/[^0-9]/g, ''))}
                    disabled={isReadOnly}
                    placeholder="Contoh: 197511082005011002"
                    className="w-full text-sm font-mono bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        {!isReadOnly && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              id="btn-save-madrasah"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm px-5 py-2.5 rounded-lg flex items-center space-x-2 transition-all shadow-md shadow-emerald-950/10 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Profil Madrasah'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
