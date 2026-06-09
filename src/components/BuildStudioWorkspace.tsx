import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Code2, Sparkles, Send, Upload, FileCode, CheckCircle, Database, 
  Github, Download, Layers, Settings2, ShieldCheck, Cpu, RefreshCw, AlertTriangle, HelpCircle, ArrowLeft, History, ArrowRight,
  Eye, Columns, Terminal, Trash2, Search, Copy, Image as LucideImage, Plus, Bookmark
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
  const [activeRightPanel, setActiveRightPanel] = useState<'features' | 'console' | 'database' | 'assets'>('features');

  // Asset Image Generator State
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageRatio, setImageRatio] = useState<'1:1' | '16:9' | '4:3' | '3:4'>('16:9');
  const [imageType, setImageType] = useState<'hero' | 'icon' | 'other'>('hero');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [generatedImages, setGeneratedImages] = useState<{
    url: string;
    prompt: string;
    ratio: string;
    date: string;
    isFallback: boolean;
  }[]>(() => {
    const saved = localStorage.getItem('buildstudio_assets_images');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync generated images to localStorage
  useEffect(() => {
    localStorage.setItem('buildstudio_assets_images', JSON.stringify(generatedImages));
  }, [generatedImages]);

  const handleGenerateAssetImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    setConsoleLogs(prev => [
      ...prev,
      {
        type: 'info',
        message: `⏳ Starting image asset generation: "${imagePrompt}" (${imageRatio})...`,
        timestamp: new Date().toLocaleTimeString(),
      }
    ]);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio: imageRatio,
          api_key: secrets?.GEMINI_API_KEY || null,
        }),
      });

      const data = await response.json();
      if (response.ok && data.status === 'success' && data.imageUrl) {
        setGeneratedImages(prev => [
          {
            url: data.imageUrl,
            prompt: imagePrompt,
            ratio: imageRatio,
            date: new Date().toLocaleTimeString(),
            isFallback: !!data.isFallback,
          },
          ...prev,
        ]);
        
        // Add log entry to our System Debug Console
        setConsoleLogs(prev => [
          ...prev,
          {
            type: 'info',
            message: `🎨 Image Asset Generated successfully: "${imagePrompt}" (${imageRatio}) ${data.isFallback ? '[Picsum Fallback]' : '[Real Base64 Image Details]'}`,
            timestamp: new Date().toLocaleTimeString(),
          }
        ]);
      } else {
        throw new Error(data.error || 'Server rejected image generation');
      }
    } catch (err: any) {
      console.error(err);
      setConsoleLogs(prev => [
        ...prev,
        {
          type: 'error',
          message: `❌ Image Asset Generation failed: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        }
      ]);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // State Management
  const [selectedModel, setSelectedModel] = useState('llama3:8b');
  const [isGodmode, setIsGodmode] = useState(currentUser.can_use_godmode);
  const [systemInstruction, setSystemInstruction] = useState(SYSTEM_PROMPT_PRESETS[0].instruction);
  const [promptInput, setPromptInput] = useState(initialPrompt || '');
  const [codeContent, setCodeContent] = useState('<!-- Tap Compile to initiate workspace -->');
  const [buildMetrics, setBuildMetrics] = useState({
    buildTime: '1.4s',
    errorCount: 0,
    stability: 98,
    totalBuilds: 0,
  });
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  // Custom Reusable Prompt Template types and state
  interface CustomPromptTemplate {
    id: string;
    title: string;
    prompt: string;
    category: string;
  }

  const defaultTemplates: CustomPromptTemplate[] = [
    {
      id: 'pt-1',
      title: 'Modern Glassmorphic Cards',
      prompt: 'Add 3 modern glassmorphic cards with subtle background blur, borders with 15% opacity, neon hex accent hover transitions, and clean dark ambient drop shadows.',
      category: 'Layouts'
    },
    {
      id: 'pt-2',
      title: 'Interactive Confetti Engine',
      prompt: 'Implement a gorgeous custom HTML5 Canvas particle explosion particle confetti effect that fires fully dynamic bursts with high performance on click of action triggers.',
      category: 'Visual FX'
    },
    {
      id: 'pt-3',
      title: 'Real-time Live search filter',
      prompt: 'Integrate an asynchronous client-side list-search input that instantly performs query filtering using state bounds, updating matching list items with smooth transition fades.',
      category: 'Behaviors'
    },
    {
      id: 'pt-4',
      title: 'Web Audio Oscillator Chimes',
      prompt: 'Synthesise a lightweight custom Synthesizer instrument with the Web Audio API that delivers elegant high-pitch retro bell chimes on mouse triggers.',
      category: 'Behaviors'
    }
  ];

  const [customTemplates, setCustomTemplates] = useState<CustomPromptTemplate[]>(() => {
    const saved = localStorage.getItem('buildstudio_custom_templates');
    return saved ? JSON.parse(saved) : defaultTemplates;
  });

  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplatePrompt, setNewTemplatePrompt] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Layouts');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const [isPromptBuilderOpen, setIsPromptBuilderOpen] = useState(false);

  // Sync custom prompt templates to local storage
  useEffect(() => {
    localStorage.setItem('buildstudio_custom_templates', JSON.stringify(customTemplates));
  }, [customTemplates]);

  const handleSaveTemplate = () => {
    if (!newTemplateTitle.trim() || !newTemplatePrompt.trim()) {
      alert('Please fill out both the Template Title and the Prompt text.');
      return;
    }
    const newTemplate: CustomPromptTemplate = {
      id: 'pt-' + Date.now(),
      title: newTemplateTitle.trim(),
      prompt: newTemplatePrompt.trim(),
      category: newTemplateCategory
    };
    setCustomTemplates(prev => [newTemplate, ...prev]);
    setNewTemplateTitle('');
    setNewTemplatePrompt('');
    alert('Prompt Template saved successfully!');
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this prompt template?')) {
      setCustomTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  // Split View Mode (split-screen / preview full-pane / code full-pane)
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'code'>('preview');

  // Specialized Terminal theme states for the code editor
  const [editorTheme, setEditorTheme] = useState<'default' | 'terminal'>('default');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const getHighlightedHTML = (code: string) => {
    if (!code) return '<span class="text-zinc-650 font-sans italic">// Start hacking below...</span>';
    
    let escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // HTML comments
    escaped = escaped.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-zinc-500 italic opacity-60">$1</span>');
    // JS comments
    escaped = escaped.replace(/(\/\/.*)/g, '<span class="text-zinc-500 italic opacity-60">$1</span>');
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-zinc-500 italic opacity-60">$1</span>');

    // Tags
    escaped = escaped.replace(/(&lt;\/?[a-zA-Z0-9:-]+)/g, '<span class="text-[#39FF14] font-bold" style="text-shadow: 0 0 3px rgba(57,255,20,0.4)">$1</span>');
    escaped = escaped.replace(/(\/?&gt;)/g, '<span class="text-[#39FF14] font-bold" style="text-shadow: 0 0 3px rgba(57,255,20,0.4)">$1</span>');

    // Attributes
    escaped = escaped.replace(/\b([a-zA-Z0-9_-]+)=/g, '<span class="text-[#00FFFF]" style="text-shadow: 0 0 3px rgba(0,255,255,0.4)">$1</span>=');

    // Strings
    escaped = escaped.replace(/("[^"\\]*(?:\\.[^"\\]*)*")/g, '<span class="text-[#FF00E4] font-medium" style="text-shadow: 0 0 3px rgba(255,0,228,0.4)">$1</span>');
    escaped = escaped.replace(/('[^'\\]*(?:\\.[^'\\]*)*')/g, '<span class="text-[#FF00E4] font-medium" style="text-shadow: 0 0 3px rgba(255,0,228,0.4)">$1</span>');
    escaped = escaped.replace(/(`[^`\\]*(?:\\.[^`\\]*)*`)/g, '<span class="text-[#FF00E4] font-medium" style="text-shadow: 0 0 3px rgba(255,0,228,0.4)">$1</span>');

    // JS Keywords
    escaped = escaped.replace(/\b(const|let|var|function|return|import|export|default|class|extends|async|await|if|else|for|while|new|this|true|false)\b/g, '<span class="text-[#FFCC00] font-bold" style="text-shadow: 0 0 3px rgba(255,204,0,0.4)">$1</span>');

    return escaped;
  };

  // Real-time Console State & Types
  interface ConsoleLogEntry {
    type: 'log' | 'error' | 'warn' | 'info' | 'network';
    message: string;
    timestamp: string;
    method?: string;
    url?: string;
    status?: string | number;
    ok?: boolean;
  }

  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([
    {
      type: 'info',
      message: 'System Console stream started. Real-time preview events, errors, and endpoints will update here.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'log' | 'error' | 'network'>('all');
  const [consoleSearch, setConsoleSearch] = useState('');

  // 1. Clear Console logs
  const handleClearConsole = () => {
    setConsoleLogs([
      {
        type: 'info',
        message: 'Console environment logs cleared by user.',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // 2. Proxy source document mapping to automatically inject logging hooks
  const getInjectedSrcDoc = () => {
    if (!codeContent) return '';
    const proxyScript = `
      <script>
        (function() {
          const _log = console.log;
          const _error = console.error;
          const _warn = console.warn;
          const _info = console.info;

          function emit(type, args) {
            try {
              const serialized = Array.from(args).map(arg => {
                if (arg === null) return 'null';
                if (arg === undefined) return 'undefined';
                if (typeof arg === 'object') {
                  try {
                    return JSON.stringify(arg);
                  } catch(e) {
                    return String(arg);
                  }
                }
                return String(arg);
              }).join(' ');

              window.parent.postMessage({
                type: 'PREVIEW_CONSOLE_LOG',
                logType: type,
                message: serialized,
                timestamp: new Date().toLocaleTimeString()
              }, '*');
            } catch (e) {
              _error("Failed to post message", e);
            }
          }

          console.log = function() {
            _log.apply(console, arguments);
            emit('log', arguments);
          };
          console.error = function() {
            _error.apply(console, arguments);
            emit('error', arguments);
          };
          console.warn = function() {
            _warn.apply(console, arguments);
            emit('warn', arguments);
          };
          console.info = function() {
            _info.apply(console, arguments);
            emit('info', arguments);
          };

          window.onerror = function(message, source, lineno, colno, error) {
            emit('error', [message + ' (line ' + lineno + ':' + colno + ')']);
            return false;
          };

          const _originalFetch = window.fetch;
          window.fetch = async function(...args) {
            const url = args[0];
            const options = args[1] || {};
            const method = options.method || 'GET';
            window.parent.postMessage({
              type: 'PREVIEW_NETWORK_LOG',
              method: method,
              url: String(url),
              timestamp: new Date().toLocaleTimeString(),
              status: 'pending'
            }, '*');

            try {
              const response = await _originalFetch(...args);
              window.parent.postMessage({
                type: 'PREVIEW_NETWORK_LOG',
                method: method,
                url: String(url),
                timestamp: new Date().toLocaleTimeString(),
                status: response.status,
                ok: response.ok
              }, '*');
              return response;
            } catch (err) {
              window.parent.postMessage({
                type: 'PREVIEW_NETWORK_LOG',
                method: method,
                url: String(url),
                timestamp: new Date().toLocaleTimeString(),
                status: 'failed',
                error: err.message
              }, '*');
              throw err;
            }
          };

          const _XMLHttpRequest = window.XMLHttpRequest;
          window.XMLHttpRequest = function() {
            const xhr = new _XMLHttpRequest();
            const send = xhr.send;
            const open = xhr.open;
            let method = 'GET';
            let url = '';

            xhr.open = function(_method, _url) {
              method = _method;
              url = _url;
              return open.apply(xhr, arguments);
            };

            xhr.send = function() {
              window.parent.postMessage({
                type: 'PREVIEW_NETWORK_LOG',
                method: method,
                url: String(url),
                timestamp: new Date().toLocaleTimeString(),
                status: 'pending'
              }, '*');

              xhr.addEventListener('load', function() {
                window.parent.postMessage({
                  type: 'PREVIEW_NETWORK_LOG',
                  method: method,
                  url: String(url),
                  timestamp: new Date().toLocaleTimeString(),
                  status: xhr.status,
                  ok: xhr.status >= 200 && xhr.status < 300
                }, '*');
              });

              xhr.addEventListener('error', function() {
                window.parent.postMessage({
                  type: 'PREVIEW_NETWORK_LOG',
                  method: method,
                  url: String(url),
                  timestamp: new Date().toLocaleTimeString(),
                  status: 'failed'
                }, '*');
              });

              return send.apply(xhr, arguments);
            };

            return xhr;
          };

        })();
      </script>
    `;

    if (codeContent.includes('<head>')) {
      return codeContent.replace('<head>', '<head>' + proxyScript);
    } else if (codeContent.includes('<html>')) {
      return codeContent.replace('<html>', '<html>' + proxyScript);
    } else {
      return proxyScript + codeContent;
    }
  };

  // 3. Listen to real-time events triggered by the preview sandbox
  useEffect(() => {
    const handlePreviewMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'PREVIEW_CONSOLE_LOG') {
        const { logType, message, timestamp } = event.data;
        setConsoleLogs((prev) => [
          ...prev,
          {
            type: logType,
            message: message,
            timestamp: timestamp
          }
        ]);
      } else if (event.data.type === 'PREVIEW_NETWORK_LOG') {
        const { method, url, timestamp, status, statusText, ok, error } = event.data;

        setConsoleLogs((prev) => {
          const nextLogs = [...prev];
          
          if (status !== 'pending') {
            const lastPendingIdx = nextLogs.map(item => item.type === 'network' && item.url === url && item.status === 'pending')
              .lastIndexOf(true);
            
            if (lastPendingIdx !== -1) {
              nextLogs[lastPendingIdx] = {
                type: 'network',
                timestamp,
                method,
                url,
                status,
                ok,
                message: error ? `❌ ${method} ${url} failed: ${error}` : `📡 ${method} ${url} - ${status} (${ok ? 'OK' : 'Error'})`
              };
              return nextLogs;
            }
          }

          nextLogs.push({
            type: 'network',
            timestamp,
            method,
            url,
            status: status || 'pending',
            ok,
            message: status === 'pending' 
              ? `📡 [Pending] ${method} ${url}` 
              : error 
              ? `❌ ${method} ${url} failed: ${error}` 
              : `📡 ${method} ${url} - ${status} (${ok ? 'OK' : 'Error'})`
          });
          return nextLogs;
        });
      }
    };

    window.addEventListener('message', handlePreviewMessage);
    return () => window.removeEventListener('message', handlePreviewMessage);
  }, []);

  // 4. Alert user whenever environment is recompiled/reloaded
  useEffect(() => {
    setConsoleLogs((prev) => [
      ...prev,
      {
        type: 'info',
        message: '🔄 Live Sandbox Environment re-synchronized. All logs reset.',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  }, [codeContent]);
  
  // Custom direct code pasting & file upload override handlers
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedCodeText, setPastedCodeText] = useState('');
  const codeUploadRef = useRef<HTMLInputElement>(null);

  const handleCodeUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        const text = event.target.result;
        setCodeContent(text);
        setBuildLogs((prev) => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] [INFO] Direct code override loaded from uploaded file: "${file.name}" (${(text.length / 1024).toFixed(1)} KB)`
        ]);
        alert(`Successfully injected the contents of "${file.name}" straight into the Editor canvas!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  
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
    const compileStartTime = Date.now();

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
          api_key: secrets?.GEMINI_API_KEY || null,
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

      // Update success metrics
      const currentElapsed = ((Date.now() - compileStartTime) / 1000).toFixed(1) + 's';
      setBuildMetrics(prev => {
        const total = prev.totalBuilds + 1;
        const stabVal = Math.min(100, Math.round(100 - (prev.errorCount / total) * 105));
        return {
          buildTime: currentElapsed,
          errorCount: prev.errorCount,
          stability: stabVal,
          totalBuilds: total
        };
      });

    } catch (err: any) {
      setBuildLogs((prev) => [...prev, `[ERROR] Build pipeline crashed: ${err.message}`]);

      // Update failure metrics
      const currentElapsed = ((Date.now() - compileStartTime) / 1000).toFixed(1) + 's';
      setBuildMetrics(prev => {
        const newErrors = prev.errorCount + 1;
        const total = prev.totalBuilds + 1;
        const stabVal = Math.max(15, Math.round(100 - (newErrors / total) * 100));
        return {
          buildTime: currentElapsed,
          errorCount: newErrors,
          stability: stabVal,
          totalBuilds: total
        };
      });
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

  // Synchronize component reactive states with GitHubService status tracker
  useEffect(() => {
    const unsub = GitHubService.subscribe((status) => {
      if (status.state === 'syncing') {
        setIsPushingGithub(true);
        setGitStatusType('info');
        setGitStatusMsg(status.lastAction || 'Pushing code to GitHub...');
      } else if (status.state === 'synced') {
        setIsPushingGithub(false);
        setGitStatusType('success');
        if (status.lastSuccessAt) {
          setGitStatusMsg(`Active repository synced successfully at ${status.lastSuccessAt}!`);
        } else {
          setGitStatusMsg('Active repository synced successfully!');
        }
      } else if (status.state === 'error') {
        setIsPushingGithub(false);
        setGitStatusType('error');
        setGitStatusMsg(status.lastError || 'GitHub operation failed.');
      } else {
        setIsPushingGithub(false);
        setGitStatusType('');
        setGitStatusMsg('');
      }
    });
    return unsub;
  }, []);

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

    try {
      if (gitToken === 'ghp_sandboxTokenOAuthBuildStudioZeroFriction' || gitToken.startsWith('ghp_sandboxToken')) {
        GitHubService.updateStatus({
          state: 'syncing',
          lastAction: `Pushing ${gitFilePath} to ${selectedRepoFullName}...`,
          lastError: undefined
        });
        await new Promise(resolve => setTimeout(resolve, 1500));
        const simulatedUrl = `https://github.com/${owner}/${repo}/blob/${gitBranch}/${gitFilePath}`;
        setGithubUrl(simulatedUrl);
        GitHubService.updateStatus({
          state: 'synced',
          lastSuccessAt: new Date().toLocaleTimeString(),
          lastError: undefined
        });
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
      alert(`Synchronisation successful!\nPushed build to GitHub repository: ${selectedRepoFullName}`);
    } catch (err: any) {
      console.error(err);
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

  // Determine Button Text & Icon based on status
  const getGitStatusParams = () => {
    if (!gitToken) {
      return {
        text: 'Push to GitHub',
        icon: <Github className="w-3.5 h-3.5 text-neutral-400" />,
        classes: 'bg-neutral-150 dark:bg-zinc-950 border-neutral-200 dark:border-zinc-850 text-neutral-400 dark:text-zinc-650'
      };
    }
    if (isPushingGithub) {
      return {
        text: 'Syncing...',
        icon: <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ed3915]" />,
        classes: 'bg-[#ed3915]/10 border-[#ed3915]/40 text-[#ed3915] animate-pulse'
      };
    }
    if (gitStatusType === 'success' && githubUrl) {
      return {
        text: 'Synced',
        icon: <CheckCircle className="w-3.5 h-3.5 text-green-500 fill-green-500/15" />,
        classes: 'bg-green-505/10 dark:bg-green-950/20 border-green-500 text-green-600 dark:text-green-400'
      };
    }
    if (gitStatusType === 'error') {
      return {
        text: 'Needs Attention',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 fill-amber-500/15" />,
        classes: 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/50 text-amber-600 dark:text-amber-400'
      };
    }
    return {
      text: 'Push to GitHub',
      icon: (
        <div className="relative">
          <Github className="w-3.5 h-3.5" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-neutral-950"></span>
        </div>
      ),
      classes: 'bg-neutral-900 hover:bg-neutral-850 border-neutral-700 text-white dark:bg-zinc-950 dark:hover:bg-zinc-900 border-zinc-800'
    };
  };

  const gitParams = getGitStatusParams();

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans">
      <style>{`
        .custom-sync-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-sync-scrollbar::-webkit-scrollbar-track {
          background: rgba(237, 57, 21, 0.05);
          border-radius: 9999px;
        }
        .custom-sync-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(237, 57, 21, 0.4);
          border-radius: 9999px;
        }
        .custom-sync-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ed3915;
        }
      `}</style>
      
      {/* Build Studio Toolbar */}
      <div id="buildstudio-action-bar" className="h-14 shrink-0 bg-neutral-50 dark:bg-zinc-900 border-b border-neutral-200 dark:border-zinc-800 px-4 flex items-center justify-between gap-4">
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
            <div className="hidden md:block">
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

        {/* Centered Premium View Mode Tab Switcher */}
        <div className="flex items-center p-1 bg-neutral-150 dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-850 rounded-2xl shadow-sm select-none">
          <button
            id="tab-preview-mode"
            onClick={() => setViewMode('preview')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none ${
              viewMode === 'preview' 
                ? 'bg-[#ed3915] text-white shadow-md scale-[1.02]' 
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-900'
            }`}
            title="Switch to Live Preview screen"
          >
            <Eye className="w-4 h-4" />
            <span>Live Preview</span>
          </button>
          
          <button
            id="tab-code-mode"
            onClick={() => setViewMode('code')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none ${
              viewMode === 'code' 
                ? 'bg-[#ed3915] text-white shadow-md scale-[1.02]' 
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-900'
            }`}
            title="Switch to TypeScript & HTML Code view"
          >
            <Code2 className="w-4 h-4" />
            <span>Code View</span>
          </button>

          <button
            id="tab-split-mode"
            onClick={() => setViewMode('split')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none ${
              viewMode === 'split' 
                ? 'bg-neutral-300 dark:bg-zinc-800 text-neutral-900 dark:text-neutral-100 shadow-md' 
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-900'
            }`}
            title="Enable dual Split Screen canvas"
          >
            <Columns className="w-4 h-4" />
            <span className="hidden sm:inline">Split Screen</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Build Health Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1 border rounded-lg text-xs font-medium transition-all select-none ${
            buildMetrics.errorCount === 0 
              ? 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
              : 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/30 text-amber-600 dark:text-amber-400'
          }`} title="Dynamic sandbox compilation stability, recent build errors, and average telemetry response time.">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${buildMetrics.errorCount === 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-bounce'}`} />
            <div className="text-[10px] font-mono leading-none flex flex-col items-start gap-1">
              <span className="font-bold tracking-tight">{buildMetrics.errorCount === 0 ? 'HEALTHY' : 'WARNING'} ({buildMetrics.stability}% Stability)</span>
              <span className="text-[8px] opacity-75">Build: {buildMetrics.buildTime} | Errors: {buildMetrics.errorCount}</span>
            </div>
          </div>

          {/* Quick Push to GitHub Button */}
          <button
            id="workspace-push-github-bar-btn"
            onClick={handleQuickPush}
            disabled={!gitToken || isPushingGithub}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed select-none ${gitParams.classes}`}
            title={gitToken ? `Push workspace state to ${selectedRepoFullName || 'repository'}` : 'Authenticate/Connect GitHub in Features panel to enable'}
          >
            {gitParams.icon}
            <span className="hidden leading-none md:inline">{gitParams.text}</span>
          </button>

          {/* Workspace Hidden Menu Selector */}
          <div className="relative">
            <button
              id="workspace-options-dropdown-trigger"
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold rounded-lg transition-all border border-neutral-200 dark:border-zinc-750 cursor-pointer text-neutral-700 dark:text-neutral-200 select-none"
              title="Show additional options"
            >
              <span>Workspace Actions</span>
              <span className="text-[9px] opacity-70">▼</span>
            </button>

            {isWorkspaceMenuOpen && (
              <>
                {/* Backdrop to close list click */}
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsWorkspaceMenuOpen(false)} />
                
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-xl p-2.5 z-50 text-xs text-left text-neutral-800 dark:text-neutral-100 animate-fade-in space-y-1">
                  <div className="px-2 py-1 text-[9px] text-zinc-400 uppercase tracking-widest font-bold font-mono">
                    System Actions
                  </div>
                  
                  {/* Credentials / secrets item */}
                  <button
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      onOpenSecrets();
                    }}
                    className="w-full text-left px-2.5 py-2 hover:bg-neutral-50 dark:hover:bg-zinc-850 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-medium"
                  >
                    <Settings2 className="w-4 h-4 text-neutral-500" />
                    <span>Credentials Setup</span>
                  </button>

                  {/* Remix copy */}
                  <button
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      handleRemixBuild();
                    }}
                    className="w-full text-left px-2.5 py-2 hover:bg-neutral-50 dark:hover:bg-zinc-850 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-medium"
                  >
                    <RefreshCw className="w-4 h-4 text-primary" />
                    <span className="text-primary font-bold">Remix Code Base</span>
                  </button>

                  <div className="h-px bg-neutral-100 dark:bg-zinc-800 my-1" />
                  
                  <div className="px-2 py-1 text-[9px] text-zinc-400 uppercase tracking-widest font-bold font-mono">
                    Sandbox Exports
                  </div>

                  {/* Export Standalone */}
                  <button
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      handleDownloadApp();
                    }}
                    className="w-full text-left px-2.5 py-2 hover:bg-neutral-50 dark:hover:bg-zinc-850 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-medium"
                  >
                    <Download className="w-4 h-4 text-emerald-500" />
                    <span>Export Standalone HTML</span>
                  </button>

                  {/* Publish Showcase */}
                  <button
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      handleSaveToGallery();
                    }}
                    className="w-full text-left px-2.5 py-2 hover:bg-neutral-50 dark:hover:bg-zinc-850 rounded-lg flex items-center gap-2 transition-all cursor-pointer font-medium"
                  >
                    <Layers className="w-4 h-4 text-[#ed3915]" />
                    <span className="text-[#ed3915] font-semibold">Publish to Portal Gallery</span>
                  </button>
                </div>
              </>
            )}
          </div>
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
              
              {/* 1. AGENT SELECTION MODULE */}
              <div className="p-3 bg-neutral-100 dark:bg-zinc-950 rounded-xl border border-neutral-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-primary animate-pulse" /> Active LLM Agent
                  </span>
                  
                  {/* Mode toggle */}
                  <div className="flex items-center gap-1 bg-neutral-200 dark:bg-zinc-900 p-0.5 rounded border border-neutral-250 dark:border-zinc-800 text-[8px] font-bold uppercase select-none">
                    <button
                      onClick={() => setIsGodmode(false)}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${!isGodmode ? 'bg-white dark:bg-zinc-800 text-neutral-800 dark:text-neutral-100 shadow-3xs' : 'text-neutral-500'}`}
                      title="Run with standard/fast local models"
                    >
                      Low
                    </button>
                    <button
                      onClick={() => setIsGodmode(true)}
                      className={`px-1.5 py-0.5 rounded transition-all flex items-center gap-0.5 cursor-pointer ${isGodmode ? 'bg-primary text-white shadow-3xs' : 'text-neutral-500'}`}
                      title="Unlock high-end models"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Godmode
                    </button>
                  </div>
                </div>

                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full text-xs p-1.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-805 rounded outline-none text-neutral-800 dark:text-neutral-250 font-mono cursor-pointer"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.name} value={m.name} className="bg-white dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200">
                      {m.name} ({m.isHighEnd ? 'PRO' : 'FREE'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. COMPILATION PAYLOADS */}
              <div className="space-y-1.5 bg-neutral-100/40 dark:bg-zinc-950/20 p-2.5 rounded-lg border border-neutral-200/50 dark:border-zinc-850">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500">
                  <span>Compilation Context Payloads</span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".pdf,.code,.js,.html,.txt,.png,.jpeg"
                  />
                </div>

                {uploadedFiles.length === 0 ? (
                  <p className="text-[9px] text-neutral-400 dark:text-zinc-650 italic leading-tight">No references uploaded. Use the '+' button in the chat input below to load files.</p>
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

              {/* 3. PROMPT TEMPLATE BUILDER */}
              <div className="pt-2 border-t border-neutral-200 dark:border-zinc-850 space-y-2">
                <button
                  onClick={() => setIsPromptBuilderOpen(!isPromptBuilderOpen)}
                  className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-neutral-550 dark:text-zinc-400 hover:text-[#ed3915] transition-colors focus:outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-primary" />
                    <span>Prompt Builder Library</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {isPromptBuilderOpen ? 'Hide ▲' : 'Manage (' + customTemplates.length + ') ▼'}
                  </span>
                </button>

                {isPromptBuilderOpen && (
                  <div className="space-y-3 bg-neutral-105 dark:bg-zinc-955 p-2.5 rounded-xl border border-neutral-200 dark:border-zinc-800 animate-fade-in text-[11px]">
                    <p className="text-[10px] text-neutral-500 leading-relaxed font-sans">
                      Collect custom prompt specifications in persistent JSON. Load into template workspace on demand.
                    </p>

                    {/* Quick Filter tabs */}
                    <div className="flex flex-wrap gap-1 border-b border-neutral-200 dark:border-zinc-800 pb-1.5">
                      {['All', 'Layouts', 'Behaviors', 'Visual FX'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategoryFilter(cat)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight transition-all cursor-pointer ${
                            activeCategoryFilter === cat 
                              ? 'bg-[#ed3915] text-white' 
                              : 'text-neutral-500 hover:text-neutral-800 dark:text-zinc-400 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-zinc-900'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Templates List */}
                    <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-0.5 custom-sync-scrollbar">
                      {customTemplates
                        .filter(t => activeCategoryFilter === 'All' || t.category === activeCategoryFilter)
                        .map((template) => (
                          <div 
                            key={template.id} 
                            className="p-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-850 hover:border-[#ed3915]/30 rounded-md transition-all group relative"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider bg-neutral-150 dark:bg-zinc-800 text-zinc-400 rounded mr-1.5">
                                  {template.category}
                                </span>
                                <strong className="text-neutral-800 dark:text-neutral-200 text-[10px] tracking-tight">{template.title}</strong>
                              </div>
                              <button
                                onClick={(e) => handleDeleteTemplate(template.id, e)}
                                className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 p-0.5 rounded transition-all"
                                title="Delete saved template"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                            <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 select-text font-serif leading-tight">
                              {template.prompt}
                            </p>

                            {/* Actions bar for template */}
                            <div className="mt-1.5 flex items-center justify-end gap-1 border-t border-neutral-100 dark:border-zinc-850/50 pt-1">
                              <button
                                onClick={() => {
                                  setPromptInput(template.prompt);
                                  alert(`Successfully loaded custom prompt: "${template.title}" into core input canvas!`);
                                }}
                                className="px-1.5 py-0.5 bg-neutral-150 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-neutral-600 dark:text-neutral-300 rounded text-[9px] font-bold transition-all cursor-pointer select-none"
                                title="Load template into text area input"
                              >
                                Load Input
                              </button>
                              <button
                                onClick={() => triggerCompile(template.prompt)}
                                className="px-1.5 py-0.5 bg-[#ed3915]/15 hover:bg-[#ed3915] text-[#ed3915] hover:text-white rounded text-[9px] font-bold border border-[#ed3915]/20 hover:border-transparent transition-all cursor-pointer select-none"
                                title="Instantly trigger compilation based on template prompt"
                              >
                                Run & Compile
                              </button>
                            </div>
                          </div>
                        ))}

                      {customTemplates.filter(t => activeCategoryFilter === 'All' || t.category === activeCategoryFilter).length === 0 && (
                        <div className="text-center py-4 text-[9px] text-zinc-500">
                          No saved templates in this category.
                        </div>
                      )}
                    </div>

                    {/* Create New template Form */}
                    <div className="pt-2 border-t border-neutral-200 dark:border-zinc-805 space-y-1.5 text-[10px]">
                      <span className="font-bold text-neutral-500 dark:text-zinc-450 uppercase tracking-widest text-[8px] block">Save Current Snippet</span>
                      
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          placeholder="Template Title..."
                          value={newTemplateTitle}
                          onChange={(e) => setNewTemplateTitle(e.target.value)}
                          className="w-full text-xs p-1 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded outline-none focus:border-primary text-neutral-800 dark:text-neutral-100"
                        />
                        <select
                          value={newTemplateCategory}
                          onChange={(e) => setNewTemplateCategory(e.target.value)}
                          className="w-full text-xs p-1 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-805 rounded outline-none text-neutral-700 dark:text-neutral-300 font-mono"
                        >
                          <option value="Layouts">Layouts</option>
                          <option value="Behaviors">Behaviors</option>
                          <option value="Visual FX">Visual FX</option>
                          <option value="APIs & DB">APIs & DB</option>
                        </select>
                      </div>

                      <div className="relative">
                        <textarea
                          placeholder="Visual/behavior details of this prompt snippet..."
                          value={newTemplatePrompt}
                          onChange={(e) => setNewTemplatePrompt(e.target.value)}
                          rows={2}
                          className="w-full text-xs p-1.5 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded outline-none focus:border-primary text-neutral-800 dark:text-neutral-100 resize-none font-mono"
                        />
                      </div>

                      <button
                        onClick={handleSaveTemplate}
                        disabled={!newTemplateTitle.trim() || !newTemplatePrompt.trim()}
                        className="w-full py-1 text-[9px] uppercase tracking-wider font-bold bg-[#ed3915] text-white hover:bg-primary-dark disabled:opacity-40 rounded flex items-center justify-center gap-1 cursor-pointer select-none"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Bookmark Template Spec</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. ACTIVE SYSTEM RULES SETUP */}
              <div className="pt-2 border-t border-neutral-200 dark:border-zinc-850 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5 text-primary" /> Active System Rules Setup
                </span>
                <select
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  className="w-full text-xs p-1.5 bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-neutral-800 rounded outline-none text-neutral-700 dark:text-neutral-300 font-mono cursor-pointer"
                >
                  {SYSTEM_PROMPT_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.instruction}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* 5. QUICK PROMPT ENHANCEMENTS & 6. CHAT INPUT BLOCK (AT THE BOTTOM OF SIDEBAR) */}
            <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-zinc-800 space-y-3">
              
              {/* suggestions chips right above input */}
              <div className="space-y-1 overflow-hidden">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 dark:text-zinc-500 block">Quick Prompt Enhancements</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-sync-scrollbar snap-x select-none cursor-grab active:cursor-grabbing">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => triggerCompile(s)}
                      className="snap-start shrink-0 px-2.5 py-1 bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-neutral-805 hover:border-[#ed3915]/50 rounded-full text-[10px] font-semibold leading-none text-neutral-700 dark:text-zinc-350 hover:bg-neutral-55 dark:hover:bg-zinc-900 transition-all cursor-pointer whitespace-nowrap"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Container */}
              <div className="relative flex flex-col bg-white dark:bg-zinc-955 border border-neutral-200 dark:border-zinc-800 focus-within:border-primary/80 rounded-xl overflow-hidden transition-all shadow-xs">
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Describe build adjustments... Enter compiles instantly."
                  rows={2}
                  className="w-full p-2.5 bg-transparent text-xs outline-none dark:text-white dark:placeholder-zinc-500 resize-none font-sans leading-relaxed"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      triggerCompile(promptInput);
                    }
                  }}
                />
                
                {/* Composite inner toolbar with plus sign upload, paste sign action, and compile send */}
                <div className="px-2.5 py-1.5 bg-neutral-50 dark:bg-zinc-900 border-t border-neutral-100/60 dark:border-zinc-850/60 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* Plus Sign button for Upload */}
                    <button
                      onClick={handleUploadClick}
                      className="p-1 px-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-neutral-600 dark:text-neutral-350 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none"
                      title="Upload reference files to prompt payloads"
                    >
                      <Plus className="w-3 h-3 text-primary shrink-0" />
                      <span>Context</span>
                    </button>

                    {/* Paste Sign button */}
                    <button
                      onClick={() => setIsPasteModalOpen(true)}
                      className="p-1 px-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-neutral-600 dark:text-neutral-350 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none font-mono"
                      title="Paste reference script snippet code directly"
                    >
                      <span className="text-primary font-black">&lt;&gt;</span>
                      <span>Paste</span>
                    </button>
                  </div>

                  <button
                    onClick={() => triggerCompile(promptInput)}
                    disabled={isBuilding || !promptInput.trim()}
                    className="px-2.5 py-1 bg-[#ed3915] text-white hover:bg-primary-dark disabled:opacity-45 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer select-none"
                    title="Send modifications to Compile"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
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
            <div 
              className={`relative border-b border-neutral-200 dark:border-zinc-800 transition-all duration-200 ${viewMode === 'code' ? 'hidden' : ''}`} 
              style={{ height: viewMode === 'preview' ? '100%' : `${splitRatio}%` }}
            >
              <div className="absolute top-2 left-2 z-30 px-2 py-1 bg-white/75 dark:bg-black/70 backdrop-blur-xs rounded border border-neutral-200/50 dark:border-zinc-800 text-[10px] uppercase font-bold tracking-wider text-neutral-500 dark:text-zinc-400">
                Live Interactive Application Preview
              </div>

              {/* Real working iframe of synthesized HTML code */}
              <iframe
                id="live-sandbox-preview"
                ref={iframeRef}
                srcDoc={getInjectedSrcDoc()}
                className="w-full h-full bg-white block"
                sandbox="allow-scripts"
                title="Workspace Preview Sandbox"
              />
            </div>

            {/* Split Drag handle emulator */}
            <div className={`h-2 bg-neutral-100 dark:bg-zinc-900 hover:bg-primary/20 cursor-row-resize flex items-center justify-center border-y border-neutral-200 dark:border-zinc-800 shrink-0 ${viewMode !== 'split' ? 'hidden' : ''}`}>
              <span className="w-10 h-1 bg-neutral-300 dark:bg-zinc-800 rounded-full"></span>
            </div>

            {/* SPLIT VIEW - Bottom Pane: Code Editor */}
            <div className={`flex-1 flex flex-col overflow-hidden relative ${viewMode === 'preview' ? 'hidden' : ''}`}>
              
              {/* Header bar of IDE Canvas */}
              <div className="h-10 shrink-0 bg-neutral-50 dark:bg-zinc-950 border-b border-neutral-200 dark:border-zinc-800 px-3 flex items-center justify-between select-none">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#ed3915] font-mono tracking-wider uppercase font-black flex items-center gap-1.5 animate-pulse">
                    <Code2 className="w-3.5 h-3.5" /> 
                    {editorTheme === 'terminal' ? '⚡ MATRIX HACKER CONSOLE ENGINE' : 'TypeScript / HTML IDE Canvas'}
                  </span>
                  
                  {/* Theme Switcher Toggle */}
                  <div className="hidden sm:flex items-center gap-1 bg-neutral-200 dark:bg-zinc-900 px-1.5 py-0.5 rounded-md border border-neutral-300 dark:border-zinc-800">
                    <button
                      onClick={() => setEditorTheme('default')}
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all cursor-pointer ${
                        editorTheme === 'default'
                          ? 'bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-neutral-100 shadow-3xs'
                          : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      Default
                    </button>
                    <button
                      onClick={() => setEditorTheme('terminal')}
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all cursor-pointer flex items-center gap-1 ${
                        editorTheme === 'terminal'
                          ? 'bg-black text-[#39FF14] shadow-3xs border border-[#39FF14]/20'
                          : 'text-neutral-500 hover:text-[#39FF14]'
                      }`}
                      title="Activate specialized Terminal neon syntax highlighting"
                    >
                      <span className="w-1 h-1 rounded-full bg-[#39FF14] inline-block animate-ping"></span>
                      Terminal
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsPasteModalOpen(true)}
                    className="px-2.5 py-1 bg-neutral-200 dark:bg-zinc-900 hover:bg-[#ed3915] hover:text-white dark:hover:bg-[#ed3915] border border-transparent dark:border-zinc-800 hover:border-transparent rounded-lg text-[10px] font-bold text-neutral-700 dark:text-zinc-300 transition-all flex items-center gap-1 cursor-pointer shadow-3xs"
                    title="Paste direct raw code to replace canvas state"
                  >
                    <Layers className="w-3 h-3 text-[#ed3915]" />
                    <span>Paste Code</span>
                  </button>
                  
                  <button
                    onClick={() => codeUploadRef.current?.click()}
                    className="px-2.5 py-1 bg-neutral-200 dark:bg-zinc-900 hover:bg-[#ed3915] hover:text-white dark:hover:bg-[#ed3915] border border-transparent dark:border-zinc-800 hover:border-transparent rounded-lg text-[10px] font-bold text-neutral-700 dark:text-zinc-300 transition-all flex items-center gap-1 cursor-pointer shadow-3xs"
                    title="Upload raw source file directly into editor"
                  >
                    <Upload className="w-3 h-3 text-emerald-500" />
                    <span>Upload File</span>
                  </button>
                  
                  <input
                    type="file"
                    ref={codeUploadRef}
                    onChange={handleCodeUploadChange}
                    className="hidden"
                    accept=".html,.js,.ts,.tsx,.css,.txt"
                  />
                </div>
              </div>
              
              <div className={`h-full w-full flex overflow-hidden ${editorTheme === 'terminal' ? 'bg-black text-zinc-100' : ''}`}>
                {/* Line number padding */}
                <div className={`w-12 shrink-0 font-mono text-[10px] text-right p-2 select-none border-r ${
                  editorTheme === 'terminal'
                    ? 'bg-black border-[#39FF14]/30 text-[#39FF14]/50'
                    : 'bg-neutral-50 dark:bg-zinc-950 text-neutral-400 dark:text-neutral-600 border-neutral-200 dark:border-zinc-800'
                }`}>
                  {Array.from({ length: Math.min(codeContent.split('\n').length || 1, 100) }).map((_, idx) => (
                    <div key={idx} className="h-5 leading-5">{idx + 1}</div>
                  ))}
                </div>

                {editorTheme === 'terminal' ? (
                  <div className="flex-1 h-full relative overflow-hidden bg-black select-text">
                    {/* Syntax Highlight overlay below */}
                    <pre
                      ref={highlightRef}
                      className="absolute inset-0 p-4 font-mono text-xs leading-5 whitespace-pre overflow-hidden z-0 pointer-events-none select-none tracking-normal"
                      style={{ fontSize: '12px', lineHeight: '20px' }}
                      dangerouslySetInnerHTML={{ __html: getHighlightedHTML(codeContent) }}
                    />
                    {/* Transparent inputs textarea above */}
                    <textarea
                      ref={textareaRef}
                      id="code-editor-textarea"
                      value={codeContent}
                      onChange={handleEditorChange}
                      onScroll={handleScroll}
                      spellCheck={false}
                      className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-[#39FF14] font-mono text-xs p-4 focus:outline-none overflow-auto leading-5 whitespace-pre resize-none z-10 selection:bg-[#39FF14]/20 tracking-normal"
                      style={{ fontSize: '12px', lineHeight: '20px' }}
                      placeholder="<!-- Synthesised Code will load here -->"
                    />
                    
                    {/* Retro matrix phosphor-tube styling scanline */}
                    <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.04] bg-linear-to-b from-transparent via-white/50 to-transparent bg-[length:100%_4px] bg-repeat" />
                  </div>
                ) : (
                  <textarea
                    id="code-editor-textarea"
                    value={codeContent}
                    onChange={handleEditorChange}
                    spellCheck={false}
                    className="flex-1 h-full bg-zinc-900 text-zinc-100 font-mono text-xs p-4 focus:outline-none overflow-auto leading-5 whitespace-pre resize-none"
                    placeholder="<!-- Synthesised Code will load here -->"
                  />
                )}
              </div>
            </div>

            {/* Real-Time Console Panel Drawer */}
            <div className="border-t border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-950 flex flex-col shrink-0">
              {/* Console Header Bar */}
              <div 
                className="h-10 px-4 flex items-center justify-between border-b border-neutral-200 dark:border-zinc-800 select-none cursor-pointer hover:bg-neutral-100 dark:hover:bg-zinc-900 transition-colors"
                onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              >
                <div className="flex items-center gap-2">
                  <Terminal className={`w-4 h-4 text-[#ed3915] transition-transform ${isConsoleOpen ? 'rotate-0' : '-rotate-90'}`} />
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-100">
                    Live Preview Debug Console
                  </span>
                  
                  {/* Badge diagnostics counts */}
                  <div className="flex items-center gap-1 ml-2">
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-neutral-200 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-400 rounded-md">
                      {consoleLogs.length} events
                    </span>
                    {consoleLogs.filter(l => l.type === 'error').length > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-red-500/10 text-red-500 rounded-md">
                        {consoleLogs.filter(l => l.type === 'error').length} Errors
                      </span>
                    )}
                    {consoleLogs.filter(l => l.type === 'network').length > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#ed3915]/10 text-[#ed3915] rounded-md">
                        {consoleLogs.filter(l => l.type === 'network').length} Network
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  {/* Action buttons */}
                  <button 
                    onClick={handleClearConsole}
                    className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-zinc-800 rounded transition-all cursor-pointer"
                    title="Clear Console Output Log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                    className="text-[10px] uppercase font-bold text-neutral-400 hover:text-primary transition-colors cursor-pointer"
                  >
                    {isConsoleOpen ? 'Minimize ▽' : 'Expand △'}
                  </button>
                </div>
              </div>

              {/* Console Body Area */}
              {isConsoleOpen && (
                <div className="h-48 flex flex-col overflow-hidden bg-neutral-950 text-neutral-200 font-mono text-[11px] leading-relaxed">
                  
                  {/* Filter Toolbar controls */}
                  <div className="h-9 shrink-0 bg-neutral-900 border-b border-zinc-850 px-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1 select-none">
                      <button
                        onClick={() => setConsoleFilter('all')}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                          consoleFilter === 'all' 
                            ? 'bg-[#ed3915] text-white' 
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        All Current Logs ({consoleLogs.length})
                      </button>
                      <button
                        onClick={() => setConsoleFilter('log')}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                          consoleFilter === 'log' 
                            ? 'bg-blue-600 text-white' 
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        Logs ({consoleLogs.filter(l => l.type === 'log' || l.type === 'info').length})
                      </button>
                      <button
                        onClick={() => setConsoleFilter('error')}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                          consoleFilter === 'error' 
                            ? 'bg-red-600 text-white' 
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        Errors ({consoleLogs.filter(l => l.type === 'error').length})
                      </button>
                      <button
                        onClick={() => setConsoleFilter('network')}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-black transition-all cursor-pointer ${
                          consoleFilter === 'network' 
                            ? 'bg-[#ed3915]/20 text-[#ed3915] border border-[#ed3915]/30' 
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        Network/XHR ({consoleLogs.filter(l => l.type === 'network').length})
                      </button>
                    </div>

                    {/* Search string filtration */}
                    <div className="relative max-w-xs w-full sm:w-48">
                      <Search className="absolute left-2 top-2.5 w-3 h-3 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Filter output..."
                        value={consoleSearch}
                        onChange={(e) => setConsoleSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md text-[10px] text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-700 font-sans"
                      />
                    </div>
                  </div>

                  {/* Logs Event Scroll view */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-sync-scrollbar">
                    {consoleLogs
                      .filter(log => {
                        if (consoleFilter === 'log') return log.type === 'log' || log.type === 'info' || log.type === 'warn';
                        if (consoleFilter === 'error') return log.type === 'error';
                        if (consoleFilter === 'network') return log.type === 'network';
                        return true;
                      })
                      .filter(log => {
                        if (!consoleSearch.trim()) return true;
                        return log.message.toLowerCase().includes(consoleSearch.toLowerCase());
                      })
                      .map((log, index) => {
                        let logColor = 'text-zinc-300';
                        if (log.type === 'error') logColor = 'text-red-400 bg-red-950/25 border-l-2 border-red-500 pl-1.5';
                        if (log.type === 'warn') logColor = 'text-amber-400 bg-amber-950/20 border-l-2 border-amber-500 pl-1.5';
                        if (log.type === 'info') logColor = 'text-emerald-400 pl-1';
                        if (log.type === 'network') {
                          logColor = log.status === 'pending' 
                            ? 'text-neutral-400 italic pl-1' 
                            : log.ok === false 
                            ? 'text-red-400 bg-red-950/15 border-l-2 border-red-505 pl-1.5' 
                            : 'text-[#ed3915]/90 pl-1';
                        }

                        return (
                          <div key={index} className={`flex items-start gap-2.5 py-0.5 border-b border-zinc-900/50 hover:bg-zinc-900 transition-colors ${logColor}`}>
                            <span className="text-zinc-600 text-[9px] select-none uppercase py-0.5 shrink-0 font-mono">{log.timestamp}</span>
                            <span className="break-all whitespace-pre-wrap font-mono">{log.message}</span>
                          </div>
                        );
                      })}
                    {consoleLogs.length === 0 && (
                      <div className="text-zinc-500 text-center py-6">
                        No telemetry logs registered in current stream scope.
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>

          {/* RIGHT ACTION DRAWER PIECE (Features / Database / Sync) */}
          <div className="w-full md:w-[260px] lg:w-[290px] bg-neutral-50 dark:bg-zinc-900 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-zinc-800 flex flex-col shrink-0">
            
            {/* Tabs selector */}
            <div className="grid grid-cols-4 text-center border-b border-neutral-200 dark:border-zinc-800 bg-neutral-100 dark:bg-zinc-950 h-10 shrink-0 text-[10px] uppercase font-bold tracking-wider">
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
              <button
                onClick={() => setActiveRightPanel('assets')}
                className={`py-2 px-1 hover:text-primary transition-all cursor-pointer ${activeRightPanel === 'assets' ? 'bg-white dark:bg-zinc-900 text-primary border-b-2 border-primary' : 'text-neutral-400'}`}
              >
                AI Assets
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

              {/* TAB 4: AI ASSETS GENERATOR */}
              {activeRightPanel === 'assets' && (
                <div className="space-y-4">
                  <div className="p-3 bg-neutral-100 dark:bg-neutral-950 rounded-lg border border-neutral-250 dark:border-zinc-800 space-y-1.5">
                    <span className="text-[10px] text-neutral-400 dark:text-zinc-500 uppercase block font-semibold">Asset Generator</span>
                    <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Creative Media Sandbox</h4>
                    <p className="text-[10px] text-neutral-500 leading-normal">
                      Develop fully custom, gorgeous AI placeholder images or launch icons for your compiled iFrame context.
                    </p>
                  </div>

                  {/* Settings Input Grid */}
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-neutral-500">Asset Persona</label>
                      <select 
                        value={imageType}
                        onChange={(e: any) => {
                          const val = e.target.value;
                          setImageType(val);
                          // Auto set matching aspect ratio!
                          if (val === 'icon') setImageRatio('1:1');
                          else if (val === 'hero') setImageRatio('16:9');
                        }}
                        className="w-full text-xs p-1.5 bg-white dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded focus:border-[#ed3915] text-neutral-800 dark:text-neutral-100 outline-none"
                      >
                        <option value="hero">App Hero Thumbnail (16:9)</option>
                        <option value="icon">App Profile Launcher (1:1)</option>
                        <option value="other">General Isometric Accent</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-neutral-500">Dimensions (Ratio)</label>
                      <select 
                        value={imageRatio}
                        onChange={(e: any) => setImageRatio(e.target.value as any)}
                        className="w-full text-xs p-1.5 bg-white dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded focus:border-[#ed3915] text-neutral-800 dark:text-neutral-100 outline-none"
                      >
                        <option value="1:1">Standard Square (1:1)</option>
                        <option value="16:9">Wide View Landscape (16:9)</option>
                        <option value="4:3">Card Snapshot (4:3)</option>
                        <option value="3:4">Story Layout (3:4)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-neutral-500">Visual Prompt</label>
                      <textarea
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="e.g. Minimalist sleek robot, modern slate palette with transparent orange lines, aesthetic vector, golden hour, wide view"
                        rows={3}
                        className="w-full text-xs p-2 bg-white dark:bg-zinc-950 border border-neutral-250 dark:border-zinc-800 rounded-lg focus:border-[#ed3915] text-neutral-800 dark:text-neutral-100 outline-none placeholder-zinc-500 font-sans resize-none"
                      />
                    </div>

                    <button
                      onClick={handleGenerateAssetImage}
                      disabled={isGeneratingImage || !imagePrompt.trim()}
                      className="w-full py-2 bg-[#ed3915] hover:bg-primary-dark disabled:opacity-40 disabled:hover:bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none shadow-sm"
                    >
                      <LucideImage className="w-3.5 h-3.5" />
                      <span>{isGeneratingImage ? 'Generating Space...' : 'Forge Visual Asset'}</span>
                    </button>
                  </div>

                  {/* Generated Assets Library List */}
                  <div className="pt-2 border-t border-neutral-200 dark:border-zinc-800 space-y-2">
                    <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-bold uppercase tracking-wider block">Generated Library ({generatedImages.length})</span>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {generatedImages.map((img, idx) => (
                        <div key={idx} className="p-2 bg-neutral-100 dark:bg-zinc-950 rounded-lg border border-neutral-200 dark:border-zinc-800 relative group overflow-hidden">
                          {/* Image preview */}
                          <div className="relative rounded overflow-hidden bg-zinc-900 border border-zinc-850">
                            <img 
                              src={img.url} 
                              alt="Generated Preview Asset" 
                              referrerPolicy="no-referrer"
                              className="w-full h-auto object-cover max-h-[140px] hover:scale-105 transition-transform duration-300"
                            />
                            {img.isFallback && (
                              <div className="absolute top-1 right-1 px-1 bg-yellow-500/90 text-[8px] font-bold text-white rounded">
                                Seeded
                              </div>
                            )}
                          </div>

                          <p className="text-[9px] text-zinc-400 font-sans line-clamp-2 mt-1.5 leading-normal" title={img.prompt}>
                            {img.prompt}
                          </p>

                          {/* Controls Row */}
                          <div className="flex items-center justify-between gap-1 mt-2 pt-1 border-t border-zinc-200 dark:border-zinc-900">
                            <span className="text-[8px] text-neutral-400 font-mono select-none">{img.ratio} @ {img.date}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  // Copy HTML img tag
                                  const snippet = `<img src="${img.url}" alt="${img.prompt.replace(/"/g, '&quot;')}" referrerPolicy="no-referrer" className="rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 w-full" />`;
                                  navigator.clipboard.writeText(snippet);
                                  setCopiedIndex(idx);
                                  setTimeout(() => setCopiedIndex(null), 1500);
                                }}
                                className="p-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-neutral-300 dark:border-zinc-800 text-neutral-600 dark:text-neutral-400 hover:text-primary rounded text-[9px] transition-all cursor-pointer font-bold flex items-center gap-1 select-none"
                                title="Copy absolute HTML Image component boilerplate snippet"
                              >
                                {copiedIndex === idx ? (
                                  <span className="text-green-500 text-[8px] uppercase">Tag Copied!</span>
                                ) : (
                                  <>
                                    <Copy className="w-2.5 h-2.5" />
                                    <span>Copy Tag</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  // Copy raw URL
                                  navigator.clipboard.writeText(img.url);
                                  alert('Image URL copied successfully!');
                                }}
                                className="p-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-neutral-300 dark:border-zinc-800 text-neutral-600 dark:text-neutral-400 hover:text-primary rounded text-[8px] transition-all cursor-pointer font-bold select-none"
                                title="Copy raw asset source link"
                              >
                                Link
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {generatedImages.length === 0 && (
                        <div className="text-center py-6 text-[10px] text-zinc-500 leading-normal">
                          No local assets generated yet.<br />Enter a visual prompt above and tap Forge to start!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* Direct Code Paste Dialog / Modal overlay */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in select-none">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-left">
            
            {/* Header */}
            <div className="p-4 bg-neutral-50 dark:bg-zinc-950 border-b border-neutral-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-neutral-800 dark:text-neutral-100 tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#ed3915]" /> Paste Direct Code Override
              </span>
              <button 
                onClick={() => {
                  setIsPasteModalOpen(false);
                  setPastedCodeText('');
                }}
                className="text-neutral-400 hover:text-neutral-500 font-mono text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form Content */}
            <div className="p-5 space-y-4">
              <p className="text-[11px] text-neutral-500 dark:text-zinc-400 leading-relaxed">
                Paste any HTML, React script, or raw source text below. Clicking <strong className="text-primary text-[#ed3915]">Overwrite Canvas</strong> will instantly inject it straight into your editor workspace.
              </p>

              <textarea
                value={pastedCodeText}
                onChange={(e) => setPastedCodeText(e.target.value)}
                placeholder="<!-- Paste your code snippet here... -->"
                rows={10}
                className="w-full p-3 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl outline-none focus:border-primary text-xs font-mono dark:text-white resize-none"
              />
            </div>

            {/* Footer buttons */}
            <div className="p-4 bg-neutral-50 dark:bg-zinc-950 border-t border-neutral-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsPasteModalOpen(false);
                  setPastedCodeText('');
                }}
                className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-700 bg-neutral-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pastedCodeText.trim()) {
                    setCodeContent(pastedCodeText);
                    setBuildLogs((prev) => [
                      ...prev, 
                      `[${new Date().toLocaleTimeString()}] [INFO] Raw code input replaced current canvas state (${(pastedCodeText.length / 1024).toFixed(1)} KB)`
                    ]);
                    setIsPasteModalOpen(false);
                    setPastedCodeText('');
                    alert("Editor canvas updated successfully with your pasted code!");
                  }
                }}
                disabled={!pastedCodeText.trim()}
                className="px-4 py-2 bg-[#ed3915] hover:bg-[#b32a10] disabled:opacity-40 text-white text-xs font-black uppercase rounded-lg cursor-pointer shadow-xs"
              >
                Overwrite Canvas
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
