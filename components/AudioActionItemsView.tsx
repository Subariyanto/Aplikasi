/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  FileAudio, 
  Upload, 
  Mic, 
  MicOff, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  User, 
  AlertCircle, 
  Copy, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Play, 
  Pause, 
  RefreshCw, 
  ArrowRight, 
  Filter, 
  MessageSquare,
  ShieldCheck,
  Zap,
  CheckSquare,
  Square
} from 'lucide-react';
import { Profile } from '../types';

interface ActionItem {
  id: string;
  task: string;
  owner: string;
  party: 'party_a' | 'party_b' | 'joint';
  deadline: string;
  deliverables?: string;
  priority: 'high' | 'medium' | 'low';
  completed?: boolean;
}

interface AnalysisResult {
  callSummary: string;
  overallSentiment?: string;
  partyAName: string;
  partyBName: string;
  actionItems: ActionItem[];
  keyAgreements: string[];
  unresolvedPoints: string[];
}

interface AudioActionItemsViewProps {
  user: Profile | null;
}

// Sample realistic sales call transcripts for 1-click testing
const SAMPLE_SALES_CALLS = [
  {
    id: 'sample-pkm-demo',
    title: 'Sales Call: Implementation Software Perencanaan Kokurikuler',
    description: 'Diskusi deal lisensi software PKM Kemenag antara Subariyanto (Tim Provider) & Drs. H. Mahrus (Kepala Madrasah).',
    transcript: `Subariyanto (Sales/Provider): "Assalamu'alaikum Pak Mahrus, terima kasih waktunya sore ini. Sesuai agenda, kami ingin mempresentasikan sistem Perencanaan Kokurikuler Madrasah (PKM) 2025 sesuai juknis Kemenag."

Drs. H. Mahrus (Kepala Madrasah): "Wa'alaikumussalam Pak Riyanto. Iya, kami di MTs Al-Madinah memang butuh solusi cepat agar penyusunan modul proyek KBC dan jadwal guru berjalan rapi."

Subariyanto: "Baik Pak Mahrus. Dalam sistem ini, pembuatan modul proyek dan rubrik penilaian otomatis di-generate menggunakan AI Kemenag. Harga lisensi tahunan untuk 1 madrasah adalah Rp 3.500.000 termasuk pendampingan guru."

Drs. H. Mahrus: "Harganya masuk akal. Saya setuju dengan angka Rp 3.500.000 tersebut. Tapi saya minta dikirimkan akun trial dahulu untuk 3 hari agar Koordinator Kokurikuler kami, Ibu Siti Aminah, bisa mencoba."

Subariyanto: "Siap Pak Mahrus! Saya berjanji akan mengirimkan kredensial akun trial ke WhatsApp Bapak dan Bu Siti Aminah hari ini sebelum jam 15.00 WIB."

Drs. H. Mahrus: "Bagus. Selanjutnya, tolong kirimkan juga draf MOU kerjasama dan berkas penawaran resmi ke email madrasah kami: mts.almadinah@kemenag.go.id."

Subariyanto: "Tentu Pak. Draf MOU resmi dan proposal penawaran akan saya kirimkan ke email madrasah besok pagi jam 09.00 WIB."

Drs. H. Mahrus: "Sip. Untuk jadwal internal kami, saya akan mengumpulkan 15 guru fasilitator pada hari Kamis jam 13.00 WIB untuk briefing awal. Dan Bu Siti Aminah akan menyerahkan daftar nama guru serta rombel siswa ke tim Bapak paling lambat hari Jumat jam 10.00 WIB."

Subariyanto: "Sangat baik Pak. Setelah berkas daftar guru kami terima hari Jumat, tim kami akan membantu mengunggah data master guru dan murid ke dalam sistem dalam waktu 1x24 jam, yaitu Sabtu sore jam 17.00 WIB."

Drs. H. Mahrus: "Deal! Kita jadwalkan penandatanganan MOU dan pengesahan anggaran pada hari Senin minggu depan jam 09.00 WIB di kantor madrasah."

Subariyanto: "Siap Pak Mahrus, terima kasih atas kesepakatannya. Wassalamu'alaikum."`,
    context: 'Demonstrasi produk & negosiasi lisensi software PKM Kemenag 2025.'
  },
  {
    id: 'sample-b2b-enterprise',
    title: 'Sales Call: B2B Enterprise Partnership & API Integration',
    description: 'Call negosiasi kontrak kerjasama B2B integrasi data pendidikan daerah.',
    transcript: `Rizky (Account Executive): "Hi Ms. Amanda, thank you for joining today's call. Following our previous proposal for the district-wide education analytics package, we wanted to confirm the remaining deal points."

Ms. Amanda (IT Director): "Hi Rizky. Our board reviewed your scope. We agree with the enterprise tier pricing of $12,000 annually for 20 schools, provided technical SLA guarantee is included."

Rizky: "Understood Ms. Amanda. I commit to sending you the revised Service Level Agreement (SLA) addendum guaranteeing 99.9% uptime by tomorrow at 2 PM EST."

Ms. Amanda: "Great. On our end, our cybersecurity officer will complete the vendor security questionnaire and return it to your team by Thursday 5 PM."

Rizky: "Excellent. Once we receive the security questionnaire, our lead architect, David, will schedule a 30-minute technical onboarding session with your IT engineers for next Monday at 10 AM EST."

Ms. Amanda: "Perfect. I will also ensure our finance manager signs the purchase order (PO) and submits it to your billing team before Friday close of business."`,
    context: 'B2B SaaS Enterprise Agreement & SLA Addendum Commitment.'
  }
];

