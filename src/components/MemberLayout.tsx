import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/LogoSeaofGlass.png';
import { LogOut } from 'lucide-react';

const MemberLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Header */}
      <header className="bg-[#0A0A0A] px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Logo"
            className="w-8 h-8 flex-shrink-0"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div>
            <p className="font-heading text-[14px] font-semibold text-white leading-tight">
              Sea of Glass Rustenburg
            </p>
            <p className="font-body text-[11px] text-white/40 leading-tight">Member Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#de3163] flex items-center justify-center text-white text-[11px] font-heading font-semibold">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <span className="font-body text-[13px] text-white/70">{user.name}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 font-body text-[12px] text-white/50 hover:text-white transition-colors"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default MemberLayout;
