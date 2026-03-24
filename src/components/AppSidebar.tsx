import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMinistries } from '@/hooks/useMinistries';
import logo from '@/assets/LogoSeaofGlass.png';
import {
  LayoutDashboard, Users, Building2, ClipboardCheck, BookOpen,
  TrendingUp, GraduationCap, Briefcase, FileText, Megaphone,
  Settings, LogOut, Lock, X, Wallet,
} from 'lucide-react';
import { Role } from '@/data/types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: Role[];
  locked?: boolean;
}

const staticNavSections: Array<{ section: string; items: NavItem[] }> = [
  {
    section: 'Church Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['GSN', 'SMN'] },
      { label: 'All Members', path: '/members', icon: <Users size={18} />, roles: ['GSN', 'SMN'] },
    ],
  },
  {
    section: 'Departments',
    items: [
      { label: "Men's Group", path: '/departments/MG', icon: <Building2 size={18} />, roles: ['GSN', 'SMN', 'HJN', 'SGN', 'IWN', 'GYJN'] },
      { label: "Women's Group", path: '/departments/WG', icon: <Building2 size={18} />, roles: ['GSN', 'SMN', 'HJN', 'SGN', 'IWN', 'GYJN'] },
      { label: 'Youth Group', path: '/departments/YG', icon: <Building2 size={18} />, roles: ['GSN', 'SMN', 'HJN', 'SGN', 'IWN', 'GYJN'] },
      { label: 'Seniors Group', path: '/departments/SNG', icon: <Building2 size={18} />, roles: ['GSN', 'SMN', 'HJN', 'SGN', 'IWN', 'GYJN'] },
      { label: 'Students', path: '/departments/STUDENTS', icon: <Building2 size={18} />, roles: ['GSN', 'SMN', 'HJN', 'SGN', 'IWN', 'GYJN'] },
    ],
  },
  {
    section: 'Tracking',
    items: [
      { label: 'Attendance', path: '/attendance', icon: <ClipboardCheck size={18} />, roles: ['GSN', 'SMN', 'HJN', 'SGN', 'IWN', 'GYJN'] },
      { label: 'Daily Bread', path: '/daily-bread', icon: <BookOpen size={18} />, roles: ['GSN', 'SMN', 'HJN', 'SGN', 'IWN', 'GYJN'] },
      { label: 'Evangelism', path: '/evangelism', icon: <TrendingUp size={18} />, roles: ['GSN', 'SMN', 'HJN', 'SGN', 'BJN', 'JJN', 'GGN', 'IWN', 'GYJN'] },
      { label: 'Tests & Results',  path: '/tests',         icon: <GraduationCap size={18} />, roles: ['GSN', 'SMN', 'HJN', 'SGN', 'BJN'] },
      { label: 'Contributions',    path: '/contributions', icon: <Wallet size={18} />,        roles: ['GSN', 'HJN', 'SGN', 'GYJN', 'IWN', 'MEMBER'] },
    ],
  },
];

const bottomNavSections: Array<{ section: string; items: NavItem[] }> = [
  {
    section: 'Reports',
    items: [
      { label: 'Reports', path: '/reports', icon: <FileText size={18} />, roles: ['GSN', 'SMN', 'HJN', 'BJN'] },
    ],
  },
  {
    section: 'Communication',
    items: [
      { label: 'Announcements', path: '/announcements', icon: <Megaphone size={18} />, roles: ['GSN', 'SMN', 'HJN', 'BJN', 'MEMBER', 'GYJN', 'SGN', 'IWN', 'JDSN', 'JJN', 'GGN', 'CULTURE'] },
    ],
  },
  {
    section: 'Admin',
    items: [
      { label: 'Settings', path: '/settings', icon: <Settings size={18} />, roles: ['GSN', 'SMN'] },
    ],
  },
];

const AppSidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user, logout, hasAccess } = useAuth();
  const navigate = useNavigate();
  const { data: ministriesData } = useMinistries();

  const ministriesSection: { section: string; items: NavItem[] } = {
    section: 'Ministries',
    items: (ministriesData ?? []).map(m => ({
      label: m.name,
      path: `/ministries/${m.id}`,
      icon: <Briefcase size={18} />,
      roles: ['GSN', 'SMN', 'BJN'] as Role[],
      locked: !m.is_active,
    })),
  };

  const allSections = [...staticNavSections, ministriesSection, ...bottomNavSections];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[240px] bg-[#0A0A0A] flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo header */}
        <div className="pt-6 pb-4 px-5 flex items-start gap-3 flex-col">
          <div className="flex items-center gap-3 w-full">
            <img
              src={logo}
              alt="Logo"
              className="w-8 flex-shrink-0"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <div className="min-w-0">
              <h2 className="font-heading text-[14px] font-semibold text-white whitespace-nowrap">Sea of Glass <br/> Rustenburg</h2>
            </div>
          </div>
          <p className="text-[11px] text-white/50 font-body">New Heaven and New Earth</p>
          <button className="absolute top-4 right-4 lg:hidden text-white/60 hover:text-white" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto pb-4">
          {allSections.map(({ section, items }, index) => {
            const visibleItems = items.filter(item => user && hasAccess(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section} className="mb-0">
                {index > 0 && <div className="h-px bg-white/[0.08] mx-4 my-2" />}
                <div className="px-5 py-2 text-[10px] font-heading uppercase tracking-[0.12em] text-white/[0.35]">
                  {section}
                </div>
                <div className="space-y-0">
                  {visibleItems.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.locked ? '#' : item.path}
                      onClick={e => {
                        if (item.locked) e.preventDefault();
                        else onClose();
                      }}
                      className={({ isActive }) => {
                        const baseClasses = "flex items-center gap-3 h-[36px] px-5 text-[13px] font-heading transition-colors";
                        if (item.locked) {
                          return `${baseClasses} text-white/30 cursor-not-allowed`;
                        }
                        if (isActive) {
                          return `${baseClasses} border-l-[3px] border-[#de3163] text-white bg-[#de3163]/[0.12] pl-[17px]`;
                        }
                        return `${baseClasses} text-white/70 hover:text-white hover:bg-white/10`;
                      }}
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                      {item.locked && <Lock size={14} className="ml-auto" />}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 bg-transparent border-t border-white/[0.08]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-[#de3163] flex-shrink-0 flex items-center justify-center text-white text-[13px] font-heading font-semibold">
              {user?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-heading font-normal text-white truncate">{user?.name}</p>
              <div className="inline-block bg-[#de3163] px-2 py-0.5 mt-0.5 rounded-full text-[11px] font-body text-white">
                {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full h-[36px] px-2 rounded font-body text-[13px] text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
