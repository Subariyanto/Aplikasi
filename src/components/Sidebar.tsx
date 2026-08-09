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
    <div ref={navRef} className="w-full bg-white border-b border-gray-200/90 shadow-sm sticky top-14 z-20 print:hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        
        {/* DESKTOP WEBSITE NAVBAR */}
        <div className="hidden lg:flex items-center justify-between h-11 text-xs font-semibold">
          
          {/* Left Navigation Links */}
          <div className="flex items-center space-x-1">
            
            {/* Dashboard Link */}
            <button
              onClick={() => handleSelectView('dashboard')}
              id="nav-dashboard"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'dashboard'
                  ? 'bg-amber-100/90 text-amber-950 font-bold border border-amber-300/60 shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-600" />
              <span>Dashboard</span>
            </button>

            {/* Panduan Link */}
            <button
              onClick={() => handleSelectView('panduan')}
              id="nav-panduan"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentView === 'panduan'
                  ? 'bg-amber-100/90 text-amber-950 font-bold border border-amber-300/60 shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Panduan</span>
            </button>

            {/* Category Dropdowns */}
            {filteredCategories.map(cat => {
              const isCatActive = cat.items.some(item => item.id === currentView);
              const isOpen = activeDropdown === cat.id;

              return (
                <div key={cat.id} className="relative">
                  <button
                    onClick={() => setActiveDropdown(isOpen ? null : cat.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      isCatActive
                        ? 'bg-amber-100/90 text-amber-950 font-bold border border-amber-300/60 shadow-xs'
                        : isOpen
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-950'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-amber-700' : ''}`} />
                  </button>

                  {/* Dropdown Menu Card */}
                  {isOpen && (
                    <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-gray-200/90 p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-2 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-gray-100 mb-1">
                        {cat.label}
                      </div>
                      <div className="space-y-0.5">
                        {cat.items.map(item => {
                          const IconComp = item.icon;
                          const isSelected = currentView === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelectView(item.id)}
                              className={`w-full text-left flex items-start space-x-2.5 p-2 rounded-lg transition-all ${
                                isSelected 
                                  ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200/80' 
                                  : 'hover:bg-slate-50 text-slate-700 hover:text-slate-950'
                              }`}
                            >
                              <div className={`p-1.5 rounded-md mt-0.5 shrink-0 ${isSelected ? 'bg-amber-400/30 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                                <IconComp className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold leading-tight">{item.label}</span>
                                  {item.badge && (
                                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 uppercase border border-amber-500/40">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                {item.desc && (
                                  <p className="text-[10px] text-slate-400 font-normal truncate mt-0.5">{item.desc}</p>
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
              className={`flex items-center space-x-1.5 px-3.5 py-1 rounded-lg text-xs font-black shadow-xs transition-all cursor-pointer border ${
                currentView === 'generator'
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md ring-2 ring-amber-300'
                  : 'bg-amber-400/90 hover:bg-amber-400 text-slate-950 border-amber-500/80 hover:shadow-sm'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>Generator Perencanaan</span>
            </button>
          )}

        </div>

        {/* MOBILE SLIDE-OVER DRAWER BACKDROP & MENU */}
        {mobileOpenState && (
          <div 
            className="lg:hidden fixed inset-0 bg-slate-900/50 z-40 transition-opacity" 
            onClick={toggleMobile}
          />
        )}

        <aside 
          className={`lg:hidden fixed inset-y-0 left-0 transform ${
            mobileOpenState ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-200 ease-in-out bg-white text-slate-800 w-72 flex flex-col h-full z-50 border-r border-gray-200 shadow-2xl`}
        >
          {/* Mobile Drawer Header */}
          <div className="p-4 border-b border-gray-200 bg-amber-400/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                PK
              </span>
              <span className="font-extrabold text-xs uppercase tracking-tight text-slate-950">
                Menu Perencanaan
              </span>
            </div>
            <button onClick={toggleMobile} className="p-1 rounded-md hover:bg-slate-200 text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info Bar */}
          <div className="px-4 py-3 border-b border-gray-100 bg-slate-50 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-900 font-bold text-xs uppercase">
              {user.nama_lengkap.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-xs truncate text-slate-950">{user.nama_lengkap}</h2>
              <span className="inline-block px-1.5 py-0.2 text-[8px] font-bold rounded bg-amber-200/80 text-amber-950 uppercase mt-0.5">
                {user.role}
              </span>
            </div>
          </div>

          {/* Navigation Links List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            
            {/* Dashboard button */}
            <button
              onClick={() => handleSelectView('dashboard')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                currentView === 'dashboard' 
                  ? 'bg-amber-400 text-slate-950 shadow-xs' 
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Utama</span>
            </button>

            {/* Featured Generator Button */}
            {isGeneratorAllowed && (
              <button
                onClick={() => handleSelectView('generator')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-black shadow-xs transition-all border ${
                  currentView === 'generator'
                    ? 'bg-amber-500 text-slate-950 border-amber-600'
                    : 'bg-amber-300 text-slate-950 border-amber-400 hover:bg-amber-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Generator Perencanaan</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-amber-400 uppercase font-black">
                  PRO
                </span>
              </button>
            )}

            {/* Categorized Items */}
            {filteredCategories.map(cat => (
              <div key={cat.id} className="space-y-1 pt-1">
                <p className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {cat.label}
                </p>
                <div className="space-y-0.5">
                  {cat.items.map(item => {
                    const IconComp = item.icon;
                    const isSelected = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectView(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300/80'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <IconComp className={`w-4 h-4 ${isSelected ? 'text-amber-800' : 'text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-gray-200 bg-slate-50">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-all border border-red-200"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>Keluar Aplikasi</span>
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
}

