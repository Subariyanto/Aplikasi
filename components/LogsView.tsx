/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, Trash2, Calendar } from 'lucide-react';
import { ActivityLog, Profile } from '../types';
import { db } from '../lib/db';

interface LogsViewProps {
  user: Profile;
}

export default function LogsView({ user }: LogsViewProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const list = await db.logs.list();
      setLogs(list);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearLogs = async () => {
    if (window.confirm('Bersihkan semua log aktivitas sistem?')) {
      localStorage.setItem('pkmg_activity_logs', '[]');
      setLogs([]);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
    log.aktivitas.toLowerCase().includes(search.toLowerCase()) ||
    log.keterangan.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" id="logs-view">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Logbook & Audit Aktivitas Pengguna</h2>
          <p className="text-xs text-slate-400">Ledger audit digital transaksi pembuatan, pengeditan, serta registrasi data di dalam platform</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={loadLogs}
            className="p-2 border bg-white rounded-lg text-slate-600 hover:bg-slate-50"
            title="Refresh Log"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {user.role === 'Admin' && (
            <button 
              onClick={handleClearLogs}
              className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 text-xs font-bold px-3 py-2 rounded-lg flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Control panel search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Cari aktivitas, nama guru..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:border-emerald-600 focus:outline-none"
        />
      </div>

      {/* Table Log */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs">Memuat riwayat log...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Belum ada catatan aktivitas harian.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 uppercase font-bold text-[10px] text-slate-500 border-b">
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Pengguna</th>
                  <th className="p-3">Hak Akses / Peran</th>
                  <th className="p-3">Aktivitas</th>
                  <th className="p-3">Rincian Deskripsi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{log.nama_lengkap}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border text-slate-600">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-emerald-800">{log.aktivitas}</td>
                    <td className="p-3 text-slate-500 leading-normal">{log.keterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
