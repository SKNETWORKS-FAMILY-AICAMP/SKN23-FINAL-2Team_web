/*
File    : src/app/components/profile/admin/DocumentsTab.tsx
Author  : 김민정
Create  : 2026-04-24
Description : S3 전역 표준 문서 관리 탭 (배관 Prefix 수정 및 UsageTab 스타일 커스텀 드롭다운 적용)
*/
import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Search,
  FileBox,
  ExternalLink,
  Loader2,
  Filter,
  X,
  ChevronLeft,
  Flame,
  BrickWall,
  Pipette,
  Zap,
  Eye,
  ChevronDown,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/app/api/admin';
import { authStorage } from '@/app/utils/storage';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

interface Document {
  id: string;
  file_name: string;
  s3_url: string;
  created_at: string;
}

const CATEGORIES = [
  { id: '소방', prefix: 'fire_', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: '건축', prefix: 'arch_', icon: BrickWall, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: '배관', prefix: 'pipe_', icon: Pipette, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: '전기', prefix: 'elec_', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
];

export const DocumentsTab = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 드롭다운 상태 관리 (UsageTab 스타일)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [uploadCategory, setUploadCategory] = useState<string>('소방');
  const [isUploadPickerOpen, setIsUploadPickerOpen] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    const token = authStorage.getAccessToken();
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await adminApi.getDocuments(token, selectedCategory);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      toast.error("문서 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory]);

  const getCategoryFromFileName = (fileName: string) => {
    const found = CATEGORIES.find(cat => fileName.startsWith(cat.prefix));
    return found ? found.id : '전통';
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const token = authStorage.getAccessToken();
    if (!file || !token) return;

    try {
      setIsUploading(true);
      const res = await adminApi.uploadDocument(token, file, uploadCategory);
      if (res.ok) {
        toast.success(`[${uploadCategory}] 업로드 성공!`);
        fetchDocuments();
      } else {
        toast.error("업로드에 실패했습니다.");
      }
    } catch (error) {
      toast.error("업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string, fileName: string) => {
    const token = authStorage.getAccessToken();
    if (!token || !confirm(`'${fileName}' 문서를 정말 삭제하시겠습니까?`)) return;

    try {
      const res = await adminApi.deleteDocument(token, docId);
      if (res.ok) {
        toast.success("문서가 삭제되었습니다.");
        fetchDocuments();
      } else {
        toast.error("삭제에 실패했습니다.");
      }
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* 고도화된 필터 및 업로드 바 (UsageTab 스타일 커스텀 드롭다운 적용) */}
        <div className="bg-[#0b0b0b] border border-white/5 p-8 rounded-[40px] flex flex-wrap gap-8 items-center justify-between shadow-2xl relative overflow-visible">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[120px] -z-10"></div>

          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-600/10 rounded-[22px] border border-blue-500/20 flex items-center justify-center">
              <FileBox className="w-7 h-7 text-blue-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">System <span className="text-blue-500">Archive</span></h2>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic">Integrated Node v1.0.4</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {/* 카테고리 필터 커스텀 드롭다운 (UsageTab 스타일) */}
            <div className="relative group min-w-[160px]">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                onBlur={() => setTimeout(() => setIsFilterOpen(false), 200)}
                className="flex items-center justify-between w-full bg-zinc-900 border border-white/5 rounded-2xl h-12 px-6 text-[11px] font-black uppercase tracking-widest text-zinc-300 transition-all hover:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-600/40"
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-blue-500" />
                  {selectedCategory === 'all' ? '전체 분야' : selectedCategory}
                </span>
                <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 w-full mt-3 bg-[#0c0c0c] border border-white/10 rounded-[24px] overflow-hidden z-[100] shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                  >
                    <div
                      onClick={() => { setSelectedCategory('all'); setIsFilterOpen(false); }}
                      className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors border-b border-white/5 ${selectedCategory === 'all' ? 'bg-blue-600/10 text-blue-500' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}
                    >
                      전체 분야 조회
                    </div>
                    {CATEGORIES.map(cat => (
                      <div
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat.id); setIsFilterOpen(false); }}
                        className={`flex items-center gap-3 px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors border-b border-white/5 last:border-0 ${selectedCategory === cat.id ? 'bg-blue-600/10 text-blue-500' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}
                      >
                        <cat.icon className={`w-3.5 h-3.5 ${cat.color}`} />
                        {cat.id}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="FIND PROTOCOL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-6 h-12 text-[11px] font-black uppercase tracking-widest text-white focus:ring-2 focus:ring-blue-600/40 outline-none w-56 transition-all hover:bg-zinc-800"
              />
            </div>

            <div className="w-[1px] h-8 bg-white/5 mx-2"></div>

            {/* 업로드 분야 선택 커스텀 드롭다운 */}
            <div className="relative group min-w-[130px]">
              <button
                onClick={() => setIsUploadPickerOpen(!isUploadPickerOpen)}
                onBlur={() => setTimeout(() => setIsUploadPickerOpen(false), 200)}
                className="flex items-center justify-between w-full bg-zinc-900 border border-white/10 rounded-2xl h-12 px-6 text-[11px] font-black uppercase tracking-widest text-blue-500 transition-all hover:bg-blue-500/5 outline-none"
              >
                <span>{uploadCategory}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isUploadPickerOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isUploadPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 w-full mt-3 bg-[#0c0c0c] border border-white/10 rounded-[24px] overflow-hidden z-[100] shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                  >
                    {CATEGORIES.map(cat => (
                      <div
                        key={cat.id}
                        onClick={() => { setUploadCategory(cat.id); setIsUploadPickerOpen(false); }}
                        className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors border-b border-white/5 last:border-0 ${uploadCategory === cat.id ? 'bg-blue-600/10 text-blue-500' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}
                      >
                        {cat.id}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 h-12 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-blue-600/30 transition-all active:scale-95 whitespace-nowrap"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              INITIATE UPLOAD
            </button>
          </div>
        </div>

        {/* 리스트 테이블 */}
        <div className="bg-[#0b0b0b] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-10 py-6 text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Integrated Archive / Spec Identification</th>
                <th className="px-10 py-6 text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Timestamp</th>
                <th className="px-10 py-6 text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode='popLayout'>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-10 py-32 text-center text-zinc-600 font-black uppercase tracking-[0.4em] italic opacity-30 animate-pulse">
                      Accessing Storage Nodes...
                    </td>
                  </tr>
                ) : filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-10 py-40 text-center">
                      <div className="flex flex-col items-center gap-5 opacity-10">
                        <Box className="w-16 h-16 text-white" />
                        <p className="text-[10px] font-black uppercase tracking-[0.6em] italic">Workspace Empty</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => {
                    const category = getCategoryFromFileName(doc.file_name);
                    const catInfo = CATEGORIES.find(c => c.id === category) || { id: '전체', prefix: '', icon: FileText, color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
                    const displayName = doc.file_name.replace(catInfo.prefix, '');

                    return (
                      <motion.tr
                        key={doc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-all group"
                      >
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-8">
                            <div className={`w-16 h-16 ${catInfo.bg} rounded-[24px] border border-white/5 flex items-center justify-center transition-transform duration-700 group-hover:scale-110 shadow-inner`}>
                              <catInfo.icon className={`w-8 h-8 ${catInfo.color}`} />
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-4">
                                <div className={`px-2.5 py-1 rounded-[10px] ${catInfo.bg} border border-white/5`}>
                                  <span className={`text-[10px] font-black ${catInfo.color} uppercase tracking-tight`}>{category}</span>
                                </div>
                                <span className="text-xl font-black text-white italic tracking-tighter group-hover:text-blue-500 transition-colors uppercase">{displayName}</span>
                              </div>
                              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest italic opacity-40">Encryption Verified · Cadence Tech Verified Entry</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-[11px] font-black text-zinc-600 tabular-nums grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all uppercase italic">
                          {new Date(doc.created_at).toLocaleString('ko-KR', {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex justify-end gap-3 opacity-30 group-hover:opacity-100 transition-all">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setPreviewUrl(doc.s3_url)}
                                  className="p-4 bg-zinc-900 border border-white/5 hover:bg-blue-600 text-zinc-500 hover:text-white rounded-[20px] transition-all shadow-2xl active:scale-95"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-blue-600 text-white font-black text-[10px] uppercase py-2.5 px-5 rounded-2xl border-none shadow-[0_10px_30px_rgba(59,130,246,0.3)]">
                                Open Protocol
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleDelete(doc.id, doc.file_name)}
                                  className="p-4 bg-zinc-900 border border-white/5 hover:bg-red-600 text-zinc-500 hover:text-white rounded-[20px] transition-all shadow-2xl active:scale-95"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-red-600 text-white font-black text-[10px] uppercase py-2.5 px-5 rounded-2xl border-none shadow-[0_10px_30px_rgba(220,38,38,0.3)]">
                                Erase Entry
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* 통합 문서 뷰어 모달 */}
        <AnimatePresence>
          {previewUrl && (
            <div className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center p-8 backdrop-blur-3xl" onClick={() => setPreviewUrl(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative max-w-7xl w-full h-[92vh] bg-[#0b0b0b] rounded-[64px] border border-white/10 shadow-[0_0_200px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-16 py-12 border-b border-white/5 flex justify-between items-center bg-black/40">
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-[28px] bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                      <FileBox className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h5 className="text-white font-black uppercase text-2xl tracking-tighter leading-none italic">Secured Stream Channel</h5>
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.6em] italic">Level 4 Encryption Authorized</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-black text-zinc-500 hover:text-white uppercase tracking-[0.3em] transition-all flex items-center gap-4 group italic"
                    >
                      Bypass to External Node <ChevronLeft className="w-4 h-4 rotate-180 group-hover:translate-x-3 transition-transform" />
                    </a>
                    <button onClick={() => setPreviewUrl(null)} className="p-6 bg-white/5 hover:bg-red-500 text-zinc-400 hover:text-white rounded-[28px] transition-all border border-white/5 shadow-inner active:scale-95">
                      <X className="w-8 h-8" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-black/60 overflow-hidden relative group">
                  {previewUrl.toLowerCase().includes('.pdf') ? (
                    <iframe
                      src={`${previewUrl}#toolbar=0`}
                      className="w-full h-full border-none"
                      title="System Protocol"
                    />
                  ) : (
                    <div className="w-full h-full overflow-auto flex items-center justify-center p-24 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
                      <img
                        src={previewUrl}
                        alt="Verified Output"
                        className="max-w-full max-h-full object-contain rounded-[40px] shadow-[0_60px_150px_rgba(0,0,0,1)] border border-white/5 group-hover:scale-[1.01] transition-transform duration-2000"
                      />
                    </div>
                  )}
                </div>

                <div className="px-16 py-10 bg-black/80 border-t border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
                    <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.7em] italic">Real-Time Data Decryption Node Active · Cadence AI Security Tunnel v2.4</p>
                  </div>
                  <p className="text-[11px] font-black text-zinc-800 uppercase tracking-[1em] italic">CADENCE AI CORE</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
};
