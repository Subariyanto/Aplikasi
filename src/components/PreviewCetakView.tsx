/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft, Download, FileText, CheckCircle, Award, AlertCircle, ExternalLink } from 'lucide-react';
import { PerencanaanKokurikuler, Madrasah, Profile } from '../types';
import { db } from '../lib/db';
import { isTrialUser, FULL_LICENSE_PRICE } from '../lib/trial';

interface PreviewCetakViewProps {
  docId?: string | null;
  user?: Profile | null;
  onBack: () => void;
  onNavigate?: (view: string, docId?: string) => void;
}

// Helper to format evaluasi & RTL text strings into structured HTML lists or line breaks
function formatEvaluasiListHtml(text?: string): string {
  if (!text || text.trim() === '' || text.trim() === '-') return '<span style="color: #9ca3af;">-</span>';

  const raw = text.trim();

  // Check if text starts with or contains numbered list items like "1. ", "2. ", "3. "
  const hasNumberedList = /(?:^|\s+|\n)\d+\.\s+/.test(raw);
  if (hasNumberedList) {
    const items = raw.split(/(?:^|\s+|\n)(\d+\.\s+)/).filter(Boolean);
    const listItems: string[] = [];
    for (let i = 0; i < items.length; i++) {
      if (/^\d+\.\s+$/.test(items[i])) {
        if (i + 1 < items.length) {
          const val = items[i + 1].trim();
          if (val) listItems.push(val);
          i++;
        }
      } else if (items[i].trim()) {
        listItems.push(items[i].trim());
      }
    }
    if (listItems.length > 0) {
      return `<ol style="margin: 4px 0 0 0; padding-left: 18px; line-height: 1.5; color: #1f2937;">${listItems.map(item => `<li style="margin-bottom: 3px;">${item}</li>`).join('')}</ol>`;
    }
  }

  // Check if text starts with or contains hyphen list items like "- Item 1 - Item 2" or "- Item 1\n- Item 2"
  const hasHyphenList = /(?:^|\n|\s+)-\s+/.test(raw);
  if (hasHyphenList) {
    const items = raw.split(/(?:^|\n|\s+)-\s+/).map(s => s.trim()).filter(Boolean);
    if (items.length > 0) {
      return `<ul style="margin: 4px 0 0 0; padding-left: 18px; line-height: 1.5; list-style-type: disc; color: #1f2937;">${items.map(item => `<li style="margin-bottom: 3px;">${item}</li>`).join('')}</ul>`;
    }
  }

  // If text has newlines
  if (raw.includes('\n')) {
    return raw.split('\n').map(line => line.trim()).filter(Boolean).map(line => `<p style="margin: 0 0 3px 0; color: #1f2937;">${line}</p>`).join('');
  }

  return `<p style="margin: 0; color: #1f2937;">${raw}</p>`;
}

