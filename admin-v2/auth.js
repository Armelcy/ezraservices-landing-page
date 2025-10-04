// 🔐 Admin Panel MFA Client Implementation
// =======================================

class EzraAdminAuth {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    this.mfaSetupCompleted = false;
  }

  // 1. Initial admin login (email + password)
  async adminLogin(email, password) {
    try {
      // Step 1: Basic auth with email/password
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(`Login failed: ${error.message}`);
      }

      // Step 2: Check if user is admin
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        await this.supabase.auth.signOut();
        throw new Error('Access denied: Admin privileges required');
      }

      // Step 3: Check if MFA is already set up
      const { data: factors } = await this.supabase.auth.mfa.listFactors();
      
      if (factors && factors.length > 0) {
        // Check if there are any verified factors
        const verifiedFactors = factors.filter(factor => factor.status === 'verified');
        
        if (verifiedFactors.length > 0) {
          // MFA is set up and verified, challenge required
          return {
            status: 'mfa_challenge_required',
            user: data.user,
            profile: profile,
            factors: verifiedFactors
          };
        } else {
          // MFA factors exist but not verified, need to complete setup
          return {
            status: 'mfa_setup_required',
            user: data.user,
            profile: profile,
            existingFactor: factors[0]
          };
        }
      } else {
        // First time admin login - require MFA setup
        return {
          status: 'mfa_setup_required',
          user: data.user,
          profile: profile
        };
      }

    } catch (error) {
      this.logSecurityEvent('admin_login_failed', { email, error: error.message });
      throw error;
    }
  }

  // 2. Set up TOTP MFA for new admin or use existing
  async setupMFA(existingFactor = null) {
    try {
      let factorData;
      
      if (existingFactor && existingFactor.secret) {
        // Use existing factor that wasn't completed and has a secret
        factorData = existingFactor;
        this.logSecurityEvent('mfa_setup_resumed', { factorId: existingFactor.id });
      } else {
        // Create new TOTP factor (existing factor was invalid or doesn't exist)
        const { data, error } = await this.supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: `Ezra Admin Authenticator ${Date.now()}` // Add timestamp to make unique
        });

        if (error) {
          throw new Error(`MFA setup failed: ${error.message}`);
        }

        factorData = data;
        this.logSecurityEvent('mfa_setup_initiated');
      }

      // Debug: Log the factor data
      console.log('Factor data from Supabase:', factorData);
      
      // Extract secret and QR code from the correct locations
      const secret = factorData.secret || factorData.totp?.secret;
      const qrCode = factorData.qr_code || factorData.totp?.qr_code;
      
      // Validate that we have the required data
      if (!secret) {
        throw new Error('No secret received from Supabase MFA enrollment. Data structure: ' + JSON.stringify(factorData));
      }
      
      if (!qrCode) {
        throw new Error('No QR code received from Supabase MFA enrollment. Data structure: ' + JSON.stringify(factorData));
      }
      
      console.log('Extracted secret:', secret);
      console.log('Extracted QR code:', qrCode);
      
      return {
        qrCode: qrCode,
        secret: secret,
        factorId: factorData.id
      };

    } catch (error) {
      this.logSecurityEvent('mfa_setup_failed', { error: error.message });
      throw error;
    }
  }

  // 3. Verify TOTP setup
  async verifyMFASetup(factorId, verificationCode) {
    try {
      const { data, error } = await this.supabase.auth.mfa.challengeAndVerify({
        factorId: factorId,
        code: verificationCode
      });

      if (error) {
        throw new Error(`MFA verification failed: ${error.message}`);
      }

      this.mfaSetupCompleted = true;
      this.logSecurityEvent('mfa_setup_completed');

      // Create admin session after successful MFA setup
      return await this.createAdminSession();

    } catch (error) {
      this.logSecurityEvent('mfa_verification_failed', { error: error.message });
      throw error;
    }
  }

  // 4. Challenge existing MFA for login
  async challengeMFA(factorId) {
    try {
      const { data, error } = await this.supabase.auth.mfa.challenge({
        factorId: factorId
      });

      if (error) {
        throw new Error(`MFA challenge failed: ${error.message}`);
      }

      return {
        challengeId: data.id
      };

    } catch (error) {
      this.logSecurityEvent('mfa_challenge_failed', { error: error.message });
      throw error;
    }
  }

  // 5. Verify MFA challenge
  async verifyMFAChallenge(challengeId, verificationCode) {
    try {
      const { data, error } = await this.supabase.auth.mfa.verify({
        challengeId: challengeId,
        code: verificationCode
      });

      if (error) {
        throw new Error(`MFA verification failed: ${error.message}`);
      }

      this.logSecurityEvent('mfa_challenge_verified');

      // Create admin session after successful MFA
      return await this.createAdminSession();

    } catch (error) {
      this.logSecurityEvent('mfa_challenge_verification_failed', { error: error.message });
      throw error;
    }
  }

  // 6. Create secure admin session
  async createAdminSession() {
    try {
      const { data, error } = await this.supabase.rpc('ezra_create_admin_session', {
        p_ip_address: await this.getClientIP(),
        p_user_agent: navigator.userAgent
      });

      if (error) {
        throw new Error(`Session creation failed: ${error.message}`);
      }

      this.logSecurityEvent('admin_session_created');

      return {
        status: 'authenticated'
      };

    } catch (error) {
      this.logSecurityEvent('session_creation_failed', { error: error.message });
      throw error;
    }
  }

  // 7. Validate existing session
  async validateSession() {
    try {
      // Use standard Supabase session validation
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error || !session) {
        console.log('❌ No session found:', error?.message || 'No session');
        return false;
      }
      
      console.log('✅ Session found for user:', session.user.email);
      
      // Check if user is admin - with better error handling
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('role, email')
        .eq('id', session.user.id)
        .single();
        
      if (profileError) {
        console.log('❌ Profile query error:', profileError.message);
        return false;
      }
      
      if (!profile) {
        console.log('❌ No profile found for user');
        return false;
      }
      
      console.log('👤 Profile found:', profile.email, 'Role:', profile.role);
      
      if (profile.role !== 'admin') {
        console.log('❌ User is not admin. Role:', profile.role);
        return false;
      }
      
      console.log('✅ Admin session validated successfully');
      return true;
    } catch (error) {
      console.log('❌ Session validation error:', error.message);
      return false;
    }
  }

  // 8. Logout and revoke session
  async logout() {
    try {
      await this.supabase.auth.signOut();
      
      this.logSecurityEvent('admin_logout');

      return true;

    } catch (error) {
      // Clear session even if revocation fails
      this.clearSession();
      return true;
    }
  }

  // 9. Clear local session data
  clearSession() {
    // Session is now handled by Supabase automatically
  }

  // 10. Security event logging
  async logSecurityEvent(action, details = {}) {
    try {
      await this.supabase.rpc('ezra_log_admin_activity', {
        p_action: action,
        p_resource_type: 'security',
        p_details: {
          ...details,
          timestamp: new Date().toISOString(),
          ip: await this.getClientIP(),
          userAgent: navigator.userAgent
        }
      });
    } catch (error) {
      // Silent fail for logging - don't break main flow
      console.warn('Security logging failed:', error);
    }
  }

  // 11. Get client IP (approximate)
  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // 12. Check if admin has required permissions
  async checkAdminPermissions(requiredRole = 'admin') {
    try {
      const sessionValid = await this.validateSession();
      if (!sessionValid) {
        return false;
      }

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      return profile?.role === requiredRole;

    } catch (error) {
      return false;
    }
  }

  // 13. Reset MFA (remove all factors)
  async resetMFA() {
    try {
      const { data: factors } = await this.supabase.auth.mfa.listFactors();
      
      if (factors && factors.length > 0) {
        // Unenroll all existing factors
        for (const factor of factors) {
          await this.supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
        
        this.logSecurityEvent('mfa_reset');
        return true;
      }
      
      return false;

    } catch (error) {
      this.logSecurityEvent('mfa_reset_failed', { error: error.message });
      throw error;
    }
  }

  // 14. Force re-authentication for sensitive operations
  async requireReauth(action) {
    try {
      const { data: factors } = await this.supabase.auth.mfa.listFactors();
      
      if (!factors || factors.length === 0) {
        throw new Error('MFA not configured');
      }

      const factorId = factors[0].id;
      const challenge = await this.challengeMFA(factorId);
      
      return {
        requiresMFA: true,
        challengeId: challenge.challengeId,
        action: action
      };

    } catch (error) {
      this.logSecurityEvent('reauth_failed', { action, error: error.message });
      throw error;
    }
  }
}

// 14. Usage Example and Integration
window.EzraAdminAuth = EzraAdminAuth;

// Initialize admin auth when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.adminAuth = new EzraAdminAuth(
    'https://zouyaaeincpprkdkofgf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXlhYWVpbmNwcHJrZGtvZmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjc2NjYsImV4cCI6MjA3MjcwMzY2Nn0.igi2uZTcC19q0ZmvTHz0L3E28ZnzVSVtaVbqRmhk2jQ'
  );

  // Check if user is already authenticated
  checkAuthStatus();
});

async function checkAuthStatus() {
  const isValid = await window.adminAuth.validateSession();
  
  if (isValid) {
    // User is authenticated, show dashboard
    showDashboard();
  } else {
    // User needs to login
    showLoginForm();
  }
}

function showDashboard() {
  // For now, just redirect to success
  // You can customize this later
  console.log('User authenticated - ready for dashboard');
}

function showLoginForm() {
  // Login form is already shown by default
  console.log('User needs to login');
}

// Export for use in admin panel
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EzraAdminAuth;
}