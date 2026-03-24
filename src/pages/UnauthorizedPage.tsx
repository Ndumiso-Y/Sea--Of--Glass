import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <ShieldOff size={28} className="text-destructive" />
        </div>
        <h1 className="font-heading text-[22px] font-bold text-black mb-2">Access Denied</h1>
        <p className="font-body text-[14px] text-[#6B7280] mb-8">
          You don't have permission to view this page. Contact your GSN if you believe this is an error.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 h-[38px] rounded-[8px] bg-[#0A0A0A] text-white font-heading text-[13px] font-semibold transition-colors hover:bg-[#333]"
        >
          Go back
        </button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
