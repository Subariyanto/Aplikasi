/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Printer, 
  Download, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  School, 
  Users, 
  ShieldCheck, 
  Layers, 
  Award, 
  ChevronRight,
  Edit3,
  Calendar,
  Save,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Profile, PerencanaanKokurikuler, Madrasah, TimKokurikuler, AnalisisMadrasah } from '../types';
import { db } from '../lib/db';
import { isTrialUser, FULL_LICENSE_PRICE, CONTACT_PERSON_NAME, CONTACT_PERSON_PHONE } from '../lib/trial';

interface ProgramLengkapViewProps {
  user: Profile;
  onNavigate: (view: string, docId?: string) => void;
}

export const ProgramLengkapView: React.FC<ProgramLengkapViewProps> = ({ user, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [madr, setMadr] = useState<Madrasah | null>(null);
  const [tim, setTim] = useState<TimKokurikuler | null>(null);
  const [analisis, setAnalisis] = useState<AnalisisMadrasah | null>(null);
  const [perencanaanList, setPerencanaanList] = useState<PerencanaanKokurikuler[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Editable header document fields
  const [tahunPelajaran, setTahunPelajaran] = useState('2025/2026');
  const [tanggalPengesahan, setTanggalPengesahan] = useState(() => {
    const today = new Date();
    return `${today.getDate()} ${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][today.getMonth()]} ${today.getFullYear()}`;
  });

  const [activeTab, setActiveTab] = useState<'preview' | 'pengaturan'>('preview');

  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      try {
        const [madrData, timData, analisisData, docList] = await Promise.all([
          db.madrasah.getFirst(),
          db.timKokurikuler.getFirst(),
          db.analisisMadrasah.getFirst(),
          db.perencanaanKokurikuler.list()
        ]);

        setMadr(madrData);
        setTim(timData);
        setAnalisis(analisisData);
        setPerencanaanList(docList);

        if (docList.length > 0) {
          // Default select the first document or active one
          setSelectedDocId(docList[0].id);
        }
      } catch (err) {
        console.error('Failed loading program data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, []);

  // Filter selected document or use all
  const selectedDoc = perencanaanList.find(d => d.id === selectedDocId) || (perencanaanList.length > 0 ? perencanaanList[0] : null);

  // Helper to collect current page CSS stylesheets
  const getPageStyles = () => {
    return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('\n');
  };

  // Open clean new tab for printing / browser preview
  const handleOpenNewTabPrint = () => {
    const element = document.getElementById('dokumen-program-utuh');
    if (!element) return;

    const stylesHtml = getPageStyles();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>Dokumen Program Kokurikuler Lengkap - ${madr?.nama || 'Madrasah'}</title>
          ${stylesHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 15px !important;
              font-family: 'Inter', system-ui, sans-serif;
            }
            #dokumen-program-utuh {
              width: 100% !important;
              max-width: none !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
            }
            .page-break {
              page-break-before: always !important;
              break-before: page !important;
            }
            tr, .avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .no-print, button, select {
              display: none !important;
            }
          </style>
        </head>
        <body class="bg-white text-black p-4">
          <div id="dokumen-program-utuh" class="p-0 border-none shadow-none text-black">
            ${element.innerHTML}
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (e) {
          console.error('Print window error:', e);
        }
      }, 500);
    } else {
      window.print();
    }
  };

  // Print function
  const handlePrint = () => {
    try {
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        handleOpenNewTabPrint();
      } else {
        window.print();
      }
    } catch (e) {
      console.error('Print failed:', e);
      handleOpenNewTabPrint();
    }
  };

  // Download PDF function
  const handleDownloadPDF = async () => {
    setIsDownloadingPdf(true);
    try {
      const element = document.getElementById('dokumen-program-utuh');
      if (!element) {
        alert('Elemen dokumen tidak ditemukan');
        return;
      }

      // Create a temporary off-screen container with full styles for html2pdf
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm'; // Standard A4 width
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.color = '#000000';
      tempContainer.style.zIndex = '-99999';

      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.width = '210mm';
      clone.style.padding = '12mm';
      clone.style.boxShadow = 'none';
      clone.style.border = 'none';

      // Remove non-printable UI elements
      const noPrints = clone.querySelectorAll('.print\\:hidden, button, select, .no-print');
      noPrints.forEach(el => el.remove());

      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      const safeTitle = (madr?.nama || 'Madrasah').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `Dokumen_Program_Kokurikuler_Lengkap_${safeTitle}_${tahunPelajaran.replace('/', '-')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          backgroundColor: '#ffffff',
          scrollY: 0,
          scrollX: 0,
          windowWidth: 1024
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // @ts-ignore
      const html2pdfModule = (await import('html2pdf.js')).default || (window as any).html2pdf;
      if (html2pdfModule) {
        await html2pdfModule().set(opt).from(tempContainer).save();
      } else {
        handleOpenNewTabPrint();
      }

      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
    } catch (e) {
      console.error('PDF Generation failed:', e);
      handleOpenNewTabPrint();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Fallback HTML Download
  const handleDownloadHTML = () => {
    const element = document.getElementById('dokumen-program-utuh');
    if (!element) return;
    const safeTitle = (madr?.nama || 'Madrasah').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Dokumen Program Kokurikuler Lengkap - ${madr?.nama || ''}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #fff; color: #111; }
          .page-break { page-break-before: always; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 12px; text-align: left; }
          th { background-color: #f8fafc; font-weight: bold; }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
      </html>
    `;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Dokumen_Program_Kokurikuler_Lengkap_${safeTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-bold text-xs">Menyusun Dokumen Program Kokurikuler Lengkap...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Panel (Hidden during printing) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Dokumen Program Kokurikuler Lengkap</h2>
                <span className="bg-amber-100 text-amber-900 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-300">
                  BUKU PROGRAM UTUH
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Integrasi otomatis Cover, Pengesahan, Kata Pengantar, Bab I–V, Hasil Generate PKM, dan Lampiran A4
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              type="button"
              className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              title="Unduh berkas PDF resmi secara langsung"
            >
              {isDownloadingPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  <span>Memproses PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Unduh PDF (.pdf)</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenNewTabPrint}
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              title="Buka dokumen di tab baru browser untuk pratinjau & cetak A4 presisi"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>Tab Baru (A4)</span>
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              title="Cetak langsung menggunakan dialog cetak browser"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Cetak Dokumen (A4)</span>
            </button>
          </div>
        </div>

        {/* Controls & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Pilih Hasil Generate PKM yang Diintegrasikan ke BAB III:
            </label>
            <select
              value={selectedDocId}
              onChange={e => setSelectedDocId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              {perencanaanList.length === 0 ? (
                <option value="">Belum Ada Modul PKM Dibuat</option>
              ) : (
                perencanaanList.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.nama_kegiatan} — {doc.fase} ({doc.status_dokumen})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Tahun Pelajaran:
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tahunPelajaran}
                onChange={e => setTahunPelajaran(e.target.value)}
                placeholder="2025/2026"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
              Tanggal Pengesahan Dokumen:
            </label>
            <input
              type="text"
              value={tanggalPengesahan}
              onChange={e => setTanggalPengesahan(e.target.value)}
              placeholder="Contoh: 15 Juli 2025"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {perencanaanList.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Belum ada modul perencanaan PKM. Anda dapat men-generate modul terlebih dahulu di menu Generator.</span>
            </div>
            <button
              onClick={() => onNavigate('generator')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shrink-0 ml-2"
            >
              Buka Generator PKM
            </button>
          </div>
        )}
      </div>

      {/* DOCUMENT PAPER PREVIEW (PRINT TARGET) */}
      <div className="flex justify-center print:block print:p-0">
        <div 
          id="dokumen-program-utuh"
          className="w-full max-w-[210mm] bg-white text-slate-900 shadow-xl border border-slate-200 p-8 sm:p-12 md:p-16 space-y-12 font-sans text-xs leading-relaxed print:shadow-none print:border-none print:p-0 print:max-w-none print:text-black print:w-full relative overflow-hidden"
        >
          {isTrialUser(user) && (
            <div className="trial-watermark-overlay">
              <div>TRIAL - LISENSI BELUM DIAKTIFKAN</div>
              <span className="trial-watermark-sub">
                Beli Kode Aktivasi Full {FULL_LICENSE_PRICE} ({CONTACT_PERSON_NAME} - {CONTACT_PERSON_PHONE})
              </span>
            </div>
          )}
          
          {/* ======================================================= */}
          {/* 1. COVER / HALAMAN JUDUL                                */}
          {/* ======================================================= */}
          <div className="min-h-[260mm] flex flex-col justify-between text-center border-4 border-double border-slate-900 p-8 sm:p-12 relative print:min-h-[270mm] print:border-slate-800">
            
            {/* Kop Kemenag / Madrasah */}
            <div className="space-y-2">
              {madr?.logo_url ? (
                <img src={madr.logo_url} alt="Logo Madrasah" className="w-20 h-20 mx-auto object-contain mb-3" />
              ) : (
                <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-800 text-white font-black text-2xl flex items-center justify-center shadow-sm mb-3">
                  PKM
                </div>
              )}
              <h4 className="font-extrabold text-sm uppercase tracking-widest text-slate-800">
                KEMENTERIAN AGAMA REPUBLIK INDONESIA
              </h4>
              <h3 className="font-extrabold text-base uppercase tracking-wider text-slate-900">
                {madr?.nama || 'MADRASAH TSANAWIYAH AL-MADINAH'}
              </h3>
              <p className="text-[10px] text-slate-600 font-medium">
                NSM: {madr?.nsm || '121233000000'} | NPSN: {madr?.npsn || '20300000'}
              </p>
              <div className="w-full h-1 bg-slate-900 mt-3" />
              <div className="w-full h-0.5 bg-slate-900 mt-0.5" />
            </div>

            {/* Title Block */}
            <div className="my-auto py-10 space-y-6">
              <span className="inline-block bg-slate-100 text-slate-800 font-extrabold text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest border border-slate-300">
                DOKUMEN RESMI MADRASAH
              </span>
              
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight leading-tight">
                  DOKUMEN PROGRAM KOKURIKULER
                </h1>
                <h2 className="text-base sm:text-lg font-bold text-emerald-800 uppercase tracking-wider">
                  SISTEM PERENCANAAN KOKURIKULER - KBC
                </h2>
                <p className="text-xs text-slate-600 italic max-w-lg mx-auto pt-1 font-medium">
                  "Pedoman Perencanaan, Pelaksanaan, dan Pengembangan Karakter Murid Berbasis Pembiasaan Cinta Allah, Cinta Ilmu, Cinta Lingkungan, Cinta Sesama & Tanah Air"
                </p>
              </div>

              {selectedDoc && (
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-xl text-left max-w-md mx-auto space-y-1.5">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Modul Program Utama (BAB III):</p>
                  <p className="text-sm font-black text-slate-900">{selectedDoc.nama_kegiatan}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] pt-1">
                    <span className="bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold text-emerald-800">
                      Tema: {selectedDoc.tema_kbc}
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold text-slate-700">
                      Fase {selectedDoc.fase}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Cover */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="space-y-1 text-slate-800">
                <p className="font-extrabold text-xs uppercase tracking-wider">DISUSUN OLEH:</p>
                <p className="font-bold text-sm text-slate-900">TIM KERJA KOKURIKULER MADRASAH</p>
              </div>

              <div className="pt-2 text-slate-700 font-bold text-xs uppercase tracking-widest">
                <p>{madr?.kabupaten || 'KABUPATEN JEMBER'}, {madr?.provinsi || 'JAWA TIMUR'}</p>
                <p className="text-slate-900 font-extrabold text-sm mt-1">TAHUN PELAJARAN {tahunPelajaran}</p>
              </div>
            </div>

          </div>

          <div className="page-break" />

          {/* ======================================================= */}
          {/* 2. LEMBAR PENGESAHAN                                    */}
          {/* ======================================================= */}
          <div className="space-y-8 pt-4">
            <div className="text-center space-y-2 border-b-2 border-slate-900 pb-4">
              <h2 className="text-lg font-black uppercase text-slate-900 tracking-wide">LEMBAR PENGESAHAN</h2>
              <h3 className="text-xs font-bold uppercase text-emerald-800 tracking-wider">
                DOKUMEN PROGRAM KOKURIKULER SISTEM PERENCANAAN KOKURIKULER - KBC
              </h3>
              <p className="text-[11px] text-slate-600 font-medium">TAHUN PELAJARAN {tahunPelajaran}</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 leading-relaxed text-justify space-y-3">
              <p>
                Setelah melalui proses analisis karakteristik madrasah, pengkajian potensi murid, dan penyusunan modul oleh Tim Kerja Kokurikuler, Dokumen Program Kokurikuler Sistem Perencanaan Kokurikuler - KBC di <strong>{madr?.nama || 'Madrasah'}</strong> ini dengan resmi diperiksa, disetujui, dan disahkan untuk diberlakukan pada Tahun Pelajaran {tahunPelajaran}.
              </p>
              <p>
                Dokumen ini menjadi acuan operasional resmi bagi seluruh Pendidik, Tenaga Kependidikan, Fasilitator Proyek, dan Orang Tua Murid dalam melaksanakan pembelajaran kokurikuler yang menumbuhkembangkan akhlakul karimah dan 7 Kebiasaan Anak Indonesia Hebat.
              </p>
            </div>

            <div className="pt-8 space-y-12">
              <div className="flex justify-end text-xs">
                <div className="text-right">
                  <p>{madr?.kabupaten || 'Jember'}, {tanggalPengesahan}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 text-center pt-4">
                <div className="space-y-16">
                  <div>
                    <p className="font-bold text-slate-700">Mengetahui & Menyetujui,</p>
                    <p className="font-extrabold text-slate-900">Kepala Madrasah</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-slate-900 underline uppercase">{madr?.kepala_madrasah || 'Drs. H. Mahrus, M.Ag.'}</p>
                    <p className="text-[10px] text-slate-600 font-medium">NIP. {madr?.nip_kepala || '197508122003121002'}</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <p className="font-bold text-slate-700">Penyusun Utama,</p>
                    <p className="font-extrabold text-slate-900">Koordinator Kokurikuler</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-slate-900 underline uppercase">{tim?.koordinator || user.nama_lengkap}</p>
                    <p className="text-[10px] text-slate-600 font-medium">NIP. {tim?.nip_koordinator || '198205142009012008'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-10 text-center border-t border-dashed border-slate-300">
                <p className="text-[10px] text-slate-500 font-medium italic">
                  * Dokumen telah disahkan dan disimpankan di Arsip Digital Perencanaan Kokurikuler Madrasah (PKM).
                </p>
              </div>
            </div>
          </div>

          <div className="page-break" />

          {/* ======================================================= */}
          {/* 3. KATA PENGANTAR                                       */}
          {/* ======================================================= */}
          <div className="space-y-6 pt-4">
            <div className="text-center space-y-1 border-b border-slate-300 pb-3">
              <h2 className="text-lg font-black uppercase text-slate-900 tracking-wide">KATA PENGANTAR</h2>
            </div>

            <div className="space-y-4 text-justify leading-relaxed">
              <p>
                Alhamdulillah, puji dan syukur senantiasa kita panjatkan ke hadirat Allah Swt. atas rahmat, hidayah, dan inayah-Nya sehingga Dokumen Program Kokurikuler Sistem Perencanaan Kokurikuler - KBC di <strong>{madr?.nama || 'Madrasah'}</strong> Tahun Pelajaran {tahunPelajaran} ini dapat diselesaikan dengan baik dan lancar. Shalawat serta salam semoga senantiasa tercurah kepada junjungan kita Nabi Besar Muhammad saw., teladan utama akhlak mulia bagi seluruh alam.
              </p>
              <p>
                Dokumen Program Kokurikuler ini disusun sebagai bentuk komitmen nyata madrasah dalam menghadirkan pembelajaran yang tidak hanya berfokus pada capaian akademik semata, melainkan juga menyentuh kedalaman jiwa dan pembentukan karakter murid. Melalui pendekatan Sistem Perencanaan Kokurikuler - KBC dan penguatan 7 Kebiasaan Anak Indonesia Hebat, kami berikhtiar menanamkan lima pilar cinta utama: <em>Cinta Allah Swt. dan Rasul-Nya, Cinta Ilmu, Cinta Lingkungan, Cinta Diri dan Sesama, serta Cinta Tanah Air</em>.
              </p>
              <p>
                Penyusunan dokumen ini dapat terwujud berkat kerja keras dan kolaborasi yang erat dari seluruh elemen madrasah. Oleh karena itu, kami menyampaikan apresiasi dan ucapan terima kasih yang setulus-tulusnya kepada:
              </p>
              
              <ol className="list-decimal pl-6 space-y-1.5 font-medium text-slate-800">
                <li>Kepala Kantor Kementerian Agama Kabupaten/Kota atas bimbingan dan arahan kebijakannya.</li>
                <li>Pengawas Pembina Madrasah yang telah memberikan supervisi dan masukan berharga.</li>
                <li>Kepala Madrasah yang memberikan arahan, fasilitasi, dan pengesahan dokumen program ini.</li>
                <li>Seluruh Pendidik, Fasilitator, dan Tim Kerja Kokurikuler yang telah mendedikasikan waktu dan gagasan terbaiknya.</li>
                <li>Pengurus Komite Madrasah dan Orang Tua Murid atas dukungan serta sinergi yang terus terjalin.</li>
              </ol>

              <p>
                Kami menyadari bahwa dokumen ini masih memerlukan penyempurnaan seiring perkembangan dinamika pembelajaran di lapangan. Oleh sebab itu, masukan konstruktif dari berbagai pihak sangat kami harapkan. Semoga Allah Swt. merestui seluruh niat dan ikhtiar mulia ini demi mencetak generasi penerus yang beriman, berilmu, dan berakhlak mulia.
              </p>
            </div>

            <div className="pt-6 flex justify-end">
              <div className="text-center space-y-1">
                <p className="text-slate-700">{madr?.kabupaten || 'Jember'}, {tanggalPengesahan}</p>
                <p className="font-bold text-slate-900">Tim Kerja Kokurikuler Madrasah</p>
              </div>
            </div>
          </div>

          <div className="page-break" />

          {/* ======================================================= */}
          {/* 4. DAFTAR ISI                                           */}
          {/* ======================================================= */}
          <div className="space-y-6 pt-4">
            <div className="text-center space-y-1 border-b border-slate-300 pb-3">
              <h2 className="text-lg font-black uppercase text-slate-900 tracking-wide">DAFTAR ISI</h2>
            </div>

            <div className="space-y-3 font-medium text-slate-800">
              <div className="flex justify-between items-baseline font-bold uppercase text-slate-900">
                <span>HALAMAN JUDUL (COVER)</span>
                <span className="border-b border-dotted border-slate-400 flex-1 mx-2"></span>
                <span>i</span>
              </div>
              <div className="flex justify-between items-baseline font-bold uppercase text-slate-900">
                <span>LEMBAR PENGESAHAN</span>
                <span className="border-b border-dotted border-slate-400 flex-1 mx-2"></span>
                <span>ii</span>
              </div>
              <div className="flex justify-between items-baseline font-bold uppercase text-slate-900">
                <span>KATA PENGANTAR</span>
                <span className="border-b border-dotted border-slate-400 flex-1 mx-2"></span>
                <span>iii</span>
              </div>
              <div className="flex justify-between items-baseline font-bold uppercase text-slate-900">
                <span>DAFTAR ISI</span>
                <span className="border-b border-dotted border-slate-400 flex-1 mx-2"></span>
                <span>iv</span>
              </div>

              {/* BAB I */}
              <div className="pt-2">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>BAB I PENDAHULUAN</span>
                  <span className="border-b border-dotted border-slate-400 flex-1 mx-2"></span>
                  <span>1</span>
                </div>
                <div className="pl-4 space-y-1 text-[11px] pt-1">
                  <div className="flex justify-between"><span>1.1 Latar Belakang & Integrasi KBC</span><span>1</span></div>
                  <div className="flex justify-between"><span>1.2 Landasan Hukum</span><span>2</span></div>
                  <div className="flex justify-between"><span>1.3 Tujuan Program</span><span>2</span></div>
                  <div className="flex justify-between"><span>1.4 Sasaran & Ruang Lingkup</span><span>3</span></div>
                </div>
              </div>

              {/* BAB II */}
              <div className="pt-2">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>BAB II ANALISIS KARAKTER & POTENSI MADRASAH</span>
                  <span className="border-b border-dotted border-slate-400 flex-1 mx-2"></span>
                  <span>4</span>
                </div>
                <div className="pl-4 space-y-1 text-[11px] pt-1">
                  <div className="flex justify-between"><span>2.1 Profil & Karakteristik Murid</span><span>4</span></div>
                  <div className="flex justify-between"><span>2.2 Potensi Lingkungan & Kemitraan</span><span>5</span></div>
                  <div className="flex justify-between"><span>2.3 Pemetaan Nilai & Dimensi KBC Utama</span><span>6</span></div>
                </div>
              </div>

              {/* BAB III */}
              <div className="pt-2">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>BAB III PERENCANAAN & MODUL PROYEK KOKURIKULER UTAMA (PKM)</span>
                  <span className="border-b border-dotted border-slate-400 flex-1 mx-2"></span>
                  <span>7</span>
                </div>
                <div className="pl-4 space-y-1 text-[11px] pt-1">
                  <div className="flex justify-between"><span>3.1 Identitas Program & Tim Fasilitator</span><span>7</span></div>
                  <div className="flex justify-between"><span>3.2 Judul, Tema, & Alokasi Waktu Proyek</span><span>8</span></div>
                  <div className="flex justify-between"><span>3.3 Target Dimensi Karakter & Indikator</span><span>9</span></div>
                  <div className="flex justify-between"><span>3.4 Tahapan Aktivitas & Pembiasaan Karakter</span><span>10</span></div>
                  <div className="flex justify-between"><span>3.5 Matriks Rubrik Asesmen & Observasi</span><span>12</span></div>
                </div>
              </div>

              {/* BAB IV */}
              <div className="pt-2">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>BAB IV PELAKSANAAN & STRATEGI PENDAMPINGAN</span>
                  <span className="border-b border-dotted border-slate-400 flex-1 mx-2"></span>
                  <span>14</span>
                </div>
                <div className="pl-4 space-y-1 text-[11px] pt-1">
                  <div className="flex justify-between"><span>4.1 Susunan Tim Kerja & Pembagian Tugas</span><span>14</span></div>
                  <div className="flex justify-between"><span>4.2 Pembiasaan Harian (7 Kebiasaan Anak Indonesia Hebat)</span><span>15</span></div>
                  <div className="flex justify-between"><span>4.3 Alokasi Sarana & Anggaran Kegiatan</span><span>16</span></div>
                </div>
              </div>

              {/* BAB V */}
              <div className="pt-2">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>BAB V EVALUASI, TINDAK LANJUT & PENUTUP</span>
                  <span className="border-b border-dotted border-slate-400 flex-1 mx-2"></span>
                  <span>17</span>
                </div>
                <div className="pl-4 space-y-1 text-[11px] pt-1">
                  <div className="flex justify-between"><span>5.1 Sistem Monitoring & Supervisi Pengawas</span><span>17</span></div>
                  <div className="flex justify-between"><span>5.2 Rencana Tindak Lanjut (RTL)</span><span>18</span></div>
                  <div className="flex justify-between"><span>5.3 Penutup</span><span>18</span></div>
                </div>
              </div>

              {/* LAMPIRAN */}
              <div className="pt-2">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>LAMPIRAN-LAMPIRAN</span>
                  <span className="border-b border-dotted border-slate-400 flex-1 mx-2"></span>
                  <span>19</span>
                </div>
                <div className="pl-4 space-y-1 text-[11px] pt-1">
                  <div className="flex justify-between"><span>Lampiran 1: Rubrik Observasi Perkembangan Karakter</span><span>19</span></div>
                  <div className="flex justify-between"><span>Lampiran 2: Format Rapor Kokurikuler A4</span><span>20</span></div>
                  <div className="flex justify-between"><span>Lampiran 3: Draft SK Tim Kerja Kokurikuler</span><span>21</span></div>
                </div>
              </div>

            </div>
          </div>

          <div className="page-break" />

          {/* ======================================================= */}
          {/* 5. BAB I: PENDAHULUAN                                   */}
          {/* ======================================================= */}
          <div className="space-y-6 pt-4">
            <div className="border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase text-slate-900 tracking-wide">BAB I: PENDAHULUAN</h2>
            </div>

            <div className="space-y-4 text-justify">
              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase">1.1 Latar Belakang & Integrasi Sistem Perencanaan Kokurikuler - KBC</h3>
                <p>
                  Pendidikan di madrasah memegang peranan strategis dalam membangun fondasi keimanan, ketakwaan, dan akhlakul karimah peserta didik. Di tengah dinamika globalisasi dan kemajuan teknologi digital, penguatan karakter murid tidak lagi cukup hanya dilakukan secara formal di dalam ruang kelas, melainkan membutuhkan penjiwaan utuh melalui program kokurikuler yang terstruktur, menyenangkan, dan berpusat pada kasih sayang.
                </p>
                <p>
                  Sistem Perencanaan Kokurikuler - KBC hadir sebagai paradigma pembelajaran di lingkungan Kementerian Agama yang mengintegrasikan nilai-nilai spiritualitas Al-Qur'an dan Hadis ke dalam lima pilar cinta utama: <strong>Cinta Allah Swt. dan Rasul-Nya, Cinta Ilmu, Cinta Lingkungan, Cinta Diri & Sesama, serta Cinta Tanah Air</strong>. Melalui lima pilar ini, kegiatan kokurikuler dirancang sedemikian rupa agar menjadi sarana habituasi (pembiasaan) yang menghidupkan 7 Kebiasaan Anak Indonesia Hebat.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase">1.2 Landasan Hukum</h3>
                <p>Penyusunan Dokumen Program Kokurikuler ini berlandaskan pada ketentuan perundang-undangan berikut:</p>
                <ul className="list-disc pl-5 space-y-1 font-medium text-slate-800">
                  <li>Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional.</li>
                  <li>Peraturan Pemerintah Nomor 57 Tahun 2021 tentang Standar Nasional Pendidikan.</li>
                  <li>Keputusan Menteri Agama (KMA) Nomor 450 Tahun 2024 tentang Pedoman Implementasi Kurikulum pada RA, MI, MTs, MA, dan MAK.</li>
                  <li>Panduan Pengembangan Sistem Perencanaan Kokurikuler - KBC Direktorat KSKK Madrasah Kementerian Agama RI.</li>
                  <li>Surat Keputusan Kepala Madrasah tentang Tim Kerja Kokurikuler Tahun Pelajaran {tahunPelajaran}.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase">1.3 Tujuan Program Kokurikuler</h3>
                <ol className="list-decimal pl-5 space-y-1 font-medium text-slate-800">
                  <li>Menanamkan dan menguatkan lima pilar cinta KBC dalam kehidupan harian murid di madrasah, rumah, dan masyarakat.</li>
                  <li>Membina 7 Kebiasaan Anak Indonesia Hebat (Bangun Pagi, Beribadah, Berolahraga, Makan Sehat, Gemar Belajar, Bermasyarakat, Tidur Cepat).</li>
                  <li>Menyediakan wadah eksplorasi bakat, minat, dan potensi kepemimpinan murid secara inklusif.</li>
                  <li>Memberikan panduan baku bagi Pendidik dan Fasilitator dalam merancang, melaksanakan, serta mengases perkembangan karakter murid.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase">1.4 Sasaran & Ruang Lingkup</h3>
                <p>
                  Sasaran utama program kokurikuler ini adalah seluruh murid <strong>{madr?.nama || 'Madrasah'}</strong> jenjang {madr?.jenjang || 'MTs'} pada Fase {selectedDoc?.fase || 'D'}, yang melibatkan jajaran Pendidik, Fasilitator Proyek, Orang Tua/Wali Murid, serta Komite Madrasah.
                </p>
              </div>
            </div>
          </div>

          <div className="page-break" />

          {/* ======================================================= */}
          {/* 6. BAB II: ANALISIS KARAKTER & POTENSI MADRASAH         */}
          {/* ======================================================= */}
          <div className="space-y-6 pt-4">
            <div className="border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase text-slate-900 tracking-wide">BAB II: ANALISIS KARAKTER & POTENSI MADRASAH</h2>
            </div>

            <div className="space-y-4 text-justify">
              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase">2.1 Profil & Karakteristik Murid</h3>
                <p>
                  Berdasarkan pemetaan hasil observasi dan analisis madrasah, profil murid di <strong>{madr?.nama || 'Madrasah'}</strong> memiliki karakteristik sosial, budaya, dan keberagamaan sebagai berikut:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 space-y-2">
                  <p><strong>Latar Belakang Murid:</strong> {analisis?.ringkasan_karakter || 'Sebagian besar murid memiliki minat tinggi pada kegiatan praktik keagamaan dan seni, namun memerlukan penguatan pembiasaan disiplin waktu, kerapian, serta kemandirian belajar.'}</p>
                  <p><strong>Tantangan Pembiasaan:</strong> {analisis?.tantangan_pembiasaan || 'Perlu pendampingan konsisten pada ibadah harian, penggunaan gawai digital yang bijak, serta kepedulian terhadap kebersihan lingkungan.'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase">2.2 Potensi Lingkungan, Sarpras, & Kemitraan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-800">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-900 mb-1">🏛️ Sarana & Prasarana Pendukung:</p>
                    <p className="text-[11px] text-slate-700">{madr?.fasilitas_unggulan || 'Mushalla madrasah yang lapang, perpustakaan digital, taman hijau, kantin sehat, serta lapangan olahraga.'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="font-bold text-slate-900 mb-1">🤝 Kemitraan & Lingkungan Luar:</p>
                    <p className="text-[11px] text-slate-700">{madr?.kemitraan_luar || 'Sinergi aktif dengan Komite Madrasah, Puskesmas setempat, KUA, Pondok Pesantren, dan Tokoh Masyarakat.'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase">2.3 Pemetaan Nilai & Dimensi KBC Yang Dikembangkan</h3>
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold">
                      <th className="border border-slate-300 p-2 text-center w-10">No</th>
                      <th className="border border-slate-300 p-2 text-left">Pilar Cinta KBC</th>
                      <th className="border border-slate-300 p-2 text-left">Focus Kebiasaan & Sikap Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2 text-center font-bold">1</td>
                      <td className="border border-slate-300 p-2 font-bold text-emerald-800">Cinta Allah Swt. & Rasul-Nya</td>
                      <td className="border border-slate-300 p-2">Beribadah tepat waktu, khusyuk salat berjamaah, hafalan Al-Qur'an, zikir, dan keteladanan akhlak.</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 text-center font-bold">2</td>
                      <td className="border border-slate-300 p-2 font-bold text-emerald-800">Cinta Ilmu</td>
                      <td className="border border-slate-300 p-2">Gemar membaca, bernalar kritis, tekun berinovasi, hormat kepada guru, dan bijak media digital.</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 text-center font-bold">3</td>
                      <td className="border border-slate-300 p-2 font-bold text-emerald-800">Cinta Lingkungan</td>
                      <td className="border border-slate-300 p-2">Menjaga kebersihan kelas & mushalla, hemat air-listrik, memilah sampah, dan merawat tanaman.</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 text-center font-bold">4</td>
                      <td className="border border-slate-300 p-2 font-bold text-emerald-800">Cinta Diri & Sesama Manusia</td>
                      <td className="border border-slate-300 p-2">Menjaga kebersihan diri, makan sehat bergizi, sikap empati, antinepotisme, dan ramah tanpa bullying.</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 text-center font-bold">5</td>
                      <td className="border border-slate-300 p-2 font-bold text-emerald-800">Cinta Tanah Air</td>
                      <td className="border border-slate-300 p-2">Toleransi (moderasi beragama), menghargai kearifan lokal, bangga produk dalam negeri, dan persatuan.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="page-break" />

          {/* ======================================================= */}
          {/* 7. BAB III: PERENCANAAN & MODUL PROYEK KOKURIKULER (PKM)*/}
          {/* ======================================================= */}
          <div className="space-y-6 pt-4">
            <div className="border-b-2 border-slate-900 pb-2 flex justify-between items-end">
              <div>
                <h2 className="text-base font-black uppercase text-slate-900 tracking-wide">
                  BAB III: PERENCANAAN & MODUL PROYEK KOKURIKULER UTAMA
                </h2>
                <p className="text-[10px] text-emerald-800 font-bold uppercase mt-0.5">
                  (HASIL GENERATE OTOMATIS MODUL PKM / RPKM)
                </p>
              </div>
              {selectedDoc && (
                <span className="text-[10px] bg-slate-100 font-mono font-bold px-2 py-1 rounded border border-slate-300">
                  ID: {selectedDoc.id.slice(0, 8)}
                </span>
              )}
            </div>

            {selectedDoc ? (
              <div className="space-y-6 text-justify">
                
                {/* 3.1 Ringkasan Modul */}
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Judul Proyek Kokurikuler:</span>
                      <span className="font-extrabold text-slate-900 text-sm">{selectedDoc.nama_kegiatan}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Tema Utama KBC:</span>
                      <span className="font-bold text-emerald-800">{selectedDoc.tema_kbc}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Fase / Kelas & Alokasi Waktu:</span>
                      <span className="font-bold text-slate-800">Fase {selectedDoc.fase} — {selectedDoc.alokasi_waktu}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Status Dokumen Modul:</span>
                      <span className="font-extrabold text-emerald-700 uppercase">{selectedDoc.status_dokumen}</span>
                    </div>
                  </div>
                </div>

                {/* 3.2 Target Dimensi Karakter KBC */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase">3.2 Dimensi Karakter KBC & Indikator Target</h3>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedDoc.dimensi_kbc?.map((dim, i) => (
                      <span key={i} className="bg-emerald-100 text-emerald-900 font-bold text-[10px] px-2.5 py-1 rounded-md border border-emerald-300">
                        ✓ {dim}
                      </span>
                    ))}
                  </div>

                  <table className="w-full border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold">
                        <th className="border border-slate-300 p-2 text-left w-1/3">Elemen / Sub-Elemen</th>
                        <th className="border border-slate-300 p-2 text-left">Indikator Ketercapaian Karakter (Target Output)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-2 font-bold text-slate-800">
                          {selectedDoc.elemen_kbc || 'Penguatan Akhlak & Pembiasaan Harian'}
                        </td>
                        <td className="border border-slate-300 p-2">
                          {selectedDoc.target_hasil || 'Murid mampu menunjukkan pembiasaan sikap penuh kasih sayang, disiplin ibadah, serta mampu merefleksikan perbuatannya dalam lembar mutabaah harian.'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3.3 Tahapan Aktivitas & Pembiasaan */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase">3.3 Alur Aktivitas Pembiasaan Karakter</h3>
                  
                  {selectedDoc.aktivitas_pembiasaan && selectedDoc.aktivitas_pembiasaan.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDoc.aktivitas_pembiasaan.map((act, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-800">Tahap {idx + 1}: {act.tahap}</span>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono font-medium text-slate-600">{act.alokasi}</span>
                          </div>
                          <p className="text-slate-800 font-medium">{act.deskripsi}</p>
                          {act.peran_guru && (
                            <p className="text-[10px] text-slate-500 italic">Peran Fasilitator: {act.peran_guru}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                      {selectedDoc.langkah_kegiatan || 'Proyek dilaksanakan melalui tahapan Pengenalan (sosialisasi pilar KBC), Kontekstualisasi (diskusi kelompok & pemetaan kasus), Aksi Nyata (praktik pembiasaan harian & karya), serta Refleksi dan Tindak Lanjut.'}
                    </div>
                  )}
                </div>

                {/* 3.4 Rubrik Asesmen */}
                <div className="space-y-2">
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase">3.4 Matriks Rubrik Asesmen Perkembangan Karakter</h3>
                  <table className="w-full border-collapse border border-slate-300 text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold">
                        <th className="border border-slate-300 p-2 text-center w-1/4">Sangat Baik (SB)</th>
                        <th className="border border-slate-300 p-2 text-center w-1/4">Baik (B)</th>
                        <th className="border border-slate-300 p-2 text-center w-1/4">Cukup (C)</th>
                        <th className="border border-slate-300 p-2 text-center w-1/4">Perlu Bimbingan (PB)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 p-2 text-slate-800">
                          {selectedDoc.rubrik_sangat_baik || 'Konsisten melakukan pembiasaan karakter secara mandiri dan menjadi teladan bagi teman.'}
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-800">
                          {selectedDoc.rubrik_baik || 'Sudah melakukan pembiasaan karakter dengan baik tanpa perlu sering diingatkan.'}
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-800">
                          {selectedDoc.rubrik_cukup || 'Mulai menunjukkan pembiasaan karakter namun kadang masih perlu diingatkan.'}
                        </td>
                        <td className="border border-slate-300 p-2 text-slate-800">
                          {selectedDoc.rubrik_perlu_bimbingan || 'Belum menunjukkan pembiasaan karakter dan memerlukan pendampingan khusus.'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                Belum ada modul proyek dipilih. Silakan pilih modul proyek di bagian atas.
              </div>
            )}
          </div>

          <div className="page-break" />

          {/* ======================================================= */}
          {/* 8. BAB IV: PELAKSANAAN & STRATEGI PENDAMPINGAN          */}
          {/* ======================================================= */}
          <div className="space-y-6 pt-4">
            <div className="border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase text-slate-900 tracking-wide">
                BAB IV: PELAKSANAAN & STRATEGI PENDAMPINGAN
              </h2>
            </div>

            <div className="space-y-4 text-justify">
              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase">4.1 Susunan Tim Kerja Kokurikuler</h3>
                <p>
                  Pelaksanaan program kokurikuler di <strong>{madr?.nama || 'Madrasah'}</strong> dikoordinasikan oleh Tim Kerja resmi berdasarkan SK Kepala Madrasah dengan susunan sebagai berikut:
                </p>
                
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold">
                      <th className="border border-slate-300 p-2 text-center w-10">No</th>
                      <th className="border border-slate-300 p-2 text-left">Jabatan Dalam Tim</th>
                      <th className="border border-slate-300 p-2 text-left">Nama Lengkap</th>
                      <th className="border border-slate-300 p-2 text-left">Uraian Tugas Utama</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2 text-center font-bold">1</td>
                      <td className="border border-slate-300 p-2 font-bold text-slate-900">Penanggung Jawab</td>
                      <td className="border border-slate-300 p-2 font-bold">{madr?.kepala_madrasah || 'Kepala Madrasah'}</td>
                      <td className="border border-slate-300 p-2">Pengarah, penanggung jawab umum, dan pengesah kebijakan program.</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 text-center font-bold">2</td>
                      <td className="border border-slate-300 p-2 font-bold text-emerald-800">Koordinator Kokurikuler</td>
                      <td className="border border-slate-300 p-2 font-bold">{tim?.koordinator || user.nama_lengkap}</td>
                      <td className="border border-slate-300 p-2">Penyusun modul, pengatur jadwal, dan pembagi alokasi tugas fasilitator.</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 text-center font-bold">3</td>
                      <td className="border border-slate-300 p-2 font-bold text-slate-900">Sekretaris Tim</td>
                      <td className="border border-slate-300 p-2">{tim?.sekretaris || 'Siti Rahmawati, S.Pd.'}</td>
                      <td className="border border-slate-300 p-2">Administrasi, dokumentasi, dan pengelolaan arsip modul perencanaan.</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 text-center font-bold">4</td>
                      <td className="border border-slate-300 p-2 font-bold text-slate-900">Bendahara Tim</td>
                      <td className="border border-slate-300 p-2">{tim?.bendahara || 'Ahmad Dahlan, S.E.'}</td>
                      <td className="border border-slate-300 p-2">Pengelolaan anggaran dan fasilitasi sarana kegiatan kokurikuler.</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 text-center font-bold">5</td>
                      <td className="border border-slate-300 p-2 font-bold text-slate-900">Fasilitator Proyek / Guru Kelas</td>
                      <td className="border border-slate-300 p-2">{tim?.anggota?.join(', ') || 'Seluruh Guru Wali Kelas & Guru Mata Pelajaran'}</td>
                      <td className="border border-slate-300 p-2">Pendamping harian murid, pengobservasi sikap, dan pengisi mutabaah.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase">4.2 Skema Pendampingan 7 Kebiasaan Anak Indonesia Hebat</h3>
                <p>
                  Strategi pendampingan karakter dilaksanakan secara menyatu melalui skema habituasi harian dan mingguan:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-bold text-emerald-800">1. Bangun Pagi & Salat Subuh</p>
                    <p className="text-[11px] text-slate-600">Dicatat pada Buku Mutabaah Yaumiyah murid dan diverifikasi orang tua.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-bold text-emerald-800">2. Beribadah Salat Dhuha & Dzuhur</p>
                    <p className="text-[11px] text-slate-600">Salat berjamaah terjadwal di mushalla madrasah dibimbing fasilitator.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-bold text-emerald-800">3. Berolahraga & Senam Pagi</p>
                    <p className="text-[11px] text-slate-600">Jumat Sehat dan jalan santai budaya 15 menit sebelum pembelajaran.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="font-bold text-emerald-800">4. Makan Sehat & Kantin Bersih</p>
                    <p className="text-[11px] text-slate-600">Edukasi bekal gizi seimbang dan gerakan minum air putih bebas plastik.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="page-break" />

          {/* ======================================================= */}
          {/* 9. BAB V: EVALUASI, TINDAK LANJUT & PENUTUP             */}
          {/* ======================================================= */}
          <div className="space-y-6 pt-4">
            <div className="border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase text-slate-900 tracking-wide">
                BAB V: EVALUASI, TINDAK LANJUT & PENUTUP
              </h2>
            </div>

            <div className="space-y-4 text-justify">
              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase">5.1 Sistem Monitoring & Evaluasi Program</h3>
                <p>
                  Evaluasi ketercapaian program kokurikuler dilakukan secara berkala pada setiap akhir fase/semester melalui tiga tahapan utama:
                </p>
                <ol className="list-decimal pl-5 space-y-1 font-medium text-slate-800">
                  <li><strong>Self-Assessment Murid:</strong> Murid mengisi lembar refleksi diri secara jujur dan terbuka.</li>
                  <li><strong>Observasi Fasilitator:</strong> Penilaian sikap berdasarkan catatan anekdot dan rubrik karakter harian.</li>
                  <li><strong>Supervisi Pengawas Kemenag:</strong> Pembina memberikan masukan, rekomendasi, dan validasi fisik pada menu Catatan Pengawas.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase">5.2 Rencana Tindak Lanjut (RTL)</h3>
                <p>
                  Hasil evaluasi digunakan sebagai pijakan dalam menyusun Rencana Tindak Lanjut (RTL), mencakup pengayaan bagi murid yang telah mencapai kriteria Sangat Baik, serta bimbingan personal berpendekatan kasih sayang bagi murid yang membutuhkan perhatian khusus.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase">5.3 Penutup</h3>
                <p>
                  Dokumen Program Kokurikuler Sistem Perencanaan Kokurikuler - KBC ini dirancang sebagai panduan dinamis yang senantiasa terbuka untuk penyempurnaan. Dengan konsistensi habituasi, keteladanan pendidik, serta dukungan penuh dari orang tua murid dan masyarakat, kita optimis madrasah mampu melahirkan generasi anak Indonesia hebat yang unggul, berakhlak mulia, dan penuh cinta.
                </p>
              </div>
            </div>

            <div className="pt-10 flex justify-end">
              <div className="text-center space-y-16">
                <p className="font-bold text-slate-900">Mengetahui & Mengesahkan,</p>
                <div>
                  <p className="font-black text-slate-900 underline uppercase">{madr?.kepala_madrasah || 'Kepala Madrasah'}</p>
                  <p className="text-[10px] text-slate-600">NIP. {madr?.nip_kepala || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="page-break" />

          {/* ======================================================= */}
          {/* 10. LAMPIRAN - LAMPIRAN                                 */}
          {/* ======================================================= */}
          <div className="space-y-6 pt-4">
            <div className="border-b-2 border-slate-900 pb-2">
              <h2 className="text-base font-black uppercase text-slate-900 tracking-wide">
                LAMPIRAN - DOKUMEN PENDUKUNG
              </h2>
            </div>

            <div className="space-y-6">
              {/* Lampiran 1 */}
              <div className="space-y-2">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase">
                  Lampiran 1: Contoh Lembar Observasi Perkembangan Karakter Murid
                </h3>
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold">
                      <th className="border border-slate-300 p-2 text-center w-8">No</th>
                      <th className="border border-slate-300 p-2 text-left">Nama Murid</th>
                      <th className="border border-slate-300 p-2 text-center">Salat Dhuha</th>
                      <th className="border border-slate-300 p-2 text-center">Kebersihan Diri</th>
                      <th className="border border-slate-300 p-2 text-center">Toleransi / Empati</th>
                      <th className="border border-slate-300 p-2 text-center">Predikat Karakter</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2 text-center">1</td>
                      <td className="border border-slate-300 p-2 font-bold">Ahmad Fauzan</td>
                      <td className="border border-slate-300 p-2 text-center text-emerald-800 font-bold">Sangat Baik</td>
                      <td className="border border-slate-300 p-2 text-center text-emerald-800 font-bold">Sangat Baik</td>
                      <td className="border border-slate-300 p-2 text-center text-emerald-800 font-bold">Baik</td>
                      <td className="border border-slate-300 p-2 text-center font-black text-emerald-900">Sangat Baik (SB)</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 text-center">2</td>
                      <td className="border border-slate-300 p-2 font-bold">Siti Aisyah</td>
                      <td className="border border-slate-300 p-2 text-center text-emerald-800 font-bold">Baik</td>
                      <td className="border border-slate-300 p-2 text-center text-emerald-800 font-bold">Sangat Baik</td>
                      <td className="border border-slate-300 p-2 text-center text-emerald-800 font-bold">Sangat Baik</td>
                      <td className="border border-slate-300 p-2 text-center font-black text-emerald-900">Sangat Baik (SB)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Lampiran 2 */}
              <div className="space-y-2 pt-2">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase">
                  Lampiran 2: Format Ringkas Rapor Kokurikuler KBC A4
                </h3>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-800 border-b pb-2">
                    <span>RAPOR KOKURIKULER SISTEM PERENCANAAN KOKURIKULER - KBC</span>
                    <span>{madr?.nama}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    * Format cetak Rapor Kokurikuler individual murid secara utuh dapat diakses dan dicetak pada menu <strong>Arsip Dokumen / Preview Cetak</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Identitas Lisensi Terkunci */}
          <div className="mt-12 pt-4 border-t-2 border-slate-900 text-center font-sans text-[10px] text-slate-700 font-bold space-y-1">
            <p className="uppercase tracking-wider">
              🔒 DOKUMEN RESMI TERVERIFIKASI SISTEM KOKURIKULER MADRASAH (PKMG)
            </p>
            <p className="text-slate-600 font-normal">
              Lisensi Lembaga Terkunci: <strong>{madr?.nama || 'Madrasah'}</strong> (NSM: {madr?.nsm || '-'}) | Hak Cipta & Keamanan Terjamin | Dicetak Oleh: {user.nama_lengkap} ({user.role})
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
