# KeyZen Browser Extension

Chrome/Chromium browser extension for the KeyZen password manager. Detects login forms, saves credentials, and autofills passwords — all powered by your existing KeyZen vault.

## Features

- 🔐 **Save Passwords** — Detects login form submissions and offers to save credentials
- 🔑 **Autofill** — Shows saved credentials for the current website with one-click fill
- 🛡️ **Secure** — Uses existing KeyZen AES-256-GCM encryption (server-side)
- 📧 **2FA Login** — Full email OTP verification in the extension popup
- 🌐 **Smart Domain Matching** — Safe subdomain matching (accounts.google.com → google.com)
- 🚫 **Privacy First** — No browsing history, no tracking, no plaintext password storage

## Setup

### Prerequisites

1. KeyZen backend running on `http://localhost:5000`
2. KeyZen frontend running on `http://localhost:5173` (optional, for "Open Vault")
3. Chrome or Chromium-based browser (Chrome, Edge, Brave, etc.)

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

### 2. Start the Frontend (optional)

```bash
cd frontend
npm install
npm run dev
```

### 3. Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder from this project
5. The KeyZen icon will appear in your browser toolbar

### 4. Authenticate the Extension

1. Click the KeyZen icon in the toolbar
2. Enter your KeyZen email and master password
3. Enter the 6-digit OTP sent to your email
4. You're now logged in!

## Usage

### Saving a Password

1. Go to any website with a login form (e.g., github.com)
2. Enter your username/email and password
3. Submit the login form
4. A KeyZen prompt appears: **"Save to KeyZen?"**
5. Click **Save Password** to save, or **Not now** to dismiss

### Autofilling a Password

1. Visit a website where you've previously saved credentials
2. Click the 🔑 badge that appears inside the password field
3. Select the credential you want to use
4. Username and password are filled automatically
5. **You** click the login button — KeyZen never auto-submits

### Extension Popup

- Shows your login status and email
- Shows the current website domain
- Shows number of saved credentials for the current site
- **Open KeyZen Vault** — opens the full web dashboard
- **Settings** — opens KeyZen settings
- **Sign Out** — logs out of the extension

## Testing

### Test Sites

Try the extension with these websites:

| Site | URL | What to Test |
|------|-----|-------------|
| GitHub | https://github.com/login | Login form detection, save, autofill |
| Google | https://accounts.google.com | Multi-step login (username → password) |
| LinkedIn | https://www.linkedin.com/login | Standard login form |
| Any site | N/A | Password fields with various patterns |

### Test Checklist

1. ✅ Login form detection — password field found on login pages
2. ✅ Username detection — email/username field identified correctly
3. ✅ Save prompt — appears after form submission
4. ✅ Save credential — sent to backend and encrypted
5. ✅ Backend auth — extension uses existing JWT authentication
6. ✅ Vault storage — credentials appear in KeyZen web vault
7. ✅ Domain matching — `github.com` matches, `evil-github.com` does not
8. ✅ Multiple credentials — multiple accounts shown in autofill popup
9. ✅ Autofill — fills username and password fields
10. ✅ Logout — clears session, requires re-authentication
11. ✅ Unauthorized access — API rejects requests without valid JWT
12. ✅ No password logging — no `console.log` of passwords anywhere
13. ✅ Extension reload — works correctly after reload
14. ✅ Invalid domains — no matches for unrelated domains

### Reloading After Changes

1. Go to `chrome://extensions/`
2. Find KeyZen in the list
3. Click the **reload** button (🔄)
4. Refresh any open tabs to pick up content script changes

## Security Architecture

### What the Extension Stores

| Storage | Data | Persistence |
|---------|------|------------|
| `chrome.storage.session` | JWT token, user info | **Ephemeral** — cleared on browser close |
| `chrome.storage.session` | Temp token (during OTP) | **Ephemeral** — removed after OTP verification |

### What the Extension NEVER Stores

- ❌ Plaintext passwords (permanently)
- ❌ Encryption keys
- ❌ MongoDB credentials
- ❌ JWT secret
- ❌ Gmail/email passwords
- ❌ Backend `.env` secrets

### How Encryption Works

1. Extension captures credentials from the login form
2. Extension sends them to the backend via HTTPS-compatible API
3. Backend encrypts the password with AES-256-GCM using the server-side `ENCRYPTION_KEY`
4. Encrypted data is stored in MongoDB
5. Extension **never** sees or handles encryption keys

### Domain Matching Rules

- `github.com` matches `github.com` ✅
- `accounts.google.com` matches `google.com` ✅
- `evil-github.com` does **NOT** match `github.com` ✅
- `github.com.evil.com` does **NOT** match `github.com` ✅

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/login` | Step 1: Verify credentials, get OTP |
| `POST` | `/api/auth/verify-otp` | Step 2: Verify OTP, get JWT |
| `POST` | `/api/auth/resend-otp` | Resend OTP code |
| `GET` | `/api/auth/me` | Validate JWT / get user info |
| `POST` | `/api/vault/extension-save` | Save credential from extension |
| `GET` | `/api/vault/extension-matches?domain=` | Get matching credentials for autofill |

## Limitations

- The backend must be running on `localhost:5000` for development
- For production deployment, update `API_BASE` in `background.js`
- Google's multi-step login (username page → password page) may require saving on the password page only
- Some sites with heavy JavaScript SPA frameworks may have non-standard form handling
- The extension popup is sized for standard Chrome popup dimensions (360px width)
