import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';
import {
  LayoutDashboard, Users, Building2, ClipboardCheck, BookOpen,
  TrendingUp, GraduationCap, Briefcase, FileText, Megaphone,
  Settings, LogOut, Menu, X, ChevronDown, Lock
} from 'lucide-react';
import { Role } from '@/data/types';
import { ministries } from '@/data/seed';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: Role[];
  children?: NavItem[];
  locked?: boolean;
}

const navSections: Array<{ section: string; items: NavItem[] }> = [
  {
    section: 'Overview',
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
      { label: 'Tests & Results', path: '/tests', icon: <GraduationCap size={18} />, roles: ['GSN', 'SMN', 'HJN', 'SGN', 'BJN'] },
    ],
  },
  {
    section: 'Ministries',
    items: ministries.map(m => ({
      label: m.name,
      path: `/ministries/${m.id}`,
      icon: <Briefcase size={18} />,
      roles: ['GSN', 'SMN', 'BJN'] as Role[],
      locked: !m.is_active,
    })),
  },
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
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-sidebar flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo header */}
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <img
            src={logo}
            alt="Logo"
            className="w-9 h-9 flex-shrink-0"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div className="min-w-0">
            <h2 className="font-heading text-sm font-semibold text-sidebar-foreground truncate">Sea of Glass</h2>
            <p className="text-[11px] text-sidebar-foreground/50 font-body truncate">Rustenburg</p>
          </div>
          <button className="lg:hidden ml-auto text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navSections.map(({ section, items }) => {
            const visibleItems = items.filter(item => user && hasAccess(item.roles));
            if (visibleItems.length === 0) return null;

            const isCollapsed = collapsed[section];

            return (
              <div key={section} className="mb-1">
                <button
                  onClick={() => toggleSection(section)}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] font-heading font-semibold uppercase tracking-wider text-sidebar-foreground/40 hover:text-sidebar-foreground/60"
                >
                  {section}
                  <ChevronDown size={12} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {visibleItems.map(item => (
                      <NavLink
                        key={item.path}
                        to={item.locked ? '#' : item.path}
                        onClick={e => {
                          if (item.locked) e.preventDefault();
                          else onClose();
                        }}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-body transition-colors ${
                            item.locked
                              ? 'text-sidebar-foreground/20 cursor-not-allowed'
                              : isActive
                              ? 'bg-sidebar-accent text-white font-medium'
                              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-muted'
                          }`
                        }
                      >
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                        {item.locked && <Lock size={12} className="ml-auto" />}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-white text-xs font-heading font-semibold">
              {user?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-heading font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-[11px] text-sidebar-foreground/50 font-body">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2.5 py-2 rounded-md text-[13px] font-body text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-muted transition-colors"
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
