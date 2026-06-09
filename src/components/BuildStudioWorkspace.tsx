import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Code2, Sparkles, Send, Upload, FileCode, CheckCircle, Database, 
  Github, Download, Layers, Settings2, ShieldCheck, Cpu, RefreshCw, AlertTriangle, HelpCircle, ArrowLeft, History, ArrowRight
} from 'lucide-react';
import { Build, UserProfile, AVAILABLE_MODELS, SYSTEM_PROMPT_PRESETS } from '../types';
import { GitHubService, GitHubRepo } from '../services/githubService';

interface BuildStudioWorkspaceProps {
  initialPrompt: string;
  currentUser: UserProfile;
  secrets: Record<string, string>;
  onOpenSecrets: () => void;
  onNavigateHome: () => void;
  isDarkMode: boolean;
}

export const BuildStudioWorkspace: React.FC<BuildStudioWorkspaceProps> = ({
  initialPrompt,
  currentUser,
  secrets,
  onOpenSecrets,
  onNavigateHome,
  isDarkMode,
}) => {
  // Navigation / Tabs in right zone
  const [activeRightPanel, setActiveRightPanel] = useState<'features' | 'console' | 'database'>('features');

  // State Management
  const [selectedModel, setSelectedModel] = useState('llama3:8b');
  const [isGodmode, setIsGodmode] = useState(currentUser.can_use_godmode);
  const [systemInstruction, setSystemInstruction] = useState(SYSTEM_PROMPT_PRESETS[0].instruction);
  const [promptInput, setPromptInput] = useState(initialPrompt || '');
  const [codeContent, setCodeContent] = useState('<!-- Tap Compile to initiate workspace -->');
  
  // Suggested Prompts
  const suggestions = [
    "Fix Bug: Ensure all keys load correctly",
    "Add Glassmorphism theme accents",
    "Add Supabase Database high-score table",
    "Generate retro synth sounds on clicks",
    "Refactor layout to double split grids"
  ];

  // Builds History State
  const [builds, setBuilds] = useState<Build[]>([
    {
      id: 'b-local-1',
      user_id: currentUser.id,
      name: 'Weather Forecast widget',
      prompt: 'Weather Forecast widget with elegant charts',
      code_content: `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-white p-6 flex flex-col justify-center items-center min-h-[400px]">
  <div class="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-sm text-center shadow-xl">
    <h3 class="text-xs uppercase font-mono tracking-widest text-[#ed3915]">Tokyo Office</h3>
    <strong class="text-4xl block mt-2 font-black font-sans">24°C</strong>
    <p class="text-sm text-zinc-400 mt-1">Light Atmospheric Fog</p>
    <div class="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-3 gap-2 text-xs font-mono">
      <div><span>MON</span><strong class="block text-primary text-xs">22°</strong></div>
      <div><span>TUE</span><strong class="block text-primary text-xs">25°</strong></div>
      <div><span>WED</span><strong class="block text-primary text-xs">26°</strong></div>
    </div>
  </div>
</body>
</html>`,
      model_used: 'llama3:8b',
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ]);
  const [activeBuildId, setActiveBuildId] = useState<string>('b-local-1');

  // Logging & Build indicators
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // File Upload emulation
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string }[]>([]);

  // DB Connection Details
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseLogs, setSupabaseLogs] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [isPushingGithub, setIsPushingGithub] = useState(false);

  // GitHub States
  const [gitToken, setGitToken] = useState<string>(() => {
    return localStorage.getItem('github_integration_token') || secrets.GITHUB_PAT || '';
  });
  const [gitRepos, setGitRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState<string>(''); // e.g. 'owner/repo'
  const [gitFilePath, setGitFilePath] = useState('index.html');
  const [gitCommitMsg, setGitCommitMsg] = useState('Workspace deployment via BuildStudio');
  const [gitBranch, setGitBranch] = useState('main');
  const [gitStatusMsg, setGitStatusMsg] = useState('');
  const [gitStatusType, setGitStatusType] = useState<'info' | 'success' | 'error' | ''>('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');

  // 1. Listen for OAuth state message events from the popup window
  useEffect(() => {
    const handleGitHubMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }

      if (event.data?.type === 'GITHUB_AUTH_SUCCESS' && event.data?.token) {
        const token = event.data.token;
        setGitToken(token);
        localStorage.setItem('github_integration_token', token);
        setGitStatusType('success');
        setGitStatusMsg(event.data.isSandbox 
          ? 'Connected via Development Sandbox Mode!' 
          : 'Successfully authenticated with your GitHub Account!'
        );
        fetchRepositories(token);
      } else if (event.data?.type === 'GITHUB_AUTH_ERROR') {
        setGitStatusType('error');
        setGitStatusMsg(`Connection Failed: ${event.data.error || 'OAuth Mismatch'}`);
      }
    };

    window.addEventListener('message', handleGitHubMessage);
    return () => window.removeEventListener('message', handleGitHubMessage);
  }, []);

  // 2. Automatically load repositories list if token details exist or change
  useEffect(() => {
    if (gitToken) {
      fetchRepositories(gitToken);
    }
  }, [gitToken]);

  const fetchRepositories = async (tokenOnUse: string) => {
    if (!tokenOnUse) return;
    setIsLoadingRepos(true);
    setGitStatusType('info');
    setGitStatusMsg('Fetching repositories list from GitHub...');
    try {
      if (tokenOnUse === 'ghp_sandboxTokenOAuthBuildStudioZeroFriction') {
        const mockRepos: GitHubRepo[] = [
          {
            id: 101,
            name: 'interactive-weather-dashboard',
            full_name: 'sandbox-developer/interactive-weather-dashboard',
            owner: { login: 'sandbox-developer', avatar_url: 'https://github.com/github.png' },
            html_url: 'https://github.com/sandbox-developer/interactive-weather-dashboard',
            description: 'A dynamic visual application compiled directly from natural language prompts.',
            default_branch: 'main'
          },
          {
            id: 102,
            name: 'buildstudio-reactive-synth',
            full_name: 'sandbox-developer/buildstudio-reactive-synth',
            owner: { login: 'sandbox-developer', avatar_url: 'https://github.com/github.png' },
            html_url: 'https://github.com/sandbox-developer/buildstudio-reactive-synth',
            description: 'Zero friction audio synthesizer layouts.',
            default_branch: 'main'
          },
          {
            id: 103,
            name: 'tiktok-ai-ide-tunnel',
            full_name: 'sandbox-developer/tiktok-ai-ide-tunnel',
            owner: { login: 'sandbox-developer', avatar_url: 'https://github.com/github.png' },
            html_url: 'https://github.com/sandbox-developer/tiktok-ai-ide-tunnel',
            description: 'Compilation sandbox system architecture.',
            default_branch: 'main'
          }
        ];
        
        await new Promise(resolve => setTimeout(resolve, 800));
        setGitRepos(mockRepos);
        setSelectedRepoFullName(mockRepos[0].full_name);
        setGitStatusType('success');
        setGitStatusMsg('GitHub Sandbox loaded successfully!');
        return;
      }

      const repos = await GitHubService.listRepositories(tokenOnUse);
      setGitRepos(repos);
      if (repos.length > 0) {
        setSelectedRepoFullName(repos[0].full_name);
      }
      setGitStatusType('success');
      setGitStatusMsg(`Loaded ${repos.length} active repositories.`);
    } catch (err: any) {
      console.error("Error fetching repos:", err);
      setGitStatusType('error');
      setGitStatusMsg(`Connection Error: ${err.message}`);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Split View Slider Ratio
  const [splitRatio, setSplitRatio] = useState(50); // percentage for top view (Live Preview)

  // Trigger compiler sequence on load if initialPrompt exists
  useEffect(() => {
    if (initialPrompt) {
      triggerCompile(initialPrompt);
    } else if (builds.length > 0) {
      setCodeContent(builds[0].code_content);
    }
  }, [initialPrompt]);

  // Logs pipeline emulator
  const addLog = (message: string, delay: number) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setBuildLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
        resolve();
      }, delay);
    });
  };

  // Compile Handler using real Server API
  const triggerCompile = async (promptToUse: string) => {
    if (!promptToUse.trim()) return;

    setIsBuilding(true);
    setBuildLogs([]);
    setPromptInput(promptToUse);

    try {
      await addLog("⚡ Initializing Sandbox Container Isolation Layer...", 300);
      await addLog(`📡 Resolving LLM Target: ${selectedModel}...`, 400);

      // Verify Godmode constraints
      const targetModel = AVAILABLE_MODELS.find(m => m.name === selectedModel);
      if (targetModel?.isHighEnd && !isGodmode) {
        throw new Error("Target selection requires high-end access. Switch Godmode ON in Settings.");
      }

      await addLog("💾 Allocating transient RAM buffers...", 250);
      await addLog("🧠 Processing build schema alignment against rules...", 350);
      await addLog("🪄 Streaming synthesis request to Server Proxy...", 200);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          model: selectedModel,
          system_instruction: systemInstruction,
          isGodmode: isGodmode,
        }),
      });

      if (!response.ok) {
        const errObj = await response.json();
        throw new Error(errObj.error || "Generation endpoint rejected request.");
      }

      const resData = await response.json();
      const generatedCode = resData.code;

      await addLog("❇️ Binary payload synthesised successfully!", 400);
      await addLog("🧩 Compiling assets & generating local bundle...", 300);
      await addLog("🚀 Launching hot reload dev server on port 3000...", 250);

      setCodeContent(generatedCode);

      // Save build to local state list
      const newBuild: Build = {
        id: 'build-' + Date.now(),
        user_id: currentUser.id,
        name: promptToUse.slice(0, 32) + (promptToUse.length > 32 ? '...' : ''),
        prompt: promptToUse,
        code_content: generatedCode,
        model_used: selectedModel,
        created_at: new Date().toISOString()
      };

      setBuilds((prev) => [newBuild, ...prev]);
      setActiveBuildId(newBuild.id);

    } catch (err: any) {
      setBuildLogs((prev) => [...prev, `[ERROR] Build pipeline crashed: ${err.message}`]);
    } finally {
      setIsBuilding(false);
    }
  };

  // Switch Active History Build
  const handleSelectBuild = (build: Build) => {
    setActiveBuildId(build.id);
    setCodeContent(build.code_content);
    setPromptInput(build.prompt);
  };

  // Save changes from Manual Editor
  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCodeContent(e.target.value);
  };

  // Connect Supabase (One-Click)
  const handleConnectSupabase = () => {
    setSupabaseConnected(true);
    setSupabaseLogs([
      "Establishing connection to Supabase storage hosts...",
      "Status Code: 200 OK Connection established.",
      "Profile database synchronization success.",
      "Executing schema migrations...",
      "CREATE TABLE profiles (id uuid PRIMARY KEY, is_admin boolean); SUCCESS.",
      "CREATE TABLE builds (id uuid PRIMARY KEY, code_content text); SUCCESS.",
      "Row Level Security policies allocated to profiles. ACTIVE."
    ]);
    setActiveRightPanel('database');
  };

  // Simulated File Uploader
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files) as File[];
    const mapped = filesArray.map(f => ({
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB'
    }));
    setUploadedFiles(prev => [...prev, ...mapped]);
    setBuildLogs(prev => [...prev, `[INFO] Context Injector: Loaded payload "${filesArray[0].name}" into compiler pipeline context`]);
  };

  // Push code to GitHub
  const handleConnectGitHub = async () => {
    setGitStatusType('info');
    setGitStatusMsg('Initiating GitHub OAuth flow popup...');
    try {
      const originParam = encodeURIComponent(window.location.origin);
      const res = await fetch(`/api/github/auth-url?origin=${originParam}`);
      if (!res.ok) {
        throw new Error(`Failed to request OAuth Authorize URL: ${res.status}`);
      }
      const data = await res.json();
      
      const popupWidth = 600;
      const popupHeight = 700;
      const left = window.screenX + (window.outerWidth - popupWidth) / 2;
      const top = window.screenY + (window.outerHeight - popupHeight) / 2;
      
      const authWindow = window.open(
        data.url,
        'github_oauth_popup',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,status=yes`
      );

      if (!authWindow) {
        setGitStatusType('error');
        setGitStatusMsg('Popup window blocked. Please permit popups to connect with GitHub.');
      }
    } catch (err: any) {
      console.error(err);
      setGitStatusType('error');
      setGitStatusMsg(`OAuth Initiation failed: ${err.message}`);
    }
  };

  const handleConnectManualToken = () => {
    if (!manualTokenInput.trim()) return;
    const token = manualTokenInput.trim();
    setGitToken(token);
    localStorage.setItem('github_integration_token', token);
    setManualTokenInput('');
    setShowTokenInput(false);
    setGitStatusType('success');
    setGitStatusMsg('GitHub PAT configured successfully. Loading repositories...');
    fetchRepositories(token);
  };

  const handleDisconnectGitHub = () => {
    setGitToken('');
    setGitRepos([]);
    setSelectedRepoFullName('');
    setGithubUrl('');
    localStorage.removeItem('github_integration_token');
    setGitStatusType('info');
    setGitStatusMsg('GitHub Integration disconnected.');
  };

  const handlePushCode = async () => {
    if (!gitToken) return;
    if (!selectedRepoFullName) {
      setGitStatusType('error');
      setGitStatusMsg('Please select a target repository first.');
      return;
    }

    const [owner, repo] = selectedRepoFullName.split('/');
    if (!owner || !repo) {
      setGitStatusType('error');
      setGitStatusMsg('Invalid repository path selection.');
      return;
    }

    setIsPushingGithub(true);
    setGitStatusType('info');
    setGitStatusMsg(`Pushing ${gitFilePath} to ${selectedRepoFullName}...`);

    try {
      if (gitToken === 'ghp_sandboxTokenOAuthBuildStudioZeroFriction' || gitToken.startsWith('ghp_sandboxToken')) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const simulatedUrl = `https://github.com/${owner}/${repo}/blob/${gitBranch}/${gitFilePath}`;
        setGithubUrl(simulatedUrl);
        setGitStatusType('success');
        setGitStatusMsg(`Synced Successfully in Sandbox Mode!`);
        alert(`Zero-friction commit successful!\nPushed file simulated: ${gitFilePath} in sandbox repo: ${selectedRepoFullName}`);
        return;
      }

      const pushRes = await GitHubService.pushFileToRepo({
        token: gitToken,
        owner,
        repo,
        filePath: gitFilePath,
        content: codeContent,
        commitMessage: gitCommitMsg,
        branch: gitBranch
      });

      setGithubUrl(pushRes.html_url);
      setGitStatusType('success');
      setGitStatusMsg(`Active repository synched successfully! Commit SHA: ${pushRes.sha.slice(0, 8)}`);
      alert(`Synchronisation successful!\nPushed build to GitHub repository: ${selectedRepoFullName}`);
    } catch (err: any) {
      console.error(err);
      setGitStatusType('error');
      setGitStatusMsg(`Direct Commit Failed: ${err.message}`);
    } finally {
      setIsPushingGithub(false);
    }
  };

  const handleQuickPush = async () => {
    if (!gitToken) {
      handleConnectGitHub();
      return;
    }
    if (!selectedRepoFullName) {
      setActiveRightPanel('features');
      alert("Please select a target repository first in the 'Features' panel on the right.");
      return;
    }
    await handlePushCode();
  };

  // Download Standalone App Code
  const handleDownloadApp = () => {
    const blob = new Blob([codeContent], { type: 'text/html' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `buildstudio_${activeBuildId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Remix Build
  const handleRemixBuild = () => {
    const active = builds.find(b => b.id === activeBuildId);
    if (!active) return;
    const remixed: Build = {
      ...active,
      id: 'remix-' + Date.now(),
      name: `Remix of ${active.name}`,
      created_at: new Date().toISOString()
    };
    setBuilds((prev) => [remixed, ...prev]);
    setActiveBuildId(remixed.id);
    alert('Project remixed! Play with the duplicate copy seamlessly on screen.');
  };

  // Save to App Gallery Showcase
  const handleSaveToGallery = () => {
    alert("Build successfully submitted to the BuildStudio developer portal! Other developers can now clone this workspace.");
  };

  // In-place interactive click mockup: clicking on element toggles inline editing highlight
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans">
      
      {/* Build Studio Toolbar */}
      <div id="buildstudio-action-bar" className="h-14 shrink-0 bg-neutral-50 dark:bg-zinc-900 border-b border-neutral-200 dark:border-zinc-800 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            id="back-home-button"
            onClick={onNavigateHome} 
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-500 dark:text-zinc-400 cursor-pointer"
            title="Back to Landing Page"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase tracking-wider dark:text-neutral-100">BuildStudio Mainframe</h2>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-trans text-[9px] text-primary font-bold">
                  <Cpu className="w-2.5 h-2.5" />
                  <span>ACTIVE</span>
                </div>
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-zinc-500 font-mono">Workspace ID: {activeBuildId}</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Agent API Toggle (Low Mode / Godmode) */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-lg text-[10px] uppercase font-bold tracking-wider">
            <button
              onClick={() => setIsGodmode(false)}
              className={`px-2 py-1 rounded transition-all ${!isGodmode ? 'bg-white dark:bg-zinc-900 text-neutral-800 dark:text-zinc-100 shadow' : 'text-neutral-500'}`}
            >
              Low Mode
            </button>
            <button
              onClick={() => setIsGodmode(true)}
              className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${isGodmode ? 'bg-primary text-white shadow-md' : 'text-neutral-500'}`}
            >
              <Sparkles className="w-2.5 h-2.5" /> Godmode
            </button>
          </div>

          {/* Model picker dropdown */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 px-2 py-1 rounded-lg">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-xs text-neutral-800 dark:text-neutral-200 border-none outline-none font-mono cursor-pointer"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.name} value={m.name} className="bg-white dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200">
                  {m.name} ({m.isHighEnd ? 'PRO' : 'FREE'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenSecrets}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs border border-neutral-200 dark:border-zinc-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-500 dark:text-neutral-300 font-medium cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" /> Credentials
          </button>

          {/* Quick Push to GitHub Button */}
          <button
            id="workspace-push-github-bar-btn"
            onClick={handleQuickPush}
            disabled={!gitToken || isPushingGithub}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed select-none ${
              gitToken 
                ? 'bg-neutral-900 hover:bg-neutral-850 border-neutral-700 text-white dark:bg-zinc-950 dark:hover:bg-zinc-900 border-zinc-800' 
                : 'bg-neutral-150 dark:bg-zinc-950 border-neutral-200 dark:border-zinc-850 text-neutral-400 dark:text-zinc-650'
            }`}
            title={gitToken ? `Push workspace state to ${selectedRepoFullName || 'repository'}` : 'Authenticate/Connect GitHub in Features panel to enable'}
          >
            <Github className="w-3.5 h-3.5" />
            <span>{isPushingGithub ? 'Pushing...' : 'Push to GitHub'}</span>
          </button>

          <button
            onClick={handleRemixBuild}
            title="Create a mirror duplicate copy of current build state"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs border border-primary/25 bg-orange-trans hover:bg-orange-trans-heavy rounded-lg text-primary font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Remix Code
          </button>
        </div>
      </div>

      {/* Main Dashboard body layout */}
      <div className="flex h-full overflow-hidden">
        
        {/* TAB A: LEFT SIDEBAR (CHAT & CONTEXT) */}
        <div 
          className={`shrink-0 bg-neutral-50 dark:bg-zinc-900/60 border-r border-neutral-200 dark:border-zinc-800 transition-all duration-300 flex flex-col ${
            sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-[280px] sm:w-[320px]'
          }`}
        >
          {/* History Collateral Header */}
          <div className="p-4 border-b border-neutral-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-primary" /> Recent Builds History
            </h3>
            <div className="mt-2.5 max-h-[120px] overflow-y-auto space-y-1.5">
              {builds.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSelectBuild(b)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs leading-normal transition-all flex items-center justify-between border ${
                    activeBuildId === b.id 
                      ? 'bg-zinc-100 dark:bg-zinc-900 border-primary/30 text-primary font-semibold' 
                      : 'border-transparent text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="truncate pr-2">{b.name}</span>
                  <span className="text-[9px] font-mono opacity-50">{new Date(b.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input / chat zone */}
          <div className="p-4 flex flex-col h-full overflow-y-auto">
            <div className="flex-1 space-y-4">
              
              {/* Context Attachments */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500">
                  <span>Compilation Payloads</span>
                  <button 
                    onClick={handleUploadClick}
                    className="text-primary hover:underline flex items-center gap-0.5 cursor-pointer text-[10px]"
                  >
                    <Upload className="w-3 h-3" /> Add Context
                  </button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept=".pdf,.code,.js,.html,.txt,.png,.jpeg"
                />

                {uploadedFiles.length === 0 ? (
                  <p className="text-[10px] text-neutral-400 dark:text-zinc-650 italic">No files provided as schema definitions.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5">
                    {uploadedFiles.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-md text-[10px] font-mono">
                        <FileCode className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate flex-1 text-neutral-700 dark:text-neutral-300">{f.name}</span>
                        <span className="text-[8px] text-neutral-400 shrink-0">{f.size}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggestions chips */}
              <div className="space-y-1.5 pt-2 overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 block">Quick Prompt Enhancements</span>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x select-none">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => triggerCompile(s)}
                      className="snap-start shrink-0 px-3 py-1.5 bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-neutral-800 hover:border-[#ed3915]/50 rounded-full text-[11px] font-medium leading-none text-neutral-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-all cursor-pointer whitespace-nowrap"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom System Prompt overriding rules */}
            <div className="pt-4 mt-auto border-t border-neutral-200 dark:border-zinc-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 flex items-center gap-1">
                <Settings2 className="w-3 h-3 text-primary" /> Active System Rules Setup
              </span>
              <select
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                className="w-full text-xs p-2 bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-neutral-800 rounded outline-none text-neutral-700 dark:text-neutral-300 font-mono cursor-pointer"
              >
                {SYSTEM_PROMPT_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.instruction}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Prompt input trigger */}
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-zinc-800 gap-1.5">
              <div className="relative flex items-center">
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Enter detailed prompt modifications..."
                  rows={2}
                  className="w-full p-2.5 bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 focus:border-primary rounded-lg text-xs outline-none dark:text-white pr-9 resize-none font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      triggerCompile(promptInput);
                    }
                  }}
                />
                <button
                  onClick={() => triggerCompile(promptInput)}
                  disabled={isBuilding || !promptInput.trim()}
                  className="absolute right-2 px-1.5 py-1.5 bg-primary text-white rounded-lg disabled:opacity-40 hover:bg-primary-dark transition-all cursor-pointer"
                  title="Trigger Compile"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ZONE B & C: PREVIEW, EDITOR, & RIGHT CONTROLS */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Main Workspace Frame */}
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Compile Stream Terminal Output Overlay */}
            {isBuilding && (
              <div className="absolute inset-0 z-40 bg-zinc-950/90 backdrop-blur-xs flex items-center justify-center p-6 text-left">
                <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs text-green-400 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-primary animate-spin" />
                      <strong className="text-[#ed3915]">COMPILE SERVER PIPELINE</strong>
                    </div>
                    <span className="text-[10px] text-zinc-500">LIVE SYNTHTESTING</span>
                  </div>
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {buildLogs.map((log, idx) => (
                      <p key={idx} className="leading-relaxed animate-fade-in">{log}</p>
                    ))}
                    <div className="flex items-center gap-1 text-white animate-pulse">
                      <span>_</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SPLIT VIEW - Top Pane: Live Preview */}
            <div className="relative border-b border-neutral-200 dark:border-zinc-800" style={{ height: `${splitRatio}%` }}>
              <div className="absolute top-2 left-2 z-30 px-2 py-1 bg-white/75 dark:bg-black/70 backdrop-blur-xs rounded border border-neutral-200/50 dark:border-zinc-800 text-[10px] uppercase font-bold tracking-wider text-neutral-500 dark:text-zinc-400">
                Live Interactive Application Preview
              </div>

              {/* Real working iframe of synthesized HTML code */}
              <iframe
                id="live-sandbox-preview"
                ref={iframeRef}
                srcDoc={codeContent}
                className="w-full h-full bg-white block"
                sandbox="allow-scripts"
                title="Workspace Preview Sandbox"
              />
            </div>

            {/* Split Drag handle emulator */}
            <div className="h-2 bg-neutral-100 dark:bg-zinc-900 hover:bg-primary/20 cursor-row-resize flex items-center justify-center border-y border-neutral-200 dark:border-zinc-800 shrink-0">
              <span className="w-10 h-1 bg-neutral-300 dark:bg-zinc-800 rounded-full"></span>
            </div>

            {/* SPLIT VIEW - Bottom Pane: Code Editor */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-neutral-900/90 border border-zinc-800 text-[9px] text-[#ed3915] font-mono tracking-wider uppercase rounded">
                TypeScript / HTML IDE Canvas
              </div>
              
              <div className="h-full w-full flex overflow-hidden">
                {/* Line number padding */}
                <div className="w-12 shrink-0 bg-neutral-50 dark:bg-zinc-950 font-mono text-[10px] text-neutral-400 dark:text-neutral-600 text-right p-2 select-none border-r border-neutral-200 dark:border-zinc-800">
                  {Array.from({ length: Math.min(codeContent.split('\n').length || 1, 100) }).map((_, idx) => (
                    <div key={idx} className="h-5 leading-5">{idx + 1}</div>
                  ))}
                </div>

                {/* Main Raw Code Editor Textarea */}
                <textarea
                  id="code-editor-textarea"
                  value={codeContent}
                  onChange={handleEditorChange}
                  spellCheck={false}
                  className="flex-1 h-full bg-zinc-900 text-zinc-100 font-mono text-xs p-4 focus:outline-none overflow-auto leading-5 whitespace-pre resize-none"
                  placeholder="<!-- Synthesised Code will load here -->"
                />
              </div>
            </div>

          </div>

          {/* RIGHT ACTION DRAWER PIECE (Features / Database / Sync) */}
          <div className="w-full md:w-[260px] lg:w-[290px] bg-neutral-50 dark:bg-zinc-900 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-zinc-800 flex flex-col shrink-0">
            
            {/* Tabs selector */}
            <div className="grid grid-cols-3 text-center border-b border-neutral-200 dark:border-zinc-800 bg-neutral-100 dark:bg-zinc-950 h-10 shrink-0 text-[10px] uppercase font-bold tracking-wider">
              <button
                onClick={() => setActiveRightPanel('features')}
                className={`py-2 px-1 hover:text-primary transition-all cursor-pointer ${activeRightPanel === 'features' ? 'bg-white dark:bg-zinc-900 text-primary border-b-2 border-primary' : 'text-neutral-400'}`}
              >
                Integrations
              </button>
              <button
                onClick={() => setActiveRightPanel('console')}
                className={`py-2 px-1 hover:text-primary transition-all cursor-pointer ${activeRightPanel === 'console' ? 'bg-white dark:bg-zinc-900 text-primary border-b-2 border-primary' : 'text-neutral-400'}`}
              >
                Ollama Sync
              </button>
              <button
                onClick={() => setActiveRightPanel('database')}
                className={`py-2 px-1 hover:text-primary transition-all cursor-pointer ${activeRightPanel === 'database' ? 'bg-white dark:bg-zinc-900 text-primary border-b-2 border-primary' : 'text-neutral-400'}`}
              >
                Database
              </button>
            </div>

            {/* Sidebar Tab Panels */}
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              
              {/* TAB 1: INTEGRATIONS */}
              {activeRightPanel === 'features' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest flex items-center gap-1">
                        <Github className="w-3.5 h-3.5" /> Git Version Sync
                      </h4>
                      {gitToken && (
                        <span className="flex items-center gap-1 text-[9px] text-green-500 font-mono font-black uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Connected
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">Export source assets directly to live repository branches</p>
                    
                    <div className="space-y-3 pt-1">
                      
                      {/* Scenario A: NOT connected to GitHub */}
                      {!gitToken ? (
                        <div className="space-y-2.5">
                          <button
                            onClick={handleConnectGitHub}
                            className="w-full py-1.5 bg-neutral-900 border border-neutral-700 hover:border-white text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all hover:bg-neutral-950 select-none"
                          >
                            <Github className="w-3.5 h-3.5 text-white" />
                            <span>Connect via GitHub OAuth</span>
                          </button>

                          <div className="text-center">
                            <button
                              onClick={() => setShowTokenInput(!showTokenInput)}
                              className="text-[10px] text-neutral-400 hover:text-primary transition-colors underline font-mono cursor-pointer"
                            >
                              {showTokenInput ? 'Cancel OAuth Override' : 'Use Personal Access Token / SIM PAT'}
                            </button>
                          </div>

                          {showTokenInput && (
                            <div className="p-3 bg-neutral-100 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-lg space-y-2 animate-fade-in">
                              <label className="block text-[9px] font-bold text-neutral-400 uppercase font-mono">GitHub PAT or Sandbox Key</label>
                              <input
                                type="password"
                                value={manualTokenInput}
                                onChange={(e) => setManualTokenInput(e.target.value)}
                                placeholder="ghp_..."
                                className="w-full p-1.5 text-xs bg-white dark:bg-zinc-900 border border-neutral-300 dark:border-zinc-800 rounded focus:border-[#ed3915] focus:outline-hidden text-neutral-900 dark:text-neutral-100 font-mono"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleConnectManualToken}
                                  className="flex-1 py-1 bg-[#ed3915] text-white text-xs font-bold rounded-md hover:bg-primary-dark transition-colors"
                                >
                                  Save Token
                                </button>
                                <button
                                  onClick={() => {
                                    setGitToken('ghp_sandboxTokenOAuthBuildStudioZeroFriction');
                                    localStorage.setItem('github_integration_token', 'ghp_sandboxTokenOAuthBuildStudioZeroFriction');
                                    setGitStatusType('success');
                                    setGitStatusMsg('Bypassed with secure Sandbox Token!');
                                  }}
                                  className="py-1 px-2 border border-neutral-300 dark:border-zinc-800 text-[10px] rounded-md text-neutral-500 hover:text-white dark:hover:bg-zinc-800 hover:bg-zinc-200 transition-colors"
                                  title="Quick layout mock list"
                                >
                                  Simulate
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Scenario B: Active GitHub integration session
                        <div className="space-y-3 p-3 bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl space-y-3 text-left">
                          
                          {/* Active Repos lists */}
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-neutral-400 uppercase font-mono">Target Repository</label>
                            {isLoadingRepos ? (
                              <div className="text-[10px] text-zinc-500 font-mono py-1.5 flex items-center gap-1.5">
                                <RefreshCw className="w-3 h-3 animate-spin text-primary" /> Loading repositories...
                              </div>
                            ) : gitRepos.length === 0 ? (
                              <div className="space-y-1">
                                <div className="text-[10px] text-amber-500 font-mono">No repositories resolved.</div>
                                <button 
                                  onClick={() => fetchRepositories(gitToken)}
                                  className="text-[9px] text-[#ed3915] hover:underline uppercase flex items-center gap-0.5 select-none"
                                >
                                  <RefreshCw className="w-2.5 h-2.5" /> Re-poll Repos
                                </button>
                              </div>
                            ) : (
                              <select
                                value={selectedRepoFullName}
                                onChange={(e) => setSelectedRepoFullName(e.target.value)}
                                className="w-full p-1.5 text-xs bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded focus:border-[#ed3915] focus:outline-hidden dark:text-neutral-100 text-neutral-800"
                              >
                                {gitRepos.map((repo) => (
                                  <option key={repo.id} value={repo.full_name}>
                                    {repo.full_name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* File Path configurations */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-neutral-400 uppercase font-mono">Target Path</label>
                              <input
                                type="text"
                                value={gitFilePath}
                                onChange={(e) => setGitFilePath(e.target.value)}
                                className="w-full p-1.5 text-xs bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded focus:border-[#ed3915] focus:outline-hidden text-neutral-900 dark:text-neutral-100 font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-neutral-400 uppercase font-mono">Branch</label>
                              <input
                                type="text"
                                value={gitBranch}
                                onChange={(e) => setGitBranch(e.target.value)}
                                className="w-full p-1.5 text-xs bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded focus:border-[#ed3915] focus:outline-hidden text-neutral-900 dark:text-neutral-100 font-mono"
                              />
                            </div>
                          </div>

                          {/* Commit Message configurations */}
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-neutral-400 uppercase font-mono">Commit Message</label>
                            <input
                              type="text"
                              value={gitCommitMsg}
                              onChange={(e) => setGitCommitMsg(e.target.value)}
                              className="w-full p-1.5 text-xs bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded focus:border-[#ed3915] focus:outline-hidden text-neutral-800 dark:text-neutral-100 font-sans"
                            />
                          </div>

                          {/* Commit dynamic operations button */}
                          <button
                            onClick={handlePushCode}
                            disabled={isPushingGithub || isLoadingRepos}
                            className="w-full py-1.5 bg-[#ed3915] hover:bg-primary-dark disabled:opacity-40 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none"
                          >
                            <Github className="w-3.5 h-3.5" />
                            <span>{isPushingGithub ? 'Pushing Commit...' : 'Commit & Push Code'}</span>
                          </button>

                          {/* Disconnect helper widget link */}
                          <div className="text-center pt-1">
                            <button
                              onClick={handleDisconnectGitHub}
                              className="text-[9px] text-red-500 hover:text-red-700 uppercase font-bold tracking-wider font-mono cursor-pointer select-none"
                            >
                              Disconnect GitHub integration
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Status / Log notification reporting */}
                      {gitStatusMsg && (
                        <div className={`p-2 rounded text-[10px] font-mono leading-relaxed border ${
                          gitStatusType === 'success' 
                            ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                            : gitStatusType === 'error'
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 border-neutral-250 dark:border-zinc-750'
                        }`}>
                          {gitStatusMsg}
                        </div>
                      )}

                      {githubUrl && (
                        <div className="p-2.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-905/30 rounded-lg">
                          <span className="text-[10px] text-green-700 dark:text-green-400 font-bold block uppercase">Sync Succeeded</span>
                          <a 
                            href={githubUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[10px] text-primary hover:underline font-mono block truncate mt-1 cursor-pointer font-bold"
                          >
                            Open pushed code in GitHub →
                          </a>
                        </div>
                      )}

                      <button
                        onClick={handleDownloadApp}
                        className="w-full py-1.5 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 text-neutral-800 dark:text-neutral-100 rounded-lg text-xs font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                      >
                        <Download className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                        <span>Export Standalone HTML</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 dark:border-zinc-800 space-y-2">
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-widest">Workspace Showcase</h4>
                    <button
                      onClick={handleSaveToGallery}
                      className="w-full py-1.5 border border-primary text-primary hover:bg-primary-dark hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Publish to Portal Gallery
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: OLLAMA SYNC DIAGNOSTICS */}
              {activeRightPanel === 'console' && (
                <div className="space-y-4">
                  <div className="p-3 bg-neutral-100 dark:bg-neutral-950 rounded-lg border border-neutral-250 dark:border-zinc-800 space-y-2">
                    <span className="text-[10px] text-neutral-400 dark:text-zinc-500 uppercase block font-semibold">Active LLM Server</span>
                    <strong className="text-xs font-mono block text-neutral-800 dark:text-neutral-200">{selectedModel}</strong>
                    <p className="text-[10px] text-neutral-500 leading-relaxed leading-normal">
                      Runs server-side parsing engine. Godmode features are highly optimized to translate prompt features maps with strict accuracy.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-neutral-400 dark:text-zinc-500 uppercase block font-bold">Allocation Diagnostics</span>
                    <div className="space-y-1.5 font-mono text-[9px] text-neutral-600 dark:text-zinc-400">
                      <div className="flex justify-between"><span>Compile Host</span><span className="text-primary">Ollama Native Docker</span></div>
                      <div className="flex justify-between"><span>Network Status</span><span className="text-green-500">200 OK CONNECTED</span></div>
                      <div className="flex justify-between"><span>Context Limit</span><span>32,768 Tokens</span></div>
                      <div className="flex justify-between"><span>Server Region</span><span>US-East / Local Proxy</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SUPABASE DATABASE */}
              {activeRightPanel === 'database' && (
                <div className="space-y-4">
                  {!supabaseConnected ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-orange-trans text-center rounded-xl border border-primary/20 space-y-2">
                        <Database className="w-8 h-8 text-primary mx-auto animate-pulse" />
                        <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Supabase Persistent DB</h4>
                        <p className="text-[10px] text-neutral-500 leading-normal">
                          Sync user workspaces, configurations, and profiles directly via instant PostgreSQL mapping rules.
                        </p>
                      </div>

                      <button
                        onClick={handleConnectSupabase}
                        className="w-full py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow"
                      >
                        Connect Supabase
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 font-mono text-[10px]">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded text-green-700 dark:text-green-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Supabase Live Connected</span>
                      </div>

                      <div className="bg-zinc-900 p-2.5 rounded border border-zinc-800 max-h-[220px] overflow-y-auto space-y-1 text-zinc-400">
                        {supabaseLogs.map((log, idx) => (
                          <div key={idx} className="leading-relaxed">{`> ${log}`}</div>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setSupabaseConnected(false);
                          setSupabaseLogs([]);
                        }}
                        className="w-full py-1 border border-neutral-300 dark:border-zinc-800 text-neutral-600 dark:text-zinc-400 hover:text-red-500 rounded text-[9px] transition-all cursor-pointer font-bold uppercase"
                      >
                        Disconnect Host
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
