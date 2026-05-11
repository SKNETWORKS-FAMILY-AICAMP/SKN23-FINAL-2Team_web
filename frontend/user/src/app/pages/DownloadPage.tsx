import { LandingNav } from '@/app/components/landing/LandingNav';
import { LandingFooter } from '@/app/components/landing/LandingFooter';
import { UserDownloadTab } from '@/app/components/profile/user/UserDownloadTab';
import { useAuth } from '@/app/context/AuthContext';

export default function DownloadPage() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <LandingNav isAuthenticated={isAuthenticated} user={user} logout={logout} />
      <main className="mx-auto max-w-4xl px-4 pb-12 pt-24 md:px-6">
        <UserDownloadTab />
      </main>
      <LandingFooter />
    </div>
  );
}