// Helper to generate a fully styled, self-contained printable HTML document
function generatePrintableHTML(
  doc: PerencanaanKokurikuler, 
  madr: Madrasah | null, 
  printType: 'rpkm' | 'rapor',
  isTrial: boolean = false
): string {
  const isRapor = printType === 'rapor';
  
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #ffffff;
      color: #111827;
      margin: 0;
      padding: 40px;
      line-height: 1.5;
      position: relative;
    }

    .watermark-overlay {
      position: fixed;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 16pt;
      font-weight: 900;
      color: rgba(220, 38, 38, 0.28);
      border: 3px dashed rgba(220, 38, 38, 0.35);
      background-color: rgba(254, 242, 242, 0.25);
      padding: 10px 22px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 2px;
      text-align: center;
      pointer-events: none;
      z-index: 99999;
      white-space: nowrap;
      user-select: none;
      line-height: 1.3;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .watermark-sub {
      font-size: 9.5pt;
      display: block;
      margin-top: 4px;
      letter-spacing: 0.5px;
      color: rgba(220, 38, 38, 0.45);
      font-weight: 700;
      text-transform: none;
    }
    
    .serif-font {
      font-family: Georgia, Cambria, "Times New Roman", Times, serif;
    }
    
    .mono-font {
      font-family: "JetBrains Mono", Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
    }
    
    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .avoid-break {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    h1, h2, h3, h4 {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }
    
    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      .no-print {
        display: none !important;
      }
      tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
    
    .kop-border {
      border-bottom: 3px double #000000;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
    }
    
    th, td {
      padding: 8px;
      border: 1px solid #e5e7eb;
    }
    
    .no-border-table th, .no-border-table td {
      border: none !important;
    }
  `;

  const kopHTML = madr ? `
    <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 24px; padding-bottom: 16px;" class="kop-border">
      ${madr.logo_url && madr.logo_url.startsWith('data:image') ? `
        <img src="${madr.logo_url}" alt="Logo Madrasah" style="width: 72px; height: 72px; object-fit: contain; flex-shrink: 0;" />
      ` : `
        <div style="width: 72px; height: 72px; border: 2px solid black; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background-color: #047857; color: white; flex-shrink: 0;">
          ${madr.nama_madrasah ? madr.nama_madrasah.slice(0, 2).toUpperCase() : 'M'}
        </div>
      `}
      <div style="flex: 1; text-align: center;">
        <h2 style="font-size: 12px; font-weight: bold; text-transform: uppercase; margin: 0; letter-spacing: 0.5px;">YAYASAN PENDIDIKAN ISLAM MADRASAH</h2>
        <h1 style="font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 2px 0 0 0; color: #047857;">${madr.nama_madrasah || '-'}</h1>
        <p style="font-size: 10px; color: #4b5563; margin: 2px 0 0 0;">
          Alamat: ${madr.alamat || '-'} | NSM: ${madr.nsm || '-'} | NPSN: ${madr.npsn || '-'}
        </p>
        <p style="font-size: 10px; color: #6b7280; margin: 2px 0 0 0;">
          Kabupaten / Kota: ${madr.kabupaten_kota || '-'} | Provinsi: ${madr.provinsi || '-'}
        </p>
      </div>
    </div>
  ` : '';

  let mainContent = '';

  if (isRapor) {
    if (!doc.pelaporan_hasil || doc.pelaporan_hasil.length === 0) {
      mainContent = `
        <div style="text-align: center; padding: 48px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 600px; margin: 40px auto; font-family: sans-serif;">
          <h3 style="font-size: 16px; font-weight: bold; color: #374151; margin-bottom: 8px;">Belum ada baris pelaporan siswa.</h3>
          <p style="font-size: 12px; color: #9ca3af;">Harap buka Rencana di menu generator, masuk ke Tab 8 ("Cetak Rapor"), klik tombol "Generate Narasi Otomatis Siswa" dan Simpan Dokumen terlebih dahulu.</p>
        </div>
      `;
    } else {
      mainContent = doc.pelaporan_hasil.map((rep, idx) => `
        <div class="${idx > 0 ? 'page-break' : ''}" style="max-width: 800px; margin: 0 auto 40px auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); font-size: 12px;">
          ${kopHTML}
          
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="font-size: 15px; font-weight: bold; text-decoration: underline; text-transform: uppercase; margin: 0;">RAPOR PROYEK KOKURIKULER</h2>
            <p style="font-size: 10px; font-weight: bold; color: #4b5563; text-transform: uppercase; margin: 4px 0 0 0; letter-spacing: 0.5px;">
              Kurikulum Berbasis Cinta (KBC) & Panca Cinta Madrasah
            </p>
          </div>

          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <p style="margin: 0;"><strong>Nama Murid:</strong> <span style="text-decoration: underline; font-weight: bold;">${rep.nama_murid}</span></p>
              <p style="margin: 0;"><strong>Madrasah:</strong> ${madr?.nama_madrasah || '-'}</p>
              <p style="margin: 0;"><strong>Jenjang / Fase:</strong> ${doc.jenjang || '-'} / Fase ${doc.kelas_fase || '-'}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <p style="margin: 0;"><strong>Tahun Pelajaran:</strong> ${doc.tahun_pelajaran || '-'}</p>
              <p style="margin: 0;"><strong>Semester:</strong> ${doc.semester || '-'}</p>
              <p style="margin: 0;"><strong>Koordinator Proyek:</strong> ${doc.guru_koordinator || '-'}</p>
            </div>
          </div>

          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 24px; background-color: white; display: flex; flex-direction: column; gap: 4px;">
            <p style="margin: 0;"><strong>Tema Proyek:</strong> ${doc.tema_kegiatan || '-'} ${doc.subtema ? `— ${doc.subtema}` : ''}</p>
            <p style="margin: 0;"><strong>Judul Proyek:</strong> ${doc.nama_kegiatan || '-'}</p>
            <p style="margin: 0;"><strong>Alokasi Waktu:</strong> ${doc.alokasi_waktu || '-'}</p>
            <p style="margin: 0;"><strong>Hasil Akhir Karya:</strong> <span style="text-decoration: underline; font-weight: bold; color: #4f46e5;">${doc.produk_hasil || 'N/A'}</span></p>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px;">Narasi Deskripsi Capaian Karakter Siswa</h3>
            <div class="serif-font" style="padding: 16px; border: 1px solid #000; border-radius: 8px; line-height: 1.6; text-align: justify; white-space: pre-wrap; min-height: 120px; background-color: #fafafa; font-size: 12px;">
              ${rep.deskripsi || 'Siswa menunjukkan antusiasme yang luar biasa dan akhlak mulia sepanjang rangkaian proyek kokurikuler ini.'}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background-color: #fafafa;">
              <strong style="display: block; font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 6px;">Dimensi Karakter Dibentuk:</strong>
              <ul style="margin: 0; padding-left: 20px;">
                ${doc.dimensi_profil_lulusan?.map(dim => `<li style="margin-bottom: 2px;">${dim}</li>`).join('') || '<li>-</li>'}
              </ul>
            </div>
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background-color: #fafafa;">
              <strong style="display: block; font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 6px;">Pilar Panca Cinta Terkait:</strong>
              <ul style="margin: 0; padding-left: 20px;">
                ${doc.topik_panca_cinta?.map(pc => `<li style="margin-bottom: 2px;">${pc}</li>`).join('') || '<li>-</li>'}
              </ul>
            </div>
          </div>

          <div style="margin-top: 48px; border-top: 1px dashed #ccc; padding-top: 24px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; gap: 16px;">
              <div>
                <p style="margin: 0 0 48px 0;">Mengetahui,<br/><strong>Orang Tua / Wali Siswa</strong></p>
                <p style="margin: 0; text-decoration: underline; font-weight: bold; color: #d1d5db;">_____________________</p>
              </div>
              <div>
                <p style="margin: 0 0 48px 0;">Mengetahui,<br/><strong>Koordinator Proyek</strong></p>
                <p style="margin: 0; text-decoration: underline; font-weight: bold;">${doc.guru_koordinator || '-'}</p>
                <p style="margin: 2px 0 0 0; font-size: 10px; color: #6b7280;">NIP/NUPTK: 198402122008101004</p>
              </div>
              <div>
                <p style="margin: 0 0 48px 0;">Disahkan Oleh,<br/><strong>Kepala Madrasah</strong></p>
                <p style="margin: 0; text-decoration: underline; font-weight: bold;">${madr ? madr.kepala_madrasah : 'Drs. H. Mahrus, M.Ag.'}</p>
                <p style="margin: 2px 0 0 0; font-size: 10px; color: #6b7280;">NIP: ${madr && madr.nip_kepala ? madr.nip_kepala : '196901052001121001'}</p>
              </div>
            </div>
          </div>

        </div>
      `).join('');
    }
  } else {
    mainContent = `
      <div style="max-width: 900px; margin: 0 auto; padding: 40px; border: 1px solid #e5e7eb; border-radius: 12px; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); font-size: 12px;">
        ${kopHTML}

        <div style="text-align: center; margin-bottom: 32px;">
          <h2 style="font-size: 15px; font-weight: bold; text-decoration: underline; text-transform: uppercase; margin: 0;">RENCANA PROYEK KOKURIKULER MADRASAH (RPKM)</h2>
          <p style="font-size: 11px; font-weight: 600; color: #4b5563; margin: 4px 0 0 0;">
            Tahun Pelajaran: ${doc.tahun_pelajaran || '-'} | Semester: ${doc.semester || '-'}
          </p>
        </div>

        <div class="avoid-break" style="margin-bottom: 24px;">
          <h3 style="font-size: 12px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; text-transform: uppercase; margin-bottom: 12px;">I. Identitas Program & Kegiatan</h3>
          <table class="no-border-table" style="width: 100%; text-align: left; font-size: 12px;">
            <tbody>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 6px 0; font-weight: bold; width: 35%;">1. Nama / Judul Proyek</td>
                <td style="padding: 6px 0;">: ${doc.nama_kegiatan || '-'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 6px 0; font-weight: bold;">2. Jenjang / Kelas / Fase</td>
                <td style="padding: 6px 0;">: ${doc.jenjang || '-'} / Kelas ${doc.kelas_fase || '-'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 6px 0; font-weight: bold;">3. Tema Kokurikuler</td>
                <td style="padding: 6px 0;">: ${doc.tema_kegiatan || '-'} ${doc.subtema ? `(${doc.subtema})` : ''}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 6px 0; font-weight: bold;">4. Jenis Kokurikuler</td>
                <td style="padding: 6px 0;">: ${doc.jenis_kokurikuler || '-'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 6px 0; font-weight: bold;">5. Alokasi Waktu & Lokasi</td>
                <td style="padding: 6px 0;">: ${doc.alokasi_waktu || '-'} | Lokasi: ${doc.lokasi_kegiatan || '-'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 6px 0; font-weight: bold;">6. Koordinator & Muatan Mapel</td>
                <td style="padding: 6px 0;">: ${doc.guru_koordinator || '-'} | Mapel Terintegrasi: ${doc.mata_pelajaran_muatan || '-'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 6px 0; font-weight: bold;">7. Jumlah Sasaran Murid</td>
                <td style="padding: 6px 0;">: ${doc.jumlah_murid || '0'} Murid</td>
              </tr>
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 6px 0; font-weight: bold;">8. Produk Hasil Akhir</td>
                <td style="padding: 6px 0;">: ${doc.produk_hasil || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="avoid-break" style="margin-bottom: 24px;">
          <h3 style="font-size: 12px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; text-transform: uppercase; margin-bottom: 8px;">II. Analisis Kebutuhan Diagnostik Madrasah</h3>
          <p style="text-align: justify; line-height: 1.6; margin: 0;">
            ${doc.analisis_kebutuhan || 'Analisis diagnostik belum diisi.'}
          </p>
        </div>

        <div class="avoid-break" style="margin-bottom: 24px;">
          <h3 style="font-size: 12px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; text-transform: uppercase; margin-bottom: 12px;">III. Landasan Karakter & Kurikulum Berbasis Cinta (KBC)</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;">
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background-color: #fafafa;">
              <strong style="display: block; margin-bottom: 6px; color: #374151;">Dimensi Karakter Terpilih:</strong>
              <ul style="margin: 0; padding-left: 20px;">
                ${doc.dimensi_profil_lulusan?.map(dim => `<li style="margin-bottom: 2px;">${dim}</li>`).join('') || '<li>-</li>'}
              </ul>
            </div>
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background-color: #fafafa;">
              <strong style="display: block; margin-bottom: 6px; color: #374151;">Pilar Panca Cinta:</strong>
              <ul style="margin: 0; padding-left: 20px;">
                ${doc.topik_panca_cinta?.map(ct => `<li style="margin-bottom: 2px;">${ct}</li>`).join('') || '<li>-</li>'}
              </ul>
            </div>
          </div>
          <div>
            <strong style="display: block; margin-bottom: 6px; color: #374151;">Kutipan Hadis / Ayat / Nilai Adab Terintegrasi:</strong>
            <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
              ${doc.materi_integrasi_kbc?.map(mat => `<li style="margin-bottom: 4px;">${mat}</li>`).join('') || '<li>-</li>'}
            </ol>
          </div>
        </div>

        <div class="avoid-break" style="margin-bottom: 24px;">
          <h3 style="font-size: 12px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; text-transform: uppercase; margin-bottom: 8px;">IV. Rumusan Tujuan Pembelajaran Kokurikuler</h3>
          <ol style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.6; text-align: justify;">
            ${doc.tujuan_pembelajaran?.map(g => `<li style="margin-bottom: 4px;">${g}</li>`).join('') || '<li>-</li>'}
          </ol>
        </div>

        <div class="avoid-break" style="margin-bottom: 24px;">
          <h3 style="font-size: 12px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; text-transform: uppercase; margin-bottom: 12px;">V. Metode Pedagogis & Kemitraan</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <p style="margin: 0;"><strong>Metode Pedagogis:</strong> ${doc.praktik_pedagogis?.join(', ') || '-'}</p>
              <p style="margin: 0;"><strong>Lingkungan Belajar:</strong> ${doc.lingkungan_pembelajaran?.join(', ') || '-'}</p>
              <p style="margin: 0;"><strong>Pemanfaatan Teknologi:</strong> ${doc.teknologi_digital?.join(', ') || '-'}</p>
            </div>
            <div style="border-left: 1px solid #e5e7eb; padding-left: 16px; display: flex; flex-direction: column; gap: 4px;">
              <p style="margin: 0;"><strong>Peran Madrasah:</strong> ${doc.kemitraan_pembelajaran?.madrasah || '-'}</p>
              <p style="margin: 0;"><strong>Peran Keluarga:</strong> ${doc.kemitraan_pembelajaran?.keluarga || '-'}</p>
              <p style="margin: 0;"><strong>Peran Masyarakat:</strong> ${doc.kemitraan_pembelajaran?.masyarakat || '-'}</p>
              <p style="margin: 0;"><strong>Peran Media:</strong> ${doc.kemitraan_pembelajaran?.media || '-'}</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 12px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; text-transform: uppercase; margin-bottom: 12px;">VI. Alur Implementasi Modul</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; text-align: left; font-size: 11px;">
            <thead>
              <tr style="background-color: #f9fafb; text-transform: uppercase; font-weight: bold; border-bottom: 1.5px solid #e5e7eb;">
                <th style="padding: 8px; border: 1px solid #e5e7eb; width: 20%;">Tahapan</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb;">Aktivitas Guru & Murid</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; width: 15%;">Waktu & Bukti</th>
              </tr>
            </thead>
            <tbody>
              ${doc.alur_kegiatan?.map(row => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background-color: #fafafa;">${row.tahap}</td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb; line-height: 1.5;">
                    <p style="margin: 0 0 4px 0;"><strong>Guru:</strong> ${row.aktivitas_guru}</p>
                    <p style="margin: 0 0 4px 0;"><strong>Murid:</strong> ${row.aktivitas_murid}</p>
                    <p style="margin: 0; color: #991b1b;"><em>Adab KBC: ${row.nilai_kbc}</em></p>
                  </td>
                  <td style="padding: 8px; border: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 4px 0;">${row.alokasi_waktu}</p>
                    <p style="margin: 0; color: #6b7280;">${row.bukti}</p>
                  </td>
                </tr>
              `).join('') || '<tr><td colspan="3" style="padding: 8px; text-align: center;">Tidak ada alur kegiatan.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="avoid-break" style="margin-bottom: 24px;">
          <h3 style="font-size: 12px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; text-transform: uppercase; margin-bottom: 12px;">VII. Rencana Asesmen Pembelajaran</h3>
          <p style="line-height: 1.6; margin: 0 0 12px 0;">
            <strong>Asesmen Formatif:</strong> ${doc.asesmen?.formatif || '-'}<br />
            <strong>Asesmen Sumatif:</strong> ${doc.asesmen?.sumatif || '-'}<br />
            <strong>Teknik Asesmen:</strong> ${doc.asesmen?.teknik?.join(', ') || '-'}
          </p>
          <strong style="display: block; margin-bottom: 8px; font-size: 11px;">Kriteria Rubrik Asesmen:</strong>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${doc.rubrik?.map(rub => `
              <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; background-color: #fafafa;">
                <p style="margin: 0 0 6px 0; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px;">${rub.dimensi}</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; font-size: 10px; line-height: 1.4;">
                  <p style="margin: 0;"><strong>SB:</strong> ${rub.sb}</p>
                  <p style="margin: 0;"><strong>B:</strong> ${rub.b}</p>
                  <p style="margin: 0;"><strong>C:</strong> ${rub.c}</p>
                  <p style="margin: 0;"><strong>K:</strong> ${rub.k}</p>
                </div>
              </div>
            `).join('') || '<p style="margin: 0;">Tidak ada rubrik.</p>'}
          </div>
        </div>

        <div class="avoid-break" style="margin-bottom: 32px;">
          <h3 style="font-size: 12px; font-weight: bold; border-bottom: 1.5px solid #000; padding-bottom: 4px; text-transform: uppercase; margin-bottom: 12px; color: #0f172a;">VIII. Evaluasi & Rencana Tindak Lanjut (RTL)</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11px; line-height: 1.5;">
            
            <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; background-color: #ffffff; display: flex; flex-direction: column;">
              <div style="font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
                1. Tingkat Ketercapaian Target Karakter
              </div>
              <div style="font-size: 10.5px; flex: 1;">
                ${formatEvaluasiListHtml(doc.evaluasi_tindak_lanjut?.ketercapaian_tujuan)}
              </div>
            </div>

            <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; background-color: #ffffff; display: flex; flex-direction: column;">
              <div style="font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
                4. Solusi & Langkah Perbaikan
              </div>
              <div style="font-size: 10.5px; flex: 1;">
                ${formatEvaluasiListHtml(doc.evaluasi_tindak_lanjut?.solusi)}
              </div>
            </div>

            <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; background-color: #ffffff; display: flex; flex-direction: column;">
              <div style="font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
                2. Faktor Pendukung Keberhasilan
              </div>
              <div style="font-size: 10.5px; flex: 1;">
                ${formatEvaluasiListHtml(doc.evaluasi_tindak_lanjut?.faktor_pendukung)}
              </div>
            </div>

            <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; background-color: #ffffff; display: flex; flex-direction: column;">
              <div style="font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
                5. Dampak Karakter & Madrasah
              </div>
              <div style="font-size: 10.5px; flex: 1;">
                ${formatEvaluasiListHtml(
                  (doc.evaluasi_tindak_lanjut?.dampak_murid || '') + 
                  (doc.evaluasi_tindak_lanjut?.dampak_madrasah ? '\n' + doc.evaluasi_tindak_lanjut.dampak_madrasah : '')
                )}
              </div>
            </div>

            <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; background-color: #ffffff; display: flex; flex-direction: column;">
              <div style="font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
                3. Faktor Hambatan & Kendala
              </div>
              <div style="font-size: 10.5px; flex: 1;">
                ${formatEvaluasiListHtml(doc.evaluasi_tindak_lanjut?.hambatan)}
              </div>
            </div>

            <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; background-color: #ffffff; display: flex; flex-direction: column;">
              <div style="font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
                6. RTL & Rekomendasi Keberlanjutan
              </div>
              <div style="font-size: 10.5px; flex: 1;">
                ${formatEvaluasiListHtml(doc.evaluasi_tindak_lanjut?.rencana_tindak_lanjut)}
              </div>
            </div>

          </div>
        </div>

        <div class="avoid-break" style="margin-top: 48px; border-top: 1px solid #ccc; padding-top: 24px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; gap: 16px;">
            <div>
              <p style="margin: 0 0 48px 0;">Mengetahui,<br/><strong>Koordinator Kokurikuler</strong></p>
              <p style="margin: 0; text-decoration: underline; font-weight: bold;">${doc.guru_koordinator || '-'}</p>
              <p style="margin: 2px 0 0 0; font-size: 10px; color: #6b7280;">NIP/NUPTK: 198402122008101004</p>
            </div>
            <div>
              <p style="margin: 0 0 48px 0;">Mendukung & Menyetujui,<br/><strong>Pengawas Madrasah Kemenag</strong></p>
              <p style="margin: 0; text-decoration: underline; font-weight: bold;">H. Muhaimin, M.Pd.I.</p>
              <p style="margin: 2px 0 0 0; font-size: 10px; color: #6b7280;">NIP: 197405102002121002</p>
            </div>
            <div>
              <p style="margin: 0 0 48px 0;">Disahkan Oleh,<br/><strong>Kepala Madrasah</strong></p>
              <p style="margin: 0; text-decoration: underline; font-weight: bold;">${madr ? madr.kepala_madrasah : 'Drs. H. Mahrus, M.Ag.'}</p>
              <p style="margin: 2px 0 0 0; font-size: 10px; color: #6b7280;">NIP: ${madr && madr.nip_kepala ? madr.nip_kepala : '196901052001121001'}</p>
            </div>
          </div>
        </div>

        <div style="margin-top: 36px; padding-top: 12px; border-top: 2px solid #0f172a; text-align: center; font-family: sans-serif; font-size: 10px; color: #334155; font-weight: bold;">
          <p style="margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">🔒 DOKUMEN RESMI TERVERIFIKASI SISTEM KOKURIKULER MADRASAH (PKMG)</p>
          <p style="margin: 3px 0 0 0; font-weight: normal; color: #64748b;">
            Lisensi Lembaga Terkunci: <strong>${madr ? madr.nama_madrasah : 'Madrasah'}</strong> (NSM: ${madr ? madr.nsm : '-'}) | Hak Cipta & Keamanan Terjamin
          </p>
        </div>

      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isRapor ? 'Rapor Proyek Kokurikuler' : 'RPKM - Rencana Proyek Kokurikuler'}</title>
      <style>
        ${styles}
      </style>
    </head>
    <body style="background-color: #f3f4f6;">
      <div class="no-print" style="max-width: ${isRapor ? '800px' : '900px'}; margin: 20px auto; padding: 16px; background-color: #ffffff; border-radius: 8px; text-align: center; font-family: sans-serif; font-size: 13px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <p style="margin: 0 0 8px 0; font-weight: bold; color: #047857;">Pratinjau Cetak Mandiri (Offline)</p>
        <p style="margin: 0 0 12px 0; color: #4b5563;">Halaman ini siap dicetak secara mandiri. Gunakan tombol di bawah ini atau tekan <strong>Ctrl + P</strong> (Windows) atau <strong>Cmd + P</strong> (Mac) untuk langsung mencetak atau menyimpan dokumen dalam format PDF secara presisi.</p>
        <button onclick="window.print()" style="background-color: #047857; color: white; font-weight: bold; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: background-color 0.2s;">
          🖨️ Cetak Sekarang / Simpan Sebagai PDF (A4)
        </button>
      </div>
      
      ${isTrial ? `
        <div class="watermark-overlay">
          TRIAL - LISENSI BELUM DIAKTIFKAN
          <span class="watermark-sub">Beli Kode Aktivasi Full Rp 100.000,- (Subariyanto - 082330647698)</span>
        </div>
      ` : ''}
      ${mainContent}
    </body>
    </html>
  `;
}

export default function PreviewCetakView({ docId, user, onBack, onNavigate }: PreviewCetakViewProps) {
  const [doc, setDoc] = useState<PerencanaanKokurikuler | null>(null);
  const [docList, setDocList] = useState<PerencanaanKokurikuler[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(docId || null);
  const [madr, setMadr] = useState<Madrasah | null>(null);
  const [loading, setLoading] = useState(true);
  const [printType, setPrintType] = useState<'rpkm' | 'rapor'>('rpkm');
  
  const [isIframe, setIsIframe] = useState(false);
  const [showIframeWarning, setShowIframeWarning] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const inIframe = window.self !== window.top;
      setIsIframe(inIframe);
      setShowIframeWarning(false);
    } catch (e) {
      setIsIframe(true);
      setShowIframeWarning(false);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [allDocs, foundSch] = await Promise.all([
          db.perencanaanKokurikuler.list(),
          db.madrasah.getFirst()
        ]);
        setDocList(allDocs);
        setMadr(foundSch);

        const targetId = docId || selectedDocId;
        if (targetId) {
          const found = allDocs.find(d => d.id === targetId);
          if (found) {
            setDoc(found);
            setSelectedDocId(found.id);
          } else if (allDocs.length > 0) {
            setDoc(allDocs[0]);
            setSelectedDocId(allDocs[0].id);
          } else {
            setDoc(null);
          }
        } else if (allDocs.length > 0) {
          setDoc(allDocs[0]);
          setSelectedDocId(allDocs[0].id);
        } else {
          setDoc(null);
        }
      } catch (e) {
        console.error('Failed to load data for printing:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [docId]);

  const handleSelectDoc = (id: string) => {
    setSelectedDocId(id);
    const found = docList.find(d => d.id === id);
    if (found) {
      setDoc(found);
    }
  };

  const handleOpenNewTabPrint = () => {
    if (!doc) return;
    try {
      const htmlContent = generatePrintableHTML(doc, madr, printType, isTrialUser(user));
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          try {
            printWindow.print();
          } catch (err) {
            console.error('Print window error:', err);
          }
        }, 500);
      } else {
        // Popup blocked: fallback to downloading standalone HTML file
        handleDownloadHTML();
      }
    } catch (e) {
      console.error('Open print tab failed:', e);
      handleDownloadHTML();
    }
  };

  const handlePrint = () => {
    try {
      setPrintError(null);
      if (!doc) return;

      // Check if running inside iframe or desktop container where window.print() might be restricted
      const isInIframe = window.self !== window.top;
      if (isInIframe) {
        // In iframe environment (e.g. AI Studio preview), opening a new window ensures Chrome/Edge prints full A4 document
        handleOpenNewTabPrint();
      } else {
        window.print();
      }
    } catch (e: any) {
      console.error('Print failed:', e);
      handleOpenNewTabPrint();
    }
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    if (!doc) return;
    setIsDownloadingPdf(true);
    setPrintError(null);

    try {
      const safeTitle = (doc.nama_kegiatan || 'kegiatan').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const pdfFilename = printType === 'rpkm' 
        ? `RPKM_${safeTitle}.pdf` 
        : `Rapor_Siswa_${safeTitle}.pdf`;

      // Generate pure HTML string with complete inline styles
      const htmlContent = generatePrintableHTML(doc, madr, printType, isTrialUser(user));

      // Create a temporary off-screen container for crisp html2canvas capture without scroll offsets
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm'; // Fixed A4 width
      tempContainer.style.backgroundColor = '#ffffff';
      tempContainer.style.color = '#000000';
      tempContainer.style.zIndex = '-99999';
      tempContainer.innerHTML = htmlContent;

      // Remove no-print UI elements from the PDF render
      const noPrints = tempContainer.querySelectorAll('.no-print');
      noPrints.forEach(el => el.remove());

      document.body.appendChild(tempContainer);

      const opt = {
        margin: [8, 8, 8, 8],
        filename: pdfFilename,
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

      // Dynamically import html2pdf.js
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
      console.error('PDF Generation error:', e);
      // Fallback: Open print tab
      handleOpenNewTabPrint();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadHTML = () => {
    if (!doc) return;
    try {
      const htmlContent = generatePrintableHTML(doc, madr, printType);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeTitle = (doc.nama_kegiatan || 'kegiatan').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = printType === 'rpkm' 
        ? `RPKM_${safeTitle}.html` 
        : `Rapor_Siswa_${safeTitle}.html`;
        
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download HTML failed:', e);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500 text-xs">Menyiapkan cetakan dokumen...</div>;
  }

  if (!doc) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4 my-8 shadow-sm">
        <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-600">
          <Printer className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-800">Belum Ada Dokumen RPKM</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Belum ada Rencana Projek Kokurikuler (RPKM) yang tersimpan. Silakan rancang/buat RPKM terlebih dahulu melalui Generator Perencanaan.
        </p>
        <div className="pt-2 flex justify-center space-x-3">
          <button
            onClick={onBack}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
          >
            Kembali ke Arsip
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate('generator')}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              + Buat RPKM Baru
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="preview-cetak-view">
      {/* Warning Banner for iFrames / Print restrictions */}
      {showIframeWarning && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-slate-800 text-xs flex items-start space-x-3 shadow-md print:hidden">
          <AlertCircle className="w-5.5 h-5.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-bold text-amber-900 text-sm">💡 Panduan Cetak PDF / A4 (Mengatasi Blokir Browser di Pratinjau)</h4>
            <p className="leading-relaxed">
              Karena aplikasi ini dijalankan di dalam <strong>Bingkai Pratinjau (iFrame AI Studio)</strong>, browser memblokir perintah cetak langsung secara otomatis demi alasan keamanan.
            </p>
            <div className="bg-white/80 p-3 rounded-lg border border-amber-100 space-y-2 text-[11px] text-slate-700">
              <p className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">Pilih salah satu cara mudah berikut:</p>
              
              <div className="space-y-1.5">
                <p>
                  <strong className="text-emerald-700 font-bold">Cara 1 (Rekomendasi Instan & Berhasil 100%):</strong><br />
                  Klik tombol hijau <strong className="text-emerald-700">"Unduh pdf"</strong> di kanan atas. Berkas rancangan mandiri yang rapi akan terunduh. Buka berkas tersebut di komputer Anda, lalu tekan <kbd className="px-1 py-0.5 bg-slate-100 border rounded font-mono text-[10px] font-bold">Ctrl + P</kbd> atau <kbd className="px-1 py-0.5 bg-slate-100 border rounded font-mono text-[10px] font-bold">Cmd + P</kbd> untuk mencetak atau menyimpannya sebagai PDF A4 yang presisi.
                </p>
                <p className="pt-1 border-t border-dashed border-slate-200">
                  <strong className="text-indigo-700 font-bold">Cara 2 (Cetak Langsung dari Browser):</strong><br />
                  Klik tombol <span className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-bold inline-flex items-center text-[10px]">Open in new tab <ExternalLink className="w-3 h-3 ml-1" /></span> di sudut kanan atas panel pratinjau Anda untuk membuka aplikasi ini di tab baru secara penuh. Setelah terbuka di tab baru, klik tombol cetak kembali untuk langsung mencetak secara instan.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowIframeWarning(false)}
              className="text-amber-800 hover:text-amber-900 font-bold underline text-[11px] mt-1 block"
            >
              Sembunyikan Panduan Ini
            </button>
          </div>
        </div>
      )}

      {printError && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-slate-800 text-xs flex items-start space-x-3 shadow-sm print:hidden">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-rose-900">Gagal Membuka Jendela Cetak</h4>
            <p className="leading-relaxed">{printError}</p>
          </div>
        </div>
      )}

      {/* Action Toolbar - Hidden in Print */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={onBack}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Document selector dropdown if multiple RPKM docs exist */}
          {docList.length > 0 && (
            <div className="flex items-center space-x-1.5">
              <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider shrink-0">Pilih RPKM:</label>
              <select
                value={doc.id}
                onChange={(e) => handleSelectDoc(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-300 text-slate-800 rounded-lg px-2.5 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-xs truncate"
              >
                {docList.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nama_kegiatan} ({d.jenjang} - {d.tahun_pelajaran})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Print format selector */}
          <div className="bg-slate-100 p-1 rounded-lg flex space-x-1">
            <button
              onClick={() => setPrintType('rpkm')}
              className={`font-bold text-[11px] px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-all ${
                printType === 'rpkm' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1. Cetak RPKM</span>
            </button>
            <button
              onClick={() => setPrintType('rapor')}
              className={`font-bold text-[11px] px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-all ${
                printType === 'rapor' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>2. Cetak Rapor Siswa</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between md:justify-end w-full md:w-auto gap-3 border-t md:border-t-0 pt-3 md:pt-0">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mr-2">
            Status: <span className="text-emerald-700 font-extrabold">{doc.status_dokumen}</span>
          </span>
          
          {/* Download Real PDF File Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloadingPdf}
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            title="Unduh berkas PDF (.pdf) resmi secara langsung"
          >
            {isDownloadingPdf ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                <span>Proses PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 shrink-0" />
                <span>Unduh pdf</span>
              </>
            )}
          </button>

          {/* Open in Clean Print Tab for Desktop Browser */}
          <button
            onClick={handleOpenNewTabPrint}
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 shadow-sm transition-all"
            title="Buka dokumen di tab baru browser untuk pratinjau & cetak A4 presisi"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>Tab Baru (A4)</span>
          </button>

          {/* Standard Browser Print Button */}
          <button
            onClick={handlePrint}
            id="btn-trigger-print"
            type="button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 shadow transition-all"
            title="Cetak langsung menggunakan dialog cetak browser"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>{printType === 'rpkm' ? 'Cetak RPKM (A4)' : 'Cetak Rapor Siswa'}</span>
          </button>
        </div>
      </div>

      {printType === 'rapor' ? (
        /* RAPOR SISWA PRINT TEMPLATE (One card per student, separated by page-break) */
        <div id="printable-document-content" className="space-y-6 print:space-y-0">
          {(!doc.pelaporan_hasil || doc.pelaporan_hasil.length === 0) ? (
            <div className="bg-white p-12 text-center rounded-xl border max-w-4xl mx-auto">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-700 font-bold text-xs">Belum ada baris pelaporan siswa.</p>
              <p className="text-slate-400 text-[11px] mt-1 max-w-md mx-auto leading-relaxed">
                Harap buka Rencana di menu generator, masuk ke Tab 8 ("Cetak Rapor"), klik tombol "Generate Narasi Otomatis Siswa" dan Simpan Dokumen terlebih dahulu.
              </p>
            </div>
          ) : (
            doc.pelaporan_hasil.map((rep, idx) => (
              <div 
                key={idx} 
                className={`bg-white p-8 md:p-12 shadow-sm border rounded-xl max-w-4xl mx-auto text-slate-850 font-serif leading-relaxed text-xs print:shadow-none print:border-none print:p-0 print:max-w-none ${idx > 0 ? 'page-break-before' : ''}`}
              >
                {/* Printable KOP MADRASAH */}
                {madr && (
                  <div className="text-center border-b-[3px] border-double border-black pb-4 mb-6 flex items-center justify-center space-x-4">
                    {madr.logo_url && madr.logo_url.startsWith('data:image') ? (
                      <img 
                        src={madr.logo_url} 
                        alt="Logo Madrasah" 
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 object-contain shrink-0" 
                      />
                    ) : (
                      <div className={`w-16 h-16 border-2 border-black flex items-center justify-center font-bold text-xs shrink-0 rounded-full ${
                        madr.logo_url === 'emerald' ? 'bg-emerald-700 text-white' :
                        madr.logo_url === 'amber' ? 'bg-amber-500 text-white' :
                        madr.logo_url === 'blue' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {madr.nama_madrasah ? madr.nama_madrasah.slice(0, 2) : 'M'}
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-sm font-bold uppercase tracking-wide">YAYASAN PENDIDIKAN ISLAM MADRASAH</h2>
                      <h1 className="text-base font-extrabold uppercase">{madr.nama_madrasah}</h1>
                      <p className="font-sans text-[10px] text-slate-600 mt-0.5">
                        Alamat: {madr.alamat} | NSM: {madr.nsm} | NPSN: {madr.npsn}
                      </p>
                      <p className="font-sans text-[10px] text-slate-500">
                        Kabupaten / Kota: {madr.kabupaten_kota} | Prov: {madr.provinsi}
                      </p>
                    </div>
                  </div>
                )}

                {/* Title */}
                <div className="text-center space-y-1 mb-6">
                  <h2 className="text-sm font-bold uppercase underline">RAPOR PROYEK KOKURIKULER</h2>
                  <p className="font-sans text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Kurikulum Berbasis Cinta (KBC) & Panca Cinta Madrasah
                  </p>
                </div>

                {/* Identity table */}
                <div className="mb-6 font-sans border p-4 rounded-lg bg-slate-50/40 print:bg-transparent print:p-0 print:border-none">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="space-y-1">
                      <p><strong>Nama Murid:</strong> <span className="underline font-bold text-slate-900">{rep.nama_murid}</span></p>
                      <p><strong>Madrasah:</strong> {madr?.nama_madrasah || '-'}</p>
                      <p><strong>Jenjang / Fase:</strong> {doc.jenjang} / Fase {doc.kelas_fase}</p>
                    </div>
                    <div className="space-y-1 md:border-l md:pl-4 print:border-none print:pl-0">
                      <p><strong>Tahun Pelajaran:</strong> {doc.tahun_pelajaran}</p>
                      <p><strong>Semester:</strong> {doc.semester}</p>
                      <p><strong>Koordinator Proyek:</strong> {doc.guru_koordinator}</p>
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                <div className="space-y-4 font-sans text-[11px] leading-relaxed">
                  <div className="border border-slate-200 p-3 rounded bg-white">
                    <p><strong>Tema Proyek:</strong> {doc.tema_kegiatan} {doc.subtema ? `— ${doc.subtema}` : ''}</p>
                    <p className="mt-1"><strong>Judul Proyek:</strong> {doc.nama_kegiatan}</p>
                    <p className="mt-1"><strong>Alokasi Waktu:</strong> {doc.alokasi_waktu}</p>
                    <p className="mt-1"><strong>Hasil Akhir Karya:</strong> <span className="underline font-bold text-indigo-700">{doc.produk_hasil || 'N/A'}</span></p>
                  </div>

                  <div className="space-y-2 mt-4">
                    <h3 className="font-bold uppercase tracking-wider text-slate-800 text-xs border-b pb-1">Narasi Deskripsi Capaian Karakter Siswa</h3>
                    <div className="p-4 border border-black/80 rounded bg-slate-50/20 font-serif text-slate-850 text-[11px] leading-relaxed text-justify whitespace-pre-wrap min-h-36">
                      {rep.deskripsi || 'Siswa menunjukkan antusiasme yang luar biasa dan akhlak mulia sepanjang rangkaian proyek kokurikuler ini. Mampu bekerja sama dengan harmonis di dalam tim fasilitator, mengamalkan pilar adab terhadap sesama murid serta mengomunikasikan ide-ide kreatifnya secara santun.'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="border p-2.5 rounded bg-slate-50/30">
                      <strong className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Dimensi Karakter Dibentuk:</strong>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                        {doc.dimensi_profil_lulusan?.map((dim, i) => <li key={i}>{dim}</li>)}
                      </ul>
                    </div>
                    <div className="border p-2.5 rounded bg-slate-50/30">
                      <strong className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Pilar Panca Cinta Terkait:</strong>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                        {doc.topik_panca_cinta?.map((pc, i) => <li key={i}>{pc}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* SIGNATURES */}
                <div className="mt-14 pt-6 border-t border-dashed font-sans text-[11px] text-slate-800">
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div className="space-y-12">
                      <p>Mengetahui,<br /><strong>Orang Tua / Wali Siswa</strong></p>
                      <div className="pt-2">
                        <p className="font-bold underline text-slate-300">_____________________</p>
                      </div>
                    </div>
                    
                    <div className="space-y-12">
                      <p>Mengetahui,<br /><strong>Koordinator Proyek</strong></p>
                      <div className="pt-2">
                        <p className="font-bold underline">{doc.guru_koordinator}</p>
                        <p className="text-[10px] text-slate-500">NIP/NUPTK: 198402122008101004</p>
                      </div>
                    </div>

                    <div className="space-y-12">
                      <p>Disahkan Oleh,<br /><strong>Kepala Madrasah</strong></p>
                      <div className="pt-2">
                        <p className="font-bold underline">
                          {madr ? madr.kepala_madrasah : 'Drs. H. Mahrus, M.Ag.'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {madr && madr.nip_kepala ? `NIP: ${madr.nip_kepala}` : 'NIP: 196901052001121001'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      ) : (
        /* RPKM DOCUMENT CANVAS (I-VIII) */
        <div id="printable-document-content" className="bg-white p-8 md:p-12 shadow-md border rounded-xl max-w-4xl mx-auto text-slate-850 font-serif leading-relaxed text-xs print:shadow-none print:border-none print:p-0 print:max-w-none relative">
          
          {/* Printable KOP MADRASAH */}
          {madr && (
            <div className="text-center border-b-[3px] border-double border-black pb-4 mb-6 flex items-center justify-center space-x-4">
              {madr.logo_url && madr.logo_url.startsWith('data:image') ? (
                <img 
                  src={madr.logo_url} 
                  alt="Logo Madrasah" 
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 object-contain shrink-0" 
                />
              ) : (
                <div className={`w-16 h-16 border-2 border-black flex items-center justify-center font-bold text-xs shrink-0 rounded-full ${
                  madr.logo_url === 'emerald' ? 'bg-emerald-700 text-white' :
                  madr.logo_url === 'amber' ? 'bg-amber-500 text-white' :
                  madr.logo_url === 'blue' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}>
                  {madr.nama_madrasah ? madr.nama_madrasah.slice(0, 2) : 'M'}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-sm font-bold uppercase tracking-wide">YAYASAN PENDIDIKAN ISLAM MADRASAH</h2>
                <h1 className="text-base font-extrabold uppercase">{madr.nama_madrasah}</h1>
                <p className="font-sans text-[10px] text-slate-600 mt-0.5">
                  Alamat: {madr.alamat} | NSM: {madr.nsm} | NPSN: {madr.npsn}
                </p>
                <p className="font-sans text-[10px] text-slate-500">
                  Kabupaten / Kota: {madr.kabupaten_kota} | Prov: {madr.provinsi}
                </p>
              </div>
            </div>
          )}

          {/* Document Title */}
          <div className="text-center space-y-1 mb-8">
            <h2 className="text-sm font-bold uppercase underline">RENCANA PROYEK KOKURIKULER MADRASAH (RPKM)</h2>
            <p className="font-sans text-[11px] font-semibold text-slate-600">
              Tahun Pelajaran: {doc.tahun_pelajaran} | Semester: {doc.semester}
            </p>
          </div>

          {/* Section 1: IDENTITAS */}
          <div className="space-y-3 mb-6 avoid-break">
            <h3 className="font-bold border-b border-black pb-1 uppercase font-sans text-xs">I. Identitas Program & Kegiatan</h3>
            <table className="w-full text-xs font-sans text-left border-collapse">
              <tbody>
                <tr className="border-b">
                  <td className="py-1.5 font-bold w-1/3">1. Nama / Judul Proyek</td>
                  <td className="py-1.5">: {doc.nama_kegiatan}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 font-bold">2. Jenjang / Kelas / Fase</td>
                  <td className="py-1.5">: {doc.jenjang} / Kelas {doc.kelas_fase}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 font-bold">3. Tema Kokurikuler</td>
                  <td className="py-1.5">: {doc.tema_kegiatan} {doc.subtema ? `(${doc.subtema})` : ''}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 font-bold">4. Jenis Kokurikuler</td>
                  <td className="py-1.5">: {doc.jenis_kokurikuler}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 font-bold">5. Alokasi Waktu & Lokasi</td>
                  <td className="py-1.5">: {doc.alokasi_waktu} | Lokasi: {doc.lokasi_kegiatan}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 font-bold">6. Koordinator & Muatan Mapel</td>
                  <td className="py-1.5">: {doc.guru_koordinator} | Mapel Terintegrasi: {doc.mata_pelajaran_muatan}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 font-bold">7. Jumlah Sasaran Murid</td>
                  <td className="py-1.5">: {doc.jumlah_murid} Murid</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5 font-bold">8. Produk Hasil Akhir</td>
                  <td className="py-1.5">: {doc.produk_hasil || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: ANALISIS KEBUTUHAN */}
          <div className="space-y-3 mb-6 avoid-break">
            <h3 className="font-bold border-b border-black pb-1 uppercase font-sans text-xs">II. Analisis Kebutuhan Diagnostik Madrasah</h3>
            <p className="text-justify font-sans text-xs leading-relaxed">
              {doc.analisis_kebutuhan || 'Analisis diagnostik belum diisi.'}
            </p>
          </div>

          {/* Section 3: LANDASAN KARAKTER & KBC */}
          <div className="space-y-3 mb-6 avoid-break">
            <h3 className="font-bold border-b border-black pb-1 uppercase font-sans text-xs">III. Landasan Karakter & Kurikulum Berbasis Cinta (KBC)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
              <div className="border p-3 rounded bg-slate-50/50">
                <span className="font-bold block text-slate-800 mb-1">Dimensi Karakter Terpilih:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                  {doc.dimensi_profil_lulusan?.map((dim, i) => (
                    <li key={i}>{dim}</li>
                  ))}
                </ul>
              </div>
              <div className="border p-3 rounded bg-slate-50/50">
                <span className="font-bold block text-slate-800 mb-1">Pilar Panca Cinta:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                  {doc.topik_panca_cinta?.map((ct, i) => (
                    <li key={i}>{ct}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-3 font-sans text-xs">
              <span className="font-bold block text-slate-800 mb-1">Kutipan Hadis / Ayat / Nilai Adab Terintegrasi:</span>
              <ul className="list-decimal pl-4 space-y-1 text-slate-600">
                {doc.materi_integrasi_kbc?.map((mat, i) => (
                  <li key={i}>{mat}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 4: TUJUAN PEMBELAJARAN */}
          <div className="space-y-3 mb-6 avoid-break">
            <h3 className="font-bold border-b border-black pb-1 uppercase font-sans text-xs">IV. Rumusan Tujuan Pembelajaran Kokurikuler</h3>
            <ul className="list-decimal pl-5 space-y-1 font-sans text-xs text-slate-700">
              {doc.tujuan_pembelajaran?.map((g, i) => (
                <li key={i} className="text-justify">{g}</li>
              ))}
            </ul>
          </div>

          {/* Section 5: METODE & KEMITRAAN */}
          <div className="space-y-3 mb-6 avoid-break">
            <h3 className="font-bold border-b border-black pb-1 uppercase font-sans text-xs">V. Metode Pedagogis & Kemitraan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-[11px] text-slate-700">
              <div className="space-y-1">
                <p><strong>Metode Pedagogis:</strong> {doc.praktik_pedagogis?.join(', ')}</p>
                <p><strong>Lingkungan Belajar:</strong> {doc.lingkungan_pembelajaran?.join(', ')}</p>
                <p><strong>Pemanfaatan Teknologi:</strong> {doc.teknologi_digital?.join(', ')}</p>
              </div>
              <div className="space-y-1 border-l pl-3">
                <p><strong>Peran Madrasah:</strong> {doc.kemitraan_pembelajaran?.madrasah || '-'}</p>
                <p><strong>Peran Keluarga:</strong> {doc.kemitraan_pembelajaran?.keluarga || '-'}</p>
                <p><strong>Peran Masyarakat:</strong> {doc.kemitraan_pembelajaran?.masyarakat || '-'}</p>
                <p><strong>Peran Media:</strong> {doc.kemitraan_pembelajaran?.media || '-'}</p>
              </div>
            </div>
          </div>

          {/* Section 6: ALUR KEGIATAN */}
          <div className="space-y-3 mb-6">
            <h3 className="font-bold border-b border-black pb-1 uppercase font-sans text-xs">VI. Alur Implementasi Modul</h3>
            <table className="w-full border-collapse border text-left font-sans text-[10px] text-slate-700">
              <thead>
                <tr className="bg-slate-50 uppercase font-bold border-b">
                  <th className="p-2 border w-1/5">Tahapan</th>
                  <th className="p-2 border">Aktivitas Guru & Murid</th>
                  <th className="p-2 border w-1/6">Waktu & Bukti</th>
                </tr>
              </thead>
              <tbody>
                {doc.alur_kegiatan?.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2 border font-bold bg-slate-50/40">{row.tahap}</td>
                    <td className="p-2 border leading-relaxed">
                      <p><strong>Guru:</strong> {row.aktivitas_guru}</p>
                      <p className="mt-1"><strong>Murid:</strong> {row.aktivitas_murid}</p>
                      <p className="mt-1 text-[9px] text-rose-800"><em>Adab KBC: {row.nilai_kbc}</em></p>
                    </td>
                    <td className="p-2 border">
                      <p>{row.alokasi_waktu}</p>
                      <p className="mt-1 text-[9px] text-slate-500">{row.bukti}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 7: ASESMEN & RUBRIK */}
          <div className="space-y-3 mb-6 avoid-break">
            <h3 className="font-bold border-b border-black pb-1 uppercase font-sans text-xs">VII. Rencana Asesmen Pembelajaran</h3>
            <p className="font-sans text-[11px] leading-relaxed">
              <strong>Asesmen Formatif:</strong> {doc.asesmen?.formatif || '-'}<br />
              <strong>Asesmen Sumatif:</strong> {doc.asesmen?.sumatif || '-'}<br />
              <strong>Teknik Asesmen:</strong> {doc.asesmen?.teknik?.join(', ') || '-'}
            </p>

            <h4 className="font-bold mt-3 font-sans text-[11px]">Kriteria Rubrik Asesmen:</h4>
            <div className="space-y-3 font-sans text-[10px] text-slate-700">
              {doc.rubrik?.map((rub, i) => (
                <div key={i} className="border p-2.5 rounded bg-slate-50/30">
                  <p className="font-bold text-slate-800 border-b pb-0.5 mb-1">{rub.dimensi}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 leading-relaxed">
                    <p><strong>SB:</strong> {rub.sb}</p>
                    <p><strong>B:</strong> {rub.b}</p>
                    <p><strong>C:</strong> {rub.c}</p>
                    <p><strong>K:</strong> {rub.k}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 8: EVALUASI & RTL */}
          <div className="space-y-3 mb-10 avoid-break">
            <h3 className="font-bold border-b border-black pb-1 uppercase font-sans text-xs">VIII. Evaluasi & Rencana Tindak Lanjut (RTL)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-[10px] text-slate-700 leading-relaxed">
              <div>
                <p><strong>1. Tingkat Ketercapaian:</strong> {doc.evaluasi_tindak_lanjut?.ketercapaian_tujuan || 'Belum diisi.'}</p>
                <p className="mt-1"><strong>2. Faktor Pendukung:</strong> {doc.evaluasi_tindak_lanjut?.faktor_pendukung || '-'}</p>
                <p className="mt-1"><strong>3. Hambatan:</strong> {doc.evaluasi_tindak_lanjut?.hambatan || '-'}</p>
              </div>
              <div className="border-l pl-3">
                <p><strong>4. Solusi:</strong> {doc.evaluasi_tindak_lanjut?.solusi || '-'}</p>
                <p className="mt-1"><strong>5. Dampak Karakter:</strong> {doc.evaluasi_tindak_lanjut?.dampak_murid || '-'}</p>
                <p className="mt-1"><strong>6. RTL & Rekomendasi:</strong> {doc.evaluasi_tindak_lanjut?.rencana_tindak_lanjut || '-'}</p>
              </div>
            </div>
          </div>

          {/* SIGNATURE PANEL (SECTION M COMPLIANCE) */}
          <div className="mt-12 pt-6 border-t font-sans text-[11px] text-slate-800 avoid-break">
            <div className="grid grid-cols-3 gap-6 text-center">
              {/* Signature Left: Koordinator */}
              <div className="space-y-12">
                <p>Mengetahui,<br /><strong>Koordinator Kokurikuler</strong></p>
                <div className="pt-2">
                  <p className="font-bold underline">{doc.guru_koordinator}</p>
                  <p className="text-[10px] text-slate-500">NIP/NUPTK: 198402122008101004</p>
                </div>
              </div>

              {/* Signature Middle: Pengawas */}
              <div className="space-y-12">
                <p>Mendukung & Menyetujui,<br /><strong>Pengawas Madrasah Kemenag</strong></p>
                <div className="pt-2">
                  <p className="font-bold underline">H. Muhaimin, M.Pd.I.</p>
                  <p className="text-[10px] text-slate-500">NIP: 197405102002121002</p>
                </div>
              </div>

              {/* Signature Right: Kepala Madrasah */}
              <div className="space-y-12">
                <p>Disahkan Oleh,<br /><strong>Kepala Madrasah</strong></p>
                <div className="pt-2">
                  <p className="font-bold underline">
                    {madr ? madr.kepala_madrasah : 'Drs. H. Mahrus, M.Ag.'}
                  </p>
                  <p className="text-[10px] text-slate-500">NIP: {madr && madr.nip_kepala ? madr.nip_kepala : '196901052001121001'}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
