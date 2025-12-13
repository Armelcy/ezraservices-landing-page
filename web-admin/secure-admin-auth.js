/**
 * SECURE Admin Authentication System
 * Fixes security vulnerabilities and implements proper admin authentication
 */

class SecureAdminAuth {
    constructor() {
        this.supabase = null;
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize Supabase
            if (window.EZRA_CONFIG) {
                this.supabase = window.supabase.createClient(
                    window.EZRA_CONFIG.SUPABASE_URL,
                    window.EZRA_CONFIG.SUPABASE_ANON_KEY,
                    {
                        auth: {
                            autoRefreshToken: true,
                            persistSession: true,
                            detectSessionInUrl: false
                        }
                    }
                );
            }
            
            // Check if user is already authenticated
            await this.checkExistingSession();
            
        } catch (error) {
            console.error('Auth initialization failed:', error);
        }
    }
    
    async checkExistingSession() {
        try {
            if (!this.supabase) return false;
            
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('Session check error:', error);
                return false;
            }
            
            if (session) {
                // Check if session is still valid
                const sessionAge = Date.now() - new Date(session.created_at).getTime();
                if (sessionAge > this.sessionTimeout) {
                    await this.logout();
                    this.showMessage('Session expirée. Veuillez vous reconnecter.', 'warning');
                    return false;
                }
                
                // Verify admin role
                const isValidAdmin = await this.verifyAdminRole(session.user.id);
                if (isValidAdmin) {
                    // Redirect to dashboard
                    window.location.href = 'modern-dashboard.html';
                    return true;
                } else {
                    await this.logout();
                    this.showMessage('Accès refusé: Privilèges administrateur requis', 'error');
                    return false;
                }
            }
            
            return false;
            
        } catch (error) {
            console.error('Session verification failed:', error);
            return false;
        }
    }
    
    async login(email, password) {
        try {
            // Input validation
            if (!email || !password) {
                this.showMessage('Email et mot de passe requis', 'error');
                return false;
            }
            
            if (!this.isValidEmail(email)) {
                this.showMessage('Format d\'email invalide', 'error');
                return false;
            }
            
            // Check for brute force protection
            if (this.isAccountLocked(email)) {
                const lockoutTime = this.getLockoutTimeRemaining(email);
                this.showMessage(`Compte verrouillé. Réessayez dans ${Math.ceil(lockoutTime / 60000)} minutes.`, 'error');
                return false;
            }
            
            // Attempt login
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password: password
            });
            
            if (error) {
                // Record failed attempt
                this.recordFailedAttempt(email);
                
                // Show appropriate error message
                if (error.message.includes('Invalid login credentials')) {
                    this.showMessage('Email ou mot de passe incorrect', 'error');
                } else {
                    this.showMessage('Erreur de connexion: ' + error.message, 'error');
                }
                return false;
            }
            
            if (!data.user) {
                this.recordFailedAttempt(email);
                this.showMessage('Échec de l\'authentification', 'error');
                return false;
            }
            
            // Verify admin role
            const isValidAdmin = await this.verifyAdminRole(data.user.id);
            if (!isValidAdmin) {
                await this.logout();
                this.recordFailedAttempt(email);
                this.showMessage('Accès refusé: Privilèges administrateur requis', 'error');
                return false;
            }
            
            // Clear failed attempts on successful login
            this.clearFailedAttempts(email);
            
            // Log successful login
            await this.logAdminAction('ADMIN_LOGIN', {
                user_id: data.user.id,
                email: data.user.email,
                login_time: new Date().toISOString(),
                ip_address: await this.getClientIP()
            });
            
            this.showMessage('Connexion réussie', 'success');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = 'modern-dashboard.html';
            }, 1000);
            
            return true;
            
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Erreur de connexion: ' + error.message, 'error');
            return false;
        }
    }
    
    async verifyAdminRole(userId) {
        try {
            const { data: profile, error } = await this.supabase
                .from('profiles')
                .select('role, is_active, full_name')
                .eq('id', userId)
                .single();
            
            if (error) {
                console.error('Profile verification error:', error);
                return false;
            }
            
            if (!profile) {
                console.error('No profile found for user');
                return false;
            }
            
            // Check if user has admin role and is active
            const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';
            const isActive = profile.is_active === true;
            
            if (!isAdmin) {
                console.error('User does not have admin role:', profile.role);
                return false;
            }
            
            if (!isActive) {
                console.error('Admin account is not active');
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.error('Admin role verification failed:', error);
            return false;
        }
    }
    
    async logout() {
        try {
            if (this.supabase) {
                // Log logout action
                const { data: { user } } = await this.supabase.auth.getUser();
                if (user) {
                    await this.logAdminAction('ADMIN_LOGOUT', {
                        user_id: user.id,
                        logout_time: new Date().toISOString()
                    });
                }
                
                await this.supabase.auth.signOut();
            }
            
            // Clear any stored session data
            localStorage.removeItem('adminSession');
            sessionStorage.clear();
            
            this.showMessage('Déconnexion réussie', 'info');
            
            // Redirect to login
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
            
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even if logout fails
            window.location.href = 'login.html';
        }
    }
    
    // Security helper methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    recordFailedAttempt(email) {
        const attempts = this.getFailedAttempts(email);
        attempts.push(Date.now());
        localStorage.setItem(`failed_attempts_${email}`, JSON.stringify(attempts));
    }
    
    getFailedAttempts(email) {
        const stored = localStorage.getItem(`failed_attempts_${email}`);
        if (!stored) return [];
        
        const attempts = JSON.parse(stored);
        // Remove attempts older than lockout duration
        const now = Date.now();
        return attempts.filter(time => (now - time) < this.lockoutDuration);
    }
    
    clearFailedAttempts(email) {
        localStorage.removeItem(`failed_attempts_${email}`);
    }
    
    isAccountLocked(email) {
        const attempts = this.getFailedAttempts(email);
        return attempts.length >= this.maxLoginAttempts;
    }
    
    getLockoutTimeRemaining(email) {
        const attempts = this.getFailedAttempts(email);
        if (attempts.length === 0) return 0;
        
        const oldestAttempt = Math.min(...attempts);
        const timeSinceOldest = Date.now() - oldestAttempt;
        return Math.max(0, this.lockoutDuration - timeSinceOldest);
    }
    
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }
    
    async logAdminAction(action, data) {
        try {
            if (!this.supabase) return;
            
            await this.supabase
                .from('audit_logs')
                .insert({
                    table_name: 'admin_actions',
                    action: action,
                    new_data: data,
                    user_id: data.user_id,
                    created_at: new Date().toISOString()
                });
        } catch (error) {
            console.warn('Failed to log admin action:', error);
        }
    }
    
    showMessage(message, type = 'info') {
        // Create or update message display
        let messageEl = document.getElementById('authMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'authMessage';
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
                max-width: 300px;
                word-wrap: break-word;
            `;
            document.body.appendChild(messageEl);
        }
        
        // Set message and style based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        messageEl.style.backgroundColor = colors[type] || colors.info;
        messageEl.textContent = message;
        
        // Animate in
        setTimeout(() => {
            messageEl.style.opacity = '1';
            messageEl.style.transform = 'translateX(0)';
        }, 100);
        
        // Hide after 5 seconds
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateX(100%)';
        }, 5000);
    }
    
    // Enhanced password requirements
    validatePassword(password) {
        const requirements = {
            minLength: password.length >= 8,
            hasUpper: /[A-Z]/.test(password),
            hasLower: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        const isValid = Object.values(requirements).every(req => req);
        
        return {
            isValid,
            requirements,
            message: isValid ? 'Mot de passe valide' : 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
        };
    }
    
    // Two-factor authentication setup (for future implementation)
    async setupTwoFactor(userId) {
        // Implementation for 2FA setup
        console.log('2FA setup not yet implemented');
    }
}

// Initialize secure authentication
document.addEventListener('DOMContentLoaded', () => {
    window.secureAdminAuth = new SecureAdminAuth();
});

// Export for use in other scripts
window.SecureAdminAuth = SecureAdminAuth;