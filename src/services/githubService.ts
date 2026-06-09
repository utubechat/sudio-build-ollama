/**
 * GitHub integration services for BuildStudio
 * Supports standard GitHub REST v3 API for OAuth and Personal Access Tokens
 */

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  description: string | null;
  default_branch: string;
}

export interface PushParams {
  token: string;
  owner: string;
  repo: string;
  filePath: string;
  content: string;
  commitMessage: string;
  branch?: string;
}

export const GitHubService = {
  /**
   * Generates the GitHub OAuth Authorize url.
   * If client flow is used, we can configure this directly.
   */
  getOAuthUrl: (clientId: string, redirectUri: string, scope = 'repo user'): string => {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      response_type: 'code',
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  },

  /**
   * Fetches the repositories belonging to the authenticated user.
   */
  listRepositories: async (token: string): Promise<GitHubRepo[]> => {
    if (!token) {
      throw new Error("GitHub token or PAT is required to list repositories.");
    }

    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      method: "GET",
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json",
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API Error: ${response.status} - ${errorText || response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Pushes/Commits a file into a selected GitHub Repository.
   * Safely retrieves the file's current SHA if it exists before overwriting.
   */
  pushFileToRepo: async (params: PushParams): Promise<{ html_url: string; sha: string }> => {
    const { token, owner, repo, filePath, content, commitMessage, branch = 'main' } = params;
    
    if (!token) throw new Error("A valid GitHub authentication token is required.");
    if (!owner || !repo) throw new Error("Repository owner and name are required.");
    if (!filePath) throw new Error("Target file path is required.");

    const headers = {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    };

    // 1. Check if file already exists to get its current SHA
    let existingSha: string | undefined;
    try {
      const checkUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
      const checkRes = await fetch(checkUrl, { method: "GET", headers });
      
      if (checkRes.ok) {
        const fileInfo = await checkRes.json();
        existingSha = fileInfo.sha;
      }
    } catch (err) {
      console.warn("Could not check for existing file, proceeding as a new commit creation:", err);
    }

    // 2. Base64 encode the content (handles UTF-8 strings correctly)
    const base64Content = btoa(unescape(encodeURIComponent(content)));

    // 3. Make the PUT commit request
    const commitUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const body: any = {
      message: commitMessage || "Automated build commit via BuildStudio",
      content: base64Content,
      branch
    };

    if (existingSha) {
      body.sha = existingSha;
    }

    const putResponse = await fetch(commitUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(body)
    });

    if (!putResponse.ok) {
      const errorMsg = await putResponse.text();
      throw new Error(`GitHub Commit failed: ${putResponse.status} - ${errorMsg}`);
    }

    const resData = await putResponse.json();
    return {
      html_url: resData.content.html_url,
      sha: resData.content.sha
    };
  }
};
