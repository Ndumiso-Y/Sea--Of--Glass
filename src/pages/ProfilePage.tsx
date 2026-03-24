import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 lg:p-8 max-w-lg">
      <h1 className="font-heading text-[24px] font-bold text-black mb-6">My Profile</h1>
      <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-6 space-y-4 text-[13px] font-body">
        <div className="flex flex-col">
          <span className="text-[#6B7280] mb-1">Name</span>
          <span className="text-black font-medium">{user?.name}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#6B7280] mb-1">Role</span>
          <span className="inline-block w-fit text-[11px] px-2 py-0.5 rounded-full bg-[#de3163] text-white font-semibold">{user?.role}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#6B7280] mb-1">Department</span>
          <span className="text-black">{user?.department ?? '—'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#6B7280] mb-1">Cell</span>
          <span className="text-black">{user?.cell ?? '—'}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
