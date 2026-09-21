import React, { useState } from 'react';
import { useBot } from '../../context/BotContext';
import {
  Shield,
  User as UserIcon,
  Mail,
  Lock,
  Crown,
  Wallet,
  Smartphone,
  CheckCircle,
  LogOut,
  X,
  KeyRound,
  RefreshCw,
  Zap,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    allUsers,
    setCurrentUserId,
    logout,
    resetPassword,
    setIsAuthModalOpen,
    setAuthMode
  } = useBot();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'switch'>('profile');
  const [newPassword, setNewPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 text-slate-100 relative overflow-hidden max-h-[92dvh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 pb-safe">
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-cyan-500/20 overflow-hidden shrink-0">
            {currentUser.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.first_name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              currentUser.first_name.charAt(0).toUpperCase()
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{currentUser.first_name}</h2>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {currentUser.email || `@${currentUser.username}`} • UID: {currentUser.user_id}
            </p>
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
            <span>Profile Details</span>
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
            <span>Security & Auth</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('switch');
              setStatusMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'switch' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Switch Account</span>
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
            }`}
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tab 1: Profile Details */}
        {activeTab === 'profile' && (
          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-emerald-400" /> Wallet Balance
                </span>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  ₹{currentUser.balance.toFixed(2)}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" /> Orders Placed
                </span>
                <div className="text-base font-bold text-white font-mono">
                  {currentUser.orders_count} Total Keys
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
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
            </div>
          </div>
        )}

        {/* Tab 2: Security & Password */}
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

        {/* Tab 3: Switch Account */}
        {activeTab === 'switch' && (
          <div className="space-y-2.5 text-xs max-h-60 overflow-y-auto">
            {allUsers.map((u) => (
              <button
                key={u.user_id}
                type="button"
                onClick={() => {
                  setCurrentUserId(u.user_id);
                  setStatusMsg({ type: 'success', text: `Switched session to ${u.first_name}!` });
                }}
                className={`w-full p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                  currentUser.user_id === u.user_id
                    ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="truncate">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{u.first_name}</span>
                    {currentUser.user_id === u.user_id && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-bold">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{u.email || `@${u.username}`}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-emerald-400 font-mono">₹{u.balance.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-500">Verified</div>
                </div>
              </button>
            ))}
          </div>
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
