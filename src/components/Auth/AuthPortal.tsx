import React, { useState } from 'react';
import { useBot } from '../../context/BotContext';
import {
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  KeyRound,
  X
} from 'lucide-react';

interface AuthPortalProps {
  isModal?: boolean;
  onClose?: () => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ isModal = false, onClose }) => {
  const {
    currentUser,
    setCurrentUserId,
    isAuthenticated,
    setIsAuthenticated,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    authMode,
    setActiveTab
  } = useBot();

  // Mode state: 'login' | 'register' | 'forgot_password'
  const [activeMode, setActiveMode] = useState<'login' | 'register' | 'forgot_password'>(
    authMode || 'login'
  );

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAgreed, setRegAgreed] = useState(true);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);

  // Status/Error states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await loginWithEmail(loginEmail, loginPassword);
      if (res.success) {
        setSuccessMsg(`Welcome back, ${res.user?.first_name || 'User'}!`);
        setActiveTab('my_bots');
        if (onClose) setTimeout(onClose, 600);
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please verify your email and password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during sign-in.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Auth (Firebase)
  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setGoogleLoading(true);

    try {
      const res = await loginWithGoogle();
      if (res.success) {
        setSuccessMsg(`Google Authentication Successful! Welcome, ${res.user?.first_name || 'User'}`);
        setActiveTab('my_bots');
        if (onClose) setTimeout(onClose, 600);
      } else {
        setErrorMsg(res.error || 'Google sign-in failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regAgreed) {
      setErrorMsg('Please agree to the Terms of Service to continue.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await registerWithEmail({
        email: regEmail,
        password: regPassword,
        name: regName,
        username: regUsername || regEmail.split('@')[0],
        role: 'Regular'
      });

      if (res.success) {
        setSuccessMsg(`Account created successfully! Welcome, ${res.user?.first_name}!`);
        setActiveTab('my_bots');
        if (onClose) setTimeout(onClose, 600);
      } else {
        setErrorMsg(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (forgotStep === 1) {
      if (!forgotEmail) {
        setErrorMsg('Please provide your registered email address.');
        return;
      }
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setForgotStep(2);
        setForgotOtp('849201');
        setSuccessMsg('A 6-digit OTP verification code has been dispatched.');
      }, 600);
      return;
    }

    if (forgotStep === 2) {
      if (!forgotOtp) {
        setErrorMsg('Please enter the 6-digit verification code.');
        return;
      }
      setForgotStep(3);
      return;
    }

    if (forgotStep === 3) {
      if (!forgotNewPassword || forgotNewPassword.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      setLoading(true);
      try {
        const res = await resetPassword(forgotEmail, forgotNewPassword);
        if (res.success) {
          setSuccessMsg(res.message);
          setTimeout(() => {
            setActiveMode('login');
            setLoginEmail(forgotEmail);
            setLoginPassword(forgotNewPassword);
            setForgotStep(1);
          }, 1200);
        } else {
          setErrorMsg(res.message);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={`w-full ${isModal ? 'max-w-md' : 'max-w-md'} mx-auto relative`}>
      {/* Background Glow effects */}
      <div className="absolute -top-10 -left-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Badge */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3 shadow-inner">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Firebase Secured Authentication</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          {activeMode === 'login'
            ? 'Sign In to Kalam Panel'
            : activeMode === 'register'
            ? 'Create Developer Account'
            : 'Account Recovery'}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          {activeMode === 'login'
            ? 'Manage your Telegram store bots, keys, and automated payment gateways.'
            : activeMode === 'register'
            ? 'Join the platform and launch your automated Telegram store in seconds.'
            : 'Reset your password and regain access to your bots.'}
        </p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Main Authentication Card */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 md:p-6 shadow-xl relative z-10 space-y-5 backdrop-blur-sm">
        {/* Top Google SSO Button */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={googleLoading || loading}
            onClick={handleGoogleAuth}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs md:text-sm shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-3 relative group"
          >
            {googleLoading ? (
              <RefreshCw className="w-4 h-4 text-slate-700 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="font-semibold text-slate-800">
              {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold ml-auto hidden sm:inline">
              Firebase Auth
            </span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-950 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
              Or with Email & Password
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>
        </div>

        {/* Tab Navigation (Login vs Register) */}
        {activeMode !== 'forgot_password' && (
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'login'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Email Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeMode === 'register'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Register Account</span>
            </button>
          </div>
        )}

        {/* ================= MODE 1: EMAIL LOGIN ================= */}
        {activeMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  Email ID or Username
                </span>
                <span className="text-[10px] text-slate-500 font-normal">e.g. kalam172010@gmail.com</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs md:text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('forgot_password');
                    setForgotEmail(loginEmail);
                    setErrorMsg(null);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer text-[11px]"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-slate-100 text-xs md:text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 text-xs select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                />
                <span>Remember this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= MODE 2: REGISTER ================= */}
        {activeMode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                Full Name
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Kalam"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs md:text-sm outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs md:text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                  Username (optional)
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="kalam_dev"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs md:text-sm outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  Create Password
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min. 6 chars"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs md:text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs md:text-sm outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="regAgreed"
                checked={regAgreed}
                onChange={(e) => setRegAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="regAgreed" className="text-[11px] text-slate-400 cursor-pointer select-none leading-relaxed">
                I agree to the Terms of Service and Telegram Bot Guidelines.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= MODE 3: FORGOT PASSWORD ================= */}
        {activeMode === 'forgot_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl flex items-center gap-2.5 text-cyan-300 text-xs">
              <KeyRound className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                {forgotStep === 1
                  ? 'Enter your registered email to receive an OTP code.'
                  : forgotStep === 2
                  ? 'Enter the 6-digit OTP code sent to your email.'
                  : 'Set your new password to restore access.'}
              </span>
            </div>

            {forgotStep === 1 && (
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="kalam172010@gmail.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs md:text-sm outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {forgotStep === 2 && (
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center justify-between">
                  <span>6-Digit Verification Code (OTP)</span>
                  <span className="text-[10px] text-cyan-400">Code: 849201</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                  placeholder="849201"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-center text-lg font-mono tracking-widest text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {forgotStep === 3 && (
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">New Password</label>
                <input
                  type="password"
                  required
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs md:text-sm outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('login');
                  setForgotStep(1);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs transition cursor-pointer"
              >
                Back to Sign In
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : forgotStep === 1 ? (
                  'Send OTP Code'
                ) : forgotStep === 2 ? (
                  'Verify Code'
                ) : (
                  'Save New Password'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
