/**
 * Ezra Admin Dashboard Configuration
 * Replace these values with your actual Supabase credentials
 */

// STEP 1: Replace these with your actual Supabase project details
const EZRA_CONFIG = {
    // Your Supabase project URL (found in Settings > API)
    SUPABASE_URL: 'https://your-project-ref.supabase.co',
    
    // Your Supabase anon/public key (found in Settings > API)
    SUPABASE_ANON_KEY: 'your-anon-key-here',
    
    // Optional: Service role key for admin operations (keep secure)
    SUPABASE_SERVICE_ROLE_KEY: 'your-service-role-key-here',
    
    // App configuration
    APP_NAME: 'Ezra Admin Portal',
    APP_DESCRIPTION: 'Administrative dashboard for Ezra Services - Cameroon Service Marketplace',
    
    // Default admin credentials for demo (change in production)
    DEMO_CREDENTIALS: {
        email: 'admin@ezraservice.com',
        password: 'ezra2025admin'
    },
    
    // Feature flags
    FEATURES: {
        REAL_TIME_UPDATES: true,
        ACTIVITY_FEED: true,
        AUTO_REFRESH: true,
        DEBUG_MODE: false
    },
    
    // Update intervals (in milliseconds)
    INTERVALS: {
        STATS_UPDATE: 30000,      // 30 seconds
        TIME_UPDATE: 1000,        // 1 second
        ACTIVITY_REFRESH: 60000   // 1 minute
    }
};

// STEP 2: Validate configuration
function validateConfig() {
    const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    const missing = required.filter(key => 
        !EZRA_CONFIG[key] || EZRA_CONFIG[key].includes('your-')
    );
    
    if (missing.length > 0) {
        console.error('❌ Missing configuration:', missing);
        console.log('📝 Please update config.js with your Supabase credentials');
        return false;
    }
    
    console.log('✅ Configuration validated successfully');
    return true;
}

// STEP 3: Export configuration
if (typeof window !== 'undefined') {
    window.EZRA_CONFIG = EZRA_CONFIG;
    window.validateConfig = validateConfig;
}

// Auto-validate on load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (!validateConfig()) {
            // Show configuration help
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
                        max-width: 600px;
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
                        ">⚙️</div>
                        
                        <h1 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1rem; color: #1e293b;">
                            Configuration Required
                        </h1>
                        
                        <p style="color: #64748b; margin-bottom: 2rem; line-height: 1.6;">
                            Please update <strong>config.js</strong> with your Supabase project credentials before using the admin dashboard.
                        </p>
                        
                        <div style="
                            background: #f8fafc; 
                            border-left: 4px solid #3b82f6; 
                            padding: 1rem; 
                            text-align: left; 
                            border-radius: 0.5rem;
                            margin-bottom: 2rem;
                        ">
                            <h3 style="font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">
                                Required Steps:
                            </h3>
                            <ol style="color: #475569; line-height: 1.6; padding-left: 1.2rem;">
                                <li>Go to your Supabase dashboard</li>
                                <li>Navigate to Settings → API</li>
                                <li>Copy your Project URL and anon key</li>
                                <li>Update the values in config.js</li>
                                <li>Refresh this page</li>
                            </ol>
                        </div>
                        
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
                               transition: background 0.2s ease;
                           "
                           onmouseover="this.style.background='#2563eb'"
                           onmouseout="this.style.background='#3b82f6'">
                            Open Supabase Dashboard
                        </a>
                    </div>
                </div>
            `;
        }
    });
}