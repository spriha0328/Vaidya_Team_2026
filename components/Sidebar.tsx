import React from 'react';
import { StoredSession, UserProfile } from '../types';

interface SidebarProps {
  isOpen: boolean;
  isDesktopOpen: boolean;
  onClose: () => void;
  sessions: StoredSession[];
  userProfile: UserProfile;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  onEditProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isDesktopOpen,
  onClose,
  sessions,
  userProfile,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onEditProfile
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-stone-900/10 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Sidebar Panel - Claude Style (Warm Off-White) */}
      <div
        className={`fixed inset-y-0 left-0 z-40 bg-[#F0F0EB] border-r border-stone-200 transform transition-all duration-300 ease-in-out flex flex-col 
          /* Mobile: fixed width, slide in/out */
          w-[85vw] max-w-[300px] ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          
          /* Desktop: relative */
          md:relative
          ${isDesktopOpen
            ? 'md:w-72 md:translate-x-0'
            : 'md:w-0 md:-translate-x-full md:overflow-hidden md:border-none'}
        `}
      >
        <div className="w-full md:w-72 flex flex-col h-full font-sans">
          <div className="p-4 shrink-0">
            {/* Header / Logo Area */}
            <div className="flex items-center justify-between mb-6 px-2 pt-2">
              <h2 className="text-stone-700 font-serif font-bold tracking-tight text-lg">PriMed</h2>
              <button onClick={onClose} className="md:hidden text-stone-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* New Chat Button - Claude Style (Warm button) */}
            <button
              onClick={onNewSession}
              className="w-full py-2.5 px-4 bg-[#EBE9E4] hover:bg-[#E0DED9] text-stone-800 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-stone-200/50 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="text-sm">New chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide">
            <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-3 px-3 mt-2">Recent</h3>

            {sessions.length === 0 && (
              <p className="text-xs text-stone-400 px-4 italic">No chat history.</p>
            )}

            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="group relative w-full"
                >
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className="w-full text-left py-2 px-3 rounded-md hover:bg-stone-200/60 transition-colors pr-8 flex items-center gap-3 group/item"
                  >
                    <div className="overflow-hidden">
                      <p className="text-[13px] text-stone-700 font-medium truncate group-hover/item:text-stone-900 leading-tight">
                        {session.preview || "New Consultation"}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={(e) => onDeleteSession(e, session.id)}
                    className="absolute right-2 top-2 p-1 text-stone-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Chat"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-stone-200 shrink-0">
            <button
              onClick={onEditProfile}
              className="w-full flex items-center gap-3 p-2 hover:bg-stone-200/50 rounded-lg transition-colors text-left"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold leading-none ${userProfile.avatarColor}`}>
                {userProfile.initials}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-stone-700 truncate">{userProfile.name}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};