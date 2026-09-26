import React, { useState, useEffect, useRef } from 'react';
import { useBot } from '../../context/BotContext';
import {
  Shield,
  User as UserIcon,
  Mail,
  Lock,
  Crown,
  Gift,
  Wallet,
  Smartphone,
  CheckCircle,
  LogOut,
  X,
  KeyRound,
  RefreshCw,
  Zap,
  ExternalLink,
  ChevronRight,
  Camera,
  Upload,
  Image as ImageIcon,
  Clock,
  Sparkles,
  Check,
  Calendar,
  Activity,
  Trash2,
  DollarSign,
  Key
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  { id: 'bot1', name: 'Cyber Bot', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&h=200&q=80' },
  { id: 'gold', name: 'Gold VIP', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=200&h=200&q=80' },
  { id: 'neon', name: 'Neon Hacker', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=200&h=200&q=80' },
  { id: 'samurai', name: 'Flame Samurai', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=200&h=200&q=80' },
  { id: 'matrix', name: 'Matrix Elite', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=200&h=200&q=80' },
  { id: 'anime', name: 'Anime Pro', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&h=200&q=80' },
  { id: 'space', name: 'Astral Master', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=200&h=200&q=80' },
  { id: 'bottts', name: 'Dice Bear Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=KalamVIP' }
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    updateUserProfile,
    logout,
    resetPassword,
    setIsAuthModalOpen,
    setAuthMode,
    orders = [],
    logs = []
  } = useBot();

  const myOrders = orders.filter(o => o.user_id === currentUser.user_id);
  const mySpinLogs = logs.filter(l => l.user_id === currentUser.user_id && (l.action === 'DAILY_GIFT' || l.action === 'SPIN' || l.action.includes('GIFT') || l.action.includes('SPIN')));
  const spinCount = (currentUser.spin_count || 0) + mySpinLogs.length;

  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'security'>('profile');
  const [newPassword, setNewPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Avatar Management State
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [previewAvatar, setPreviewAvatar] = useState<string>(currentUser.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time Session Clock & Login Uptime
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionUptimeSec, setSessionUptimeSec] = useState(0);

  useEffect(() => {
    setPreviewAvatar(currentUser.avatar_url || '');
  }, [currentUser.avatar_url]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSessionUptimeSec(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  // Format real-time login timestamp
  const loginTimestamp = currentUser.last_login || currentUser.login_at || currentUser.joined_date || new Date().toISOString();
  const formatLiveDate = (dateStr?: string) => {
    if (!dateStr) return 'Active Now';
    try {
      const d = new Date(dateStr.includes('T') ? dateStr : (dateStr || '').replace(' ', 'T'));
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Compress & crop avatar image to perfect 256x256 square JPEG
  const compressAndCropAvatar = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const targetSize = 256;
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          // Center crop square
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(compressedDataUrl);
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle local file upload & base64 conversion
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMsg({ type: 'error', text: 'Please select a valid image file (JPG, PNG, WebP).' });
      return;
    }

    setIsUploading(true);
    setStatusMsg(null);
    try {
      const compressedBase64 = await compressAndCropAvatar(file);
      setPreviewAvatar(compressedBase64);
      updateUserProfile({ avatar_url: compressedBase64 });
      setStatusMsg({ type: 'success', text: 'Profile photo uploaded and updated successfully!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Failed to process image. Please try another picture.' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAvatarUrl.trim()) return;
    setPreviewAvatar(customAvatarUrl.trim());
    updateUserProfile({ avatar_url: customAvatarUrl.trim() });
    setCustomAvatarUrl('');
    setStatusMsg({ type: 'success', text: 'Profile photo updated via direct URL!' });
  };

  const handleSelectPreset = (url: string) => {
    setPreviewAvatar(url);
    updateUserProfile({ avatar_url: url });
    setStatusMsg({ type: 'success', text: 'Preset avatar selected and saved!' });
  };

  const handleResetAvatar = () => {
    const defaultBottt = `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username || 'kalam'}`;
    setPreviewAvatar('');
    updateUserProfile({ avatar_url: defaultBottt });
    setStatusMsg({ type: 'success', text: 'Profile photo reset to default avatar.' });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.email) {
      setStatusMsg({ type: 'error', text: 'No email address associated with current user.' });
      return;
    }
    if (newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await resetPassword(currentUser.email, newPassword);
      if (res.success) {
        setStatusMsg({ type: 'success', text: 'Password successfully updated!' });
        setNewPassword('');
      } else {
        setStatusMsg({ type: 'error', text: res.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 text-slate-100 relative overflow-hidden max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 pb-safe">
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header with Live Avatar & Change Trigger */}
        <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4">
          <div className="relative group shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-cyan-500/20 overflow-hidden border-2 border-cyan-500/40">
              {previewAvatar ? (
                <img
                  src={previewAvatar}
                  alt={currentUser.first_name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                currentUser.first_name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Quick Camera Hover Button */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('avatar');
                setStatusMsg(null);
              }}
              className="absolute -bottom-1 -right-1 p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full shadow-lg border border-slate-900 transition cursor-pointer"
              title="Change Profile Photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white truncate">{currentUser.first_name}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5 truncate">
              <span>{currentUser.email || `@${currentUser.username}`}</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400 font-bold">UID: {currentUser.user_id}</span>
            </p>
          </div>
        </div>

        {/* Real-Time User Login & Live Clock Status Banner */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Real-Time Login Status</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <Clock className="w-3 h-3" />
              <span>Session: {formatUptime(sessionUptimeSec)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Current Login Timestamp:</span>
              <span className="font-mono text-cyan-300 font-bold">
                {formatLiveDate(loginTimestamp)}
              </span>
            </div>

            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Live System Clock:</span>
              <span className="font-mono text-indigo-300 font-bold">
                {currentTime.toLocaleTimeString('en-US', { hour12: true })} ({currentTime.toLocaleDateString()})
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setStatusMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'profile' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('avatar');
              setStatusMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'avatar' ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Set Photo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('security');
              setStatusMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'security' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
            }`}
          >
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tab 1: Profile Details */}
        {activeTab === 'profile' && (
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                  <Wallet className="w-3 h-3 text-emerald-400" /> Balance
                </span>
                <div className="text-xs font-black text-emerald-400 font-mono">
                  ₹{currentUser.balance.toFixed(2)}
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                  <DollarSign className="w-3 h-3 text-purple-400" /> Total Spent
                </span>
                <div className="text-xs font-black text-purple-300 font-mono">
                  ₹{(currentUser.spent || 0).toFixed(2)}
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                  <Key className="w-3 h-3 text-amber-400" /> Keys Bought
                </span>
                <div className="text-xs font-black text-amber-300 font-mono">
                  {myOrders.length} Keys
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                  <Gift className="w-3 h-3 text-pink-400" /> Spins / Claims
                </span>
                <div className="text-xs font-black text-pink-300 font-mono">
                  {spinCount} Spins
                </div>
              </div>
            </div>

            {/* Purchased Keys History Section */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Purchased Keys History ({myOrders.length})</span>
                </span>
              </div>

              {myOrders.length === 0 ? (
                <div className="text-center py-3 text-slate-500 text-[11px] italic">
                  No purchased keys found. Order keys from the product store!
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {myOrders.map((o) => (
                    <div key={o.id || o.order_id} className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                      <div className="space-y-0.5 overflow-hidden">
                        <div className="font-bold text-slate-200 text-[11px] truncate">{o.product_name}</div>
                        <div className="font-mono text-cyan-300 text-[10px] font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800/60 inline-block">
                          {o.delivered_key}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">{o.purchase_date}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(o.delivered_key);
                          setStatusMsg({ type: 'success', text: `Copied key: ${o.delivered_key}` });
                        }}
                        className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/60 rounded-lg text-[10px] font-bold transition shrink-0 cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Telegram User ID:</span>
                <span className="font-mono font-bold text-cyan-400">{currentUser.user_id}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Telegram Chat ID:</span>
                <span className="font-mono font-bold text-indigo-400">{currentUser.chat_id || currentUser.user_id}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Email Address:</span>
                <span className="font-semibold text-slate-200">{currentUser.email || 'None Linked'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Telegram Username:</span>
                <span className="font-semibold text-cyan-400">@{currentUser.username}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Sign-In Provider:</span>
                <span className="font-semibold text-indigo-300 capitalize flex items-center gap-1">
                  {currentUser.auth_provider === 'google' ? '✓ Google SSO' : '✓ Email & Password'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Member Since:</span>
                <span className="font-mono text-slate-300">{currentUser.joined_date.split(' ')[0]}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Last Logged In:</span>
                <span className="font-mono text-cyan-400 font-bold">{formatLiveDate(loginTimestamp)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Manual Profile Photo Set & Upload */}
        {activeTab === 'avatar' && (
          <div className="space-y-4 text-xs">
            {/* 1. Device Upload Button */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  Upload Photo From Device
                </span>
                <span className="text-[10px] text-slate-500">JPG, PNG, WebP up to 5MB</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20"
                >
                  {isUploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Choose Image File</span>
                    </>
                  )}
                </button>

                {previewAvatar && (
                  <button
                    type="button"
                    onClick={handleResetAvatar}
                    className="p-2.5 bg-slate-800 hover:bg-rose-900/30 text-rose-400 rounded-xl transition cursor-pointer"
                    title="Remove custom photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Direct Image URL Input */}
            <form onSubmit={handleApplyUrl} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                Or Paste Image Link (URL)
              </span>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!customAvatarUrl.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </form>

            {/* 3. Preset Avatars Grid */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Select VIP Preset Avatar
              </span>
              <div className="grid grid-cols-4 gap-2.5">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = previewAvatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      className={`relative group rounded-xl overflow-hidden p-1 border transition cursor-pointer text-left ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/20 ring-2 ring-cyan-500/50'
                          : 'border-slate-800 hover:border-slate-600 bg-slate-900'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-12 rounded-lg object-cover"
                      />
                      <span className="block text-[10px] font-semibold text-slate-300 truncate mt-1 text-center">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Password */}
        {activeTab === 'security' && (
          <form onSubmit={handleUpdatePassword} className="space-y-3.5 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 block flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                Change Password for {currentUser.email || currentUser.username}
              </span>

              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password (min. 6 chars)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-cyan-500"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Update Password</span>}
              </button>
            </div>
          </form>
        )}

        {/* Bottom Actions Bar: Logout & Switch to Auth Portal */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
              setIsAuthModalOpen(true);
              setAuthMode('login');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              setIsAuthModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <span>Open Login Portal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
