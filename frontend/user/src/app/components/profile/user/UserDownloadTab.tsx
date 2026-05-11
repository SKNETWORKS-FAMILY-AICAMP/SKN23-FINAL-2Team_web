import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  HardDriveDownload,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/app/api/client';

type PluginMetadata = {
  name: string;
  version?: string;
  platform: string;
  cad: string;
  mac_supported: boolean;
  file_format?: string;
  file_size?: number | null;
  installer_ready?: boolean;
  bundle_ready: boolean;
};

const formatBytes = (bytes?: number | null) => {
  if (!bytes) return '파일 크기 확인 중';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const getFilenameFromDisposition = (disposition: string) => {
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);

  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] || 'CadenceAI-AutoCAD-Installer.exe';
};

export const UserDownloadTab: React.FC = () => {
  const [metadata, setMetadata] = useState<PluginMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/plugin/metadata`);

        if (!response.ok) {
          throw new Error(`Metadata failed: ${response.status}`);
        }

        const data = await response.json();
        setMetadata(data);
      } catch (error) {
        console.error('Failed to load plugin metadata', error);
        setLoadError('설치 파일 정보를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/plugin/installer/download`);

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail || `Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const filename = getFilenameFromDisposition(disposition);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('설치 프로그램 다운로드를 시작했습니다.');
    } catch (error) {
      console.error('Plugin installer download failed', error);
      toast.error('다운로드 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  const installerReady = metadata?.installer_ready !== false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">AutoCAD 플러그인 다운로드</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-500">
          Windows 설치 프로그램을 내려받아 Cadence AI AutoCAD 플러그인을 설치할 수 있습니다.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0071e3]">
              <HardDriveDownload className="h-3.5 w-3.5" />
              Windows 설치 파일
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Cadence AI Installer</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
              설치 파일을 실행하면 최신 AutoCAD 플러그인 번들이 자동으로 내려받아집니다.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading || isLoading || !installerReady}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0071e3] px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? '다운로드 준비 중...' : 'Windows 설치 EXE 다운로드'}
              </button>
              <span className="text-xs text-zinc-400">
                {metadata?.file_size ? formatBytes(metadata.file_size) : 'EXE'}
              </span>
            </div>

            {(loadError || !installerReady) && (
              <p className="mt-4 text-xs font-medium text-amber-600">
                {loadError || '설치 프로그램이 아직 빌드되지 않았습니다.'}
              </p>
            )}
          </div>

          <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500">지원 환경</dt>
                <dd className="font-semibold text-zinc-900">{metadata?.platform || 'Windows 10/11 64-bit'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500">지원 CAD</dt>
                <dd className="font-semibold text-zinc-900">{metadata?.cad || 'AutoCAD for Windows'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-zinc-500">파일 형식</dt>
                <dd className="font-semibold text-zinc-900">{metadata?.file_format || 'EXE'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">macOS는 현재 지원하지 않습니다</p>
            <p className="mt-1 text-xs leading-5 text-amber-700">
              현재 플러그인은 Windows AutoCAD 전용입니다.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#0071e3]" />
          <h2 className="text-sm font-semibold text-zinc-900">설치 흐름</h2>
        </div>
        <ol className="grid gap-3 text-sm text-zinc-600 md:grid-cols-3">
          {[
            'Windows 설치 파일을 다운로드합니다.',
            '설치 프로그램을 실행합니다.',
            'AutoCAD를 다시 시작해 플러그인을 확인합니다.',
          ].map((item, index) => (
            <li key={item} className="rounded-lg bg-zinc-50 p-4">
              <span className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-[#0071e3] ring-1 ring-zinc-200">
                {index + 1}
              </span>
              <p className="text-xs leading-5 text-zinc-600">{item}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
