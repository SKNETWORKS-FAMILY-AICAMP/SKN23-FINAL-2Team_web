/*
Modification History:
    - 2026-05-14 (김지우) : 다운로드 페이지 히어로 이미지 풀폭 적용 및 중복 다운로드 버튼 제거
    - 2026-05-14 (김지우) : 사용자 가이드 섹션 추가
*/
import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  HardDriveDownload,
  Terminal,
  Zap,
  MousePointerClick,
  LayoutList,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/app/api/client';
import landingMainImage from '@/assets/landing-main.png';

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

/* ────────────────────────────── 가이드 ────────────────────────────── */

const TOC_ITEMS = [
  { id: 'guide-requirements', label: '설치 전 준비사항' },
  { id: 'guide-install',      label: '플러그인 설치 방법' },
  { id: 'guide-features',     label: '주요 기능 및 사용법' },
  { id: 'guide-faq',          label: '자주 묻는 질문' },
];

const MENUS = [
  { path: '[Agent] → [전기 에이전트]', desc: 'KEC 규정 기반 전기 도면 검토' },
  { path: '[Agent] → [배관 에이전트]', desc: '배관 및 설비 정합성 검토' },
  { path: '[Agent] → [건축 에이전트]', desc: '건축 법규 및 공간 데이터 분석' },
  { path: '[Agent] → [소방 에이전트]', desc: '화재 안전 기준(NFSC) 검토' },
  { path: '[Agent] → [시방서/API키 관리]', desc: '환경 설정 및 데이터 관리' },
];

const COMMANDS = [
  { cmd: 'AELEC',       desc: '전기 에이전트 패널 호출' },
  { cmd: 'APIPE',       desc: '배관 에이전트 패널 호출' },
  { cmd: 'AARCH',       desc: '건축 에이전트 패널 호출' },
  { cmd: 'AFIRE',       desc: '소방 에이전트 패널 호출' },
  { cmd: 'AGENTTOGGLE', desc: '에이전트 패널 표시 / 숨기기 토글' },
];

const FAQS = [
  {
    q: '오토캐드를 실행했는데 에이전트 패널이 뜨지 않아요.',
    a: '커맨드 창에 AELEC 을 직접 입력해 보세요. 그래도 반응이 없다면 NETLOAD 명령어를 입력하고 설치 경로의 CadSllmAgent.dll 파일을 수동으로 선택해 로드할 수 있습니다.',
  },
  {
    q: 'AI 분석 속도가 느려요.',
    a: '도면의 객체 수가 너무 많을 경우 분석 시간이 길어질 수 있습니다. CADJSONEXPORTSEL 명령어로 검토가 필요한 특정 영역만 선택해 분석하면 훨씬 빠르게 결과를 얻을 수 있습니다.',
  },
  {
    q: '업데이트는 어떻게 하나요?',
    a: '플러그인 실행 시 서버와 통신해 최신 버전을 자동 확인합니다. 새 버전이 있으면 별도의 재설치 없이 프로그램 내에서 자동으로 업데이트가 진행됩니다.',
  },
];

function Cmd({ children }: { children: React.ReactNode }) {
  return (
    <code className="inline-block rounded bg-zinc-900 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide text-emerald-400">
      {children}
    </code>
  );
}

function SectionBadge({ n, icon: Icon }: { n: number; icon: React.ElementType }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0071e3]/10">
      <Icon className="h-4 w-4 text-[#0071e3]" />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-start justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-zinc-800">Q. {q}</span>
        {open
          ? <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
          : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />}
      </button>
      {open && (
        <p className="pb-4 text-[13px] leading-6 text-zinc-600">
          {a}
        </p>
      )}
    </div>
  );
}

