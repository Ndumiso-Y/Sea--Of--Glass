import React from 'react';
import { announcements, announcementReads, members } from '@/data/seed';
import { useAuth } from '@/contexts/AuthContext';
import { Megaphone, Plus, Check, Send } from 'lucide-react';

const AnnouncementsPage: React.FC = () => {
  const { user } = useAuth();
  const canCreate = user?.role === 'GSN' || user?.role === 'SMN';

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Announcements</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">{announcements.length} announcements</p>
        </div>
        {canCreate && (
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-heading text-sm font-semibold hover:bg-sidebar-accent-hover transition-colors">
            <Plus size={16} /> Create Announcement
          </button>
        )}
      </div>

      <div className="space-y-4">
        {announcements.map(a => {
          const author = members.find(m => m.id === a.created_by);
          const reads = announcementReads.filter(r => r.announcement_id === a.id);
          const totalMembers = members.length;

          return (
            <div key={a.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Megaphone size={16} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">{a.title}</h3>
                    <p className="text-xs text-muted-foreground font-body">
                      {author?.name} · {new Date(a.created_at).toLocaleDateString()} · {a.recipient_group === 'all' ? 'All members' : a.recipient_group}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.telegram_sent ? (
                    <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-success/10 text-success font-medium"><Send size={10} /> Sent</span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-warning/10 text-warning font-medium">Not sent</span>
                  )}
                </div>
              </div>
              <p className="font-body text-sm text-foreground/80 mb-3">{a.body}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                <Check size={12} /> {reads.length}/{totalMembers} read
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
