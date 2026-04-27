/*
File    : src/app/components/profile/user/UserAccountTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - 계정 설정 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
 */
import React from 'react';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

interface AccountTabProps {
  user: any;
  setShowPasswordModal: (show: boolean) => void;
  setShowDeleteModal: (show: boolean) => void;
  setCertFile: (file: File | null) => void;
  certFile: File | null;
}

export const UserAccountTab: React.FC<AccountTabProps> = ({
  user,
  setShowPasswordModal,
  setShowDeleteModal,
  setCertFile,
  certFile
}) => {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <h2 className="text-2xl font-bold mb-6">계정 설정</h2>
      <div className="grid gap-6 max-w-2xl">
        {/* 로그인 정보 */}
        <div className="bg-white border border-zinc-200 shadow-sm p-6 rounded-2xl flex items-center justify-between">
          <div>
            <label className="text-sm text-zinc-500 font-bold block mb-1">로그인 이메일</label>
            <div className="text-lg font-medium text-zinc-900">{user?.email || 'N/A'}</div>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg text-sm flex items-center gap-2 text-zinc-700 transition-colors"
          >
            <Lock className="w-4 h-4" /> 비밀번호 변경
          </button>
        </div>

        {/* 기업 정보 */}
        <div className="bg-white border border-zinc-200 shadow-sm p-6 rounded-2xl space-y-4">
          <div>
            <label className="text-sm text-zinc-500 font-bold block mb-1">기업명</label>
            <div className="text-lg font-medium text-zinc-900">{user?.companyName || 'N/A'}</div>
          </div>

          <div className="pt-4 border-t border-zinc-200">
            <label className="text-sm text-zinc-500 font-bold block mb-3">사업자등록증 관리</label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-600 file:bg-zinc-100 file:text-zinc-700 file:px-4 file:py-2 file:mr-4 file:rounded-l-lg hover:file:bg-zinc-200 w-full max-w-sm"
                />
                <button
                  disabled={!certFile}
                  onClick={() => toast.info('파일이 첨부되었습니다. 관리자 승인이 다시 필요합니다.')}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${certFile ? 'bg-[#0071e3] text-white hover:brightness-110' : 'bg-white/5 text-zinc-600'
                    }`}
                >
                  변경하기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 위험 구역 */}
        <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="font-bold text-red-500">회원 탈퇴</h4>
            <p className="text-sm text-zinc-500 mt-1">계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold"
          >
            탈퇴 신청
          </button>
        </div>
      </div>
    </div>
  );
};
