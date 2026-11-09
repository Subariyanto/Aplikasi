/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  UserSquare2, 
  ShieldCheck, 
  FileSearch, 
  FileText, 
  Database, 
  KeyRound, 
  Settings, 
  LogOut, 
  ClipboardCheck, 
  ListChecks, 
  Sparkles, 
  ChevronDown,
  Activity,
  Menu,
  X,
  HelpCircle,
  FileAudio,
  BookOpen,
  Printer
} from 'lucide-react';
import { Profile, UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: Profile | null;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onToggleMobile?: () => void;
}

export default function Sidebar({ 
  currentView, 
  onNavigate, 
  user, 
  onLogout,
  isOpenMobile = false,
  onToggleMobile
}: SidebarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const mobileOpenState = isOpenMobile || isMobileOpen;

  const toggleMobile = () => {
    if (onToggleMobile) {
      onToggleMobile();
    } else {
      setIsMobileOpen(!isMobileOpen);
    }
  };

  const ALL_ROLES = [UserRole.ADMIN, UserRole.KOORDINATOR_KOKURIKULER, UserRole.TRIAL];

  const navCategories = [
    {
      id: 'data_master',
      label: 'Data Master',
      icon: Database,
      items: [
        { id: 'madrasah', label: 'Data Madrasah', icon: School, desc: 'Profil, NSM, & Sarpras Madrasah', roles: ALL_ROLES },
        { id: 'guru', label: 'Data Guru', icon: Users, desc: 'Tenaga Pendidik & Fasilitator', roles: ALL_ROLES },
        { id: 'murid', label: 'Data Murid', icon: UserSquare2, desc: 'Data Siswa & Rombel Kelas', roles: ALL_ROLES },
        { id: 'tim', label: 'Tim Kerja Kokurikuler', icon: ShieldCheck, desc: 'SK & Pembagian Tugas Tim', roles: ALL_ROLES },
      ]
    },
    {
      id: 'perencanaan',
      label: 'Perencanaan & Program',
      icon: Sparkles,
      items: [
        { id: 'generator', label: 'Generator Perencanaan', icon: Sparkles, desc: 'Rakit & Generate Modul Proyek KBC', badge: 'UTAMA', roles: ALL_ROLES },
        { id: 'program_lengkap', label: 'Program Kokurikuler Lengkap', icon: BookOpen, desc: 'Buku Dokumen Utuh (Cover, BAB I-V, PKM)', badge: 'LENGKAP', roles: ALL_ROLES },
        { id: 'audio_action_items', label: 'Peninjau Audio & Tindak Lanjut', icon: FileAudio, desc: 'Ekstrak Action Items Sales Call & Audio', badge: 'BARU', roles: ALL_ROLES },
        { id: 'analisis', label: 'Analisis Madrasah', icon: FileSearch, desc: 'Identifikasi Karakter & Potensi Murid', roles: ALL_ROLES },
        { id: 'bank', label: 'Bank Tema & Program', icon: Database, desc: 'Katalog Referensi Proyek Kokurikuler', roles: ALL_ROLES },
        { id: 'panduan', label: 'Panduan Penggunaan', icon: HelpCircle, desc: 'Petunjuk Lisan & Alur Cara Mengisi App', roles: ALL_ROLES },
      ]
    },
    {
      id: 'dokumen',
      label: 'Dokumen & Catatan',
      icon: FileText,
      items: [
        { id: 'preview_cetak', label: 'Cetak Dokumen RPKM', icon: Printer, desc: 'Pratinjau & Cetak A4 Modul RPKM & Rapor', badge: 'A4', roles: ALL_ROLES },
        { id: 'arsip', label: 'Arsip Dokumen', icon: FileText, desc: 'Kelola Draf, Rubrik, & Rekam Modul', roles: ALL_ROLES },
        { id: 'catatan_pengawas', label: 'Catatan Pengawas', icon: ClipboardCheck, desc: 'Evaluasi & Catatan Pembina Kemenag', roles: ALL_ROLES },
        { id: 'logs', label: 'Logs Aktivitas', icon: Activity, desc: 'Histori Perubahan & Audit System', roles: [UserRole.ADMIN] },
      ]
    },
    {
      id: 'admin_settings',
      label: 'Pengaturan',
      icon: Settings,
      items: [
        { id: 'kode_aktivasi', label: 'Kode Aktivasi', icon: KeyRound, desc: 'Kelola Kode & Lisensi Aplikasi', roles: [UserRole.ADMIN, UserRole.TRIAL] },
        { id: 'user_management', label: 'Manajemen User', icon: ListChecks, desc: 'Kelola Hak Akses & Akun Pengguna', roles: [UserRole.ADMIN] },
        { id: 'pengaturan', label: 'Pengaturan Profil', icon: Settings, desc: 'Edit Profil, Foto, & Password', roles: ALL_ROLES },
      ]
    }
  ];

  // Filter categories and items based on role
  const filteredCategories = navCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => item.roles.includes(user.role))
  })).filter(cat => cat.items.length > 0);

  const handleSelectView = (viewId: string) => {
    onNavigate(viewId);
    setActiveDropdown(null);
    if (mobileOpenState) toggleMobile();
  };

  const isGeneratorAllowed = [UserRole.ADMIN, UserRole.KOORDINATOR_KOKURIKULER].includes(user.role);

  return (
    <div ref={navRef} className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] sticky top-16 z-20 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* DESKTOP WEBSITE NAVBAR (ENLARGED FOR CLARITY) */}
        <div className="hidden lg:flex items-center justify-between h-14 text-sm font-bold">
          
          {/* Left Navigation Links */}
          <div className="flex items-center space-x-2">
            
            {/* Dashboard Link */}
            <button
              onClick={() => handleSelectView('dashboard')}
              id="nav-dashboard"
              className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-emerald-700 text-white font-extrabold shadow-sm shadow-emerald-800/25 ring-1 ring-emerald-600'
                  : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-950'
              }`}
            >
              <LayoutDashboard className={`w-4.5 h-4.5 ${currentView === 'dashboard' ? 'text-amber-300' : 'text-emerald-700'}`} />
              <span className="text-[13.5px] tracking-tight">Dashboard</span>
            </button>

            {/* Panduan Link */}
            <button
              onClick={() => handleSelectView('panduan')}
              id="nav-panduan"
              className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                currentView === 'panduan'
                  ? 'bg-emerald-700 text-white font-extrabold shadow-sm shadow-emerald-800/25 ring-1 ring-emerald-600'
                  : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-950'
              }`}
            >
              <HelpCircle className={`w-4.5 h-4.5 ${currentView === 'panduan' ? 'text-amber-300' : 'text-emerald-700'}`} />
              <span className="text-[13.5px] tracking-tight">Panduan</span>
            </button>

            {/* Category Dropdowns */}
            {filteredCategories.map(cat => {
              const isCatActive = cat.items.some(item => item.id === currentView);
              const isOpen = activeDropdown === cat.id;

              return (
                <div key={cat.id} className="relative">
                  <button
                    onClick={() => setActiveDropdown(isOpen ? null : cat.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                      isCatActive
                        ? 'bg-emerald-50 text-emerald-950 font-extrabold border border-emerald-300 shadow-2xs'
                        : isOpen
                        ? 'bg-slate-100 text-slate-950 font-bold'
                        : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-950'
                    }`}
                  >
                    <span className="text-[13.5px] tracking-tight">{cat.label}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-700' : ''}`} />
                  </button>

                  {/* Dropdown Menu Card (Enlarged & High Legibility) */}
                  {isOpen && (
                    <div className="absolute left-0 mt-2.5 w-88 sm:w-[25rem] bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3.5 py-2 text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1.5 flex items-center justify-between bg-slate-50/70 rounded-xl">
                        <span>{cat.label}</span>
                        <span className="text-[10px] text-slate-600 font-semibold lowercase">klik untuk membuka</span>
                      </div>
                      <div className="space-y-1">
                        {cat.items.map(item => {
                          const IconComp = item.icon;
                          const isSelected = currentView === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectView(item.id)}
                              className={`w-full text-left flex items-start space-x-3.5 p-3 rounded-xl transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200 shadow-2xs' 
                                  : 'hover:bg-slate-50 text-slate-700 hover:text-slate-950'
                              }`}
                            >
                              <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 transition-colors ${isSelected ? 'bg-emerald-700 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'}`}>
                                <IconComp className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-bold leading-tight text-slate-950">{item.label}</span>
                                  {item.badge && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 uppercase border border-amber-500/30 shrink-0">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                {item.desc && (
                                  <p className="text-xs text-slate-600 font-medium mt-1 leading-snug">{item.desc}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Highlighted Website Feature Button */}
          {isGeneratorAllowed && (
            <button
              onClick={() => handleSelectView('generator')}
              id="nav-quick-generator"
              className={`flex items-center space-x-2 px-4.5 py-2 rounded-xl text-sm font-extrabold shadow-sm transition-all cursor-pointer border ${
                currentView === 'generator'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-300'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-500/80 hover:shadow-md'
              }`}
            >
              <Sparkles className="w-4 h-4 fill-current text-slate-950" />
              <span>Generator Perencanaan</span>
            </button>
          )}

        </div>

        {/* MOBILE SLIDE-OVER DRAWER BACKDROP & MENU */}
        {mobileOpenState && (
          <div 
            className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity" 
            onClick={toggleMobile}
          />
        )}

        <aside 
          className={`lg:hidden fixed inset-y-0 left-0 transform ${
            mobileOpenState ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-200 ease-in-out bg-white text-slate-800 w-84 sm:w-96 flex flex-col h-full z-50 border-r border-slate-200 shadow-2xl`}
        >
          {/* Mobile Drawer Header */}
          <div className="p-4.5 border-b border-slate-200 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 text-amber-300 font-black text-sm flex items-center justify-center shadow-xs">
                PKM
              </div>
              <div>
                <span className="font-extrabold text-sm uppercase tracking-tight text-white block">
                  Perencanaan Kokurikuler
                </span>
                <span className="text-xs text-emerald-200/90 font-medium">Kemenag 2025</span>
              </div>
            </div>
            <button onClick={toggleMobile} className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info Bar */}
          <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm uppercase shadow-xs">
              {user.nama_lengkap.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm truncate text-slate-950">{user.nama_lengkap}</h2>
              <span className="inline-block px-2.5 py-0.5 text-[9px] font-extrabold rounded-md bg-emerald-100 text-emerald-900 uppercase mt-0.5">
                {user.role}
              </span>
            </div>
          </div>

          {/* Navigation Links List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            
            {/* Dashboard button */}
            <button
              onClick={() => handleSelectView('dashboard')}
              className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                currentView === 'dashboard' 
                  ? 'bg-emerald-700 text-white shadow-xs' 
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 text-amber-300" />
              <span>Dashboard Utama</span>
            </button>

            {/* Featured Generator Button */}
            {isGeneratorAllowed && (
              <button
                onClick={() => handleSelectView('generator')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black shadow-xs transition-all border ${
                  currentView === 'generator'
                    ? 'bg-emerald-800 text-white border-emerald-900'
                    : 'bg-amber-400 text-slate-950 border-amber-500 hover:bg-amber-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-5 h-5 fill-current text-slate-950" />
                  <span>Generator Perencanaan</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-amber-300 uppercase font-black">
                  PRO
                </span>
              </button>
            )}

            {/* Categorized Items */}
            {filteredCategories.map(cat => (
              <div key={cat.id} className="space-y-1.5 pt-2">
                <p className="px-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                  {cat.label}
                </p>
                <div className="space-y-1">
                  {cat.items.map(item => {
                    const IconComp = item.icon;
                    const isSelected = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectView(item.id)}
                        className={`w-full flex items-start space-x-3 p-3 rounded-xl text-sm transition-all text-left ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                            : 'text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <IconComp className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 text-sm leading-tight">{item.label}</span>
                            {item.badge && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 uppercase shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.desc && (
                            <p className="text-xs text-slate-500 font-normal leading-normal mt-0.5 line-clamp-1">{item.desc}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2.5 px-4 py-3 rounded-xl text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-200 cursor-pointer shadow-2xs"
            >
              <LogOut className="w-4.5 h-4.5 text-rose-600" />
              <span>Keluar Aplikasi</span>
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
}

