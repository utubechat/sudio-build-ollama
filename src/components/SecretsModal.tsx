import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Check, X, Key, Info } from 'lucide-react';

interface SecretsModalProps {
  isOpen: boolean;
  onClose: () => void;
  secrets: Record<string, string>;
  onSaveSecrets: (newSecrets: Record<string, string>) => void;
}

export const SecretsModal: React.FC<SecretsModalProps> = ({ isOpen, onClose, secrets, onSaveSecrets }) => {
  const [localSecrets, setLocalSecrets] = useState<Record<string, string>>({
    GEMINI_API_KEY: secrets.GEMINI_API_KEY || '',
    SUPABASE_URL: secrets.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: secrets.SUPABASE_ANON_KEY || '',
    GITHUB_PAT: secrets.GITHUB_PAT || '',
    OLLAMA_HOST: secrets.OLLAMA_HOST || 'http://localhost:11434',
  });

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  if (!isOpen) return null;

  const toggleShow = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSecrets(localSecrets);
    setIsSavedSuccessfully(true);
    setTimeout(() => {
      setIsSavedSuccessfully(false);
      onClose();
    }, 1200);
  };

  const secretDefs = [
    { key: 'GEMINI_API_KEY', label: 'Gemini API Key (Server Proxy)', desc: 'Required to power code intelligence models on the backend' },
    { key: 'SUPABASE_URL', label: 'Supabase URL', desc: 'Endpoint URI to sync data, authentication, and builds storage' },
    { key: 'SUPABASE_ANON_KEY', label: 'Supabase Public Anon Key', desc: 'Secure client-side endpoint validation token' },
    { key: 'GITHUB_PAT', label: 'GitHub Personal Access Token', desc: 'Enables direct "Connect GitHub" code repository commits' },
    { key: 'OLLAMA_HOST', label: 'Local Ollama Port URL', desc: 'Connection destination for offline local LLM modeling requests' },
  ];

  return (
    <div id="secrets-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">Secrets & Environment Variables</h3>
          </div>
          <button id="close-secrets" onClick={onClose} className="p-1 rounded bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-500 dark:text-neutral-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Keys are securely pre-loaded in full-stack memory. Adding overrides here configures custom workspace integrations dynamically.
            </p>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {secretDefs.map((def) => (
              <div key={def.key} className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-neutral-400" />
                  {def.label}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showKeys[def.key] ? 'text' : 'password'}
                    value={localSecrets[def.key]}
                    onChange={(e) => setLocalSecrets({ ...localSecrets, [def.key]: e.target.value })}
                    className="w-full px-3 py-1.5 pr-10 text-sm bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:border-primary focus:ring-1 focus:ring-primary outline-none dark:text-white font-mono"
                    placeholder={`Enter ${def.key}...`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow(def.key)}
                    className="absolute right-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showKeys[def.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-neutral-400 dark:text-zinc-500 block">{def.desc}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-950 text-xs font-medium text-neutral-600 dark:text-neutral-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-primary hover:bg-primary-dark text-white text-xs font-medium flex items-center gap-1.5 shadow"
            >
              {isSavedSuccessfully ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Saved!
                </>
              ) : (
                <>Save Secrets</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
