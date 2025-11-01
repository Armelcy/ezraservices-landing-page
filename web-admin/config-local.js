/**
 * Ezra Admin Dashboard Configuration
 */

const EZRA_CONFIG = {
    // Supabase configuration
    SUPABASE_URL: 'https://zouyaaeincpprkdkofgf.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXlhYWVpbmNwcHJrZGtvZmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODI0ODAsImV4cCI6MjA3NTE1ODQ4MH0.CVQUfeYgFoXY8Bcdc22WpYO-hTGKop5-GrD1qRee9rU',
    
    // App configuration
    APP_NAME: 'Ezra Admin Portal',
    APP_DESCRIPTION: 'Administrative dashboard for Ezra Services - Cameroon Service Marketplace',
    
    // Feature flags
    FEATURES: {
        REAL_TIME_UPDATES: true,
        ACTIVITY_FEED: true,
        AUTO_REFRESH: true,
        DEBUG_MODE: true  // Enable debug mode to see connection issues
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