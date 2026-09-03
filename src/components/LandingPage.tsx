import React, { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import { Sparkles, ShieldCheck, Lock, Database, ArrowRight, BookOpen, Compass, CheckCircle2, X, Mail, User, LogIn, UserPlus } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, isConfigured } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setErrorMsg(null);
    setShowAuthModal(true);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      setShowAuthModal(false);
    } catch (err: any) {
      const isCancellation =
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/popup-blocked' ||
        (typeof err?.message === 'string' && err.message.includes('popup-closed-by-user'));

      if (!isCancellation) {
        setErrorMsg(err?.message || 'Google sign in could not be completed.');
      }
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmedEmail = emailInput.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    try {
      signInWithEmail(trimmedEmail, nameInput);
      setShowAuthModal(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to authenticate.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Navigation Header */}
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight font-serif text-stone-900">
                ReflectAI
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                Gemini 3.6 Flash & Firestore
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="header-demo-signin-btn"
              onClick={() => handleOpenAuth('login')}
              className="px-3.5 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Test Preview Session
            </button>
            <button
              id="header-google-signin-btn"
              onClick={handleGoogleSignIn}
              className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <span>Sign In with Google</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-medium mb-8">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          <span>Tenant Isolation: Entries strictly bound to your authenticated UID</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-medium tracking-tight text-stone-900 max-w-3xl leading-[1.15]">
          A mindful sanctuary for your thoughts, powered by Gemini.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-stone-600 max-w-2xl font-light leading-relaxed">
          Record reflections, explore multi-turn dialogues with Gemini 3.6 Flash, and preserve your journey in Cloud Firestore with guaranteed user data isolation.
        </p>

        {/* CTA Group */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
          <button
            id="hero-google-signin-btn"
            onClick={handleGoogleSignIn}
            className="w-full sm:w-auto flex items-center justify-center space-x-3 px-6 py-3.5 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 active:scale-[0.99] rounded-xl shadow-md transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.8 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.3 0 10.6 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.4-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
              />
            </svg>
            <span>Sign In with Google</span>
          </button>

          <button
            id="hero-demo-signin-btn"
            onClick={() => handleOpenAuth('signup')}
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300/80 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4 text-stone-500" />
            <span>Launch Interactive Session</span>
          </button>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-100/60 text-amber-800 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-900 text-base mb-1">
              Gemini 3.6 Flash Engine
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Multi-turn conversational reflections with an automated 4-model fallback ladder ensuring high-availability brainstorming and summarization.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-900 text-base mb-1">
              Cloud Firestore Isolation
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Every journal entry is anchored strictly under <code className="text-xs bg-stone-100 px-1 py-0.5 rounded text-stone-800">/users/{'{uid}'}/interactions</code> with owner-only ABAC rules.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-900 text-base mb-1">
              Zero Hardcoded Secrets
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Server-side API routes protect all Gemini credentials via Secret Manager and environment variables without exposing tokens to client bundles.
            </p>
          </div>
        </div>

        {/* System Highlights Banner */}
        <div className="mt-16 w-full p-6 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-amber-800 shrink-0" />
            <div className="text-sm text-stone-800">
              <span className="font-medium">Production Security Directives Active: </span>
              Undefined-stripping payload sanitization, zero-insecure defaults, and resilient recovery matrix.
            </div>
          </div>
          <div className="text-xs text-stone-500 font-mono">
            {isConfigured ? 'Firebase Live Sync Ready' : 'Interactive Sandbox Ready'}
          </div>
        </div>
      </main>

      {/* Auth Modal: Asks for Login or Signup */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            id="auth-dialog"
            className="bg-white rounded-2xl shadow-xl border border-stone-200/90 w-full max-w-md overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-700 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 text-sm font-serif">
                    {authMode === 'login' ? 'Sign In to ReflectAI' : 'Create ReflectAI Account'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Choose your authentication method to begin
                  </p>
                </div>
              </div>
              <button
                id="close-auth-modal-btn"
                onClick={() => setShowAuthModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1.5 bg-stone-100/80 mx-6 mt-5 rounded-xl text-xs font-medium">
              <button
                type="button"
                id="tab-login-btn"
                onClick={() => { setAuthMode('login'); setErrorMsg(null); }}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                id="tab-signup-btn"
                onClick={() => { setAuthMode('signup'); setErrorMsg(null); }}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="p-6 pt-5 space-y-4">
              {/* Google Sign-in */}
              <button
                type="button"
                id="modal-google-signin-btn"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center space-x-2.5 px-4 py-2.5 border border-stone-300 hover:bg-stone-50 rounded-xl text-xs font-semibold text-stone-800 transition-colors shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.8 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.3 0 10.6 0 12s.6 3.7 1.6 5.6l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.4-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-stone-200 w-full" />
                <span className="bg-white px-2.5 text-[11px] text-stone-400 uppercase tracking-wider absolute">
                  or email
                </span>
              </div>

              {/* Email Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Your Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="auth-name-input"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 bg-white"
                      />
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="auth-email-input"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="e.g. user@example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-700/20 focus:border-amber-700 bg-white"
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                    {errorMsg}
                  </p>
                )}

                {/* RBAC Security Policy Notice */}
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Administrative Access Rule:</strong> Only{' '}
                    <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px] text-amber-950">
                      samshaikh5853@gmail.com
                    </code>{' '}
                    is recognized as Administrator. All other emails receive standard user privileges with tenant-isolated logs.
                  </div>
                </div>

                <button
                  type="submit"
                  id="auth-submit-btn"
                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {authMode === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-stone-200/70 py-6 text-center text-xs text-stone-500">
        ReflectAI &bull; Cloud Run &amp; Gemini 3.6 Flash Challenge &bull; Protected with Firebase Security Rules
      </footer>
    </div>
  );
};
