// ============================================================
// KeyZen Extension — Popup Script
// ============================================================
// Handles login, OTP verification, and authenticated dashboard
// in the extension popup. Communicates with background.js via
// chrome.runtime.sendMessage.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const loginSection = document.getElementById('login-section');
  const authSection = document.getElementById('auth-section');
  const loadingSection = document.getElementById('loading-section');

  const loginForm = document.getElementById('login-form');
  const otpForm = document.getElementById('otp-form');

  const loginEmailInput = document.getElementById('login-email');
  const loginPasswordInput = document.getElementById('login-password');
  const loginBtn = document.getElementById('login-btn');
  const loginError = document.getElementById('login-error');

  const otpInput = document.getElementById('otp-input');
  const otpBtn = document.getElementById('otp-btn');
  const resendOtpBtn = document.getElementById('resend-otp-btn');
  const backToLoginBtn = document.getElementById('back-to-login-btn');
  const otpError = document.getElementById('otp-error');

  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  const userAvatar = document.getElementById('user-avatar');
  const currentDomain = document.getElementById('current-domain');
  const matchCount = document.getElementById('match-count');
  const siteCard = document.getElementById('site-card');

  const openVaultBtn = document.getElementById('open-vault-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const logoutBtn = document.getElementById('logout-btn');

  // ---- Section Visibility ----

  function showSection(section) {
    loginSection.classList.add('hidden');
    authSection.classList.add('hidden');
    loadingSection.classList.add('hidden');
    section.classList.remove('hidden');
  }

  function showLoginForm() {
    loginForm.classList.remove('hidden');
    otpForm.classList.add('hidden');
    loginError.classList.add('hidden');
    showSection(loginSection);
  }

  function showOTPForm() {
    loginForm.classList.add('hidden');
    otpForm.classList.remove('hidden');
    otpError.classList.add('hidden');
    otpInput.value = '';
    otpInput.focus();
  }

  function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
  }

  function hideError(element) {
    element.classList.add('hidden');
  }

  // ---- Check Auth Status ----

  async function checkAuth() {
    showSection(loadingSection);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' });
      if (response.authenticated && response.user) {
        await showAuthenticatedUI(response.user);
      } else {
        showLoginForm();
      }
    } catch {
      showLoginForm();
    }
  }

  // ---- Show Authenticated UI ----

  async function showAuthenticatedUI(user) {
    userName.textContent = user.name || '—';
    userEmail.textContent = user.email || '—';
    userAvatar.textContent = (user.name || '?')[0].toUpperCase();

    // Get current tab domain
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const url = new URL(tab.url);
        const domain = url.hostname;
        currentDomain.textContent = domain;

        // Get match count
        try {
          const matchResponse = await chrome.runtime.sendMessage({
            type: 'GET_MATCHES',
            domain: domain,
          });
          if (matchResponse && !matchResponse.error && matchResponse.matches) {
            matchCount.textContent = matchResponse.matches.length;
          } else {
            matchCount.textContent = '0';
          }
        } catch {
          matchCount.textContent = '—';
        }
      } else {
        currentDomain.textContent = 'N/A';
        matchCount.textContent = '—';
      }
    } catch {
      currentDomain.textContent = 'N/A';
      matchCount.textContent = '—';
    }

    showSection(authSection);
  }

  // ---- Login ----

  loginBtn.addEventListener('click', async () => {
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    if (!email || !password) {
      showError(loginError, 'Please enter email and password');
      return;
    }

    hideError(loginError);
    loginBtn.textContent = 'Signing in…';
    loginBtn.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'LOGIN',
        email,
        password,
      });

      if (response.error) {
        showError(loginError, response.message);
        loginBtn.textContent = 'Sign In';
        loginBtn.disabled = false;
        return;
      }

      if (response.requireOTP) {
        showOTPForm();
      }
    } catch (err) {
      showError(loginError, 'Connection failed. Is KeyZen backend running?');
    } finally {
      loginBtn.textContent = 'Sign In';
      loginBtn.disabled = false;
    }
  });

  // Allow Enter key on login inputs
  loginPasswordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });
  loginEmailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginPasswordInput.focus();
  });

  // ---- OTP Verification ----

  otpBtn.addEventListener('click', async () => {
    const otp = otpInput.value.trim();

    if (!otp || otp.length !== 6) {
      showError(otpError, 'Please enter the 6-digit verification code');
      return;
    }

    hideError(otpError);
    otpBtn.textContent = 'Verifying…';
    otpBtn.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'VERIFY_OTP',
        otp,
      });

      if (response.error) {
        showError(otpError, response.message);
        otpBtn.textContent = 'Verify';
        otpBtn.disabled = false;
        return;
      }

      if (response.success && response.user) {
        await showAuthenticatedUI(response.user);
      }
    } catch {
      showError(otpError, 'Verification failed');
    } finally {
      otpBtn.textContent = 'Verify';
      otpBtn.disabled = false;
    }
  });

  otpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') otpBtn.click();
  });

  // ---- Resend OTP ----

  resendOtpBtn.addEventListener('click', async () => {
    resendOtpBtn.textContent = 'Sending…';
    resendOtpBtn.disabled = true;

    try {
      const response = await chrome.runtime.sendMessage({ type: 'RESEND_OTP' });
      if (response.error) {
        showError(otpError, response.message);
      } else {
        resendOtpBtn.textContent = 'Code Sent ✓';
        setTimeout(() => {
          resendOtpBtn.textContent = 'Resend Code';
          resendOtpBtn.disabled = false;
        }, 3000);
      }
    } catch {
      showError(otpError, 'Failed to resend code');
      resendOtpBtn.textContent = 'Resend Code';
      resendOtpBtn.disabled = false;
    }
  });

  // ---- Back to Login ----

  backToLoginBtn.addEventListener('click', () => {
    showLoginForm();
  });

  // ---- Logout ----

  logoutBtn.addEventListener('click', async () => {
    logoutBtn.textContent = 'Signing out…';
    logoutBtn.disabled = true;
    try {
      await chrome.runtime.sendMessage({ type: 'LOGOUT' });
    } catch {
      // Ignore errors
    }
    showLoginForm();
    logoutBtn.textContent = 'Sign Out';
    logoutBtn.disabled = false;
  });

  // ---- Open Vault ----

  openVaultBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/dashboard/vault' });
  });

  // ---- Settings ----

  settingsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/dashboard/settings' });
  });

  // ---- Initialize ----

  checkAuth();
});
