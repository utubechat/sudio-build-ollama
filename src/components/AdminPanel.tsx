import React, { useState } from 'react';
import { Shield, Users, BarChart3, Settings, HelpCircle, HardDrive, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { UserProfile, AVAILABLE_MODELS } from '../types';

interface AdminPanelProps {
  currentUser: UserProfile;
  onUpdateGodmode: (flag: boolean) => void;
  isDarkMode: boolean;
}

interface MockUser {
  id: string;
  email: string;
  role: 'Admin' | 'User';
  godmodeEnabled: boolean;
  queries: number;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onUpdateGodmode, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'models'>('users');
  const [users, setUsers] = useState<MockUser[]>([
    { id: 'usr-1', email: currentUser.email, role: 'Admin', godmodeEnabled: currentUser.can_use_godmode, queries: 48 },
    { id: 'usr-2', email: 'junior-dev@buildstudio.com', role: 'User', godmodeEnabled: false, queries: 14 },
    { id: 'usr-3', email: 'chief-architect@antigravity.io', role: 'User', godmodeEnabled: true, queries: 132 },
    { id: 'usr-4', email: 'utubechat3@gmail.com', role: 'Admin', godmodeEnabled: true, queries: 75 }
  ]);

  const [modelsStatus, setModelsStatus] = useState<Record<string, boolean>>({
    'llama3:8b': true,
    'mistral:7b': true,
    'codegemma:7b': true,
    'llama3-lexi:70b': true,
    'mixtral:8x7b': true,
    'deepcoder:33b': false, // simulate one offline
  });

  const toggleUserGodmode = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextFlag = !u.godmodeEnabled;
        if (u.email === currentUser.email) {
          onUpdateGodmode(nextFlag);
        }
        return { ...u, godmodeEnabled: nextFlag };
      }
      return u;
    }));
  };

  const deleteUser = (id: string) => {
    if (confirm('Are you sure you want to revoke workspace credentials for this user?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const toggleModelStatus = (modelName: string) => {
    setModelsStatus(prev => ({
      ...prev,
      [modelName]: !prev[modelName]
    }));
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow">
      {/* Admin header */}
      <div className="bg-neutral-50 dark:bg-zinc-800/40 p-4 border-b border-neutral-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 text-sm">Admin Control Tower</h3>
            <p className="text-[11px] text-neutral-400 dark:text-zinc-500">Monitor Ollama servers, user permissions & telemetry stats</p>
          </div>
        </div>
        <div className="flex bg-neutral-100 dark:bg-zinc-950 p-1 rounded-lg border border-neutral-200 dark:border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'users' ? 'bg-white dark:bg-zinc-900 text-primary font-medium shadow' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Users</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'analytics' ? 'bg-white dark:bg-zinc-900 text-primary font-medium shadow' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'models' ? 'bg-white dark:bg-zinc-900 text-primary font-medium shadow' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> Ollama Servers</span>
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* TAB 1: USER DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-zinc-800 pb-2 text-neutral-400 dark:text-zinc-500">
                    <th className="py-2">User Workspace</th>
                    <th>Role</th>
                    <th>Token Queries</th>
                    <th>Godmode Access</th>
                    <th className="text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800/50">
                  {users.map((user) => (
                    <tr key={user.id} className="text-neutral-700 dark:text-neutral-300">
                      <td className="py-3 font-medium">
                        <div>
                          <span>{user.email}</span>
                          {user.email === currentUser.email && (
                            <span className="ml-2 px-1.5 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-[10px]">You</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          user.role === 'Admin' ? 'bg-primary/10 text-primary' : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="font-mono">{user.queries} API</td>
                      <td>
                        <button
                          onClick={() => toggleUserGodmode(user.id)}
                          className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer"
                        >
                          {user.godmodeEnabled ? (
                            <ToggleRight className="w-6 h-6 text-primary" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-neutral-400" />
                          )}
                          <span className={user.godmodeEnabled ? 'text-primary font-semibold' : ''}>
                            {user.godmodeEnabled ? 'Approved' : 'Disabled'}
                          </span>
                        </button>
                      </td>
                      <td className="text-right">
                        <button
                          disabled={user.email === currentUser.email}
                          onClick={() => deleteUser(user.id)}
                          className="text-neutral-400 hover:text-red-500 disabled:opacity-35 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 dark:bg-zinc-950 rounded-lg border border-neutral-100 dark:border-zinc-800">
                <span className="text-[10px] text-neutral-400 dark:text-zinc-500 uppercase block">Total Operations Runs</span>
                <span className="text-xl font-mono font-bold dark:text-white">269 queries</span>
                <span className="text-[10px] text-green-500 block mt-1">↑ 12% spikes active today</span>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-zinc-950 rounded-lg border border-neutral-100 dark:border-zinc-800">
                <span className="text-[10px] text-neutral-400 dark:text-zinc-500 uppercase block">Average Agent Latency</span>
                <span className="text-xl font-mono font-bold dark:text-white">1.18 s</span>
                <span className="text-[10px] text-neutral-400 dark:text-zinc-500 block mt-1">Backed by gemini-3.5-flash</span>
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-zinc-950 rounded-lg border border-neutral-100 dark:border-zinc-800">
                <span className="text-[10px] text-neutral-400 dark:text-zinc-500 uppercase block">Godmode Ratio</span>
                <span className="text-xl font-mono font-bold dark:text-white">78.5% allocated</span>
                <span className="text-[10px] text-primary block mt-1">High-end queries active</span>
              </div>
            </div>

            {/* Model Usage simple graph */}
            <div className="pt-4 border-t border-neutral-100 dark:border-zinc-800/65">
              <h4 className="text-xs font-semibold text-neutral-700 dark:text-zinc-400 mb-3">Server Traffic Distribution per Model</h4>
              <div className="space-y-2.5">
                {[
                  { name: 'llama3:8b', pct: 25, count: 68 },
                  { name: 'mixtral:8x7b (Godmode)', pct: 45, count: 121 },
                  { name: 'llama3-lexi:70b (Godmode)', pct: 20, count: 54 },
                  { name: 'mistral:7b', pct: 10, count: 26 },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-neutral-600 dark:text-neutral-400">
                      <span className="font-mono">{item.name}</span>
                      <span className="font-mono text-[10px]">{item.count} builds ({item.pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-100 dark:bg-zinc-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${item.pct}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OLLAMA SERVERS */}
        {activeTab === 'models' && (
          <div className="space-y-3">
            <div className="p-3 bg-neutral-50 dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-800 rounded-lg flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>Ollama Container Host Connection: <strong className="text-primary font-mono select-all">http://localhost:11434</strong></span>
              </div>
              <span className="text-[10px] text-neutral-400">Healthy</span>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-zinc-800">
              {AVAILABLE_MODELS.map((model) => {
                const isOnline = modelsStatus[model.name] !== false;
                return (
                  <div key={model.name} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-neutral-800 dark:text-white font-mono">{model.name}</strong>
                        <span className="text-[10px] text-neutral-400 font-mono bg-neutral-100 dark:bg-zinc-850 px-1 rounded">{model.size}</span>
                      </div>
                      <p className="text-[10px] text-neutral-500">{model.description}</p>
                    </div>
                    <div>
                      <button
                        onClick={() => toggleModelStatus(model.name)}
                        className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                          isOnline
                            ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 hover:bg-neutral-100 dark:hover:bg-zinc-800'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-neutral-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {isOnline ? 'Active Online' : 'Offline'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
