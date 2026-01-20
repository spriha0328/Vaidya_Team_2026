import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, StoredSession, UserProfile, LocationData, GroundingChunk } from './types';
import { Sidebar } from './components/Sidebar';
import { sendMessageToGemini } from './services/geminiService';
import { secureStorage, generateId, logAuditEvent, encodeShareData, decodeShareData } from './services/utils';

// ==========================================
// 🧩 SUB-COMPONENTS
// ==========================================

const ChatBubble: React.FC<{ message: Message; userProfile: UserProfile }> = ({ message, userProfile }) => {
  const isUser = message.role === 'user';

  // Helper to render grounding sources
  const renderSources = () => {
    if (!message.groundingMetadata?.groundingChunks) return null;

    const chunks = message.groundingMetadata.groundingChunks;
    // Filter out chunks that don't have web or maps data
    const validChunks = chunks.filter(c => (c.web && c.web.uri) || (c.maps && c.maps.sourcePlace));

    if (validChunks.length === 0) return null;

    return (
      <div className="mt-4 pt-3 border-t border-slate-200/50">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">manage_search</span>
          Verified Sources
        </p>
        <div className="flex flex-wrap gap-2">
          {validChunks.map((chunk, idx) => {
            if (chunk.web && chunk.web.uri) {
              return (
                <a
                  key={idx}
                  href={chunk.web.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2 py-1 bg-white/60 hover:bg-white rounded-lg border border-slate-200 text-[10px] text-blue-600 transition-colors"
                >
                  <img src={`https://www.google.com/s2/favicons?domain=${new URL(chunk.web.uri).hostname}`} alt="" className="w-3 h-3 opacity-70" />
                  <span className="truncate max-w-[150px]">{chunk.web.title || "Source"}</span>
                </a>
              );
            }
            if (chunk.maps?.sourcePlace) {
              return (
                <span
                  key={idx}
                  className="flex items-center gap-1 px-2 py-1 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-[10px] text-green-700 transition-colors cursor-default"
                >
                  <span className="material-symbols-outlined text-[12px]">location_on</span>
                  <span className="truncate max-w-[150px]">{chunk.maps.sourcePlace.name || "Location"}</span>
                </span>
              );
            }
            return null;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[95%] md:max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative p-4 md:p-5 text-[15px] md:text-[16px] leading-[1.7]
            ${isUser
              ? 'user-bubble text-slate-800' // Custom class from index.css
              : 'ai-bubble text-slate-800'} // Custom class from index.css
          `}
        >
          {!isUser && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-sm bg-orange-300 flex items-center justify-center text-[10px] font-bold text-orange-900">
                AI
              </div>
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest">PriMed</span>
            </div>
          )}

          {message.attachment && (
            <div className="mb-4 rounded-md overflow-hidden border border-stone-200 bg-stone-50 p-3 max-w-sm">
              {message.attachment.mimeType === 'application/pdf' ? (
                <div className="flex items-center gap-3 text-stone-700">
                  <span className="material-symbols-outlined text-red-400">picture_as_pdf</span>
                  <span className="text-sm font-medium font-sans">{message.attachment.name || 'Medical Document'}</span>
                </div>
              ) : (
                <img src={message.attachment.data} alt="Attachment" className="max-h-60 rounded border border-stone-100" />
              )}
            </div>
          )}

          <div className={isUser ? 'font-sans' : 'prose max-w-none text-stone-800'}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {renderSources()}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileModal: React.FC<{
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (p: UserProfile) => void
}> = ({ profile, isOpen, onClose, onSave }) => {
  const [name, setName] = useState(profile.name);
  const [color, setColor] = useState(profile.avatarColor);

  if (!isOpen) return null;

  const colors = [
    'bg-slate-500', 'bg-red-400', 'bg-orange-400', 'bg-amber-400',
    'bg-green-400', 'bg-emerald-400', 'bg-teal-400', 'bg-cyan-400',
    'bg-sky-400', 'bg-blue-400', 'bg-indigo-400', 'bg-violet-400',
    'bg-purple-400', 'bg-fuchsia-400', 'bg-pink-400', 'bg-rose-400'
  ];

  const handleSave = () => {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    onSave({ name, initials, avatarColor: color });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="glass-panel p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-slate-700 mb-4">Edit Profile</h3>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-solace-blue"
          />
        </div>
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 mb-2">Avatar Color</label>
          <div className="grid grid-cols-8 gap-2">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full ${c} ${color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-2 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700">Save</button>
        </div>
      </div>
    </div>
  );
};

const ShareModal: React.FC<{ isOpen: boolean; link: string; onClose: () => void }> = ({ isOpen, link, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="glass-panel p-6 rounded-2xl max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-2 mb-2 text-amber-500">
          <span className="material-symbols-outlined">warning</span>
          <h3 className="text-lg font-bold text-slate-700">Share Secure Link</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          This link contains the full medical conversation history. Share with caution.
          The data is encoded in the URL and is not stored on any external server.
        </p>
        <div className="flex gap-2 mb-4">
          <input
            readOnly
            value={link}
            className="flex-1 p-2 bg-slate-100 rounded-lg text-xs text-slate-500 border border-slate-200 truncate"
          />
          <button
            onClick={copyToClipboard}
            className="p-2 bg-solace-blue text-white rounded-lg hover:bg-blue-400 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
          </button>
        </div>
        <button onClick={onClose} className="w-full py-2 text-slate-500 hover:bg-slate-100 rounded-xl">Close</button>
      </div>
    </div>
  );
};

// ==========================================
// 🚀 MAIN APP
// ==========================================

const App: React.FC = () => {
  // Data State
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "USER",
    initials: "AL",
    avatarColor: "bg-slate-500"
  });
  const [location, setLocation] = useState<LocationData | undefined>(undefined);

  // UI State
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Upload State
  const [attachment, setAttachment] = useState<{ name: string, data: string, mimeType: string } | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  // Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [input]);

  // Load Data on Mount
  useEffect(() => {
    // 1. Load Profile
    const storedProfile = secureStorage.getItem<UserProfile>('primed_profile');
    if (storedProfile) setUserProfile(storedProfile);

    // 2. Request Geolocation for Google Maps Grounding
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          logAuditEvent("LOCATION", "User location acquired for Maps Grounding");
        },
        (error) => {
          console.warn("Geolocation denied:", error);
        }
      );
    }

    // 3. Check for Share Link (URL Hash)
    const hash = window.location.hash;
    if (hash.startsWith('#/share?data=')) {
      const encoded = hash.split('data=')[1];
      const sharedMessages = decodeShareData(encoded);
      if (sharedMessages) {
        // Start a new session with shared data
        const newId = generateId();
        const newSession: StoredSession = {
          id: newId,
          timestamp: Date.now(),
          preview: "Shared Consultation",
          messages: sharedMessages
        };
        // We delay setting this to ensure sessions load first
        setTimeout(() => {
          setSessions(prev => [newSession, ...prev]);
          secureStorage.setItem('primed_sessions', [newSession, ...secureStorage.getItem<StoredSession[]>('primed_sessions') || []]);
          setCurrentSessionId(newId);
          setMessages(sharedMessages);
          window.location.hash = ''; // Clear hash
        }, 100);
        return; // Skip normal load
      }
    }

    // 4. Normal Load
    const storedSessions = secureStorage.getItem<StoredSession[]>('primed_sessions') || [];
    setSessions(storedSessions);

    if (storedSessions.length === 0) {
      startNewSession();
    } else {
      loadSession(storedSessions[0].id, storedSessions);
    }

    logAuditEvent("SYSTEM_BOOT", "Application initialized securely");
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, uploadStatus]);

  const saveSessions = (updatedSessions: StoredSession[]) => {
    setSessions(updatedSessions);
    secureStorage.setItem('primed_sessions', updatedSessions);
  };

  const updateProfile = (p: UserProfile) => {
    setUserProfile(p);
    secureStorage.setItem('primed_profile', p);
  };

  const startNewSession = () => {
    const newId = generateId();
    const newSession: StoredSession = {
      id: newId,
      timestamp: Date.now(),
      preview: "New Consultation",
      messages: []
    };
    saveSessions([newSession, ...sessions]);
    setCurrentSessionId(newId);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (sessions.length <= 1 && sessions[0].id === id) {
      startNewSession();
      return;
    }
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (currentSessionId === id) {
      loadSession(updated[0].id, updated);
    }
  };

  const loadSession = (id: string, currentList = sessions) => {
    const session = currentList.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
      setIsSidebarOpen(false); // Mobile
    }
  };

  const handleShare = () => {
    if (messages.length === 0) return;
    const encoded = encodeShareData(messages);
    const url = `${window.location.origin}${window.location.pathname}#/share?data=${encoded}`;
    setShareLink(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadStatus('uploading');
      const reader = new FileReader();
      reader.onload = (event) => {
        setTimeout(() => {
          const base64String = event.target?.result as string;
          setAttachment({
            name: file.name,
            data: base64String,
            mimeType: file.type
          });
          setUploadStatus('success');
          logAuditEvent("FILE_UPLOAD", "User uploaded file successfully");
        }, 800);
      };
      reader.onerror = () => {
        setUploadStatus('error');
        logAuditEvent("FILE_UPLOAD_ERROR", "Failed to read file");
      };
      reader.readAsDataURL(file);
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    setUploadStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
    }
  };

  // ==========================================
  // 🎤 VOICE INPUT
  // ==========================================
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = async () => {
    // If already listening, stop it
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      // 1. Explicitly request microphone access first to trigger permissions/check hardware
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Stop the stream immediately - we just needed to verify access/trigger prompt
      stream.getTracks().forEach(track => track.stop());

      // 2. Now proceed with Web Speech API
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => prev ? prev + " " + transcript : transcript);
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);

          let errorMessage = "Voice input error.";
          if (event.error === 'not-allowed') {
            errorMessage = "Microphone access denied. Please allow microphone permissions in your browser settings.";
          } else if (event.error === 'audio-capture') {
            errorMessage = "No microphone found. Please ensure your microphone is connected and working.";
          } else if (event.error === 'no-speech') {
            return; // Ignore no-speech errors (common if user stays silent)
          } else if (event.error === 'network') {
            errorMessage = "Network error. Please check your internet connection.";
          }

          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            alert(errorMessage);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } else {
        alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      }
    } catch (err) {
      console.error("Microphone access failed:", err);
      // Determine specific getUserMedia error
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          alert("Microphone access denied. Please unblock the microphone in your browser URL bar.");
        } else if (err.name === 'NotFoundError') {
          alert("No microphone device found. Please check your input settings.");
        } else {
          alert(`Microphone error: ${err.message}`);
        }
      } else {
        alert("Could not access microphone.");
      }
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || !currentSessionId) return;

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      attachment: attachment ? { mimeType: attachment.mimeType, data: attachment.data } : undefined
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    const tempAttachment = attachment;
    clearAttachment();
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const response = await sendMessageToGemini(
        messages,
        userMsg.content,
        tempAttachment ? { mimeType: tempAttachment.mimeType, data: tempAttachment.data.split(',')[1] } : undefined,
        location
      );

      const botMsg: Message = {
        id: generateId(),
        role: 'model',
        content: response.text,
        groundingMetadata: response.groundingMetadata
      };

      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);

      const updatedSessions = sessions.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: finalMessages,
            preview: userMsg.content.substring(0, 30) + (userMsg.content.length > 30 ? '...' : '')
          };
        }
        return s;
      });
      saveSessions(updatedSessions);

    } catch (error) {
      const errorMsg: Message = {
        id: generateId(),
        role: 'model',
        content: "⚠️ Connection interrupted. Secure link failed.",
        isError: true
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden text-slate-800 font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#f8fafc]">
        <div className="aurora-blob w-[50vw] h-[50vw] bg-blue-100 top-[-10%] left-[-10%]"></div>
        <div className="aurora-blob w-[50vw] h-[50vw] bg-pink-50 bottom-[-10%] right-[-10%]"></div>
        <div className="aurora-blob w-[40vw] h-[40vw] bg-purple-100 top-[40%] left-[40%]"></div>
      </div>

      <Sidebar
        isOpen={isSidebarOpen}
        isDesktopOpen={isDesktopSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        userProfile={userProfile}
        onSelectSession={loadSession}
        onNewSession={startNewSession}
        onDeleteSession={deleteSession}
        onEditProfile={() => setIsProfileOpen(true)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        profile={userProfile}
        onClose={() => setIsProfileOpen(false)}
        onSave={updateProfile}
      />

      <ShareModal
        isOpen={!!shareLink}
        link={shareLink || ''}
        onClose={() => setShareLink(null)}
      />

      <main className="relative z-10 flex-1 flex flex-col h-full transition-all duration-300 w-full">

        <header className="flex items-center justify-between p-4 pb-2 shrink-0">
          <button
            onClick={handleToggleSidebar}
            className="p-2 rounded-lg bg-white/50 text-slate-600 hover:bg-white/80 transition-colors z-50"
            title="Toggle Sidebar"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          <div className="flex-1 flex justify-end">
            {messages.length > 0 && (
              <button
                onClick={handleShare}
                className="p-2 text-slate-400 hover:text-solace-blue transition-colors flex items-center gap-1 bg-white/40 rounded-lg"
                title="Share Chat Link"
              >
                <span className="material-symbols-outlined text-sm">ios_share</span>
                <span className="text-xs font-medium hidden sm:inline">Share</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-20 lg:px-40 py-4 scrollbar-hide w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-80 mt-[-50px] px-4">
              <div className="flex flex-col items-center">
                <h1 className="text-4xl md:text-6xl font-bold text-slate-800 font-display tracking-tight mb-2">PriMed AI</h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full tracking-wider font-sans">BETA 2.0</span>
              </div>
              <p className="text-base md:text-xl text-slate-500 italic max-w-lg font-light font-sans">
                Secure Medical Intelligence & Compassionate Support.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-2xl">
                <button onClick={() => setInput("I am feeling very anxious and overwhelmed lately.")} className="p-4 glass-panel rounded-xl text-left hover:scale-[1.02] transition-transform">
                  <span className="block text-solace-blue mb-1 material-symbols-outlined">self_improvement</span>
                  <span className="text-sm font-medium text-slate-600">Mental Support</span>
                </button>
                <button onClick={() => setInput("Check drug interactions: Aspirin and Ibuprofen")} className="p-4 glass-panel rounded-xl text-left hover:scale-[1.02] transition-transform">
                  <span className="block text-solace-purple mb-1 material-symbols-outlined">medication</span>
                  <span className="text-sm font-medium text-slate-600">Safety Check (Live Search)</span>
                </button>
                <button onClick={() => setInput("Find a cardiologist near me.")} className="p-4 glass-panel rounded-xl text-left hover:scale-[1.02] transition-transform">
                  <span className="block text-solace-pink mb-1 material-symbols-outlined">location_on</span>
                  <span className="text-sm font-medium text-slate-600">Find Specialist (Maps)</span>
                </button>
                <button onClick={() => setInput("Help me understand this lab report.")} className="p-4 glass-panel rounded-xl text-left hover:scale-[1.02] transition-transform">
                  <span className="block text-slate-500 mb-1 material-symbols-outlined">upload_file</span>
                  <span className="text-sm font-medium text-slate-600">Document Review</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pb-4">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} userProfile={userProfile} />
              ))}
              {isLoading && (
                <div className="flex justify-start w-full mb-6">
                  <div className="glass-panel px-6 py-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-solace-blue rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-solace-purple rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-solace-pink rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-3 sm:p-6 pt-2 shrink-0">
          <div className="max-w-3xl mx-auto relative">
            {/* Attachment Preview (Floating above input) */}
            {(attachment || uploadStatus === 'uploading') && (
              <div className="absolute bottom-full left-6 mb-2 p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/50 flex items-center gap-3 z-20 animate-in fade-in slide-in-from-bottom-2">
                {uploadStatus === 'uploading' ? (
                  <div className="flex items-center gap-2 px-2">
                    <div className="w-4 h-4 border-2 border-solace-blue border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-slate-500 font-medium">Processing scan...</span>
                  </div>
                ) : attachment ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                      <span className="material-symbols-outlined text-sm">description</span>
                    </div>
                    <div className="flex flex-col overflow-hidden max-w-[200px]">
                      <span className="text-xs font-semibold text-slate-700 truncate">{attachment.name}</span>
                      <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[10px]">check_circle</span>
                        Ready to analyze
                      </span>
                    </div>
                    <button onClick={clearAttachment} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors ml-1">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </>
                ) : null}
                {uploadStatus === 'error' && (
                  <span className="text-xs text-red-500 px-2 font-medium">Upload Failed</span>
                )}
              </div>
            )}

            <div className={`relative flex items-end bg-white rounded-[1.5rem] border border-stone-200 shadow-xl shadow-stone-200/40 p-2 gap-2 max-w-3xl mx-auto`}>

              {(attachment || uploadStatus === 'uploading') && (
                <div className="absolute bottom-full left-0 mb-2 p-3 bg-white rounded-lg shadow-sm border border-stone-100 flex items-center gap-3">
                  {uploadStatus === 'uploading' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-stone-600 font-serif">Processing...</span>
                    </div>
                  ) : attachment ? (
                    <>
                      <span className="material-symbols-outlined text-stone-500">description</span>
                      <span className="text-sm font-medium text-stone-700 truncate max-w-[150px]">{attachment.name}</span>
                      <button onClick={clearAttachment} className="text-stone-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </>
                  ) : null}
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-xl transition-colors relative shrink-0"
                title="Upload"
              >
                <span className="material-symbols-outlined nav-icon">attach_file</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
              />

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message PriMed..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-stone-800 placeholder-stone-400 resize-none py-3.5 max-h-32 min-h-[52px] scrollbar-hide text-[16px] outline-none font-sans"
                rows={1}
              />

              <button
                onClick={startListening}
                className={`p-2 rounded-lg transition-all duration-200 shrink-0 flex items-center justify-center
                  ${isListening ? 'bg-red-50 text-red-500' : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'}
                `}
              >
                <span className={`material-symbols-outlined ${isListening ? 'animate-pulse' : ''}`}>mic</span>
              </button>

              <button
                onClick={handleSend}
                disabled={isLoading || (!input && !attachment) || uploadStatus === 'uploading'}
                className={`p-2 rounded-lg transition-all duration-200 shrink-0 ${input || attachment
                  ? 'bg-stone-800 text-white shadow-sm hover:bg-stone-700'
                  : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2 px-4 opacity-70 font-medium">
            {location ? (
              <span className="flex items-center justify-center gap-1 text-emerald-600 bg-emerald-50 py-0.5 px-2 rounded-full inline-block">
                <span className="material-symbols-outlined text-[10px]">my_location</span>
                Location active
              </span>
            ) : (
              "Enable location for local clinic recommendations."
            )}
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;