/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Plus, Search, Heart, Smile, Sparkles, Trash2, X, AlertCircle } from 'lucide-react';
import { 
  BANK_THEMES, 
  BANK_G7KAIH, 
  BANK_KKBC, 
  BankTheme, 
  BankHabit, 
  BankCcLov 
} from '../lib/db';
import { Profile, UserRole } from '../types';

interface BankViewProps {
  user: Profile;
}

export default function BankView({ user }: BankViewProps) {
  const [activeTab, setActiveTab] = useState<'themes' | 'g7kaih' | 'kkbc'>('themes');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable lists (initializing from pre-seeded data in localStorage or fallback)
  const [themes, setThemes] = useState<BankTheme[]>(() => {
    const stored = localStorage.getItem('pkmg_bank_themes');
    return stored ? JSON.parse(stored) : BANK_THEMES;
  });

  const [g7kaih, setG7kaih] = useState<BankHabit[]>(BANK_G7KAIH);
  const [kkbc, setKkbc] = useState<BankCcLov[]>(BANK_KKBC);

  // New Theme entry state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeDesc, setNewThemeDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isReadOnly = ![UserRole.ADMIN, UserRole.KOORDINATOR_KOKURIKULER].includes(user.role);

  const saveThemes = (updated: BankTheme[]) => {
    setThemes(updated);
    localStorage.setItem('pkmg_bank_themes', JSON.stringify(updated));
  };

  const handleAddTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeName.trim()) {
      setErrorMsg('Nama tema tidak boleh kosong.');
      return;
    }

    const newItem: BankTheme = {
      id: 'theme-' + Date.now(),
      nama: newThemeName.trim(),
      deskripsi: newThemeDesc.trim() || 'Deskripsi tema kustom madrasah.'
    };

    const nextThemes = [...themes, newItem];
    saveThemes(nextThemes);
    setIsModalOpen(false);
    setNewThemeName('');
    setNewThemeDesc('');
  };

  const handleDeleteTheme = (id: string, name: string) => {
    if (isReadOnly) return;
    if (window.confirm(`Hapus tema "${name}" dari Bank Tema?`)) {
      const nextThemes = themes.filter(t => t.id !== id);
      saveThemes(nextThemes);
    }
  };

  const filteredThemes = themes.filter(t => 
    t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.deskripsi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="bank-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Bank Tema & Program KBC</h2>
          <p className="text-xs text-slate-400">Rekomendasi judul kegiatan kurikulum, pembiasaan harian, dan kolaborasi kepedulian sosial</p>
        </div>
        {!isReadOnly && activeTab === 'themes' && (
          <button
            onClick={() => setIsModalOpen(true)}
            id="btn-add-bank-theme"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tema Kustom</span>
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('themes'); setSearchQuery(''); }}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'themes' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bank Tema Kokurikuler ({themes.length})
        </button>
        <button
          onClick={() => { setActiveTab('g7kaih'); setSearchQuery(''); }}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'g7kaih' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bank Gerakan G7KAIH ({g7kaih.length})
        </button>
        <button
          onClick={() => { setActiveTab('kkbc'); setSearchQuery(''); }}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'kkbc' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bank Kegiatan KKBC ({kkbc.length})
        </button>
      </div>

      {/* Control panel search */}
      {activeTab === 'themes' && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari tema kokurikuler..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none transition-all"
          />
        </div>
      )}

      {/* Display Grid Lists */}
      {activeTab === 'themes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredThemes.map(t => (
            <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-emerald-600/30 transition-all group">
              <div>
                <span className="w-6 h-6 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px] flex items-center justify-center mb-2">
                  T
                </span>
                <h4 className="font-bold text-slate-800 text-xs tracking-tight">{t.nama}</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed mt-1.5">{t.deskripsi}</p>
              </div>
              {!isReadOnly && t.id.startsWith('theme-') && (
                <div className="flex justify-end pt-3 mt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDeleteTheme(t.id, t.nama)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'g7kaih' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 text-amber-900 border border-amber-100 rounded-xl text-xs space-y-1">
            <h4 className="font-bold flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Gerakan 7 Kebiasaan Anak Indonesia Hebat (G7KAIH)</span>
            </h4>
            <p>Pilar pembiasaan karakter yang mengedepankan pembelajaran penuh kesadaran (mindful, meaningful, joyful learning) dalam ekosistem pendukung.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {g7kaih.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-start space-x-3.5">
                <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                  {item.id}
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Kebiasaan: {item.kebiasaan}</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    <span className="font-semibold text-slate-700">Contoh Proyek:</span> {item.contoh_kegiatan}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'kkbc' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 text-emerald-950 border border-emerald-100 rounded-xl text-xs space-y-1">
            <h4 className="font-bold flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Kegiatan Kolaboratif Berbasis Cinta (KKBC)</span>
            </h4>
            <p>Implementasi pembiasaan dan keteladanan yang mengedepankan pilar cinta tanah air, cinta ilmu, cinta alam, serta persahabatan ramah anak tanpa perundungan.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kkbc.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-1 hover:border-emerald-600/30 transition-all">
                <div className="flex items-center space-x-2 text-emerald-700">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="font-bold text-slate-800 text-xs">{item.nama_kegiatan}</h4>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed pl-6">{item.deskripsi}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Theme Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Tambah Tema Kustom Madrasah</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTheme} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Nama Tema Baru</label>
                <input 
                  type="text" 
                  value={newThemeName}
                  onChange={e => setNewThemeName(e.target.value)}
                  placeholder="Contoh: Panen Raya Apotik Hidup"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Keterangan / Deskripsi Ide Kegiatan</label>
                <textarea 
                  rows={3}
                  value={newThemeDesc}
                  onChange={e => setNewThemeDesc(e.target.value)}
                  placeholder="Deskripsikan ide kegiatan pendukung tema ini secara ringkas..."
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-lg"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg"
                >
                  Simpan Tema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
