import React, { useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GenerativeMountainScene from '@/components/ui/mountain-scene';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '@/assets/LogoSeaofGlass.png';
import type { Role, UserSession } from '@/data/types';

// ── Portal config ──────────────────────────────────────────────────────────

interface PortalConfig {
  label: string;
  allowedRoles: Role[];
  /** 'any' means role is sufficient regardless of department */
  departments?: string[];
}

const PORTALS: Record<string, PortalConfig> = {
  mg: {
    label: "Men's Group",
    allowedRoles: ['HJN', 'SGN', 'IWN', 'GYJN', 'MEMBER'],
    departments: ['MG'],
  },
  wg: {
    label: "Women's Group",
    allowedRoles: ['HJN', 'SGN', 'IWN', 'GYJN', 'MEMBER'],
    departments: ['WG'],
  },
  yg: {
    label: 'Youth Group',
    allowedRoles: ['HJN', 'SGN', 'IWN', 'GYJN', 'MEMBER'],
    departments: ['YG'],
  },
  sng: {
    label: 'Seniors Group',
    allowedRoles: ['HJN', 'SGN', 'IWN', 'GYJN', 'MEMBER'],
    departments: ['SNG'],
  },
  ministries: {
    label: 'Ministries',
    allowedRoles: ['BJN', 'JDSN', 'GGN', 'JJN', 'CULTURE'],
  },
  admin: {
    label: 'Church Administration',
    allowedRoles: ['GSN', 'SMN'],
  },
  member: {
    label: 'Members',
    allowedRoles: ['MEMBER'],
  },
};

function roleHome(role: Role): string {
  if (role === 'GSN' || role === 'SMN') return '/dashboard';
  if (role === 'BJN' || role === 'JJN' || role === 'GGN') return '/evangelism';
  if (role === 'MEMBER') return '/member';
  if (role === 'JDSN' || role === 'CULTURE') return '/announcements';
  return '/attendance';
}

// ── Component ──────────────────────────────────────────────────────────────

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const portalId = params.get('portal') ?? '';
  const portal   = PORTALS[portalId] ?? null;

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const session: UserSession | null = await login(email, password);

    if (!session) {
      setError('Invalid email or password');
      return;
    }

    // Portal validation — role AND department must match the portal
    if (portal) {
      const roleOk = portal.allowedRoles.includes(session.role);
      const deptOk = !portal.departments ||
        portal.departments.includes(session.department as string);

      if (!roleOk || !deptOk) {
        setError(
          'Your account is not registered for this portal. ' +
          'Please return to the portal selection and choose the correct one.'
        );
        return;
      }
    }

    navigate(roleHome(session.role));
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: '#f0f9ff' }}
      >
        <div className="absolute inset-0 z-0">
          <Suspense fallback={<div className="w-full h-full bg-[#f0f9ff]" />}>
            <GenerativeMountainScene />
          </Suspense>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-md p-12 rounded-2xl border border-black/5 text-center">
          <img
            src={logo}
            alt="Sea of Glass Logo"
            className="w-20 h-20 mb-6 mx-auto"
          />
        <h1 className="font-heading text-2xl font-semibold text-black">
          Sea of Glass Rustenburg
        </h1>
          <p className="font-body text-sm mt-2" style={{ color: 'rgba(0,0,0,0.6)' }}>
            New Heaven and New Earth
          </p>
        </div>

        {portal && (
          <div className="absolute bottom-10 left-0 right-0 px-10">
            <div className="border border-black/5 bg-white/40 backdrop-blur-md rounded-[8px] px-5 py-3 text-center">
              <p className="font-body text-[12px] text-black/50 uppercase tracking-wider mb-1">Portal</p>
              <p className="font-heading text-[16px] font-semibold text-black">{portal.label}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-card">

        {/* Back link */}
        <div className="px-6 pt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-body text-[13px] text-[#6B7280] hover:text-black transition-colors"
          >
            <ArrowLeft size={14} />
            Portal selection
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-sm">

            {/* Mobile logo */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <img src={logo} alt="Sea of Glass Logo" className="w-14 h-14 mb-3" />
              <h1 className="font-heading text-xl font-semibold text-foreground">
                Sea of Glass Rustenburg
              </h1>
              <p className="font-body text-xs text-muted-foreground mt-1">New Heaven and New Earth</p>
            </div>

            {/* Portal badge */}
            {portal ? (
              <div className="mb-6">
                <span className="inline-block text-[11px] font-heading font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-[#de3163]/10 text-[#de3163]">
                  {portal.label} Portal
                </span>
              </div>
            ) : (
              <div className="mb-2" />
            )}

            <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Sign in</h2>
            <p className="font-body text-sm text-muted-foreground mb-8">
              Enter your credentials to access the dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-heading text-sm font-medium text-foreground block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-card text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="font-heading text-sm font-medium text-foreground block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-card text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <p className="text-destructive text-sm font-body leading-snug">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Sign in
              </button>
            </form>

            <p className="text-xs text-muted-foreground font-body mt-8 text-center">
              Demo — Admin: thabo@example.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
