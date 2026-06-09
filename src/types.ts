export interface UserProfile {
  id: string;
  email: string;
  is_admin: boolean;
  can_use_godmode: boolean;
  created_at: string;
}

export interface Build {
  id: string;
  user_id: string;
  name: string;
  prompt: string;
  code_content: string;
  preview_url?: string;
  model_used: string;
  created_at: string;
  system_instruction?: string;
}

export interface BuildSecret {
  key: string;
  value: string;
  isCustom: boolean;
}

export interface BuildLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export interface SystemPromptPreset {
  id: string;
  name: string;
  instruction: string;
}

export const SYSTEM_PROMPT_PRESETS: SystemPromptPreset[] = [
  {
    id: 'default',
    name: 'Expert React Native / Single Page Developer',
    instruction: 'You are an expert React/TS developer. Output ONLY valid single-page HTML, Tailwind, and JS script content suitable for an interactive preview.'
  },
  {
    id: 'creative',
    name: 'Creative UI Craftsman',
    instruction: 'Focus heavily on gorgeous visual design, high contrast themes, smooth micro-interactions, and beautiful negative space.'
  },
  {
    id: 'minimalist',
    name: 'Strict Minimalist',
    instruction: 'Keep layouts compact, typography sharp, black and white color schemes, and no extraneous graphics.'
  }
];

export interface OllamaModel {
  name: string;
  size: string;
  isHighEnd: boolean;
  description: string;
}

export const AVAILABLE_MODELS: OllamaModel[] = [
  { name: 'llama3:8b', size: '4.7 GB', isHighEnd: false, description: 'Llama 3 general-purpose lightweight model' },
  { name: 'mistral:7b', size: '4.1 GB', isHighEnd: false, description: 'Mistral high efficiency local model' },
  { name: 'codegemma:7b', size: '4.8 GB', isHighEnd: false, description: 'Code-optimized local code assistant' },
  { name: 'llama3-lexi:70b', size: '40 GB', isHighEnd: true, description: 'Lexi 70B ultra reasoning coder (Godmode Only)' },
  { name: 'mixtral:8x7b', size: '26 GB', isHighEnd: true, description: 'Mixtral high-speed MoE model (Godmode Only)' },
  { name: 'deepcoder:33b', size: '19 GB', isHighEnd: true, description: 'Deepcoder-pro reasoning engine (Godmode Only)' }
];
