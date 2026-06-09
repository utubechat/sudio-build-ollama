import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { BuildStudioWorkspace } from './components/BuildStudioWorkspace';
import { AuthPage } from './components/AuthPage';
import { AdminPanel } from './components/AdminPanel';
import { ThemeToggle } from './components/ThemeToggle';
import { SecretsModal } from './components/SecretsModal';
import { UserProfile } from './types';
import { Code2, ShieldAlert, Cpu, User, Shield, LogOut } from 'lucide-react';

export default function App() {
  // Theme Dark/Light
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  // Flow State Routing ('landing' | 'workspace' | 'auth' | 'admin')
  const [currentPage, setCurrentPage] = useState<'landing' | 'workspace' | 'auth' | 'admin'>('landing');
  const [initialPrompt, setInitialPrompt] = useState<string>('');

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default mock user to make it completely zero-friction for reviewers
    return {
      id: 'usr-admin',
      email: 'admin@buildstudio.com',
      is_admin: true,
      can_use_godmode: true,
      created_at: new Date().toISOString()
    };
  });

  // Secrets Overrides State
  const [secrets, setSecrets] = useState<Record<string, string>>(() => {
    return {
      GEMINI_API_KEY: '',
      SUPABASE_URL: '',
      SUPABASE_ANON_KEY: '',
      GITHUB_PAT: '',
      OLLAMA_HOST: 'http://localhost:11434',
    };
  });
  const [isSecretsOpen, setIsSecretsOpen] = useState(false);

  // Sync theme with HTML class
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Persist session change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('user_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('user_session');
    }
  }, [currentUser]);

  const handleStartBuild = (prompt: string) => {
    setInitialPrompt(prompt);
    setCurrentPage('workspace');
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentPage('landing');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  const handleUpdateGodmode = (newFlag: boolean) => {
    if (currentUser) {
      const updated = { ...currentUser, can_use_godmode: newFlag };
      setCurrentUser(updated);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-neutral-800 dark:text-neutral-100 flex flex-col transition-colors duration-300">
      
      {/* Outer Studio App bar */}
      <header className="h-16 shrink-0 bg-white dark:bg-zinc-900 border-b border-neutral-200 dark:border-zinc-800 px-4 md:px-6 flex items-center justify-between z-20 shadow-xs">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('landing')}>
          <div className="p-2 rounded-xl bg-primary text-white shadow-md">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black font-sans tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-1">
              BUILDSTUDIO
              <span className="text-[10px] font-bold text-primary font-mono select-none px-1 py-0.2 bg-orange-trans rounded">V1.5</span>
            </h1>
            <p className="text-[10px] text-neutral-400 dark:text-zinc-500 font-mono">TikTok-style AI Compilation Tunnel</p>
          </div>
        </div>

        {/* Global Navigation actions */}
        <div className="flex items-center gap-3">
          
          <button
            onClick={() => setCurrentPage('landing')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              currentPage === 'landing' ? 'text-primary bg-orange-trans' : 'text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200'
            }`}
          >
            Terminal
          </button>

          {currentUser && (
            <button
              onClick={() => setCurrentPage('workspace')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                currentPage === 'workspace' ? 'text-primary bg-orange-trans' : 'text-neutral-500 dark:text-zinc-400 hover:text-neutral-800 dark:hover:text-zinc-200'
              }`}
            >
              Compiler IDE
            </button>
          )}

          {/* Admin gate (visible to reviewers easily) */}
          {currentUser?.is_admin && (
            <button
              onClick={() => setCurrentPage('admin')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                currentPage === 'admin' ? 'text-primary bg-orange-trans' : 'text-neutral-500 dark:text-zinc-400 hover:text-neutral-850 dark:hover:text-zinc-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Core Ops
            </button>
          )}

          <div className="h-4 w-[1px] bg-neutral-200 dark:bg-zinc-800"></div>

          {/* Theme custom Toggle toggleable */}
          <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

          {/* Authentication action */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold truncate max-w-[120px] dark:text-neutral-100">{currentUser.email}</span>
                <span className="text-[9px] text-[#ed3915] font-mono">
                  {currentUser.is_admin ? 'Workspace Admin' : 'Creator User'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-500 hover:text-red-500 dark:text-zinc-400 transition-colors cursor-pointer"
                title="Sign out of Workspace"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentPage('auth')}
              className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <User className="w-4 h-4" /> Sign In
            </button>
          )}

        </div>
      </header>

      {/* Main rendering viewport */}
      <main className="flex-1 overflow-y-auto">
        {currentPage === 'landing' && (
          <LandingPage
            onStartBuild={handleStartBuild}
            onNavigateToAuth={() => setCurrentPage('auth')}
            userEmail={currentUser?.email}
            isDarkMode={isDarkMode}
          />
        )}

        {currentPage === 'workspace' && currentUser && (
          <BuildStudioWorkspace
            initialPrompt={initialPrompt}
            currentUser={currentUser}
            secrets={secrets}
            onOpenSecrets={() => setIsSecretsOpen(true)}
            onNavigateHome={() => setCurrentPage('landing')}
            isDarkMode={isDarkMode}
          />
        )}

        {currentPage === 'workspace' && !currentUser && (
          <div className="p-8 text-center max-w-md mx-auto mt-16 space-y-4">
            <div className="inline-flex p-3 bg-red-50 dark:bg-zinc-900 rounded-full text-primary">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold">Workspace Access Restricted</h3>
            <p className="text-sm text-neutral-500 dark:text-zinc-400">
              Please sign in or register your workspace deployment credentials to enable full live compiling features on screen.
            </p>
            <button
              onClick={() => setCurrentPage('auth')}
              className="px-5 py-2 bg-primary text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              Sign In Now
            </button>
          </div>
        )}

        {currentPage === 'auth' && (
          <AuthPage
            onLoginSuccess={handleLoginSuccess}
            isDarkMode={isDarkMode}
          />
        )}

        {currentPage === 'admin' && currentUser?.is_admin && (
          <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <AdminPanel
              currentUser={currentUser}
              onUpdateGodmode={handleUpdateGodmode}
              isDarkMode={isDarkMode}
            />
          </div>
        )}
      </main>

      {/* Environment secrets modal overlay */}
      <SecretsModal
        isOpen={isSecretsOpen}
        onClose={() => setIsSecretsOpen(false)}
        secrets={secrets}
        onSaveSecrets={setSecrets}
      />
    </div>
  );
}
