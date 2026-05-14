/*
File    : src/app/components/profile/admin/AdminDocumentsTab.tsx
Author  : 김민정
Create  : 2026-04-24
Description : S3 전역 표준 문서 관리 탭
Modification History:
    - 2026-04-26 (김민정) : 카테고리별 문서 관리 및 S3 업로드/삭제 로직 점검
    - 2026-05-04 (송주엽) : 라이트 테마 통일 리디자인
*/
import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Upload, Trash2, Search, ExternalLink,
  Loader2, X, ChevronLeft, Flame, BrickWall, Pipette, Zap, ChevronDown, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/app/api/admin';
import { getAdminToken } from '@/app/context/AdminAuthContext';
import { toast } from 'sonner';

interface Document {
  id: string;
  file_name: string;
  s3_url?: string;
  raw_s3_url: string;
  created_at: string;
  domain?: DocumentDomain;
  domain_label?: string;
  doc_type?: DocumentType;
  doc_type_label?: string;
}

type UploadKind = 'json' | 'markdown' | 'text' | 'binary';
type DocumentDomain = 'arch' | 'elec' | 'fire' | 'pipe';
type DocumentType = 'spec' | 'standard';

type PendingUpload = {
  id: string;
  file: File;
  domain: DocumentDomain;
  docType: DocumentType;
  content: string;
  kind: UploadKind;
  error?: string;
};

