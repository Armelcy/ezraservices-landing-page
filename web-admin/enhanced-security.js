/**
 * Enhanced Security Module for Ezra Admin Dashboard
 * Implements auto-logout, session management, and security monitoring
 */

class EzraSecurityManager {
  constructor() {
    this.sessionTimeoutMinutes = 30; // Auto-logout after 30 minutes of inactivity
    this.warningTimeoutMinutes = 25; // Show warning at 25 minutes
    this.activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    this.sessionTimer = null;
    this.warningTimer = null;
    this.isWarningShown = false;
    this.securityLogs = [];
    this.maxLoginAttempts = 5;
    this.lockoutDurationMinutes = 15;
    
    this.init();
  }

  init() {
    this.setupActivityListeners();
    this.setupSecurityHeaders();
    this.setupCSRFProtection();
    this.loadSecurityState();
    this.startSessionMonitoring();
    
    console.log('🔒 Enhanced Security Manager initialized');
  }

  // Activity Monitoring & Auto-Logout
  setupActivityListeners() {
    this.activityEvents.forEach(event => {
      document.addEventListener(event, () => this.resetSessionTimer(), true);
    });
  }

  resetSessionTimer() {
    // Clear existing timers
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
    
    // Hide warning if shown
    if (this.isWarningShown) {
      this.hideSessionWarning();
    }

    // Set warning timer (25 minutes)
    this.warningTimer = setTimeout(() => {
      this.showSessionWarning();
    }, this.warningTimeoutMinutes * 60 * 1000);

    // Set logout timer (30 minutes)
    this.sessionTimer = setTimeout(() => {
      this.autoLogout('session_timeout');
    }, this.sessionTimeoutMinutes * 60 * 1000);

    // Update last activity timestamp
    localStorage.setItem('ezra_last_activity', Date.now().toString());
  }

  showSessionWarning() {
    this.isWarningShown = true;
    
    const warningModal = document.createElement('div');
    warningModal.id = 'session-warning-modal';
    warningModal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      ">
        <div style="
          background: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          max-width: 400px;
          text-align: center;
          animation: slideIn 0.3s ease;
        ">
          <div style="
            background: #FEF3CD;
            color: #92400E;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-weight: 600;
          ">
            ⚠️ Session Warning
          </div>
          <h3 style="margin-bottom: 16px; color: #1F2937;">Your session will expire soon</h3>
          <p style="color: #6B7280; margin-bottom: 24px;">
            You will be automatically logged out in 5 minutes due to inactivity.
          </p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="stay-logged-in" style="
              background: #FF6B35;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            ">Stay Logged In</button>
            <button id="logout-now" style="
              background: #E5E7EB;
              color: #374151;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
            ">Logout Now</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(warningModal);

    // Add event listeners
    document.getElementById('stay-logged-in').addEventListener('click', () => {
      this.hideSessionWarning();
      this.resetSessionTimer();
      this.logSecurityEvent('session_extended');
    });

    document.getElementById('logout-now').addEventListener('click', () => {
      this.autoLogout('user_requested');
    });
  }

  hideSessionWarning() {
    const modal = document.getElementById('session-warning-modal');
    if (modal) {
      modal.remove();
    }
    this.isWarningShown = false;
  }