export default function AudioActionItemsView({ user }: AudioActionItemsViewProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'transcript'>('upload');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [contextNote, setContextNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Microphone recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Filtering results
  const [filterParty, setFilterParty] = useState<'all' | 'party_a' | 'party_b' | 'high_priority' | 'pending'>('all');
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        setAudioUrl(URL.createObjectURL(file));
        setError(null);
      } else {
        setError('Mohon unggah berkas bertipe audio (MP3, WAV, M4A, WEBM, OGG).');
      }
    }
  };

  // Handle Audio Recording
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Failed to access microphone:', err);
      setError('Izin mikrofon tidak diberikan atau tidak didukung di peramban.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  // Convert File or Blob to Base64
  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Load Sample Sales Call
  const handleLoadSample = (sample: typeof SAMPLE_SALES_CALLS[0]) => {
    setActiveTab('transcript');
    setTranscriptText(sample.transcript);
    setContextNote(sample.context);
    setError(null);
  };

  // Trigger Action Item Extraction via Backend API
  const handleExtractActionItems = async () => {
    setLoading(true);
    setError(null);

    try {
      let bodyData: any = { contextNote };

      if (activeTab === 'upload' && audioFile) {
        const base64 = await fileToBase64(audioFile);
        bodyData.audioData = base64;
        bodyData.mimeType = audioFile.type || 'audio/mp3';
      } else if (activeTab === 'record' && audioBlob) {
        const base64 = await fileToBase64(audioBlob);
        bodyData.audioData = base64;
        bodyData.mimeType = 'audio/webm';
      } else if (activeTab === 'transcript' && transcriptText.trim()) {
        bodyData.transcript = transcriptText;
      } else {
        setLoading(false);
        setError('Sediakan rekaman audio atau transkrip percakapan sales call terlebih dahulu.');
        return;
      }

      const response = await fetch('/api/extract-action-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || resData.details || 'Gagal mengekstrak tindak lanjut dari audio/transkrip.');
      }

      // Add completed flag to each item
      const formattedItems: ActionItem[] = (resData.data.actionItems || []).map((item: any, index: number) => ({
        id: item.id || `act-${index + 1}`,
        task: item.task,
        owner: item.owner,
        party: item.party || 'joint',
        deadline: item.deadline,
        deliverables: item.deliverables || '',
        priority: item.priority || 'medium',
        completed: false
      }));

      setAnalysisResult({
        callSummary: resData.data.callSummary || 'Ringkasan percakapan berhasil diproses.',
        overallSentiment: resData.data.overallSentiment || 'Positif / Kesepakatan TerCapai',
        partyAName: resData.data.partyAName || 'Tim Provider (Pihak A)',
        partyBName: resData.data.partyBName || 'Klien / Mitra (Pihak B)',
        actionItems: formattedItems,
        keyAgreements: resData.data.keyAgreements || [],
        unresolvedPoints: resData.data.unresolvedPoints || []
      });

    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err?.message || 'Terjadi kesalahan saat memproses data audio dengan Gemini AI.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Action Item Completion Status
  const toggleItemCompletion = (id: string) => {
    if (!analysisResult) return;
    setAnalysisResult({
      ...analysisResult,
      actionItems: analysisResult.actionItems.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    });
  };

  // Add Manual Action Item
  const handleAddManualItem = () => {
    if (!analysisResult) return;
    const newItem: ActionItem = {
      id: `act-manual-${Date.now()}`,
      task: 'Tugas tindak lanjut baru...',
      owner: analysisResult.partyAName,
      party: 'party_a',
      deadline: 'Segera',
      priority: 'medium',
      completed: false
    };
    setAnalysisResult({
      ...analysisResult,
      actionItems: [...analysisResult.actionItems, newItem]
    });
  };

  // Delete Action Item
  const handleDeleteItem = (id: string) => {
    if (!analysisResult) return;
    setAnalysisResult({
      ...analysisResult,
      actionItems: analysisResult.actionItems.filter(i => i.id !== id)
    });
  };

  // Copy Formatted List
  const handleCopyActionPlan = () => {
    if (!analysisResult) return;

    let text = `📋 RINGKASAN TINDAK LANJUT SALES CALL & PERJANJIAN\n`;
    text += `=================================================\n\n`;
    text += `📞 Ringkasan Percakapan: ${analysisResult.callSummary}\n`;
    text += `🤝 Pihak A: ${analysisResult.partyAName}\n`;
    text += `🏢 Pihak B: ${analysisResult.partyBName}\n\n`;

    text += `✅ SERANTAI TINDAK LANJUT KESEPAKATAN (EXPLICIT ACTION ITEMS):\n`;
    analysisResult.actionItems.forEach((item, idx) => {
      const statusIcon = item.completed ? '[SELESAI]' : '[PENDING]';
      text += `${idx + 1}. ${statusIcon} ${item.task}\n`;
      text += `   - Penanggung Jawab: ${item.owner} (${item.party === 'party_a' ? 'Pihak A' : item.party === 'party_b' ? 'Pihak B' : 'Bersama'})\n`;
      text += `   - Tenggat Waktu: ${item.deadline}\n`;
      if (item.deliverables) text += `   - Hasil/Luaran: ${item.deliverables}\n`;
      text += `   - Prioritas: ${item.priority.toUpperCase()}\n\n`;
    });

    if (analysisResult.keyAgreements.length > 0) {
      text += `💡 Poin-Poin Utama Kesepakatan:\n`;
      analysisResult.keyAgreements.forEach(k => text += `- ${k}\n`);
      text += `\n`;
    }

    navigator.clipboard.writeText(text);
    setCopiedNotification('Daftar Action Items berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  // Filtered Action Items
  const filteredActionItems = (analysisResult?.actionItems || []).filter(item => {
    if (filterParty === 'party_a') return item.party === 'party_a';
    if (filterParty === 'party_b') return item.party === 'party_b';
    if (filterParty === 'high_priority') return item.priority === 'high';
    if (filterParty === 'pending') return !item.completed;
    return true;
  });

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-slate-950 p-5 md:p-6 rounded-2xl shadow-sm border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 bg-slate-950 text-amber-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 fill-amber-300" />
            <span>AI Sales Call Reviewer & Executive Action Planner</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-950">
            Peninjau Rekaman Audio & Ekstraksi Tindak Lanjut
          </h2>
          <p className="text-xs md:text-sm text-slate-800 font-medium max-w-2xl">
            Unggah rekaman audio percakapan sales call, rekam langsung, atau masukkan transkrip. AI Gemini akan mengekstrak semua <strong>explicit action items</strong> yang disepakati oleh kedua belah pihak beserta penanggung jawab, tenggat waktu, dan luaran konkret.
          </p>
        </div>

        {/* Quick Sample Button */}
        <div className="shrink-0 flex flex-wrap md:flex-col gap-2">
          <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider">
            Coba Demo 1-Klik:
          </span>
          {SAMPLE_SALES_CALLS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleLoadSample(sample)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-lg shadow-xs border border-amber-600/30 flex items-center space-x-1.5 transition-all text-left cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600 shrink-0" />
              <span className="truncate max-w-[180px]">{sample.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Copied Alert */}
      {copiedNotification && (
        <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{copiedNotification}</span>
          </div>
        </div>
      )}

      {/* 2. Audio Input Workspace */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-slate-50/80 p-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-amber-400 text-slate-950 font-extrabold shadow-xs border border-amber-500/40'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>1. Unggah Audio File (.mp3, .wav)</span>
          </button>

          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
              activeTab === 'record'
                ? 'bg-amber-400 text-slate-950 font-extrabold shadow-xs border border-amber-500/40'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>2. Rekam Suara Langsung</span>
          </button>

          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
              activeTab === 'transcript'
                ? 'bg-amber-400 text-slate-950 font-extrabold shadow-xs border border-amber-500/40'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>3. Teks Transkrip Percakapan</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 md:p-6 space-y-4">
          
          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 hover:border-amber-500 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-amber-50/30 transition-all cursor-pointer"
              >
                <input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleFileChange}
                  className="hidden" 
                  id="audio-upload-input"
                />
                <label htmlFor="audio-upload-input" className="cursor-pointer space-y-2 block">
                  <div className="w-14 h-14 bg-amber-100 text-amber-900 rounded-full flex items-center justify-center mx-auto shadow-xs border border-amber-300">
                    <FileAudio className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">
                      Klik untuk memilih berkas audio rekaman sales call
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mendukung format MP3, WAV, M4A, WEBM, atau OGG (Hingga 50MB)
                    </p>
                  </div>
                </label>
              </div>

              {audioFile && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileAudio className="w-6 h-6 text-amber-700" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{audioFile.name}</p>
                      <p className="text-[10px] text-slate-500">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  {audioUrl && (
                    <audio controls src={audioUrl} className="h-9 max-w-xs" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE VOICE RECORDING */}
          {activeTab === 'record' && (
            <div className="text-center py-8 space-y-4 bg-slate-50 rounded-2xl border border-gray-200">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900">Rekam Percakapan Panggilan Sales Call / Rapat</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Gunakan mikrofon perangkat Anda untuk merekam pembicaraan langsung dengan klien atau calon mitra madrasah.
                </p>
              </div>

              <div className="py-2">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center mx-auto shadow-md transition-all hover:scale-105 cursor-pointer"
                    title="Mulai Merekam Suara"
                  >
                    <Mic className="w-8 h-8" />
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 font-extrabold text-sm rounded-full animate-pulse border border-red-300">
                      <span className="w-3 h-3 bg-red-600 rounded-full"></span>
                      <span>Merekam: {formatSeconds(recordingTime)}</span>
                    </div>
                    <div>
                      <button
                        onClick={stopRecording}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center space-x-2 cursor-pointer"
                      >
                        <MicOff className="w-4 h-4 text-red-400" />
                        <span>Hentikan & Simpan Rekaman</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {audioBlob && !isRecording && (
                <div className="max-w-md mx-auto bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Rekaman Siap Diproses ({formatSeconds(recordingTime)})</span>
                  </div>
                  {audioUrl && (
                    <audio controls src={audioUrl} className="h-8 max-w-[200px]" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRANSCRIPT TEXT */}
          {activeTab === 'transcript' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Teks Transkrip Percakapan / Catatan Panggilan:
              </label>
              <textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="Tempelkan atau ketik transkrip percakapan sales call antara Pihak A (Sales/Provider) dan Pihak B (Klien/Kepala Madrasah)..."
                className="w-full h-44 p-3.5 text-xs font-mono bg-slate-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          )}

          {/* Optional Context Note */}
          <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <input
                type="text"
                value={contextNote}
                onChange={(e) => setContextNote(e.target.value)}
                placeholder="Catatan Konteks Tambahan (opsional: Nama Klien, Topik Penawaran, Paket Lisensi...)"
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleExtractActionItems}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-300 font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>AI Sedang Menganalisis Percakapan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Ekstrak Action Items dengan Gemini AI</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

        </div>
      </div>

      {/* 3. Action Items Extraction Results Display */}
      {analysisResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* Executive Call Overview Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                  Hasil Peninjauan Panggilan & Analisis AI
                </span>
                <h3 className="text-lg font-black text-slate-950">
                  Ringkasan Percakapan & Status Kesepakatan
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                {analysisResult.overallSentiment && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-full text-xs font-black uppercase">
                    {analysisResult.overallSentiment}
                  </span>
                )}
                <button
                  onClick={handleCopyActionPlan}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer border border-gray-200"
                  title="Salin Seluruh Action Plan"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Hasil</span>
                </button>
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-gray-200">
              {analysisResult.callSummary}
            </p>

            {/* Identified Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                  A
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-indigo-800">Pihak A (Sales / Provider / Vendor)</p>
                  <p className="text-xs font-black text-slate-900">{analysisResult.partyAName}</p>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                  B
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-emerald-800">Pihak B (Klien / Pembeli / Mitra)</p>
                  <p className="text-xs font-black text-slate-900">{analysisResult.partyBName}</p>
                </div>
              </div>
            </div>

            {/* Key Mutually Agreed Terms */}
            {analysisResult.keyAgreements.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Poin Utama Kesepakatan yang Disetujui (Key Agreements):</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {analysisResult.keyAgreements.map((agreement, idx) => (
                    <div key={idx} className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 text-xs font-semibold text-slate-800 flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{agreement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Explicit Action Items List Workspace */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            
            {/* Filter Bar */}
            <div className="p-4 border-b border-gray-200 bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Daftar Tindak Lanjut Konkret (Explicit Action Items)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-black text-[10px]">
                  {filteredActionItems.length} Tugas
                </span>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
                <button
                  onClick={() => setFilterParty('all')}
                  className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    filterParty === 'all'
                      ? 'bg-amber-400 text-slate-950 border-amber-500'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-gray-200'
                  }`}
                >
                  Semua ({analysisResult.actionItems.length})
                </button>

                <button
                  onClick={() => setFilterParty('party_a')}
                  className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    filterParty === 'party_a'
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : 'bg-white text-indigo-700 hover:bg-indigo-50 border-indigo-200'
                  }`}
                >
                  Komitmen Pihak A
                </button>

                <button
                  onClick={() => setFilterParty('party_b')}
                  className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    filterParty === 'party_b'
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-white text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                  }`}
                >
                  Komitmen Pihak B
                </button>

                <button
                  onClick={() => setFilterParty('high_priority')}
                  className={`px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    filterParty === 'high_priority'
                      ? 'bg-red-600 text-white border-red-700'
                      : 'bg-white text-red-700 hover:bg-red-50 border-red-200'
                  }`}
                >
                  Prioritas Tinggi
                </button>

                <button
                  onClick={handleAddManualItem}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg flex items-center space-x-1 cursor-pointer ml-auto"
                  title="Tambah Item Manual"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Item</span>
                </button>
              </div>
            </div>

            {/* Action Items Cards */}
            <div className="p-4 md:p-6 space-y-3">
              {filteredActionItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold">
                  Tidak ada action item pada filter ini.
                </div>
              ) : (
                filteredActionItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      item.completed 
                        ? 'bg-slate-50 border-gray-200 opacity-60 line-through' 
                        : item.priority === 'high'
                        ? 'bg-white border-red-200 shadow-2xs hover:border-red-300'
                        : 'bg-white border-gray-200 shadow-2xs hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      
                      {/* Checkbox & Task details */}
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <button
                          onClick={() => toggleItemCompletion(item.id)}
                          className="mt-0.5 shrink-0 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          {item.completed ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </button>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <p className={`text-xs md:text-sm font-extrabold text-slate-900 leading-snug ${item.completed ? 'line-through text-slate-400' : ''}`}>
                            {item.task}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                            {/* Party Owner Tag */}
                            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full border ${
                              item.party === 'party_a'
                                ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                                : item.party === 'party_b'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                : 'bg-amber-50 text-amber-900 border-amber-200'
                            }`}>
                              <User className="w-3 h-3 shrink-0" />
                              <span>{item.owner}</span>
                            </span>

                            {/* Agreed Deadline Tag */}
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                              <span>Tenggat: {item.deadline}</span>
                            </span>

                            {/* Priority Tag */}
                            <span className={`px-2 py-0.5 rounded-full uppercase text-[9px] font-black ${
                              item.priority === 'high'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : item.priority === 'medium'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              Prioritas: {item.priority}
                            </span>

                            {/* Deliverables if mentioned */}
                            {item.deliverables && (
                              <span className="text-slate-500 text-[10px] font-normal italic">
                                Luaran: {item.deliverables}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Item Delete Button */}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Hapus Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Unresolved Points Section */}
            {analysisResult.unresolvedPoints.length > 0 && (
              <div className="p-4 md:p-6 border-t border-gray-200 bg-amber-50/40">
                <h4 className="text-xs font-extrabold uppercase text-amber-900 tracking-wider mb-2 flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <span>Isu Belum Terjawab / Ditangguhkan (Unresolved Follow-ups):</span>
                </h4>
                <ul className="space-y-1 text-xs font-medium text-slate-700 list-disc list-inside">
                  {analysisResult.unresolvedPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
