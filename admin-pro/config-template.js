/**
 * Ezra Admin Dashboard Configuration Template
 * 
 * SECURITY NOTE: Never commit real credentials to GitHub!
 * 
 * Instructions:
 * 1. Copy this file to 'config-local.js'
 * 2. Update the values in config-local.js with your real credentials
 * 3. Add config-local.js to .gitignore so it's never committed
 */

const EZRA_CONFIG = {
    // STEP 1: Replace with your Supabase project URL
    // Found in: Supabase Dashboard → Settings → API → Project URL
    SUPABASE_URL: 'https://YOUR_PROJECT_ID.supabase.co',
    
    // STEP 2: Replace with your Supabase anon/public key
    // Found in: Supabase Dashboard → Settings → API → anon/public key
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ANON_KEY_HERE',
    
    // App configuration (you can customize these)
    APP_NAME: 'Ezra Admin Portal',
    APP_DESCRIPTION: 'Administrative dashboard for Ezra Services - Cameroon Service Marketplace',
    
    // Demo credentials for testing (change these!)
    DEMO_CREDENTIALS: {
        email: 'admin@ezraservice.com',
        password: 'your-admin-password'
    },
    
    // Feature flags
    FEATURES: {
        REAL_TIME_UPDATES: true,
        ACTIVITY_FEED: true,
        AUTO_REFRESH: true,
        DEBUG_MODE: true  // Set to false in production
    },
    
    // Update intervals (in milliseconds)
    INTERVALS: {
        STATS_UPDATE: 30000,      // 30 seconds
        TIME_UPDATE: 1000,        // 1 second
        ACTIVITY_REFRESH: 60000   // 1 minute
    }
};

// Validation function
function validateConfig() {
    const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    const missing = required.filter(key => 
        !EZRA_CONFIG[key] || 
        EZRA_CONFIG[key].includes('YOUR_') || 
        EZRA_CONFIG[key].includes('your-')
    );
    
    if (missing.length > 0) {
        console.error('❌ Missing configuration:', missing);
        console.log('📝 Please update config-local.js with your Supabase credentials');
        return false;
    }
    
    console.log('✅ Configuration validated successfully');
    return true;
}

// Export configuration
if (typeof window !== 'undefined') {
    window.EZRA_CONFIG = EZRA_CONFIG;
    window.validateConfig = validateConfig;
}

// Auto-validate on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (!validateConfig()) {
            showConfigurationHelp();
        }
    });
}

function showConfigurationHelp() {
    document.body.innerHTML = `
        <div style="
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
            <div style="
                background: white; 
                padding: 3rem; 
                border-radius: 1rem; 
                max-width: 700px;
                text-align: center;
                box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
            ">
                <div style="
                    width: 64px; 
                    height: 64px; 
                    background: #f59e0b; 
                    border-radius: 12px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    margin: 0 auto 1.5rem;
                    font-size: 1.75rem;
                ">🔒</div>
                
                <h1 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; color: #1e293b;">
                    Secure Configuration Required
                </h1>
                
                <p style="color: #64748b; margin-bottom: 2rem; line-height: 1.6;">
                    For security, please set up your credentials using the safe method below.
                </p>
                
                <div style="
                    background: #f8fafc; 
                    border-left: 4px solid #3b82f6; 
                    padding: 1.5rem; 
                    text-align: left; 
                    border-radius: 0.5rem;
                    margin-bottom: 2rem;
                ">
                    <h3 style="font-weight: 600; color: #1e293b; margin-bottom: 1rem;">
                        🛡️ Secure Setup Steps:
                    </h3>
                    <ol style="color: #475569; line-height: 1.8; padding-left: 1.2rem; margin: 0;">
                        <li><strong>Copy</strong> config-template.js → config-local.js</li>
                        <li><strong>Edit config-local.js</strong> with your Supabase credentials</li>
                        <li><strong>Update index.html</strong> to load config-local.js</li>
                        <li><strong>Add config-local.js</strong> to .gitignore</li>
                        <li><strong>Test locally</strong> before deploying</li>
                    </ol>
                </div>
                
                <div style="
                    background: #fef3c7; 
                    border-left: 4px solid #f59e0b; 
                    padding: 1rem; 
                    text-align: left; 
                    border-radius: 0.5rem;
                    margin-bottom: 2rem;
                    font-size: 0.9rem;
                ">
                    <strong>⚠️ Security Note:</strong> Never commit real API keys to GitHub. 
                    Use environment variables or local config files that are gitignored.
                </div>
                
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <a href="https://supabase.com/dashboard" 
                       target="_blank" 
                       style="
                           display: inline-block;
                           background: #3b82f6; 
                           color: white; 
                           padding: 0.75rem 1.5rem; 
                           border-radius: 0.5rem; 
                           text-decoration: none; 
                           font-weight: 600;
                       ">
                        Get Supabase Keys
                    </a>
                    
                    <button onclick="location.reload()" 
                            style="
                                background: #6b7280; 
                                color: white; 
                                padding: 0.75rem 1.5rem; 
                                border-radius: 0.5rem; 
                                border: none;
                                font-weight: 600;
                                cursor: pointer;
                            ">
                        Reload After Setup
                    </button>
                </div>
            </div>
        </div>
    `;
}