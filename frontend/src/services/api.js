const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Helper to retrieve API keys securely stored in localStorage
export function getSavedKeys() {
  return {
    openai: localStorage.getItem("key_openai") || "",
    openrouter: localStorage.getItem("key_openrouter") || "",
    groq: localStorage.getItem("key_groq") || "",
    anthropic: localStorage.getItem("key_anthropic") || "",
  };
}

// Helper to save API keys in localStorage
export function saveKeys(keys) {
  if (keys.openai !== undefined) localStorage.setItem("key_openai", keys.openai);
  if (keys.openrouter !== undefined) localStorage.setItem("key_openrouter", keys.openrouter);
  if (keys.groq !== undefined) localStorage.setItem("key_groq", keys.groq);
  if (keys.anthropic !== undefined) localStorage.setItem("key_anthropic", keys.anthropic);
}

function getHeaders(keys = getSavedKeys()) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (keys.openai) headers["X-OpenAI-Key"] = keys.openai;
  if (keys.openrouter) headers["X-OpenRouter-Key"] = keys.openrouter;
  if (keys.groq) headers["X-Groq-Key"] = keys.groq;
  if (keys.anthropic) headers["X-Anthropic-Key"] = keys.anthropic;
  return headers;
}

export async function getSessions() {
  const response = await fetch(`${API_BASE}/sessions/`);
  if (!response.ok) {
    throw new Error("Failed to fetch sessions");
  }
  return response.json();
}

export async function createSession(payload = {}) {
  const response = await fetch(`${API_BASE}/sessions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to create session");
  }
  return response.json();
}

export async function updateSession(sessionId, payload) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Failed to update session");
  }
  return response.json();
}

export async function deleteSession(sessionId) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete session");
  }
  return true;
}

export async function getSessionMessages(sessionId) {
  const response = await fetch(`${API_BASE}/chat/${sessionId}/history`);
  if (!response.ok) {
    throw new Error("Failed to fetch chat history");
  }
  return response.json();
}

export async function getModels() {
  const response = await fetch(`${API_BASE}/models/`);
  if (!response.ok) {
    throw new Error("Failed to fetch models");
  }
  return response.json();
}

export async function sendMessageStream(
  sessionId, 
  content, 
  onChunk, 
  onError, 
  onDone
) {
  const keys = getSavedKeys();
  const headers = getHeaders(keys);
  
  try {
    const response = await fetch(`${API_BASE}/chat/${sessionId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content, stream: true }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Server returned error status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      
      // Store the incomplete trailing line back in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const cleaned = line.trim();
        if (!cleaned.startsWith("data:")) continue;
        
        const dataStr = cleaned.slice(5).trim();
        if (!dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            onError(new Error(parsed.error));
            return;
          }
          if (parsed.content) {
            onChunk(parsed.content);
          }
        } catch (e) {
          console.error("Failed to parse SSE JSON payload", dataStr, e);
        }
      }
    }
    onDone();
  } catch (err) {
    onError(err);
  }
}
