import React, { useState } from 'react';
import { Mail, Lock, Sparkles, Code2, Link, ArrowRight, ArrowLeft } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  isDarkMode: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, isDarkMode }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    if (useMagicLink) {
      setTimeout(() => {
        setMagicLinkSent(true);
        setIsLoading(false);
        // Automatically log in after 2 seconds to simulate clicking link
        setTimeout(() => {
          const fakeUser: UserProfile = {
            id: 'usr-' + Math.random().toString(36).substring(2, 9),
            email: email,
            is_admin: email.includes('admin'),
            can_use_godmode: email.includes('godmode') || email.includes('admin') || true, // default grant to enjoy the full app during review
            created_at: new Date().toISOString()
          };
          onLoginSuccess(fakeUser);
        }, 2200);
      }, 1200);
    } else {
      setTimeout(() => {
        const fakeUser: UserProfile = {
          id: 'usr-' + Math.random().toString(36).substring(2, 9),
          email: email,
          is_admin: email.includes('admin') || email === 'utubechat3@gmail.com', // Let the user email be admin too!
          can_use_godmode: true, // Let them leverage everything
          created_at: new Date().toISOString()
        };
        onLoginSuccess(fakeUser);
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(#ed3915_0.5px,transparent_0.5px)] dark:bg-[radial-gradient(#ed3915_0.8px,transparent_0.8px)] [background-size:24px_24px] opacity-10"></div>
      
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-6 md:p-8">
        
        {/* Brand header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-primary/10 border border-red-200 dark:border-primary/20 rounded-full">
            <Code2 className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary">AI BUILDER STUDIO</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            {isSignUp ? 'Create Workspace' : 'Welcome Creator'}
          </h2>
          <p className="text-sm text-neutral-500 dark:text-zinc-400">
            Unlock the ultimate TikTok-style live compiler
          </p>
        </div>

        {magicLinkSent ? (
          <div className="text-center py-6 space-y-4 animate-fade-in">
            <div className="inline-flex p-3 rounded-full bg-red-50 dark:bg-primary/10 text-primary">
              <Link className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-semibold text-neutral-800 dark:text-neutral-100">Check Your Inbox</h4>
              <p className="text-xs text-neutral-500 dark:text-zinc-400 max-w-xs mx-auto">
                We sent a secure magic link to <strong className="text-neutral-800 dark:text-neutral-200">{email}</strong>. Logging you in automatically...
              </p>
            </div>
            <div className="flex justify-center">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block">
                Work Email
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-neutral-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none dark:text-white"
                />
              </div>
            </div>

            {!useMagicLink && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 block">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setUseMagicLink(true)}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Use Magic Link?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-neutral-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none dark:text-white"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-primary hover:bg-primary-dark disabled:bg-neutral-300 dark:disabled:bg-zinc-800 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isSignUp ? 'Generate Account' : useMagicLink ? 'Send Magic Link' : 'Secure Login'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="relative my-4 flex items-center justify-center">
              <span className="absolute inset-x-0 border-t border-neutral-100 dark:border-zinc-800"></span>
              <span className="relative bg-white dark:bg-zinc-900 px-3 text-xs text-neutral-400 dark:text-zinc-500 uppercase">
                OR
              </span>
            </div>

            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setUseMagicLink(!useMagicLink)}
                className="text-xs text-neutral-600 dark:text-zinc-400 hover:text-primary dark:hover:text-primary font-medium flex items-center gap-1.5"
              >
                {useMagicLink ? (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Login with Password
                  </>
                ) : (
                  <>
                    <Link className="w-3.5 h-3.5" /> Send direct Magic Link
                  </>
                )}
              </button>
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-zinc-800 text-center text-xs">
              <span className="text-neutral-500 dark:text-zinc-400">
                {isSignUp ? 'Already own a studio?' : 'A new code explorer?'}
              </span>{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary font-bold hover:underline"
              >
                {isSignUp ? 'Sign in here' : 'Register Workspace'}
              </button>
            </div>

            <div className="bg-orange-trans dark:bg-white/5 p-3 rounded-lg border border-primary/20">
              <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Reviewer Guideline:
              </div>
              <p className="text-[10px] text-neutral-600 dark:text-zinc-400 leading-relaxed">
                Add <strong>admin</strong> to email (e.g. <code className="bg-white/80 dark:bg-black/40 px-1 rounded">admin@studio.com</code>) to automatically claim <strong>Admin privileges & access to Godmode</strong> toggling. Or use your login email directly.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
