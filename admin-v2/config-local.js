/**
 * Ezra Admin Dashboard Configuration - SECURE VERSION
 * NO CREDENTIALS STORED HERE (public repository)
 */

const EZRA_CONFIG = {
    // Supabase configuration - SET AT RUNTIME FOR SECURITY
    SUPABASE_URL: 'https://zouyaaeincpprkdkofgf.supabase.co',
    SUPABASE_ANON_KEY: null, // Will be set securely at runtime
    
    // App configuration
    APP_NAME: 'Ezra Admin Portal',
    APP_DESCRIPTION: 'Administrative dashboard for Ezra Services - Cameroon Service Marketplace',
    
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

// Export configuration
if (typeof window !== 'undefined') {
    window.EZRA_CONFIG = EZRA_CONFIG;
}