  autoLogout(reason = 'unknown') {
    this.logSecurityEvent('auto_logout', { reason });
    
    // Clear all timers
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
    
    // Clear session data
    this.clearSessionData();
    
    // Show logout message
    this.showLogoutMessage(reason);
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 3000);
  }

  showLogoutMessage(reason) {
    const message = reason === 'session_timeout' 
      ? 'Your session has expired due to inactivity.'
      : 'You have been logged out.';
    
    document.body.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background: linear-gradient(135deg, #1B365D 0%, #FF6B35 100%);
      ">
        <div style="
          background: white;
          padding: 48px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        ">
          <div style="
            background: #FEE2E2;
            color: #DC2626;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            font-weight: 600;
          ">
            🚪 Session Ended
          </div>
          <h2 style="margin-bottom: 16px; color: #1F2937;">${message}</h2>
          <p style="color: #6B7280; margin-bottom: 24px;">
            You will be redirected to the login page in a few seconds...
          </p>
          <div style="
            width: 40px;
            height: 40px;
            border: 4px solid #E5E7EB;
            border-top: 4px solid #FF6B35;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          "></div>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  // Security Headers & CSRF Protection
  setupSecurityHeaders() {
    // Add security meta tags if not present
    if (!document.querySelector('meta[http-equiv="X-Frame-Options"]')) {
      const frameOptions = document.createElement('meta');
      frameOptions.setAttribute('http-equiv', 'X-Frame-Options');
      frameOptions.setAttribute('content', 'DENY');
      document.head.appendChild(frameOptions);
    }

    if (!document.querySelector('meta[http-equiv="X-Content-Type-Options"]')) {
      const contentType = document.createElement('meta');
      contentType.setAttribute('http-equiv', 'X-Content-Type-Options');
      contentType.setAttribute('content', 'nosniff');
      document.head.appendChild(contentType);
    }
  }

  setupCSRFProtection() {
    // Generate CSRF token for the session
    const csrfToken = this.generateCSRFToken();
    sessionStorage.setItem('ezra_csrf_token', csrfToken);
    
    // Add CSRF token to all forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrf_token';
      csrfInput.value = csrfToken;
      form.appendChild(csrfInput);
    });
  }

  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Login Attempt Monitoring
  checkLoginAttempts(email) {
    const key = `ezra_login_attempts_${email}`;
    const attempts = JSON.parse(localStorage.getItem(key) || '[]');
    const now = Date.now();
    
    // Remove attempts older than lockout duration
    const validAttempts = attempts.filter(attempt => 
      now - attempt < this.lockoutDurationMinutes * 60 * 1000
    );

    if (validAttempts.length >= this.maxLoginAttempts) {
      const lockoutEnd = validAttempts[0] + (this.lockoutDurationMinutes * 60 * 1000);
      const remainingMinutes = Math.ceil((lockoutEnd - now) / (60 * 1000));
      
      throw new Error(`Too many failed login attempts. Account locked for ${remainingMinutes} more minutes.`);
    }

    return validAttempts.length;
  }

  recordFailedLoginAttempt(email) {
    const key = `ezra_login_attempts_${email}`;
    const attempts = JSON.parse(localStorage.getItem(key) || '[]');
    attempts.push(Date.now());
    localStorage.setItem(key, JSON.stringify(attempts));
    
    this.logSecurityEvent('failed_login_attempt', { email, attempt_count: attempts.length });
  }

  clearLoginAttempts(email) {
    const key = `ezra_login_attempts_${email}`;
    localStorage.removeItem(key);
  }

  // Session Management
  loadSecurityState() {
    const lastActivity = localStorage.getItem('ezra_last_activity');
    if (lastActivity) {
      const timeSinceActivity = Date.now() - parseInt(lastActivity);
      if (timeSinceActivity > this.sessionTimeoutMinutes * 60 * 1000) {
        this.autoLogout('session_expired');
        return;
      }
    }
    
    // Resume session monitoring
    this.resetSessionTimer();
  }

  startSessionMonitoring() {
    // Check for multiple tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'ezra_logout_all_tabs') {
        this.autoLogout('logout_all_tabs');
      }
    });

    // Check for session validity every 5 minutes
    setInterval(() => {
      this.validateSession();
    }, 5 * 60 * 1000);
  }

  async validateSession() {
    try {
      if (window.supabase && window.EZRA_CONFIG) {
        const client = window.supabase.createClient(
          window.EZRA_CONFIG.SUPABASE_URL,
          window.EZRA_CONFIG.SUPABASE_ANON_KEY
        );
        
        const { data: { session } } = await client.auth.getSession();
        if (!session) {
          this.autoLogout('session_invalid');
        }
      }
    } catch (error) {
      console.warn('Session validation failed:', error);
    }
  }

  clearSessionData() {
    // Clear all Ezra-related data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ezra_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear session storage
    sessionStorage.clear();
    
    // Signal other tabs to logout
    localStorage.setItem('ezra_logout_all_tabs', Date.now().toString());
  }

  // Security Logging
  logSecurityEvent(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      ip: 'client-side', // Would need server-side for real IP
      sessionId: sessionStorage.getItem('ezra_session_id') || 'unknown'
    };

    this.securityLogs.push(logEntry);
    
    // Keep only last 100 logs
    if (this.securityLogs.length > 100) {
      this.securityLogs = this.securityLogs.slice(-100);
    }

    // Store in session storage for debugging
    sessionStorage.setItem('ezra_security_logs', JSON.stringify(this.securityLogs));
    
    console.log('🔒 Security Event:', logEntry);
  }

  // Public Methods
  extendSession() {
    this.resetSessionTimer();
    this.logSecurityEvent('session_extended_manual');
  }

  forceLogout() {
    this.autoLogout('force_logout');
  }

  getSecurityLogs() {
    return this.securityLogs;
  }

  // Initialize on page load
  static init() {
    if (typeof window !== 'undefined') {
      window.EzraSecurityManager = new EzraSecurityManager();
    }
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', EzraSecurityManager.init);
} else {
  EzraSecurityManager.init();
}

// Export for manual usage
if (typeof window !== 'undefined') {
  window.EzraSecurityManager = EzraSecurityManager;
}