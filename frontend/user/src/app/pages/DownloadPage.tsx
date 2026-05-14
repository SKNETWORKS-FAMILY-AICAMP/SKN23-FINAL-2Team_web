/*
Modification History:
    - 2026-05-14 (김지우) : 다운로드 페이지 배경색 및 풀폭 히어로 레이아웃 적용
*/
import { LandingNav } from '@/app/components/landing/LandingNav';
import { LandingFooter } from '@/app/components/landing/LandingFooter';
import { UserDownloadTab } from '@/app/components/profile/user/UserDownloadTab';
import { useAuth } from '@/app/context/AuthContext';

export default function DownloadPage() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <LandingNav isAuthenticated={isAuthenticated} user={user} logout={logout} />
      <main className="pb-12 pt-[60px]">
        <UserDownloadTab />
      </main>
      <LandingFooter />
    </div>
  );
}
