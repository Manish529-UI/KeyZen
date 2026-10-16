// ============================================================
// KeyZen Extension — Service Worker (Background Script)
// ============================================================
// Handles all API communication with the KeyZen backend.
// Acts as a secure bridge between content scripts and the server.
// Stores JWT in chrome.storage.session (ephemeral, encrypted by Chrome).
// ============================================================

const API_BASE = 'http://localhost:5000/api';

// ---- Pending Credentials (temporary in-memory stash) ----
// Used to survive page navigations between form submit and save prompt.
// Automatically cleared after 2 minutes for security.
let pendingCredentials = null;
let pendingCredentialsTimer = null;

// ---- Token Management (chrome.storage.session) ----

async function getToken() {
  const data = await chrome.storage.session.get('keyzen_token');
  return data.keyzen_token || null;
}

async function setToken(token) {
  await chrome.storage.session.set({ keyzen_token: token });
}

async function clearToken() {
  await chrome.storage.session.remove('keyzen_token');
  await chrome.storage.session.remove('keyzen_user');
}

async function getUser() {
  const data = await chrome.storage.session.get('keyzen_user');
  return data.keyzen_user || null;
}

async function setUser(user) {
  await chrome.storage.session.set({ keyzen_user: user });
}

// ---- API Helpers ----

async function apiRequest(method, path, body = null) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, message: data.message || 'Request failed' };
  }

  return data;
}

// ---- Message Handler ----

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch((err) => {
    sendResponse({ error: true, message: err.message || 'Unknown error', status: err.status });
  });
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  switch (message.type) {
    // --- Auth ---
    case 'LOGIN': {
      const { email, password } = message;
      const data = await apiRequest('POST', '/auth/login', { email, password });
      if (data.tempToken) {
        await chrome.storage.session.set({ keyzen_temp_token: data.tempToken });
      }
      return data;
    }

    case 'VERIFY_OTP': {
      const { otp } = message;
      const sessionData = await chrome.storage.session.get('keyzen_temp_token');
      const tempToken = sessionData.keyzen_temp_token;
      if (!tempToken) {
        throw { message: 'Session expired. Please login again.' };
      }
      const data = await apiRequest('POST', '/auth/verify-otp', { tempToken, otp });
      // Store the full JWT and user info
      await setToken(data.token);
      await setUser({ _id: data._id, name: data.name, email: data.email });
      await chrome.storage.session.remove('keyzen_temp_token');
      return { success: true, user: { _id: data._id, name: data.name, email: data.email } };
    }

    case 'RESEND_OTP': {
      const sessionData = await chrome.storage.session.get('keyzen_temp_token');
      const tempToken = sessionData.keyzen_temp_token;
      if (!tempToken) {
        throw { message: 'Session expired. Please login again.' };
      }
      return await apiRequest('POST', '/auth/resend-otp', { tempToken });
    }

    case 'GET_AUTH_STATUS': {
      const token = await getToken();
      const user = await getUser();
      if (!token || !user) {
        return { authenticated: false };
      }
      // Validate token is still valid
      try {
        const me = await apiRequest('GET', '/auth/me');
        return { authenticated: true, user: me };
      } catch {
        await clearToken();
        return { authenticated: false };
      }
    }

    case 'LOGOUT': {
      await clearToken();
      return { success: true };
    }

    // --- Credential Stashing (survives page navigation) ---
    case 'STASH_CREDENTIALS': {
      const { credentials } = message;
      if (credentials && credentials.password) {
        pendingCredentials = credentials;
        await chrome.storage.session.set({
          keyzen_pending_creds: {
            ...credentials,
            timestamp: Date.now()
          }
        });
        if (pendingCredentialsTimer) clearTimeout(pendingCredentialsTimer);
        pendingCredentialsTimer = setTimeout(async () => {
          pendingCredentials = null;
          pendingCredentialsTimer = null;
          await chrome.storage.session.remove('keyzen_pending_creds');
        }, 120000);
      }
      return { success: true };
    }

    case 'CHECK_PENDING_CREDENTIALS': {
      // Retrieve from memory or session storage
      let creds = pendingCredentials;
      if (!creds) {
        const sessionData = await chrome.storage.session.get('keyzen_pending_creds');
        if (sessionData.keyzen_pending_creds) {
          // Verify it's not older than 2 minutes
          if (Date.now() - sessionData.keyzen_pending_creds.timestamp < 120000) {
            creds = sessionData.keyzen_pending_creds;
          }
        }
      }
      pendingCredentials = null;
      if (pendingCredentialsTimer) {
        clearTimeout(pendingCredentialsTimer);
        pendingCredentialsTimer = null;
      }
      await chrome.storage.session.remove('keyzen_pending_creds');
      return { credentials: creds };
    }

    // --- Vault ---
    case 'SAVE_CREDENTIAL': {
      const { url, username, password } = message;
      const data = await apiRequest('POST', '/vault/extension-save', { url, username, password });
      return { success: true, item: data };
    }

    case 'GET_MATCHES': {
      const { domain } = message;
      const data = await apiRequest('GET', `/vault/extension-matches?domain=${encodeURIComponent(domain)}`);
      return { matches: data };
    }

    default:
      throw { message: `Unknown message type: ${message.type}` };
  }
}

