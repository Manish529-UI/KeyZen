// ============================================================
// KeyZen Extension — Content Script
// ============================================================
// Detects login forms on web pages and provides:
// 1. Save-password prompt after form submission
// 2. Autofill UI when saved credentials exist for the domain
//
// Security rules enforced:
// - Only collects from actual login/password form contexts
// - Never submits forms automatically
// - Never saves without explicit user confirmation
// - Never injects UI on pages without login forms
// - No console.log of passwords
// - No browsing history collection
// ============================================================

(function () {
  'use strict';

  // Prevent double-injection
  if (window.__keyzenContentInjected) return;
  window.__keyzenContentInjected = true;

  const KEYZEN_PREFIX = 'keyzen-ext';

  // ---- Utility: Extract domain from current page ----
  function getCurrentDomain() {
    return window.location.hostname;
  }

  // ---- Utility: Get display name for the site ----
  function getSiteName() {
    const hostname = getCurrentDomain();
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const name = parts[parts.length - 2];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return hostname;
  }

  // ---- Element Visibility Helper ----
  function isElementVisible(el) {
    if (!el) return false;
    if (typeof el.checkVisibility === 'function') {
      return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    }
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && (rect.width > 0 || rect.height > 0 || el.offsetParent !== null);
  }

  // ---- Detect Login Form Fields ----
  function findPasswordFields() {
    return Array.from(document.querySelectorAll('input[type="password"]')).filter(
      (el) => isElementVisible(el)
    );
  }

  function findUsernameField(passwordField) {
    // Strategy 1: Look for inputs with matching autocomplete attributes
    const form = passwordField.closest('form');
    const scope = form || document;

    const candidates = Array.from(scope.querySelectorAll('input')).filter((el) => {
      if (el.type === 'password' || el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return false;
      if (!isElementVisible(el)) return false; // hidden
      const auto = (el.getAttribute('autocomplete') || '').toLowerCase();
      const name = (el.name || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      const type = (el.type || '').toLowerCase();
      const placeholder = (el.placeholder || '').toLowerCase();

      // Autocomplete hints
      if (['username', 'email', 'current-username'].includes(auto)) return true;

      // Type
      if (type === 'email') return true;

      // Name/ID heuristics
      const patterns = ['user', 'email', 'login', 'account', 'identifier', 'uname'];
      if (patterns.some((p) => name.includes(p) || id.includes(p))) return true;

      // Placeholder heuristics
      if (patterns.some((p) => placeholder.includes(p))) return true;

      return false;
    });

    // Return the one closest (before) the password field in DOM order
    if (candidates.length > 0) {
      // Prefer the one immediately before the password field
      const allInputs = Array.from(scope.querySelectorAll('input'));
      const pwIndex = allInputs.indexOf(passwordField);
      let best = null;
      let bestDist = Infinity;
      for (const c of candidates) {
        const cIndex = allInputs.indexOf(c);
        const dist = pwIndex - cIndex;
        if (dist > 0 && dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      return best || candidates[0];
    }

    return null;
  }

  function isLoginForm(passwordField) {
    const form = passwordField.closest('form');
    if (form) {
      const action = (form.action || '').toLowerCase();
      const method = (form.method || '').toLowerCase();
      // Likely a login/signup form
      if (method === 'post') return true;
      if (action.includes('login') || action.includes('signin') || action.includes('auth') || action.includes('register') || action.includes('signup')) return true;
    }
    // If there's a password field, it's likely a login context
    return true;
  }

  // ---- UI Injection Helpers ----

  function createOverlay() {
    const existing = document.getElementById(`${KEYZEN_PREFIX}-overlay`);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = `${KEYZEN_PREFIX}-overlay`;
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.3); z-index: 2147483646;
      display: flex; align-items: flex-start; justify-content: center;
      padding-top: 80px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    return overlay;
  }

  function removeAllKeyzenUI() {
    const ids = [
      `${KEYZEN_PREFIX}-overlay`,
      `${KEYZEN_PREFIX}-save-prompt`,
      `${KEYZEN_PREFIX}-autofill-popup`,
    ];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  }

  // ---- SAVE PASSWORD PROMPT ----

  function showSavePrompt(url, username, password) {
    removeAllKeyzenUI();

    const overlay = createOverlay();
    overlay.id = `${KEYZEN_PREFIX}-save-prompt`;

    const siteName = getSiteName();

    const card = document.createElement('div');
    card.style.cssText = `
      background: #151D32; border: 1px solid #26334D; border-radius: 14px;
      padding: 26px 28px; min-width: 360px; max-width: 420px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.6); color: #F1F5F9;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      animation: keyzenSlideIn 0.25s ease-out;
    `;

    card.innerHTML = `
      <style>
        @keyframes keyzenSlideIn {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        <div style="width: 38px; height: 38px; border-radius: 8px; background: #3978F6;
                    display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; color: #FFFFFF;">
          🔐
        </div>
        <div>
          <div style="font-size: 15px; font-weight: 600; color: #F1F5F9;">Save to KeyZen?</div>
          <div style="font-size: 12px; color: #A0AEC0; margin-top: 2px;">Credential detected on this page</div>
        </div>
      </div>
      <div style="background: #0B1020; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid #26334D;">
        <div style="font-size: 14px; font-weight: 600; color: #F1F5F9; margin-bottom: 4px;">${escapeHtml(siteName)}</div>
        <div style="font-size: 12px; color: #A0AEC0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escapeHtml(username || 'No username detected')}
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="${KEYZEN_PREFIX}-save-btn" style="
          flex: 1; padding: 10px 18px; border: none; border-radius: 8px; cursor: pointer;
          font-size: 13px; font-weight: 600; font-family: inherit;
          background: #3978F6; color: #FFFFFF;
          transition: all 0.15s ease; letter-spacing: 0.01em; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">Save Password</button>
        <button id="${KEYZEN_PREFIX}-dismiss-btn" style="
          flex: 1; padding: 10px 18px; border: 1px solid #26334D; border-radius: 8px; cursor: pointer;
          font-size: 13px; font-weight: 500; font-family: inherit;
          background: #1A243E; color: #A0AEC0;
          transition: all 0.15s ease;
        ">Not now</button>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Event listeners
    document.getElementById(`${KEYZEN_PREFIX}-save-btn`).addEventListener('click', async () => {
      const btn = document.getElementById(`${KEYZEN_PREFIX}-save-btn`);
      btn.textContent = 'Saving…';
      btn.style.opacity = '0.7';
      btn.disabled = true;

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'SAVE_CREDENTIAL',
          url: url,
          username: username,
          password: password,
        });

        if (response.error) {
          if (response.status === 401) {
            btn.textContent = 'Login to KeyZen first';
            btn.style.background = '#ef4444';
          } else {
            btn.textContent = 'Failed to save';
            btn.style.background = '#ef4444';
          }
          setTimeout(removeAllKeyzenUI, 2000);
        } else {
          btn.textContent = '✓ Saved!';
          btn.style.background = '#22c55e';
          setTimeout(removeAllKeyzenUI, 1200);
        }
      } catch {
        btn.textContent = 'Error';
        btn.style.background = '#ef4444';
        setTimeout(removeAllKeyzenUI, 2000);
      }
    });

    document.getElementById(`${KEYZEN_PREFIX}-dismiss-btn`).addEventListener('click', removeAllKeyzenUI);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) removeAllKeyzenUI();
    });
  }

  // ---- AUTOFILL UI ----

  function showAutofillPopup(anchorField, credentials) {
    // Remove any existing autofill popup
    const existing = document.getElementById(`${KEYZEN_PREFIX}-autofill-popup`);
    if (existing) existing.remove();

    if (!credentials || credentials.length === 0) return;

    const popup = document.createElement('div');
    popup.id = `${KEYZEN_PREFIX}-autofill-popup`;

    // Position near the anchor field
    const rect = anchorField.getBoundingClien    const top = rect.bottom + window.scrollY + 4;
    const left = rect.left + window.scrollX;

    popup.style.cssText = `
      position: absolute; top: ${top}px; left: ${left}px;
      min-width: 280px; max-width: 380px; z-index: 2147483647;
      background: #151D32; border: 1px solid #26334D; border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.6); color: #F1F5F9;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      animation: keyzenFadeIn 0.2s ease-out; overflow: hidden;
    `;

    const siteName = getSiteName();

    let credentialListHtml = '';
    credentials.forEach((cred, index) => {
      credentialListHtml += `
        <div class="keyzen-cred-item" data-index="${index}" style="
          padding: 10px 16px; cursor: pointer; display: flex; align-items: center; gap: 12px;
          transition: background 0.12s ease; border-bottom: 1px solid #1B263C;
        ">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: #1A243E;
                      border: 1px solid #26334D; display: flex; align-items: center; justify-content: center;
                      font-size: 14px; flex-shrink: 0; color: #3978F6; font-weight: 600;">
            ${escapeHtml((cred.username || '?')[0].toUpperCase())}
          </div>
          <div style="overflow: hidden;">
            <div style="font-size: 13px; font-weight: 500; color: #F1F5F9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${escapeHtml(cred.username || 'No username')}
            </div>
            <div style="font-size: 11px; color: #6B7C96;">••••••••</div>
          </div>
        </div>
      `;
    });

    popup.innerHTML = `
      <style>
        @keyframes keyzenFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .keyzen-cred-item:hover {
          background: #1C2740 !important;
        }
        .keyzen-cred-item:last-child {
          border-bottom: none !important;
        }
      </style>
      <div style="padding: 12px 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #26334D; background: #0B1020;">
        <div style="width: 24px; height: 24px; border-radius: 6px; background: #3978F6;
                    display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; color: #FFFFFF;">
          🔐
        </div>
        <span style="font-size: 13px; font-weight: 600; color: #F1F5F9;">KeyZen</span>
        <span style="font-size: 11px; color: #A0AEC0; margin-left: auto;">${escapeHtml(siteName)}</span>
        <button id="${KEYZEN_PREFIX}-autofill-close" style="
          background: none; border: none; color: #A0AEC0; cursor: pointer; font-size: 16px;
          padding: 0 2px; line-height: 1; margin-left: 4px;
        ">×</button>
      </div>
      ${credentialListHtml}
    `;

    document.body.appendChild(popup);

    // Handle credential selection
    popup.querySelectorAll('.keyzen-cred-item').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index);
        const cred = credentials[idx];
        if (cred) {
          autofillCredential(anchorField, cred);
          popup.remove();
        }
      });
    });

    // Close button
    const closeBtn = document.getElementById(`${KEYZEN_PREFIX}-autofill-close`);
    if (closeBtn) {
      closeBtn.addEventListener('click', () => popup.remove());
    }

    // Close on outside click (delayed to prevent immediate close)
    setTimeout(() => {
      document.addEventListener('click', function closePopup(e) {
        if (!popup.contains(e.target) && e.target !== anchorField) {
          popup.remove();
          document.removeEventListener('click', closePopup);
        }
      });
    }, 100);
  }

  function autofillCredential(passwordField, credential) {
    // Find the username field associated with this password field
    const usernameField = findUsernameField(passwordField);

    if (usernameField && credential.username) {
      setNativeValue(usernameField, credential.username);
    }

    if (credential.password) {
      setNativeValue(passwordField, credential.password);
    }

    // Do NOT submit the form — user must do it manually
  }

  // Set value using native setter to trigger React/Angular/Vue change handlers
  function setNativeValue(element, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ---- HTML Escaping ----
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // ---- Form Submission Interception ----

  // Track whether we already stashed credentials this page to avoid duplicates
  let hasStashedThisPage = false;

  function interceptFormSubmission(passwordField) {
    const form = passwordField.closest('form');

    // Reset stash flag whenever the user types/modifies the password
    passwordField.addEventListener('input', () => {
      hasStashedThisPage = false;
    });

    const captureAndStash = () => {
      if (hasStashedThisPage) return;

      const usernameField = findUsernameField(passwordField);
      const username = usernameField ? usernameField.value.trim() : '';
      const password = passwordField.value;

      if (!password) return; // Don't capture empty passwords

      hasStashedThisPage = true;

      const credentials = {
        url: window.location.href,
        domain: getCurrentDomain(),
        username: username,
        password: password,
      };

      // Send credentials to the background script for safe temporary storage.
      // This survives page navigation — the next page will retrieve them.
      try {
        chrome.runtime.sendMessage({
          type: 'STASH_CREDENTIALS',
          credentials: credentials,
        });
      } catch {
        // Extension context invalidated — ignore
      }

      // Also try to show the prompt on this page (works for SPA / AJAX forms
      // that don't navigate). If the page navigates, the next page picks it up.
      setTimeout(() => {
        showSavePrompt(credentials.url, credentials.username, credentials.password);
      }, 300);
    };

    if (form) {
      form.addEventListener('submit', captureAndStash, { capture: true });
    }

    // Find submit buttons or clickable actions in the form or in the nearest modal/dialog container
    const container = form || passwordField.closest('div[role="dialog"], div[id*="modal" i], div[class*="modal" i], div[id*="login" i], div[class*="login" i], div[id*="auth" i], section, main') || document;
    
    // Select all buttons and submit inputs in the container
    const actionButtons = container.querySelectorAll(
      'button, input[type="submit"], input[type="button"], a[role="button"], div[role="button"], span[role="button"]'
    );
    actionButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (passwordField.value) {
          captureAndStash();
        }
      }, { capture: true });
    });

    // Handle Enter key on password field
    passwordField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        captureAndStash();
      }
    });

    // Handle Enter key on username field as well
    const usernameField = findUsernameField(passwordField);
    if (usernameField) {
      usernameField.addEventListener('input', () => {
        hasStashedThisPage = false;
      });
      usernameField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && passwordField.value) {
          captureAndStash();
        }
      });
    }

    // Fallback: capture on beforeunload if we haven't already
    window.addEventListener('beforeunload', () => {
      if (hasStashedThisPage) return;
      const pw = passwordField.value;
      if (!pw) return;
      const uf = findUsernameField(passwordField);
      const un = uf ? uf.value.trim() : '';
      try {
        chrome.runtime.sendMessage({
          type: 'STASH_CREDENTIALS',
          credentials: { url: window.location.href, domain: getCurrentDomain(), username: un, password: pw },
        });
      } catch {
        // ignore
      }
    });
  }

  // ---- Autofill Badge (small icon near password field) ----

  function attachAutofillBadge(passwordField, credentials) {
    // Avoid duplicate badges
    if (passwordField.dataset.keyzenBadge) return;
    passwordField.dataset.keyzenBadge = 'true';

    const badge = document.createElement('div');
    badge.id = `${KEYZEN_PREFIX}-badge-${Date.now()}`;
    badge.style.cssText = `
      position: absolute; width: 24px; height: 24px; border-radius: 6px;
      background: #3978F6; cursor: pointer; border: 1px solid rgba(57, 120, 246, 0.5);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; z-index: 2147483645; box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      transition: transform 0.15s ease;
    `;
    badge.textContent = '🔑';
    badge.title = `KeyZen: ${credentials.length} saved credential(s)`;

    // Position the badge inside the password field (right side)
    const positionBadge = () => {
      const rect = passwordField.getBoundingClientRect();
      badge.style.position = 'absolute';
      badge.style.top = `${rect.top + window.scrollY + (rect.height - 24) / 2}px`;
      badge.style.left = `${rect.right + window.scrollX - 32}px`;
    };
    positionBadge();

    badge.addEventListener('mouseenter', () => { badge.style.transform = 'scale(1.15)'; });
    badge.addEventListener('mouseleave', () => { badge.style.transform = 'scale(1)'; });
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      showAutofillPopup(passwordField, credentials);
    });

    document.body.appendChild(badge);

    // Reposition on scroll/resize
    const reposition = () => positionBadge();
    window.addEventListener('scroll', reposition, { passive: true });
    window.addEventListener('resize', reposition, { passive: true });
  }

  // ---- Main Detection Logic ----

  async function scanForLoginForms() {
    const passwordFields = findPasswordFields();
    if (passwordFields.length === 0) return;

    const domain = getCurrentDomain();

    // For each password field, set up form interception
    passwordFields.forEach((pwField) => {
      if (pwField.dataset.keyzenIntercepted) return;
      pwField.dataset.keyzenIntercepted = 'true';

      if (isLoginForm(pwField)) {
        interceptFormSubmission(pwField);
      }
    });

    // Check for saved credentials for autofill
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_MATCHES',
        domain: domain,
      });

      if (response && !response.error && response.matches && response.matches.length > 0) {
        passwordFields.forEach((pwField) => {
          if (!pwField.dataset.keyzenAutofill) {
            pwField.dataset.keyzenAutofill = 'true';
            attachAutofillBadge(pwField, response.matches);
          }
        });
      }
    } catch {
      // User is not logged in or backend is unreachable — silently ignore
    }
  }

  // ---- MutationObserver for dynamically loaded forms ----

  let scanTimeout = null;
  const observer = new MutationObserver(() => {
    // Debounce to avoid excessive scanning
    if (scanTimeout) clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => {
      scanForLoginForms();
    }, 500);
  });

  // ---- Initialize ----

  async function init() {
    // Don't run on the KeyZen frontend itself
    if (window.location.hostname === 'localhost' && window.location.port === '5173') return;

    // Check if the background has pending credentials from a previous page
    // (i.e., the user submitted a login form that navigated here)
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_PENDING_CREDENTIALS' });
      if (response && response.credentials) {
        const { url, username, password } = response.credentials;
        if (url && password) {
          // Small delay to let the new page render
          setTimeout(() => {
            showSavePrompt(url, username, password);
          }, 400);
        }
      }
    } catch {
      // Extension context not available — ignore
    }

    // Initial scan for login forms on this page
    scanForLoginForms();

    // Watch for dynamically added forms
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
