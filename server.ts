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

// 3. GitHub OAuth Authorize url endpoint
app.get("/api/github/auth-url", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID || "";
  const clientOrigin = req.query.origin || 'http://localhost:3000';
  const redirectUri = `${clientOrigin}/api/github/callback`;
  const scope = "repo user";
  
  const params = new URLSearchParams({
    client_id: clientId || "MOCK_CLIENT_ID",
    redirect_uri: redirectUri,
    scope,
    response_type: "code",
  });
  
  res.json({ 
    url: `https://github.com/login/oauth/authorize?${params.toString()}`,
    isConfigured: !!process.env.GITHUB_CLIENT_ID
  });
});

// 4. GitHub OAuth Callback
app.get(["/api/github/callback", "/api/github/callback/"], async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!code) {
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GITHUB_AUTH_ERROR', error: 'No authorization code received' }, '*');
              window.close();
            }
          </script>
          <p>Error: No authorization code received.</p>
        </body>
      </html>
    `);
    return;
  }

  try {
    if (!clientId || !clientSecret) {
      // Sandbox fallback token for visual testing if environment secrets are not filled yet
      const sandboxToken = "ghp_sandboxTokenOAuthBuildStudioZeroFriction";
      res.send(`
        <html>
          <body style="font-family: sans-serif; background: #121212; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh;">
            <div style="text-align: center; border: 1px solid #eb3915; padding: 20px; border-radius: 12px; max-width: 400px;">
              <h3 style="color: #ed3915; margin-bottom: 8px;">Development Sandbox Mode</h3>
              <p style="font-size: 13px; color: #aaa; margin-bottom: 16px;">
                GITHUB_CLIENT_ID is not configured in .env. Falling back to simulated secure token to allow review of Repository Listing & Code Committing interface.
              </p>
              <div style="font-size: 11px; color: #888; margin-bottom: 24px;">Automatically logging in...</div>
              <script>
                setTimeout(() => {
                  if (window.opener) {
                    window.opener.postMessage({ 
                      type: 'GITHUB_AUTH_SUCCESS', 
                      token: '${sandboxToken}', 
                      isSandbox: true 
                    }, '*');
                    window.close();
                  }
                }, 1800);
              </script>
            </div>
          </body>
        </html>
      `);
      return;
    }

    // Exchange auth code for GitHub API Access Token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData: any = await tokenRes.json();
    const token = tokenData.access_token;

    if (!token) {
      throw new Error(tokenData.error_description || "Could not retrieve access token from GitHub.");
    }

    res.send(`
      <html>
        <body style="font-family: sans-serif; background: #121212; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh;">
          <div style="text-align: center; border: 1px solid #333; padding: 20px; border-radius: 12px;">
            <h3 style="color: #00ff66; margin-bottom: 8px;">Authentication Successful</h3>
            <p style="font-size: 13px; color: #aaa;">Syncing details with BuildStudio workspace. Pop-up closing...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', token: '${token}' }, '*');
                window.close();
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("GitHub OAuth Error:", err);
    res.send(`
      <html>
        <body style="font-family: sans-serif; background: #121212; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh;">
          <div style="text-align: center; border: 1px solid #ff4444; padding: 20px; border-radius: 12px; max-width: 400px;">
            <h3 style="color: #ff4444; margin-bottom: 8px;">Authorization Mismatch</h3>
            <p style="font-size: 13px; color: #aaa;">${err.message}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GITHUB_AUTH_ERROR', error: '${err.message}' }, '*');
              }
            </script>
          </div>
        </body>
      </html>
    `);
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
