import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Shared Gemini Client - lazy loaded to avoid crashing on start if API key isn't provided yet
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure your secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. Models endpoint
app.get("/api/models", (req, res) => {
  res.json({
    status: "ok",
    models: [
      { name: 'llama3:8b', size: '4.7 GB', isHighEnd: false, description: 'Llama 3 general-purpose lightweight model' },
      { name: 'mistral:7b', size: '4.1 GB', isHighEnd: false, description: 'Mistral high efficiency local model' },
      { name: 'codegemma:7b', size: '4.8 GB', isHighEnd: false, description: 'Code-optimized local code assistant' },
      { name: 'llama3-lexi:70b', size: '40 GB', isHighEnd: true, description: 'Lexi 70B ultra reasoning coder (Godmode Only)' },
      { name: 'mixtral:8x7b', size: '26 GB', isHighEnd: true, description: 'Mixtral high-speed MoE model (Godmode Only)' },
      { name: 'deepcoder:33b', size: '19 GB', isHighEnd: true, description: 'Deepcoder-pro reasoning engine (Godmode Only)' }
    ]
  });
});

// 2. Generate Endpoint using server-side Gemini API
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, model, system_instruction, isGodmode } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "Prompt is required." });
      return;
    }

    // Check Godmode if model is high-end
    const highEndModels = ['llama3-lexi:70b', 'mixtral:8x7b', 'deepcoder:33b'];
    if (highEndModels.includes(model) && !isGodmode) {
      res.status(403).json({ error: "Access denied. Selection of high-end model require Godmode clearance." });
      return;
    }

    const ai = getGeminiClient();

    // Prepare a secure code generation instructions wrapper
    const defaultInstruction = system_instruction || "You are an expert React/TS developer. Output ONLY valid single-page HTML, Tailwind, and JS script content suitable for an interactive preview.";

    const queryPrompt = `
Generate a single-page interactive app based on this request: "${prompt}".

CRITICAL REQUIREMENTS:
- Produce ONLY output that can be embedded in an iframe as a complete, working HTML document.
- Must include the Tailwind CSS playground CDN script: <script src="https://cdn.tailwindcss.com"></script>
- If you use icons, load Lucide development icons (e.g., <script src="https://unpkg.com/lucide@latest"></script> or equivalent standard icon sets) or render polished SVG vectors directly.
- The layout must fit the described style (modern dark or light colors). Make it gorgeous, professional, and functionally complete.
- Do NOT output any markdown wrappers such as \`\`\`html or \`\`\`. Output ONLY the raw HTML code itself so that it can be executed immediately.
- Ensure all interactive elements (buttons, inputs, state transformations, charts, visual effects) are completely functional using inline, responsive JavaScript (<script> tags with event listeners).
- Return ONLY valid HTML. Do not talk, do not apologize, do not include explainers before or after.
`;

    // Always use robust gemini-3.5-flash as the underlying driver
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: queryPrompt,
      config: {
        systemInstruction: defaultInstruction,
        temperature: 0.7,
      },
    });

    const rawCode = response.text || "";
    // Clean up random markdown backticks if Gemini ignores direct format instructions
    let cleanCode = rawCode.trim();
    if (cleanCode.startsWith("```html")) {
      cleanCode = cleanCode.substring(7);
    } else if (cleanCode.startsWith("```")) {
      cleanCode = cleanCode.substring(3);
    }
    if (cleanCode.endsWith("```")) {
      cleanCode = cleanCode.substring(0, cleanCode.length - 3);
    }
    cleanCode = cleanCode.trim();

    res.json({
      status: "success",
      code: cleanCode,
      model_used: model,
      created_at: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Gemini Code Generation Error:", err);
    res.status(500).json({ error: err.message || "An unexpected error occurred during generation." });
  }
});

// Configure Vite or Static Asset serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BuildStudio server running on http://0.0.0.0:${PORT}`);
  });
};

startServer();
