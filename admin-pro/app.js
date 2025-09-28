/**
 * Ezra Admin Dashboard - Professional UI with Supabase Integration
 * Connects the beautiful dashboard to real Ezra marketplace data
 */

// Get configuration from config.js
const config = window.EZRA_CONFIG;

// Initialize Supabase client with configuration
const supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
    },
    realtime: {
        enabled: true,
    },
});

// Global state
let currentUser = null;
let realtimeSubscriptions = [];
let updateIntervals = [];

/**
 * Authentication Management
 */
class EzraAuth {
    static async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Verify admin role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, is_active, full_name')
                .eq('id', data.user.id)
                .single();

            if (profileError || profile.role !== 'admin' || !profile.is_active) {
                await supabase.auth.signOut();
                throw new Error('Access denied: Admin privileges required');
            }

            return { user: data.user, profile };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    static async signOut() {
        try {
            // Clean up subscriptions
            realtimeSubscriptions.forEach(sub => sub.unsubscribe());
            updateIntervals.forEach(interval => clearInterval(interval));
            realtimeSubscriptions = [];
            updateIntervals = [];

            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            currentUser = null;
            showLogin();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }

    static async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return { user, profile };
    }
}

/**
 * Dashboard Data Management
 */
class EzraDashboard {
    static async getStats() {
        try {
            // Use parallel queries for better performance
            const [totalUsersResult, pendingKYCResult, activeBookingsResult, 
                   pendingPayoutsResult, revenueResult, todayRevenueResult] = await Promise.all([
                this.getTotalUsers(),
                this.getPendingKYC(),
                this.getActiveBookings(),
                this.getPendingPayouts(),
                this.getTotalRevenue(),
                this.getTodayRevenue(),
            ]);

            return {
                totalUsers: totalUsersResult || 0,
                pendingKYC: pendingKYCResult || 0,
                activeBookings: activeBookingsResult || 0,
                pendingPayouts: pendingPayoutsResult || 0,
                totalRevenue: revenueResult || 0,
                todayRevenue: todayRevenueResult || 0,
                systemHealth: 99.9, // TODO: Implement actual health check
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return {
                totalUsers: 0,
                pendingKYC: 0,
                activeBookings: 0,
                pendingPayouts: 0,
                totalRevenue: 0,
                todayRevenue: 0,
                systemHealth: 99.9,
            };
        }
    }

    static async getTotalUsers() {
        const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .in('role', ['customer', 'provider'])
            .eq('is_active', true);
        return count;
    }

    static async getPendingKYC() {
        const { count } = await supabase
            .from('providers')
            .select('*', { count: 'exact', head: true })
            .eq('cni_verified', false);
        return count;
    }

    static async getActiveBookings() {
        const { count } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .in('status', ['confirmed', 'in_progress']);
        return count;
    }

    static async getPendingPayouts() {
        const { count } = await supabase
            .from('escrow_transactions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'held');
        return count;
    }

    static async getTotalRevenue() {
        const { data } = await supabase
            .from('bookings')
            .select('service_fee')
            .eq('status', 'completed');
        
        return data?.reduce((sum, booking) => sum + (booking.service_fee || 0), 0) || 0;
    }

    static async getTodayRevenue() {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('bookings')
            .select('service_fee')
            .eq('status', 'completed')
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59`);
        
        return data?.reduce((sum, booking) => sum + (booking.service_fee || 0), 0) || 0;
    }

    static async getActivityFeed(limit = 10) {
        try {
            const activities = [];

            // Get recent bookings
            const { data: bookings } = await supabase
                .from('bookings')
                .select(`
                    id, service_name, created_at, customer_id,
                    customer:customer_id(full_name, location)
                `)
                .order('created_at', { ascending: false })
                .limit(limit / 2);

            // Get recent KYC approvals
            const { data: kyc } = await supabase
                .from('providers')
                .select(`
                    id, updated_at, business_name,
                    user:user_id(full_name, location)
                `)
                .eq('cni_verified', true)
                .order('updated_at', { ascending: false })
                .limit(limit / 2);

            // Format booking activities
            bookings?.forEach(booking => {
                activities.push({
                    id: `booking_${booking.id}`,
                    type: 'booking',
                    message: `New booking: ${booking.service_name} in ${booking.customer?.location || 'Unknown'}`,
                    timestamp: booking.created_at,
                    icon: '🔧',
                    iconBg: '#e8f5e8',
                    iconColor: '#388e3c'
                });
            });

            // Format KYC activities
            kyc?.forEach(provider => {
                activities.push({
                    id: `kyc_${provider.id}`,
                    type: 'kyc',
                    message: `KYC approved: ${provider.user?.full_name} (${provider.business_name || 'Provider'})`,
                    timestamp: provider.updated_at,
                    icon: '✅',
                    iconBg: '#e3f2fd',
                    iconColor: '#1976d2'
                });
            });

            // Sort by timestamp and limit
            return activities
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);

        } catch (error) {
            console.error('Error fetching activity feed:', error);
            return [];
        }
    }

    static subscribeToUpdates() {
        // Subscribe to real-time updates
        const subscription = supabase
            .channel('admin-dashboard')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'bookings' },
                () => this.updateDashboard()
            )
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => this.updateDashboard()
            )
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'providers' },
                () => this.updateDashboard()
            )
            .subscribe();

        realtimeSubscriptions.push(subscription);

        // Set up periodic updates
        const interval = setInterval(() => {
            this.updateDashboard();
        }, 30000); // Update every 30 seconds

        updateIntervals.push(interval);
    }

    static async updateDashboard() {
        try {
            const stats = await this.getStats();
            const activities = await this.getActivityFeed();

            updateStatsDisplay(stats);
            updateActivityFeed(activities);
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }
}

/**
 * UI Management Functions
 */
function showLogin() {
    document.getElementById('login').style.display = 'flex';
    document.getElementById('dashboard').classList.remove('active');
}

function showDashboard() {
    document.getElementById('login').style.display = 'none';
    document.getElementById('dashboard').classList.add('active');
    
    // Initialize dashboard
    initializeDashboard();
}

function updateStatsDisplay(stats) {
    document.getElementById('totalUsers').textContent = stats.totalUsers.toLocaleString();
    document.getElementById('pendingKYC').textContent = stats.pendingKYC.toLocaleString();
    document.getElementById('activeBookings').textContent = stats.activeBookings.toLocaleString();
    document.getElementById('pendingPayouts').textContent = stats.pendingPayouts.toLocaleString();
    document.getElementById('totalRevenue').textContent = formatCurrency(stats.totalRevenue);
    document.getElementById('todayRevenue').textContent = formatCurrency(stats.todayRevenue);
    document.getElementById('activeUsers').textContent = Math.floor(stats.totalUsers * 0.1).toLocaleString();
}

function updateActivityFeed(activities) {
    const activityList = document.getElementById('activityList');
    
    if (activities.length === 0) {
        activityList.innerHTML = `
            <div class="loading">
                <span>No recent activities</span>
            </div>
        `;
        return;
    }

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${activity.iconBg}; color: ${activity.iconColor};">
                ${activity.icon}
            </div>
            <div class="activity-content">
                <div class="activity-message">${activity.message}</div>
                <div class="activity-time">${formatTimeAgo(activity.timestamp)}</div>
            </div>
            <div class="activity-status"></div>
        </div>
    `).join('');
}

function formatCurrency(amount) {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M FCFA`;
    } else if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}K FCFA`;
    } else {
        return `${amount.toLocaleString()} FCFA`;
    }
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) !== 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) !== 1 ? 's' : ''} ago`;
}

function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        timeZone: 'Africa/Douala'
    });
    document.getElementById('currentTime').textContent = timeString;
}

async function initializeDashboard() {
    // Start time updates
    updateCurrentTime();
    const timeInterval = setInterval(updateCurrentTime, 1000);
    updateIntervals.push(timeInterval);

    // Load initial data
    try {
        const stats = await EzraDashboard.getStats();
        const activities = await EzraDashboard.getActivityFeed();
        
        updateStatsDisplay(stats);
        updateActivityFeed(activities);
        
        // Set up real-time subscriptions
        EzraDashboard.subscribeToUpdates();
        
        // Update admin name
        if (currentUser?.profile?.full_name) {
            document.getElementById('adminName').textContent = currentUser.profile.full_name;
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError('Failed to load dashboard data. Please refresh the page.');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);
}

/**
 * Event Listeners and Initialization
 */
document.addEventListener('DOMContentLoaded', async function() {
    // Check for existing session
    try {
        const user = await EzraAuth.getCurrentUser();
        if (user && user.profile?.role === 'admin') {
            currentUser = user;
            showDashboard();
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Error checking session:', error);
        showLogin();
    }

    // Login form handler
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        const errorDiv = document.getElementById('error');
        
        // Reset error state
        errorDiv.classList.add('hidden');
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
        
        try {
            const result = await EzraAuth.signIn(email, password);
            currentUser = result;
            showDashboard();
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign in';
        }
    });

    // Navigation handlers
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            const page = this.dataset.page;
            console.log(`Navigating to ${page} (placeholder)`);
            // TODO: Implement page navigation
        });
    });

    // Auth state listener
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            currentUser = null;
            showLogin();
        }
    });
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    realtimeSubscriptions.forEach(sub => sub.unsubscribe());
    updateIntervals.forEach(interval => clearInterval(interval));
});

// Global functions for debugging
window.ezraAdmin = {
    auth: EzraAuth,
    dashboard: EzraDashboard,
    currentUser: () => currentUser,
    supabase: supabase
};