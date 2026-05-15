/*
File    : src/app/components/profile/user/UserSecurityTab.tsx
Author  : 김지우
Create  : 2026-05-15
Description : 마이페이지 - 보안 탭 컴포넌트

Modification History:
    - 2026-05-15 (김지우) : 기업명/기업 이메일/비밀번호 변경 UI 및 이메일 인증 모달 추가
    - 2026-05-15 (김지우) : 로그인 섹션 하단에 계정 삭제 항목 추가
    - 2026-05-15 (김지우) : 로그인 정보 카드의 글자 크기와 행 높이를 계정 삭제 항목 기준으로 축소
    - 2026-05-15 (김지우) : 담당자 이름/이메일 변경 항목 및 담당자 이메일 우선 인증 안내 추가
    - 2026-05-15 (김지우) : 담당자 정보를 로그인 섹션 아래 별도 항목으로 분리
*/
import React, { useState } from 'react';
import { Building2, Mail, Pencil, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';

type SecurityField = 'company' | 'email' | 'password' | 'contactName' | 'contactEmail';

type ProfileUpdatePayload = {
  code: string;
  company_name?: string;
  email?: string;
  new_password?: string;
  contact_name?: string;
  contact_email?: string;
};

interface UserSecurityTabProps {
  user: any;
  onRequestCode: () => Promise<boolean>;
  onUpdateProfile: (payload: ProfileUpdatePayload) => Promise<boolean>;
  setShowDeleteModal: (show: boolean) => void;
}

const passwordMask = '**************';

export const UserSecurityTab: React.FC<UserSecurityTabProps> = ({
  user,
  onRequestCode,
  onUpdateProfile,
  setShowDeleteModal,
}) => {
  const [editingField, setEditingField] = useState<SecurityField | null>(null);
  const [value, setValue] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const companyName = user?.companyName || user?.company_name || '';
  const email = user?.email || '';
  const contactName = user?.contactName || user?.contact_name || '';
  const contactEmail = user?.contactEmail || user?.contact_email || '';
  const verificationTargetEmail = contactEmail || email;

  const closeModal = () => {
    setEditingField(null);
    setValue('');
    setPasswordConfirm('');
    setCode('');
    setCodeSent(false);
    setIsSending(false);
    setIsSaving(false);
  };

  const openEditor = (field: SecurityField) => {
    setEditingField(field);
    setValue(
      field === 'company'
        ? companyName
        : field === 'email'
          ? email
          : field === 'contactName'
            ? contactName
            : field === 'contactEmail'
              ? contactEmail
              : ''
    );
    setPasswordConfirm('');
    setCode('');
    setCodeSent(false);
  };

  const validatePassword = (nextPassword: string) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return regex.test(nextPassword);
  };

  const handleSendCode = async () => {
    setIsSending(true);
    try {
      const ok = await onRequestCode();
      if (ok) setCodeSent(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleSave = async () => {
    if (!editingField) return;

    if (code.length !== 6) {
      toast.error('이메일로 받은 6자리 인증 코드를 입력해주세요.');
      return;
    }

    const trimmedValue = value.trim();
    const payload: ProfileUpdatePayload = { code };

    if (editingField === 'company') {
      if (!trimmedValue) {
        toast.error('기업명을 입력해주세요.');
        return;
      }
      payload.company_name = trimmedValue;
    }

    if (editingField === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) {
        toast.error('올바른 이메일 주소를 입력해주세요.');
        return;
      }
      payload.email = trimmedValue;
    }

    if (editingField === 'contactName') {
      if (!trimmedValue) {
        toast.error('담당자 이름을 입력해주세요.');
        return;
      }
      payload.contact_name = trimmedValue;
    }

    if (editingField === 'contactEmail') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) {
        toast.error('올바른 담당자 이메일 주소를 입력해주세요.');
        return;
      }
      payload.contact_email = trimmedValue;
    }

    if (editingField === 'password') {
      if (!validatePassword(value)) {
        toast.error('비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.');
        return;
      }
      if (value !== passwordConfirm) {
        toast.error('비밀번호가 일치하지 않습니다.');
        return;
      }
      payload.new_password = value;
    }

    setIsSaving(true);
    try {
      const ok = await onUpdateProfile(payload);
      if (ok) closeModal();
    } finally {
      setIsSaving(false);
    }
  };

  const loginRows = [
    {
      key: 'company' as const,
      label: '기업명',
      value: companyName || 'N/A',
      Icon: Building2,
      required: true,
    },
    {
      key: 'email' as const,
      label: '기업 이메일',
      value: email || 'N/A',
      Icon: Mail,
      required: true,
    },
    {
      key: 'password' as const,
      label: '비밀번호',
      value: passwordMask,
      Icon: ShieldCheck,
      required: true,
    },
  ];

  const contactRows = [
    {
      key: 'contactName' as const,
      label: '담당자 이름',
      value: contactName || '미등록',
      Icon: UserRound,
      required: false,
    },
    {
      key: 'contactEmail' as const,
      label: '담당자 이메일',
      value: contactEmail || '미등록',
      Icon: Mail,
      required: false,
    },
  ];

  const editingTitle = editingField === 'company'
    ? '기업명 변경'
    : editingField === 'email'
      ? '기업 이메일 변경'
      : editingField === 'contactName'
        ? '담당자 이름 변경'
        : editingField === 'contactEmail'
          ? '담당자 이메일 변경'
          : '비밀번호 변경';

  const renderRows = (
    rows: Array<{
      key: SecurityField;
      label: string;
      value: string;
      Icon: typeof Building2;
      required: boolean;
    }>
  ) => (
    <div className="mt-5 border-t border-zinc-200">
      {rows.map(({ key, label, value: rowValue, Icon, required }) => (
            <div key={key} className="grid min-h-[66px] grid-cols-[180px_minmax(0,1fr)_44px] items-center border-b border-zinc-200">
              <div className="flex items-center gap-2.5 pr-5 text-sm font-black text-zinc-900">
                <Icon className="h-4 w-4 text-zinc-500" />
                <span>
                  {label}{' '}
                  <span className="font-medium text-zinc-500">
                    {required ? '(필수)' : '(선택)'}
                  </span>
                </span>
              </div>
              <div className="border-l border-zinc-300 px-5 text-sm font-semibold text-zinc-900">
                {rowValue}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => openEditor(key)}
                  className="inline-flex h-8 w-8 items-center justify-center bg-zinc-950 text-white transition-colors hover:bg-zinc-800"
                  aria-label={`${label} 변경`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="border border-zinc-200/80 bg-white px-7 py-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <h2 className="text-base font-black text-zinc-900">로그인</h2>
        <p className="mt-2 max-w-5xl text-sm leading-6 text-zinc-500">
          계정 또는 보안 영역에 접근하려면 기업명, 기업 이메일 및 비밀번호를 사용합니다.
          이 정보를 변경하면 Cadence AI에 로그인하는 방법이 변경됩니다.
        </p>

        {renderRows(loginRows)}
      </section>

      <section className="border border-zinc-200/80 bg-white px-7 py-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <h2 className="text-base font-black text-zinc-900">담당자</h2>
        <p className="mt-2 max-w-5xl text-sm leading-6 text-zinc-500">
          담당자 이메일이 등록되면 계정 정보 변경 인증 코드는 담당자 이메일로 발송됩니다.
        </p>

        {renderRows(contactRows)}
      </section>

      <section className="flex items-center justify-between border border-zinc-200/80 bg-white px-7 py-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div>
          <p className="flex items-center gap-2 text-base font-black text-zinc-900">
            <Trash2 className="h-5 w-5 text-zinc-500" />
            계정 삭제
          </p>
          <p className="mt-2 text-sm text-zinc-500">계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-1 border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-50"
        >
          계정 삭제
        </button>
      </section>

      {editingField && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg border border-zinc-200 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,0.30)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-zinc-950">{editingTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  담당자 이메일이 등록되어 있으면 담당자 이메일로 인증 코드가 발송됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-7 space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-500">
                  {verificationTargetEmail || '인증 이메일 없음'}
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSending || !verificationTargetEmail}
                  className="border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSending ? '발송 중...' : codeSent ? '재발송' : '코드 발송'}
                </button>
              </div>

              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="인증 코드 6자리"
                className="h-12 w-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950"
              />

              {editingField === 'password' ? (
                <>
                  <input
                    type="password"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="새 비밀번호 (영문+숫자+특수문자 8자 이상)"
                    className="h-12 w-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950"
                  />
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                    placeholder="새 비밀번호 확인"
                    className="h-12 w-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950"
                  />
                </>
              ) : (
                <input
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={
                    editingField === 'company'
                      ? '새 기업명'
                      : editingField === 'email'
                        ? '새 기업 이메일'
                        : editingField === 'contactName'
                          ? '담당자 이름'
                          : '담당자 이메일'
                  }
                  className="h-12 w-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950"
                />
              )}
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? '변경 중...' : '변경하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
