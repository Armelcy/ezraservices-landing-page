/**
 * Ezra Admin Dashboard Configuration
 */

const EZRA_CONFIG = {
    // Supabase configuration
    SUPABASE_URL: 'https://zouyaaeincpprkdkofgf.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXlhYWVpbmNwcHJrZGtvZmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjc2NjYsImV4cCI6MjA3MjcwMzY2Nn0.igi2uZTcC19q0ZmvTHz0L3E28ZnzVSVtaVbqRmhk2jQ',
    
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