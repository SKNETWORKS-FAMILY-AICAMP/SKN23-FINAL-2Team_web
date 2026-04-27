import React, { useState } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/app/components/ui/input-otp';
import { useAdminAuth } from '@/app/context/AdminAuthContext';
import { toast } from 'sonner';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface PinLoginFormProps {
  onSuccess: () => void;
}

export const PinLoginForm: React.FC<PinLoginFormProps> = ({ onSuccess }) => {
  const { adminLogin } = useAdminAuth();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6) {
      toast.error('6자리 PIN을 모두 입력해주세요.');
      return;
    }
    setIsLoading(true);
    const result = await adminLogin(pin);
    setIsLoading(false);
    if (result.success) {
      toast.success('관리자 인증 완료');
      onSuccess();
    } else {
      toast.error(result.message ?? 'PIN이 올바르지 않습니다.');
      setPin('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-full bg-[#0071e3]/10 flex items-center justify-center mb-2">
          <ShieldCheck className="w-7 h-7 text-[#0071e3]" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">관리자 인증</h1>
        <p className="text-sm text-zinc-400">6자리 PIN 번호를 입력하세요</p>
      </div>

      <InputOTP
        maxLength={6}
        value={pin}
        onChange={setPin}
        disabled={isLoading}
      >
        <InputOTPGroup className="gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className="w-12 h-14 text-xl bg-white/[0.04] border-white/10 text-white rounded-lg"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>

      <button
        type="submit"
        disabled={isLoading || pin.length < 6}
        className="w-full max-w-xs bg-[#0071e3] text-white py-3 rounded-lg font-semibold
                   hover:bg-[#0077ed] transition-all disabled:opacity-40 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            인증 중...
          </>
        ) : '입장하기'}
      </button>
    </form>
  );
};
