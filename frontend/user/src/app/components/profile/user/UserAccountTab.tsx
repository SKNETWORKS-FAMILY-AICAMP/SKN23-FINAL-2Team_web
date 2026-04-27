/*
File    : src/app/components/profile/user/UserAccountTab.tsx
Author  : 김민정
Create  : 2026-04-23
Description : 마이페이지 - 계정 설정 탭 컴포넌트

Modification History:
    - 2026-04-23 (김민정) : 모듈화 작업으로 인한 파일 분리 생성
 */
import React from 'react';
import { Lock, FileDown } from 'lucide-react';
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
            <div className="text-lg font-medium text-zinc-900">{user?.companyName ? `${user.companyName}` : 'N/A'}</div>
          </div>

          <div className="pt-4 border-t border-zinc-200">
            <label className="text-sm text-zinc-500 font-bold block mb-3">사업자등록증 관리</label>
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-400">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-zinc-400 font-medium">현재 등록된 파일</div>
                  <div className="text-sm font-bold text-zinc-700 truncate max-w-[300px]">
                    {user?.business_reg_s3_url?.split('/').pop() || '등록된 파일 없음'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                  user?.verification_status === 'verified' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {user?.verification_status === 'verified' ? '인증 완료' : '인증 대기'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 pl-1">
              * 등록된 정보는 관리자 승인 절차를 거쳐 보호되고 있습니다. 변경이 필요한 경우 고객센터로 문의해주세요.
            </p>
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