const DOMAINS: Array<{ id: DocumentDomain; label: string; prefix: string; icon: typeof Flame; color: string; badge: string }> = [
  { id: 'fire', label: '소방', prefix: 'fire_', icon: Flame, color: 'text-orange-500', badge: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'arch', label: '건축', prefix: 'arch_', icon: BrickWall, color: 'text-blue-500', badge: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'pipe', label: '배관', prefix: 'pipe_', icon: Pipette, color: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'elec', label: '전기', prefix: 'elec_', icon: Zap, color: 'text-yellow-500', badge: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
];

const DOC_TYPES: Array<{ id: DocumentType; label: string; folder: string }> = [
  { id: 'spec', label: '시방서', folder: 'spec' },
  { id: 'standard', label: '법령/기술지침', folder: 'standard' },
];

const ITEMS_PER_PAGE = 10;

export const AdminDocumentsTab = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [uploadDomain, setUploadDomain] = useState<DocumentDomain>('fire');
  const [uploadDocType, setUploadDocType] = useState<DocumentType>('spec');
  const [isUploadPickerOpen, setIsUploadPickerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [selectedPendingIndex, setSelectedPendingIndex] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    const token = getAdminToken();
    if (!token) {
      setIsLoading(false);
      toast.error('관리자 인증 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }
    try {
      setIsLoading(true);
      const res = await adminApi.getDocuments(token, selectedDomain, selectedDocType);
      if (res.ok) setDocuments(await res.json());
      else toast.error('문서 목록을 불러오지 못했습니다.');
    } catch {
      toast.error('문서 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    setCurrentPage(1);
  }, [selectedDomain, selectedDocType]);

  const getDomainInfo = (doc: Pick<Document, 'file_name' | 'raw_s3_url' | 'domain'>) => {
    if (doc.domain) return DOMAINS.find(domain => domain.id === doc.domain) || null;
    const rawUrl = doc.raw_s3_url || '';
    return DOMAINS.find(domain => rawUrl.includes(`/standards/${domain.id}/`) || doc.file_name.startsWith(domain.prefix)) || null;
  };

  const inferDomainFromFile = (file: File): DocumentDomain => {
    const lowerName = file.name.toLowerCase();
    return DOMAINS.find(domain => lowerName.startsWith(domain.prefix.toLowerCase()))?.id || uploadDomain;
  };

  const createPendingUpload = async (file: File): Promise<PendingUpload> => {
    const lowerName = file.name.toLowerCase();
    const kind: UploadKind =
      lowerName.endsWith('.json') ? 'json'
        : lowerName.endsWith('.md') || lowerName.endsWith('.markdown') ? 'markdown'
          : file.type.startsWith('text/') ? 'text'
            : 'binary';
    const baseUpload = {
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      domain: inferDomainFromFile(file),
      docType: uploadDocType,
      content: '',
      kind,
    };

    if (!lowerName.endsWith('.pdf')) {
      return {
        ...baseUpload,
        error: 'PDF 파일만 업로드할 수 있습니다.'
      };
    }

    try {
      const rawContent = kind === 'binary' ? '' : await file.text();
      const content = kind === 'json' ? JSON.stringify(JSON.parse(rawContent), null, 2) : rawContent;
      return { ...baseUpload, content };
    } catch {
      return {
        ...baseUpload,
        error: kind === 'json' ? 'JSON 형식이 올바르지 않습니다. 내용을 확인한 뒤 다시 선택해주세요.' : '파일 내용을 읽지 못했습니다.'
      };
    }
  };

  const queueFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const queued = await Promise.all(files.map(createPendingUpload));
    const firstNewIndex = pendingUploads.length;
    setPendingUploads(prev => [...prev, ...queued]);
    setSelectedPendingIndex(firstNewIndex);
    toast.success(`${queued.length}개 파일이 업로드 대기열에 추가되었습니다.`);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await queueFiles(Array.from(e.target.files || []));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancelPendingUpload = () => {
    setPendingUploads([]);
    setSelectedPendingIndex(0);
    setIsUploadModalOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePendingUpload = (index: number) => {
    const next = pendingUploads.filter((_, itemIndex) => itemIndex !== index);
    setPendingUploads(next);
    setSelectedPendingIndex(Math.min(selectedPendingIndex, Math.max(0, next.length - 1)));
  };

  const handleConfirmUpload = async () => {
    const token = getAdminToken();
    if (!token || pendingUploads.length === 0) return;
    if (pendingUploads.some(item => item.error)) {
      toast.error('오류가 있는 파일을 제거한 뒤 업로드해주세요.');
      return;
    }

    try {
      setIsUploading(true);
      const results: Array<{ runpod?: { db_inserted_chunks?: number } }> = [];
      for (const item of pendingUploads) {
        const res = await adminApi.uploadDocument(token, item.file, item.domain, item.docType);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || item.file.name);
        results.push(data);
      }
      const insertedChunks = results.reduce((sum, item) => sum + (item.runpod?.db_inserted_chunks || 0), 0);
      toast.success(`${pendingUploads.length}개 문서 처리 완료 · ${insertedChunks}개 chunk 등록`);
      setPendingUploads([]);
      setSelectedPendingIndex(0);
      setIsUploadModalOpen(false);
      fetchDocuments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, fileName: string) => {
    const token = getAdminToken();
    if (!token || !confirm(`'${fileName}' 문서를 삭제하시겠습니까?`)) return;
    try {
      const res = await adminApi.deleteDocument(token, docId);
      if (res.ok) { toast.success('문서가 삭제되었습니다.'); fetchDocuments(); }
      else toast.error('삭제에 실패했습니다.');
    } catch { toast.error('삭제 중 오류가 발생했습니다.'); }
  };

  const filteredDocs = documents.filter(doc =>
    doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE);
  const currentDocs = filteredDocs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const selectedDoc = filteredDocs.find((doc) => doc.id === selectedDocId) || filteredDocs[0];
  const selectedPending = pendingUploads[selectedPendingIndex] || pendingUploads[0];
  const hasUploadErrors = pendingUploads.some(item => item.error);
  const getDocumentUrl = (doc: Document) => doc.s3_url || doc.raw_s3_url;
  const isImagePreview = (url: string) => /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(url);
  const isPdfPreview = (url: string) => /\.pdf(\?|#|$)/i.test(url);

  return (
    <div className="space-y-5">
      {/* 툴바 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        {/* 분야 필터 */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            onBlur={() => setTimeout(() => setIsFilterOpen(false), 200)}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 outline-none min-w-[120px] justify-between"
          >
            <span>{selectedDomain === 'all' ? '전체 분야' : DOMAINS.find(domain => domain.id === selectedDomain)?.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden min-w-[140px]"
              >
                <div
                  onClick={() => { setSelectedDomain('all'); setIsFilterOpen(false); }}
                  className={`px-4 py-2.5 text-sm cursor-pointer border-b border-slate-100 ${selectedDomain === 'all' ? 'bg-blue-50 text-[#1e40af] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >전체 분야</div>
                {DOMAINS.map(domain => (
                  <div
                    key={domain.id}
                    onClick={() => { setSelectedDomain(domain.id); setIsFilterOpen(false); }}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer border-b border-slate-100 last:border-0 ${selectedDomain === domain.id ? 'bg-blue-50 text-[#1e40af] font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <domain.icon className={`w-3.5 h-3.5 ${domain.color}`} />
                    {domain.label}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {[{ id: 'all', label: '전체 종류' }, ...DOC_TYPES].map(type => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedDocType(type.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                selectedDocType === type.id ? 'bg-white text-[#1e40af] shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* 검색 */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="파일명 검색..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-[#1e40af] outline-none transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,application/pdf" multiple />
        <button
          onClick={() => setIsUploadModalOpen(true)}
          disabled={isUploading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e40af] hover:bg-[#1d3a9e] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {isUploading ? '업로드 중...' : '문서 업로드'}
        </button>
      </div>

      {/* 문서 테이블 + 상세 보기 */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            <div className="col-span-4">파일명</div>
            <div className="col-span-2">분야</div>
            <div className="col-span-2">종류</div>
            <div className="col-span-3">S3 URL</div>
            <div className="col-span-1 text-right">삭제</div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-sm text-slate-400 animate-pulse">문서 목록을 불러오는 중...</div>
          ) : currentDocs.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">등록된 문서가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {currentDocs.map((doc) => {
                const domainInfo = getDomainInfo(doc);
                const docTypeInfo = DOC_TYPES.find(type => type.id === doc.doc_type);
                const displayName = domainInfo && doc.file_name.startsWith(domainInfo.prefix)
                  ? doc.file_name.replace(domainInfo.prefix, '')
                  : doc.file_name;
                const documentUrl = getDocumentUrl(doc);
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`group grid grid-cols-12 px-5 py-3.5 items-center cursor-pointer transition-colors ${
                      selectedDoc?.id === doc.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      {domainInfo ? (
                        <domainInfo.icon className={`w-4 h-4 shrink-0 ${domainInfo.color}`} />
                      ) : (
                        <FileText className="w-4 h-4 shrink-0 text-slate-400" />
                      )}
                      <span className="text-sm font-medium text-slate-800 truncate">{displayName}</span>
                    </div>
                    <div className="col-span-2">
                      {domainInfo ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${domainInfo.badge}`}>
                          {domainInfo.label}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">기타</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-semibold text-slate-500">{docTypeInfo?.label || doc.doc_type_label || '기존 문서'}</span>
                    </div>
                    <div className="col-span-3 flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-mono text-slate-400 truncate" title={doc.raw_s3_url}>
                        {doc.raw_s3_url}
                      </span>
                      <a
                        href={documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 text-slate-300 hover:text-[#1e40af] transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, doc.file_name); }}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredDocs.length > 0 && (
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                총 <strong className="text-slate-700">{filteredDocs.length}</strong>개 문서
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    title="이전 페이지"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-[92px] text-center text-sm font-semibold text-slate-700">
                    <span className="text-[#1e40af]">{currentPage}</span>
                    <span className="mx-1.5 text-slate-300">/</span>
                    <span>{totalPages}</span>
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    title="다음 페이지"
                  >
                    <ChevronLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">상세 보기</p>
          {selectedDoc ? (
            <>
              {(() => {
                const domainInfo = getDomainInfo(selectedDoc);
                const docTypeInfo = DOC_TYPES.find(type => type.id === selectedDoc.doc_type);
                const displayName = domainInfo && selectedDoc.file_name.startsWith(domainInfo.prefix)
                  ? selectedDoc.file_name.replace(domainInfo.prefix, '')
                  : selectedDoc.file_name;
                const documentUrl = getDocumentUrl(selectedDoc);
                return (
                  <>
                    <div className="flex items-start gap-3">
                      {domainInfo ? (
                        <domainInfo.icon className={`mt-1 h-5 w-5 shrink-0 ${domainInfo.color}`} />
                      ) : (
                        <FileText className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                      )}
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-black text-slate-900">{displayName}</h3>
                        <p className="mt-1 text-xs text-slate-400">{selectedDoc.created_at ? selectedDoc.created_at.split('T')[0] : '등록일 없음'}</p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between border-b border-slate-100 pb-3">
                        <span className="text-slate-400">분야</span>
                        <span className="font-semibold text-slate-700">{domainInfo?.label || '기타'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-3">
                        <span className="text-slate-400">문서 종류</span>
                        <span className="font-semibold text-slate-700">{docTypeInfo?.label || selectedDoc.doc_type_label || '기존 문서'}</span>
                      </div>
                      <div className="border-b border-slate-100 pb-3">
                        <span className="text-slate-400">S3 URL</span>
                        <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{selectedDoc.raw_s3_url}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-1 gap-2">
                      <button
                        onClick={() => setPreviewUrl(documentUrl)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700"
                      >
                        <FileText className="h-3.5 w-3.5" /> 미리보기
                      </button>
                      <a
                        href={documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> 새 탭에서 열기
                      </a>
                      <button
                        onClick={() => handleDelete(selectedDoc.id, selectedDoc.file_name)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> 삭제
                      </button>
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center text-slate-400">
              <FileText className="mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-semibold">선택한 문서가 없습니다.</p>
            </div>
          )}
        </aside>
      </div>

      {/* 문서 뷰어 모달 */}
      <AnimatePresence>
        {previewUrl && (
          <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-8 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative max-w-5xl w-full h-[88vh] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h5 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1e40af]" /> 문서 미리보기
                </h5>
                <div className="flex items-center gap-3">
                  <a href={previewUrl} target="_blank" rel="noreferrer" className="text-xs text-[#1e40af] hover:underline flex items-center gap-1">
                    새 탭에서 열기 <ExternalLink className="w-3 h-3" />
                  </a>
                  <button onClick={() => setPreviewUrl(null)} className="p-1.5 bg-slate-200 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-lg transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden bg-slate-100">
                {isImagePreview(previewUrl) ? (
                  <div className="w-full h-full flex items-center justify-center p-8">
                    <img src={previewUrl} alt="문서" className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
                  </div>
                ) : isPdfPreview(previewUrl) ? (
                  <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full border-none" title="문서 미리보기" />
                ) : (
                  <iframe src={previewUrl} className="w-full h-full border-none bg-white" title="문서 미리보기" />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 업로드 모달 */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[210] flex items-center justify-center p-8 backdrop-blur-sm" onClick={handleCancelPendingUpload}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                <div className="min-w-0">
                  <h5 className="truncate text-sm font-bold text-slate-900">문서 업로드</h5>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    분야 선택 후 파일을 추가하고 내용을 확인하세요.
                  </p>
                </div>
                <button onClick={handleCancelPendingUpload} className="rounded-lg bg-slate-200 p-1.5 text-slate-500 transition-all hover:bg-red-100 hover:text-red-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="border-b border-slate-100 bg-white px-6 py-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="relative min-w-[140px]">
                    <label className="mb-1.5 block text-xs font-bold text-slate-500">업로드 분야</label>
                    <button
                      onClick={() => setIsUploadPickerOpen(!isUploadPickerOpen)}
                      onBlur={() => setTimeout(() => setIsUploadPickerOpen(false), 200)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none hover:border-slate-300"
                    >
                      <span>{DOMAINS.find(domain => domain.id === uploadDomain)?.label}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isUploadPickerOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isUploadPickerOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="absolute top-full left-0 z-50 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                        >
                          {DOMAINS.map(domain => (
                            <div
                              key={domain.id}
                              onClick={() => { setUploadDomain(domain.id); setIsUploadPickerOpen(false); }}
                              className={`flex cursor-pointer items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-sm last:border-0 ${uploadDomain === domain.id ? 'bg-blue-50 font-semibold text-[#1e40af]' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              <domain.icon className={`h-3.5 w-3.5 ${domain.color}`} />
                              {domain.label}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-500">문서 종류</label>
                    <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                      {DOC_TYPES.map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setUploadDocType(type.id)}
                          className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                            uploadDocType === type.id ? 'bg-white text-[#1e40af] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1d3a9e] disabled:opacity-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    파일 선택
                  </button>
                  <p className="pb-2 text-xs text-slate-400">
                    파일명 접두어 fire_, arch_, pipe_, elec_가 있으면 분야를 자동 인식합니다.
                  </p>
                </div>
              </div>

              {selectedPending ? (
                <div className="grid flex-1 min-h-0 grid-cols-[260px_minmax(0,1fr)]">
                  <aside className="overflow-y-auto border-r border-slate-200 bg-white p-4">
                    <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">업로드 대기열</div>
                    <div className="space-y-2">
                      {pendingUploads.map((item, index) => (
                        <div
                          key={item.id}
                          className={`group flex items-center gap-2 rounded-lg border p-2 text-left ${
                            index === selectedPendingIndex
                              ? 'border-blue-200 bg-blue-50'
                              : item.error
                                ? 'border-red-200 bg-red-50'
                                : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <button type="button" onClick={() => setSelectedPendingIndex(index)} className="min-w-0 flex-1 text-left">
                            <p className="truncate text-xs font-bold text-slate-800">{item.file.name}</p>
                            <p className={`mt-0.5 text-[10px] ${item.error ? 'text-red-500' : 'text-slate-400'}`}>
                              {DOMAINS.find(domain => domain.id === item.domain)?.label} · {DOC_TYPES.find(type => type.id === item.docType)?.label} · {(item.file.size / 1024).toFixed(1)}KB
                            </p>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePendingUpload(index)}
                            className="rounded-md p-1 text-slate-300 opacity-0 transition-all hover:bg-red-100 hover:text-red-500 group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </aside>

                  <div className="overflow-auto bg-slate-950 p-6">
                    {selectedPending.error ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600">
                        {selectedPending.error}
                      </div>
                    ) : selectedPending.kind === 'binary' ? (
                      <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-center text-slate-300">
                        <FileText className="mb-4 h-10 w-10 text-slate-500" />
                        <p className="text-sm font-semibold">이 파일 형식은 본문 미리보기를 지원하지 않습니다.</p>
                        <p className="mt-1 text-xs text-slate-500">파일명과 분야를 확인한 뒤 승인하면 업로드됩니다.</p>
                      </div>
                    ) : (
                      <pre className="min-h-full whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-900 p-5 font-mono text-xs leading-6 text-slate-100">
                        {selectedPending.content}
                      </pre>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
                  <FileText className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-semibold">업로드할 파일을 선택하세요.</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
                <button
                  onClick={handleCancelPendingUpload}
                  disabled={isUploading}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={isUploading || hasUploadErrors || pendingUploads.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1e40af] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1d3a9e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  승인 후 {pendingUploads.length}개 업로드
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
