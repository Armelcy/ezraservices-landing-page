// 🔐 Simple Admin Authentication for Web Admin Dashboard
// ======================================================

class WebAdminAuth {
  constructor() {
    this.supabase = window.supabase.createClient(
      window.EZRA_CONFIG.SUPABASE_URL,
      window.EZRA_CONFIG.SUPABASE_ANON_KEY
    );
    this.currentUser = null;
  }

  // Simple login with email and password + admin verification
  async login(email, password) {
    try {
      console.log('🔐 Web admin login attempt for:', email);
      
      // Step 1: Authenticate with Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      // Step 2: Verify admin role
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('role, full_name, email, is_active')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile error:', profileError);
        throw new Error('Could not load user profile');
      }

      if (profile.role !== 'admin') {
        console.error('❌ Not admin role:', profile.role);
        await this.supabase.auth.signOut();
        throw new Error('Access denied: Admin privileges required');
      }

      if (!profile.is_active) {
        console.error('❌ Account disabled');
        await this.supabase.auth.signOut();
        throw new Error('Account is disabled');
      }

      console.log('✅ Web admin login successful:', profile.full_name);
      
      this.currentUser = {
        user: authData.user,
        profile: profile
      };

      // Store session info
      localStorage.setItem('ezra_admin_session', JSON.stringify({
        userId: authData.user.id,
        email: profile.email,
        name: profile.full_name,
        loginTime: new Date().toISOString()
      }));

      return {
        success: true,
        user: this.currentUser
      };

    } catch (error) {
      console.error('❌ Web admin login failed:', error);
      throw error;
    }
  }

  // Check if currently authenticated
  async isAuthenticated() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error || !session) {
        this.currentUser = null;
        localStorage.removeItem('ezra_admin_session');
        return false;
      }

      // Verify admin role still valid
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('role, full_name, email, is_active')
        .eq('id', session.user.id)
        .single();

      if (profileError || profile.role !== 'admin' || !profile.is_active) {
        await this.logout();
        return false;
      }

      this.currentUser = {
        user: session.user,
        profile: profile
      };

      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  // Get current user info
  getCurrentUser() {
    return this.currentUser;
  }

  // Get Supabase client for API calls
  getSupabaseClient() {
    return this.supabase;
  }

  // Logout
  async logout() {
    try {
      await this.supabase.auth.signOut();
      this.currentUser = null;
      localStorage.removeItem('ezra_admin_session');
      console.log('🔒 Admin logout successful');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local data anyway
      this.currentUser = null;
      localStorage.removeItem('ezra_admin_session');
      return true;
    }
  }

  // Get session info for display
  getSessionInfo() {
    const session = localStorage.getItem('ezra_admin_session');
    return session ? JSON.parse(session) : null;
  }
}

// Initialize global admin auth instance
window.webAdminAuth = new WebAdminAuth();

// Utility function to protect admin pages
async function requireAdminAuth() {
  const isAuth = await window.webAdminAuth.isAuthenticated();
  if (!isAuth) {
    // Redirect to login page
    window.location.href = './admin-login.html';
    return false;
  }
  return true;
}

// Utility function to show user info in header
function displayAdminUserInfo(containerId = 'admin-user-info') {
  const user = window.webAdminAuth.getCurrentUser();
  const container = document.getElementById(containerId);
  
  if (container && user) {
    container.innerHTML = `
      <div class="admin-user-display">
        <span class="admin-user-name">${user.profile.full_name}</span>
        <span class="admin-user-email">${user.profile.email}</span>
        <button class="admin-logout-btn" onclick="handleAdminLogout()">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    `;
  }
}

// Global logout handler
async function handleAdminLogout() {
  if (confirm('Are you sure you want to logout?')) {
    await window.webAdminAuth.logout();
    window.location.href = './admin-login.html';
  }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WebAdminAuth, requireAdminAuth, displayAdminUserInfo };
}