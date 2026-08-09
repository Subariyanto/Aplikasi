/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  Search, 
  Trash2, 
  Edit, 
  Eye, 
  Layers, 
  CheckCircle, 
  Clock, 
  FileText 
} from 'lucide-react';
import { PerencanaanKokurikuler, Profile, UserRole } from '../types';
import { db } from '../lib/db';

interface ArsipViewProps {
  user: Profile;
  onNavigate: (view: string, docId?: string) => void;
}

export default function ArsipView({ user, onNavigate }: ArsipViewProps) {
  const [docs, setDocs] = useState<PerencanaanKokurikuler[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jenjangFilter, setJenjangFilter] = useState<string>('all');

  const isReadOnly = false;

  useEffect(() => {
    async function loadDocs() {
      try {
        const sch = await db.madrasah.getFirst();
        if (sch) {
          const list = await db.perencanaanKokurikuler.list(sch.id);
          setDocs(list);
        }
      } catch (e) {
        console.error('Failed to load archives:', e);
      } finally {
        setLoading(false);
      }
    }
    loadDocs();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (isReadOnly) return;
    if (window.confirm(`Hapus dokumen perencanaan "${name}" dari arsip?`)) {
      try {
        await db.perencanaanKokurikuler.delete(id);
        setDocs(docs.filter(d => d.id !== id));
        
        await db.logs.create({
          user_id: user.id,
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          aktivitas: 'Hapus Rencana',
          keterangan: `Menghapus dokumen perencanaan: ${name}`
        });
      } catch (e) {
        alert('Gagal menghapus dokumen.');
      }
    }
  };

  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.nama_kegiatan.toLowerCase().includes(search.toLowerCase()) || 
                          doc.tema_kegiatan.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status_dokumen === statusFilter;
    const matchesJenjang = jenjangFilter === 'all' || doc.jenjang === jenjangFilter;
    return matchesSearch && matchesStatus && matchesJenjang;
  });

  return (
    <div className="space-y-6" id="arsip-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Arsip Modul Perencanaan Kokurikuler</h2>
          <p className="text-xs text-slate-400">Arsip digital dan rekam data draf, pengajuan, serta dokumen perencanaan yang telah disetujui</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={() => onNavigate('generator')}
            id="btn-create-new-plan"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 shadow transition-all shrink-0"
          >
            <Layers className="w-4 h-4" />
            <span>Rancang Proyek Baru</span>
          </button>
        )}
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama proyek..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full text-xs p-2 border rounded-lg bg-white focus:outline-none"
          >
            <option value="all">Semua Status Dokumen</option>
            <option value="Draft">Draft</option>
            <option value="Disetujui">Aktif / Disetujui (Siap Cetak)</option>
          </select>
        </div>

        <div>
          <select 
            value={jenjangFilter}
            onChange={e => setJenjangFilter(e.target.value)}
            className="w-full text-xs p-2 border rounded-lg bg-white focus:outline-none"
          >
            <option value="all">Semua Jenjang</option>
            <option value="RA">RA</option>
            <option value="MI">MI</option>
            <option value="MTs">MTs</option>
            <option value="MA">MA</option>
          </select>
        </div>
      </div>

      {/* Docs Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs">Memuat arsip rancangan madrasah...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
          <Archive className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 text-sm">Tidak Ada Dokumen</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Belum ada rencana proyek kokurikuler yang cocok dengan kriteria pencarian atau filter Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:border-emerald-600/30 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    doc.status_dokumen === 'Disetujui' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                    doc.status_dokumen === 'Diajukan' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {doc.status_dokumen === 'Disetujui' ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3" />}
                    <span>{doc.status_dokumen}</span>
                  </span>
                  <span className="text-[10px] bg-emerald-50 border border-emerald-100/60 font-bold px-2 py-0.5 rounded-lg text-emerald-800">
                    {doc.jenjang} / {doc.kelas_fase}
                  </span>
                </div>

                <h4 className="font-bold text-slate-800 text-sm tracking-tight mt-3 leading-snug">{doc.nama_kegiatan}</h4>
                <p className="text-slate-400 text-[10px] mt-1">Tema: <span className="text-slate-600 font-semibold">{doc.tema_kegiatan}</span></p>
                <p className="text-slate-400 text-[10px]">Alokasi: <span className="text-slate-600 font-medium">{doc.alokasi_waktu}</span></p>
                <p className="text-slate-400 text-[10px]">Koordinator: <span className="text-slate-600 font-medium">{doc.guru_koordinator}</span></p>
              </div>

              {/* Action Buttons Footer */}
              <div className="border-t border-slate-50 pt-4 mt-4 flex items-center justify-between">
                <span className="text-[9px] text-slate-400 font-medium">
                  TP: {doc.tahun_pelajaran} | Sem. {doc.semester}
                </span>

                <div className="flex items-center space-x-1.5">
                  <button 
                    onClick={() => onNavigate('preview_cetak', doc.id)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition-all shadow-xs"
                    title="Cetak & Pratinjau RPKM"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Cetak RPKM</span>
                  </button>

                  {!isReadOnly && (
                    <button 
                      onClick={() => onNavigate('generator', doc.id)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-700 border border-slate-200 rounded-lg transition-colors"
                      title="Edit Perencanaan"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}

                  {!isReadOnly && (
                    <button 
                      onClick={() => handleDelete(doc.id, doc.nama_kegiatan)}
                      className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 border rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