function PluginGuide() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 md:px-6">
      {/* 헤더 */}
      <div className="mb-10 border-t border-zinc-200 pt-14">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
          <BookOpen className="h-3.5 w-3.5" />
          사용자 가이드
        </div>
        <h2 className="text-2xl font-black tracking-tight text-zinc-900 md:text-3xl">
          Cadence AI 오토캐드 플러그인<br className="hidden md:block" /> 설치 및 사용법
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
          Cadence AI는 AutoCAD 환경 내에서 AI가 도면을 실시간으로 검토하고 법규 위반 사항을 자동으로 수정해 주는 엔지니어링 자동화 솔루션입니다.
        </p>
      </div>

      <div className="flex gap-10 lg:gap-16">
        {/* ── 사이드바 목차 (데스크탑) ── */}
        <aside className="hidden w-44 shrink-0 lg:block">
          <div className="sticky top-24">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-zinc-400">목차</p>
            <nav className="space-y-1">
              {TOC_ITEMS.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-md px-2 py-1.5 text-[13px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── 본문 ── */}
        <div className="min-w-0 flex-1 space-y-14">

          {/* 1. 준비사항 */}
          <section id="guide-requirements" className="scroll-mt-24">
            <div className="mb-5 flex items-center gap-3">
              <SectionBadge n={1} icon={CheckCircle2} />
              <h3 className="text-lg font-bold text-zinc-900">설치 전 준비사항</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: '지원 OS', value: 'Windows 10 / 11 (64비트)' },
                { label: '지원 AutoCAD', value: '2025 ~ 2027 (R25.0 ~ R27.0)' },
                { label: '네트워크', value: '설치 및 AI 분석 시 인터넷 필요' },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">{item.label}</p>
                  <p className="text-sm font-semibold text-zinc-800">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 2. 설치 방법 */}
          <section id="guide-install" className="scroll-mt-24">
            <div className="mb-5 flex items-center gap-3">
              <SectionBadge n={2} icon={LayoutList} />
              <h3 className="text-lg font-bold text-zinc-900">플러그인 설치 방법</h3>
            </div>
            <ol className="space-y-4">
              {[
                {
                  step: '설치 파일 실행',
                  desc: <>다운로드한 <Cmd>CadSllmAgent.Installer.exe</Cmd> 파일을 실행합니다.</>,
                },
                {
                  step: '자동 설치 진행',
                  desc: '설치 창이 나타나면 최신 버전의 플러그인을 자동으로 다운로드하고 설치합니다. 별도의 경로 지정 없이 AutoCAD 표준 플러그인 폴더에 자동 설치됩니다.',
                },
                {
                  step: '설치 완료 확인',
                  desc: <>콘솔에 <span className="font-semibold text-emerald-600">설치 완료</span> 메시지가 나타나면 아무 키나 눌러 창을 닫습니다.</>,
                },
                {
                  step: 'AutoCAD 재실행',
                  desc: 'AutoCAD를 실행합니다. 이미 실행 중이라면 종료 후 다시 실행해 주세요.',
                },
              ].map((item, i) => (
                <li key={item.step} className="flex gap-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0071e3] text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm font-semibold text-zinc-900">{item.step}</p>
                    <p className="mt-1 text-[13px] leading-6 text-zinc-500">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* 3. 주요 기능 */}
          <section id="guide-features" className="scroll-mt-24">
            <div className="mb-5 flex items-center gap-3">
              <SectionBadge n={3} icon={Zap} />
              <h3 className="text-lg font-bold text-zinc-900">주요 기능 및 사용법</h3>
            </div>

            <div className="space-y-8">
              {/* ① 메뉴 사용 */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700">①</span>
                  <h4 className="text-sm font-bold text-zinc-800">에이전트 실행 (메뉴 사용)</h4>
                </div>
                <p className="mb-3 text-[13px] leading-6 text-zinc-500">
                  AutoCAD 상단 메뉴바에 새롭게 추가된 <span className="font-semibold text-zinc-700">[Agent]</span> 메뉴를 확인하세요.
                  명령어를 입력하지 않아도 마우스 클릭만으로 모든 기능을 실행할 수 있습니다.
                </p>
                <div className="overflow-hidden rounded-xl border border-zinc-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50">
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-400">메뉴 경로</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-400">기능</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {MENUS.map(row => (
                        <tr key={row.path} className="transition-colors hover:bg-zinc-50">
                          <td className="px-4 py-3">
                            <code className="text-[12px] font-semibold text-zinc-700">{row.path}</code>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-zinc-600">{row.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* NOTE */}
                <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <span className="mt-0.5 shrink-0 text-[11px] font-bold uppercase tracking-wider text-amber-600">NOTE</span>
                  <p className="text-[13px] leading-5 text-amber-800">
                    상단에 <span className="font-semibold">[Agent]</span> 메뉴가 보이지 않는다면, AutoCAD 명령창에{' '}
                    <Cmd>MENUBAR</Cmd>를 입력하고 값을 <span className="font-semibold">1</span>로 설정해 주세요.
                  </p>
                </div>
              </div>

              {/* ② 명령어 (숙련자용) */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700">②</span>
                  <h4 className="text-sm font-bold text-zinc-800">AI 에이전트 활용 (명령어 — 숙련자용)</h4>
                </div>
                <p className="mb-3 text-[13px] leading-6 text-zinc-500">
                  메뉴 대신 명령어를 직접 입력해 빠르게 실행할 수 있습니다.
                </p>
                <div className="overflow-hidden rounded-xl border border-zinc-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50">
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-400">명령어</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-400">기능</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {COMMANDS.map(row => (
                        <tr key={row.cmd} className="transition-colors hover:bg-zinc-50">
                          <td className="px-4 py-3"><Cmd>{row.cmd}</Cmd></td>
                          <td className="px-4 py-3 text-[13px] text-zinc-600">{row.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* 4. FAQ */}
          <section id="guide-faq" className="scroll-mt-24">
            <div className="mb-5 flex items-center gap-3">
              <SectionBadge n={4} icon={Terminal} />
              <h3 className="text-lg font-bold text-zinc-900">자주 묻는 질문 (FAQ)</h3>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white px-5">
              {FAQS.map(faq => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
            </div>
          </section>

          {/* TIP 콜아웃 */}
          <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50 p-5">
            <MousePointerClick className="mt-0.5 h-5 w-5 shrink-0 text-[#0071e3]" />
            <div>
              <p className="text-sm font-bold text-blue-900">고객 지원</p>
              <p className="mt-1 text-[13px] leading-6 text-blue-700">
                사용 중 오류가 발생하거나 기능 제안이 필요하시면 웹사이트의{' '}
                <a href="/inquiries" className="font-semibold underline underline-offset-2">1:1 고객 문의</a>{' '}
                게시판을 이용해 주세요. 담당 엔지니어가 신속하게 답변해 드립니다.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */

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
    <div className="space-y-10">
      <section className="relative min-h-[460px] overflow-hidden bg-zinc-950">
        <img
          src={landingMainImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-100 brightness-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5" />

        <div className="relative z-10 flex min-h-[460px] max-w-3xl flex-col justify-center px-6 py-12 text-white sm:px-10 md:px-14 lg:px-20 xl:px-24">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur">
            <HardDriveDownload className="h-3.5 w-3.5" />
            Cadence AI Agent
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
            AutoCAD 플러그인 다운로드
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/80 md:text-base">
            에이전트를 이용하면 도면 검토 및 수정, 검색 등을 할 수 있습니다.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || isLoading || !installerReady}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/80 bg-white px-5 py-3 text-sm font-bold text-zinc-950 shadow-lg transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:border-white/30 disabled:bg-white/20 disabled:text-white/50"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? '다운로드 준비 중...' : 'Windows 설치 .exe 다운로드'}
            </button>
            <span className="text-xs font-medium text-white/60">
              {metadata?.file_size ? formatBytes(metadata.file_size) : 'EXE'}
            </span>
          </div>
          {(loadError || !installerReady) && (
            <p className="mt-4 text-xs font-medium text-amber-300">
              {loadError || '설치 프로그램이 아직 빌드되지 않았습니다.'}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-4 md:px-6">
        <section className="border-y border-zinc-200 bg-white py-7">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px] md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0071e3]">
                <HardDriveDownload className="h-3.5 w-3.5" />
                Windows 설치 파일
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Cadence AI Installer</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
                설치 파일을 실행하면 최신 Autodesk AutoCAD 2027 플러그인 번들이 자동으로 내려받아집니다.
              </p>

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
                  <dd className="font-semibold text-zinc-900">{metadata?.cad || 'AutoCAD 2027 for Windows'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-zinc-500">파일 형식</dt>
                  <dd className="font-semibold text-zinc-900">{metadata?.file_format || '.exe'}</dd>
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

      {/* ─── 사용자 가이드 ─── */}
      <PluginGuide />
    </div>
  );
};
