import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import GenerativeMountainScene from '@/components/ui/mountain-scene';
import logo from '@/assets/LogoSeaofGlass.png';
import {
  Users, Heart, Star, Building2, Shield, GraduationCap,
  Globe, Music, Activity, HandHeart, UserCircle,
} from 'lucide-react';

interface PortalCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: 'cerise' | 'black';
}

const ACTIVE_PORTALS: PortalCard[] = [
  {
    id: 'mg',
    title: "Men's Group",
    description: 'MG department member and leader access',
    icon: <Users size={22} />,
    accent: 'cerise',
  },
  {
    id: 'wg',
    title: "Women's Group",
    description: 'WG department member and leader access',
    icon: <Users size={22} />,
    accent: 'black',
  },
  {
    id: 'yg',
    title: 'Youth Group',
    description: 'YG department member and leader access',
    icon: <Star size={22} />,
    accent: 'cerise',
  },
  {
    id: 'sng',
    title: 'Seniors Group',
    description: 'SNG department member and leader access',
    icon: <Heart size={22} />,
    accent: 'black',
  },
  {
    id: 'ministries',
    title: 'Ministries',
    description: 'All 24 ministry leaders and members',
    icon: <Building2 size={22} />,
    accent: 'cerise',
  },
  {
    id: 'admin',
    title: 'Church Administration',
    description: 'GSN, SMN and administrative access',
    icon: <Shield size={22} />,
    accent: 'black',
  },
  {
    id: 'member',
    title: 'Member Portal',
    description: 'Your announcements, videos, fruits & attendance',
    icon: <UserCircle size={22} />,
    accent: 'cerise',
  },
];

const COMING_SOON = [
  { title: 'Students Group', icon: <GraduationCap size={18} /> },
  { title: 'International Department', icon: <Globe size={18} /> },
  { title: 'Praise & Worship', icon: <Music size={18} /> },
  { title: 'Sports Ministry', icon: <Activity size={18} /> },
  { title: 'Health & Welfare', icon: <HandHeart size={18} /> },
];

function todayLabel(): string {
  return new Date().toLocaleDateString('en-ZA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

const PortalPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-sky-50 relative overflow-hidden">
      {/* ── Background Mountain Scene ──────────────────────────────── */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<div className="w-full h-full bg-sky-50" />}>
          <GenerativeMountainScene />
        </Suspense>
      </div>

      {/* ── Content on top ────────────────────────────────────────── */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="border-b border-black/5 px-6 lg:px-10 py-4 flex items-center justify-between bg-white/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-10 h-10 flex-shrink-0" />
          <div>
            <p className="font-heading text-[20px] font-semibold text-black leading-tight">
              Sea of Glass Rustenburg
            </p>
            <p className="font-body text-[13px] text-black/60 leading-tight">
              New Heaven and New Earth
            </p>
          </div>
        </div>
        <p className="hidden sm:block font-body text-[13px] text-black/60">{todayLabel()}</p>
      </header>

      {/* ── Main ───────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 lg:px-10 py-12">

        {/* Section heading */}
        <div className="flex items-start gap-4 mb-10">
          <div className="w-[3px] self-stretch rounded-full bg-[#de3163] flex-shrink-0 mt-1" />
          <div>
            <h1 className="font-heading text-[32px] font-bold text-black leading-tight">
              Welcome
            </h1>
            <p className="font-body text-[16px] text-black/70 mt-1">
              Select your portal to continue
            </p>
          </div>
        </div>

        {/* ── Active portal cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {ACTIVE_PORTALS.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/login?portal=${p.id}`)}
              className={`
                group text-left bg-white/60 backdrop-blur-md border border-black/5 rounded-[10px] p-5
                transition-all duration-150
                hover:shadow-md hover:border-[#de3163] hover:bg-white/80 hover:translate-y-[-2px]
                focus:outline-none focus:ring-2 focus:ring-[#de3163]/30
              `}
            >
              {/* Icon */}
              <div
                className={`
                  w-11 h-11 rounded-[8px] flex items-center justify-center mb-4 text-white
                  ${p.accent === 'cerise' ? 'bg-[#de3163]' : 'bg-[#0A0A0A]'}
                `}
              >
                {p.icon}
              </div>

              {/* Text */}
              <p className="font-heading text-[15px] font-semibold text-black leading-snug mb-1">
                {p.title}
              </p>
              <p className="font-body text-[13px] text-black/60 leading-snug">
                {p.description}
              </p>

              {/* Hover arrow */}
              <p className="font-body text-[12px] text-[#de3163] mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                Sign in →
              </p>
            </button>
          ))}
        </div>

        {/* ── Coming soon ─────────────────────────────────────────── */}
        <div className="mb-4">
          <p className="font-heading text-[12px] font-semibold uppercase tracking-[0.1em] text-black/40 mb-3">
            Coming Soon
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {COMING_SOON.map((c) => (
              <div
                key={c.title}
                className="relative bg-black/5 backdrop-blur-md border border-black/5 rounded-[10px] p-4 opacity-60"
              >
                <div className="w-9 h-9 rounded-[6px] bg-black/5 flex items-center justify-center text-black/50 mb-3">
                  {c.icon}
                </div>
                <p className="font-heading text-[13px] font-medium text-black/60 leading-snug mb-2">
                  {c.title}
                </p>
                <span className="inline-block text-[10px] font-heading font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/10 text-black/50">
                  Coming Soon
                </span>
              </div>
            ))}
          </div>
        </div>

      </main>
      </div>
    </div>
  );
};

export default PortalPage;
