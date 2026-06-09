import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Code2, Play, FileCode, Database, Terminal, ShieldAlert } from 'lucide-react';

interface LandingPageProps {
  onStartBuild: (prompt: string) => void;
  onNavigateToAuth: () => void;
  userEmail?: string;
  isDarkMode: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartBuild, onNavigateToAuth, userEmail, isDarkMode }) => {
  const [prompt, setPrompt] = useState('');
  const [errorText, setErrorText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setErrorText('Please describe what you want to compile.');
      return;
    }
    setErrorText('');
    onStartBuild(prompt);
  };

  const samplePrompts = [
    { title: 'Pomodoro Workspace', desc: 'A gorgeous developer timer with work sound loops & task lists' },
    { title: 'Markdown Sandbox', desc: 'Sleek side-by-side markdown converter with direct text copy' },
    { title: 'Vaporwave Canvas', desc: 'Sleek drawboard with custom retro neon color palettes' },
    { title: 'SVG Vector Lab', desc: 'Dynamic vector editor with sliders to update shape dimensions' },
  ];

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4">
      {/* Decorative grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#ed3915_0.5px,transparent_0.5px)] dark:bg-[radial-gradient(#ed3915_0.8px,transparent_0.8px)] [background-size:32px_32px] opacity-[0.07] pointer-events-none"></div>
      
      <div className="w-full max-w-3xl mx-auto space-y-12 text-center z-10">
        
        {/* Intro Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-full text-xs font-semibold text-neutral-600 dark:text-zinc-300"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Next-Generation Compiler Pipeline</span>
        </motion.div>

        {/* Title and Pitch */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-4"
        >
          <h1 className="text-4xl sm:text-6xl font-black font-sans tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
            Build Software in <span className="text-primary underline decoration-neutral-800/20 dark:decoration-white/10 decoration-wavy">Real Time</span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-zinc-400 max-w-xl mx-auto">
            Input ideas. Watch the TikTok-style compiler stream code, construct the DOM, and deploy live full-stack services immediately.
          </p>
        </motion.div>

        {/* Console Prompt Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden text-left"
        >
          {/* Windows title bar mock */}
          <div className="px-4 py-2.5 bg-neutral-50 dark:bg-zinc-950 border-b border-neutral-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              <span className="text-[10px] font-mono text-neutral-400 dark:text-zinc-500 ml-2">studio://compiler.engine</span>
            </div>
            {userEmail ? (
              <span className="text-[11px] text-primary/70 font-mono">auth: {userEmail}</span>
            ) : (
              <button onClick={onNavigateToAuth} className="text-[11px] text-primary hover:underline font-semibold cursor-pointer">
                Unlock Pro Account
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What elegant application shall we compile today? e.g. Build an interactive pixel-editor with save, clear, and glowing neon brush palettes..."
                rows={4}
                className="w-full bg-neutral-50 dark:bg-zinc-950/70 text-neutral-800 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-600 text-sm p-4 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono leading-relaxed resize-none"
              />
            </div>

            {errorText && (
              <div className="flex items-center gap-2 text-xs text-red-500 font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorText}</span>
              </div>
            )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap gap-3 text-neutral-400 text-xs">
                  <span className="flex items-center gap-1"><FileCode className="w-3.5 h-3.5" /> HTML/JS Sandbox</span>
                  <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5" /> Supabase Schema</span>
                  <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5" /> Ollama local hosts</span>
                </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold font-mono tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Compile Workspace
              </button>
            </div>
          </form>
        </motion.div>

        {/* Suggestion Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="space-y-3"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-zinc-500">Popular Quickstarts</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {samplePrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(item.desc)}
                className="p-3 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 hover:border-primary dark:hover:border-primary rounded-xl text-left transition-all duration-200 hover:shadow shadow-xs flex items-start gap-3 group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-orange-trans text-primary group-hover:bg-primary group-hover:text-white transition-colors mt-0.5">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{item.title}</h4>
                  <p className="text-[11px] text-neutral-500 dark:text-zinc-400 leading-normal mt-0.5">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};
