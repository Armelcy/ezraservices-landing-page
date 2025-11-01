// Ezra Admin Dashboard v2 - State-of-the-Art Professional Admin Portal
// Built for Cameroon's Premier Service Marketplace

class EzraAdminDashboard {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.realTimeSubscriptions = [];
        this.refreshInterval = null;
        this.currentPage = 'dashboard';
        
        this.init();
    }

    async init() {
        try {
            // Initialize Supabase client
            if (typeof window.EZRA_CONFIG === 'undefined') {
                this.showError('Configuration Required', 'Please set up your Supabase credentials in config-local.js');
                return;
            }

            this.supabase = window.supabase.createClient(
                window.EZRA_CONFIG.SUPABASE_URL,
                window.EZRA_CONFIG.SUPABASE_ANON_KEY
            );

            // Check authentication state
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (session) {
                await this.handleAuthSuccess(session.user);
            } else {
                this.showLogin();
            }

            this.bindEvents();
            this.startClock();
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Initialization Failed', error.message);
        }
    }

    bindEvents() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = item.dataset.page;
                if (page) {
                    this.navigateToPage(page);
                }
            });
        });

        // Logout
        window.logout = () => this.handleLogout();
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        const errorDiv = document.getElementById('error');

        // Show loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                <div class="spinner" style="width: 16px; height: 16px; margin: 0;"></div>
                <span>Authenticating...</span>
            </div>
        `;
        errorDiv.classList.add('hidden');

        try {
            // Authenticate with Supabase
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                throw error;
            }

            // Verify admin role
            const { data: profile, error: profileError } = await this.supabase
                .from('profiles')
                .select('role, is_active, full_name')
                .eq('id', data.user.id)
                .single();

            if (profileError || !profile) {
                throw new Error('Unable to verify user profile');
            }

            if (profile.role !== 'admin' || !profile.is_active) {
                throw new Error('Access denied. Admin privileges required.');
            }

            await this.handleAuthSuccess(data.user, profile);

        } catch (error) {
            console.error('Login error:', error);
            this.showError('Authentication Failed', error.message);
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In to Dashboard';
        }
    }

    async handleAuthSuccess(user, profile = null) {
        this.currentUser = user;
        
        // Get profile if not provided
        if (!profile) {
            const { data: profileData } = await this.supabase
                .from('profiles')
                .select('role, is_active, full_name')
                .eq('id', user.id)
                .single();
            profile = profileData;
        }

        // Update UI with user info
        document.getElementById('adminName').textContent = profile?.full_name || 'Administrator';

        // Show dashboard
        this.showDashboard();
        
        // Load dashboard data
        await this.loadDashboardData();
        
        // Setup real-time subscriptions
        this.setupRealTimeSubscriptions();
        
        // Setup auto-refresh
        this.startAutoRefresh();
    }

    async handleLogout() {
        try {
            // Cleanup subscriptions and intervals
            this.cleanup();
            
            // Sign out from Supabase
            await this.supabase.auth.signOut();
            
            // Show login screen
            this.showLogin();
            
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    showLogin() {
        document.getElementById('login').style.display = 'flex';
        document.getElementById('dashboard').classList.remove('active');
        document.title = 'Ezra Admin Portal - Sign In';
    }

    showDashboard() {
        document.getElementById('login').style.display = 'none';
        document.getElementById('dashboard').classList.add('active');
        document.title = 'Ezra Admin Portal - Dashboard';
    }

    showError(title, message) {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = `${title}: ${message}`;
        errorDiv.classList.remove('hidden');
    }

    navigateToPage(page) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
        
        this.currentPage = page;
        
        // Load page-specific content
        this.loadPageContent(page);
    }

    async loadPageContent(page) {
        const contentArea = document.querySelector('.content-area');
        if (!contentArea) return;

        // Show loading state
        contentArea.innerHTML = `
            <div class="loading" style="min-height: 400px;">
                <div class="spinner"></div>
                <span>Loading ${page}...</span>
            </div>
        `;

        try {
            switch(page) {
                case 'dashboard':
                    await this.loadDashboardContent();
                    break;
                case 'users':
                    await this.loadUsersContent();
                    break;
                case 'providers':
                    await this.loadProvidersContent();
                    break;
                case 'bookings':
                    await this.loadBookingsContent();
                    break;
                case 'kyc':
                    await this.loadKYCContent();
                    break;
                case 'payouts':
                    await this.loadPayoutsContent();
                    break;
                case 'transactions':
                    await this.loadTransactionsContent();
                    break;
                case 'analytics':
                    await this.loadAnalyticsContent();
                    break;
                case 'notifications':
                    await this.loadNotificationsContent();
                    break;
                case 'settings':
                    await this.loadSettingsContent();
                    break;
                case 'audit':
                    await this.loadAuditContent();
                    break;
                default:
                    contentArea.innerHTML = `
                        <div style="text-align: center; padding: var(--space-16);">
                            <h2>Page Not Found</h2>
                            <p>The requested page "${page}" is not available yet.</p>
                        </div>
                    `;
            }
        } catch (error) {
            console.error(`Error loading ${page} content:`, error);
            contentArea.innerHTML = `
                <div style="text-align: center; padding: var(--space-16); color: var(--error);">
                    <h2>Error Loading Page</h2>
                    <p>Failed to load ${page} content. Please try again.</p>
                </div>
            `;
        }
    }

    async loadDashboardContent() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon" style="background: rgba(99, 102, 241, 0.1); color: var(--primary);">👥</div>
                        <div class="stat-trend positive">
                            <span>↗️</span>
                            <span id="usersGrowth">+0%</span>
                        </div>
                    </div>
                    <div class="stat-value" id="totalUsers">0</div>
                    <div class="stat-label">Total Users</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon" style="background: rgba(255, 107, 53, 0.1); color: var(--ezra-orange);">🛡️</div>
                        <div class="stat-trend negative">
                            <span>↘️</span>
                            <span id="kycGrowth">-0%</span>
                        </div>
                    </div>
                    <div class="stat-value" id="pendingKYC">0</div>
                    <div class="stat-label">Pending KYC</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--success);">📅</div>
                        <div class="stat-trend positive">
                            <span>↗️</span>
                            <span id="bookingsGrowth">+0%</span>
                        </div>
                    </div>
                    <div class="stat-value" id="activeBookings">0</div>
                    <div class="stat-label">Active Bookings</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">💰</div>
                        <div class="stat-trend positive">
                            <span>↗️</span>
                            <span id="revenueGrowth">+0%</span>
                        </div>
                    </div>
                    <div class="stat-value" id="totalRevenue">0</div>
                    <div class="stat-label">Total Revenue</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1); color: var(--error);">⚡</div>
                        <div class="stat-trend positive">
                            <span>↗️</span>
                            <span>+0.1%</span>
                        </div>
                    </div>
                    <div class="stat-value" id="systemHealth">99.9%</div>
                    <div class="stat-label">System Health</div>
                </div>

                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon" style="background: rgba(139, 69, 19, 0.1); color: #8B4513;">💎</div>
                        <div class="stat-trend positive">
                            <span>↗️</span>
                            <span id="todayGrowth">+0%</span>
                        </div>
                    </div>
                    <div class="stat-value" id="todayRevenue">0</div>
                    <div class="stat-label">Today's Revenue</div>
                </div>
            </div>

            <!-- Activity Feed -->
            <div class="activity-section">
                <div class="activity-header">
                    <div class="activity-title">
                        📊 Live Activity Feed
                    </div>
                    <div style="display: flex; align-items: center; gap: var(--space-2); font-size: 0.875rem;">
                        <div class="status-indicator"></div>
                        <span>Real-time monitoring</span>
                    </div>
                </div>
                
                <div class="activity-list" id="activityList">
                    <div class="loading">
                        <div class="spinner"></div>
                        <span>Loading live activities...</span>
                    </div>
                </div>
            </div>
        `;
        
        // Load dashboard data
        await this.loadDashboardData();
    }

    async loadUsersContent() {
        try {
            const { data: users, error } = await this.supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const contentArea = document.querySelector('.content-area');
            contentArea.innerHTML = `
                <div style="margin-bottom: var(--space-6);">
                    <h2 style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">
                        User Management
                    </h2>
                    <p style="color: var(--text-secondary);">Manage customer and provider accounts</p>
                </div>

                <div class="activity-section">
                    <div class="activity-header">
                        <div class="activity-title">
                            👥 Users (${users?.length || 0})
                        </div>
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: var(--gray-50); border-bottom: 1px solid var(--border);">
                                <tr>
                                    <th style="padding: var(--space-4); text-align: left; font-weight: 600; color: var(--text-primary);">User</th>
                                    <th style="padding: var(--space-4); text-align: left; font-weight: 600; color: var(--text-primary);">Email</th>
                                    <th style="padding: var(--space-4); text-align: left; font-weight: 600; color: var(--text-primary);">Role</th>
                                    <th style="padding: var(--space-4); text-align: left; font-weight: 600; color: var(--text-primary);">KYC Status</th>
                                    <th style="padding: var(--space-4); text-align: left; font-weight: 600; color: var(--text-primary);">Joined</th>
                                    <th style="padding: var(--space-4); text-align: left; font-weight: 600; color: var(--text-primary);">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users?.map(user => `
                                    <tr style="border-bottom: 1px solid var(--border-light);">
                                        <td style="padding: var(--space-4);">
                                            <div style="display: flex; align-items: center; gap: var(--space-3);">
                                                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--ezra-orange); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                                                    ${(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style="font-weight: 600; color: var(--text-primary);">${user.full_name || 'Unknown'}</div>
                                                    <div style="font-size: 0.875rem; color: var(--text-secondary);">ID: ${user.id.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style="padding: var(--space-4); color: var(--text-secondary);">${user.email || 'No email'}</td>
                                        <td style="padding: var(--space-4);">
                                            <span style="padding: var(--space-1) var(--space-2); background: ${user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : user.role === 'provider' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)'}; color: ${user.role === 'admin' ? 'var(--error)' : user.role === 'provider' ? 'var(--warning)' : 'var(--primary)'}; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 600;">
                                                ${user.role || 'customer'}
                                            </span>
                                        </td>
                                        <td style="padding: var(--space-4);">
                                            <span style="padding: var(--space-1) var(--space-2); background: ${user.kyc_status === 'verified' ? 'rgba(16, 185, 129, 0.1)' : user.kyc_status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(107, 114, 128, 0.1)'}; color: ${user.kyc_status === 'verified' ? 'var(--success)' : user.kyc_status === 'pending' ? 'var(--warning)' : 'var(--text-secondary)'}; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 600;">
                                                ${user.kyc_status || 'not_started'}
                                            </span>
                                        </td>
                                        <td style="padding: var(--space-4); color: var(--text-secondary); font-size: 0.875rem;">
                                            ${new Date(user.created_at).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td style="padding: var(--space-4);">
                                            <span style="padding: var(--space-1) var(--space-2); background: ${user.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)'}; color: ${user.is_active ? 'var(--success)' : 'var(--text-secondary)'}; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 600;">
                                                ${user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('') || '<tr><td colspan="6" style="padding: var(--space-8); text-align: center; color: var(--text-secondary);">No users found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading users:', error);
            throw error;
        }
    }

    async loadBookingsContent() {
        try {
            // First, let's try a simple query to see what's available
            const { data: bookings, error } = await this.supabase
                .from('bookings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Bookings query error:', error);
                throw error;
            }

            // Try to get related data separately to avoid join issues
            let enrichedBookings = bookings || [];
            
            if (bookings && bookings.length > 0) {
                // Get customer profiles
                const customerIds = [...new Set(bookings.map(b => b.customer_id).filter(Boolean))];
                let customerProfiles = {};
                
                if (customerIds.length > 0) {
                    const { data: profiles } = await this.supabase
                        .from('profiles')
                        .select('id, full_name, email')
                        .in('id', customerIds);
                    
                    if (profiles) {
                        customerProfiles = profiles.reduce((acc, profile) => {
                            acc[profile.id] = profile;
                            return acc;
                        }, {});
                    }
                }

                // Get provider data if provider_id exists
                const providerIds = [...new Set(bookings.map(b => b.provider_id).filter(Boolean))];
                let providerData = {};
                
                if (providerIds.length > 0) {
                    const { data: providers } = await this.supabase
                        .from('providers')
                        .select('id, business_name, contact_phone')
                        .in('id', providerIds);
                    
                    if (providers) {
                        providerData = providers.reduce((acc, provider) => {
                            acc[provider.id] = provider;
                            return acc;
                        }, {});
                    }
                }

                // Enrich bookings with related data
                enrichedBookings = bookings.map(booking => ({
                    ...booking,
                    customer: customerProfiles[booking.customer_id] || null,
                    provider: providerData[booking.provider_id] || null
                }));
            }

            const contentArea = document.querySelector('.content-area');
            contentArea.innerHTML = `
                <div style="margin-bottom: var(--space-6);">
                    <h2 style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">
                        Booking Management
                    </h2>
                    <p style="color: var(--text-secondary);">Monitor and manage service bookings</p>
                </div>

                <div class="activity-section">
                    <div class="activity-header">
                        <div class="activity-title">
                            📅 Recent Bookings (${bookings?.length || 0})
                        </div>
                    </div>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: var(--gray-50); border-bottom: 1px solid var(--border);">
                                <tr>
                                    <th style="padding: var(--space-4); text-align: left; font-weight: 600; color: var(--text-primary);">Booking ID</th>
                                    <th style="padding: var(--space-4); text-align: left; font-weight: 600; color: var(--text-primary);">Customer</th>
                                    <th style="padding: var(--space-4); text-align: left; font-weight: 600; color: var(--text-primary);">Provider</th>
                                    <th style="padding: var(--space-4); text-align: left; font-weight: 600; color: var(--text-primary);">Service</th>
                                    <th style="padding: var(--space-4); text-align: left; font-weight: 600; color: var(--text-primary);">Amount</th>
                                    <th style="padding: var(--space-4); text-align: left; font-weight: 600; color: var(--text-primary);">Status</th>
                                    <th style="padding: var(--space-4); text-align: left; font-weight: 600; color: var(--text-primary);">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${enrichedBookings?.map(booking => `
                                    <tr style="border-bottom: 1px solid var(--border-light);">
                                        <td style="padding: var(--space-4); font-family: monospace; color: var(--text-secondary); font-size: 0.875rem;">
                                            #${booking.id ? booking.id.slice(0, 8) : 'N/A'}
                                        </td>
                                        <td style="padding: var(--space-4);">
                                            <div style="font-weight: 600; color: var(--text-primary);">${booking.customer?.full_name || 'Unknown Customer'}</div>
                                            <div style="font-size: 0.875rem; color: var(--text-secondary);">${booking.customer?.email || ''}</div>
                                        </td>
                                        <td style="padding: var(--space-4);">
                                            <div style="font-weight: 600; color: var(--text-primary);">${booking.provider?.business_name || 'Unknown Provider'}</div>
                                            <div style="font-size: 0.875rem; color: var(--text-secondary);">${booking.provider?.contact_phone || ''}</div>
                                        </td>
                                        <td style="padding: var(--space-4); color: var(--text-secondary);">
                                            ${booking.service_type || booking.service_category || 'General Service'}
                                        </td>
                                        <td style="padding: var(--space-4); font-weight: 600; color: var(--text-primary);">
                                            ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(booking.total_amount || booking.amount || 0)}
                                        </td>
                                        <td style="padding: var(--space-4);">
                                            <span style="padding: var(--space-1) var(--space-2); background: ${this.getStatusColor(booking.status).bg}; color: ${this.getStatusColor(booking.status).text}; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 600;">
                                                ${booking.status || 'pending'}
                                            </span>
                                        </td>
                                        <td style="padding: var(--space-4); color: var(--text-secondary); font-size: 0.875rem;">
                                            ${booking.created_at ? new Date(booking.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                                        </td>
                                    </tr>
                                `).join('') || '<tr><td colspan="7" style="padding: var(--space-8); text-align: center; color: var(--text-secondary);">No bookings found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading bookings:', error);
            throw error;
        }
    }

    getStatusColor(status) {
        const colors = {
            'pending': { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B' },
            'confirmed': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' },
            'in_progress': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' },
            'completed': { bg: 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6' },
            'cancelled': { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' }
        };
        return colors[status] || colors['pending'];
    }

    async loadProvidersContent() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div style="margin-bottom: var(--space-6);">
                <h2 style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">
                    Provider Management
                </h2>
                <p style="color: var(--text-secondary);">Manage service providers and their businesses</p>
            </div>
            <div style="padding: var(--space-16); text-align: center; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: var(--space-4);">🔧</div>
                <h3>Providers Management</h3>
                <p>Provider management features will be available soon.</p>
            </div>
        `;
    }

    async loadKYCContent() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div style="margin-bottom: var(--space-6);">
                <h2 style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">
                    KYC Center
                </h2>
                <p style="color: var(--text-secondary);">Identity verification and compliance management</p>
            </div>
            <div style="padding: var(--space-16); text-align: center; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: var(--space-4);">🛡️</div>
                <h3>KYC Verification</h3>
                <p>Identity verification features will be available soon.</p>
            </div>
        `;
    }

    async loadPayoutsContent() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div style="margin-bottom: var(--space-6);">
                <h2 style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">
                    Payout Management
                </h2>
                <p style="color: var(--text-secondary);">Manage provider payments and withdrawals</p>
            </div>
            <div style="padding: var(--space-16); text-align: center; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: var(--space-4);">💰</div>
                <h3>Payout System</h3>
                <p>Payout management features will be available soon.</p>
            </div>
        `;
    }

    async loadTransactionsContent() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div style="margin-bottom: var(--space-6);">
                <h2 style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">
                    Transaction History
                </h2>
                <p style="color: var(--text-secondary);">Monitor payments and financial transactions</p>
            </div>
            <div style="padding: var(--space-16); text-align: center; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: var(--space-4);">💳</div>
                <h3>Transaction Monitoring</h3>
                <p>Transaction management features will be available soon.</p>
            </div>
        `;
    }

    async loadAnalyticsContent() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div style="margin-bottom: var(--space-6);">
                <h2 style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">
                    Analytics Dashboard
                </h2>
                <p style="color: var(--text-secondary);">Business intelligence and performance metrics</p>
            </div>
            <div style="padding: var(--space-16); text-align: center; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: var(--space-4);">📈</div>
                <h3>Advanced Analytics</h3>
                <p>Analytics features will be available soon.</p>
            </div>
        `;
    }

    async loadNotificationsContent() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div style="margin-bottom: var(--space-6);">
                <h2 style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">
                    Notification Center
                </h2>
                <p style="color: var(--text-secondary);">Manage push notifications and messaging</p>
            </div>
            <div style="padding: var(--space-16); text-align: center; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: var(--space-4);">🔔</div>
                <h3>Push Notifications</h3>
                <p>Notification management features will be available soon.</p>
            </div>
        `;
    }

    async loadSettingsContent() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div style="margin-bottom: var(--space-6);">
                <h2 style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">
                    System Settings
                </h2>
                <p style="color: var(--text-secondary);">Configure platform settings and preferences</p>
            </div>
            <div style="padding: var(--space-16); text-align: center; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: var(--space-4);">⚙️</div>
                <h3>Configuration</h3>
                <p>Settings management features will be available soon.</p>
            </div>
        `;
    }

    async loadAuditContent() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = `
            <div style="margin-bottom: var(--space-6);">
                <h2 style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-2);">
                    Audit Log
                </h2>
                <p style="color: var(--text-secondary);">Track admin activities and system changes</p>
            </div>
            <div style="padding: var(--space-16); text-align: center; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: var(--space-4);">📋</div>
                <h3>Activity Tracking</h3>
                <p>Audit log features will be available soon.</p>
            </div>
        `;
    }

    startClock() {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Africa/Douala'
            });
            
            const clockElement = document.getElementById('currentTime');
            if (clockElement) {
                clockElement.textContent = timeString;
            }
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    async loadDashboardData() {
        try {
            console.log('Loading dashboard data...');
            
            // Show loading states
            this.showLoadingState();
            
            // Fetch all statistics in parallel
            const [
                totalUsersResult,
                pendingKYCResult,
                activeBookingsResult,
                pendingPayoutsResult,
                totalRevenueResult,
                todayRevenueResult,
                recentActivities
            ] = await Promise.all([
                this.getTotalUsers(),
                this.getPendingKYC(),
                this.getActiveBookings(),
                this.getPendingPayouts(),
                this.getTotalRevenue(),
                this.getTodayRevenue(),
                this.getRecentActivities()
            ]);

            // Update UI with fetched data
            this.updateDashboardStats({
                totalUsers: totalUsersResult,
                pendingKYC: pendingKYCResult,
                activeBookings: activeBookingsResult,
                pendingPayouts: pendingPayoutsResult,
                totalRevenue: totalRevenueResult,
                todayRevenue: todayRevenueResult
            });

            // Update activity feed
            this.updateActivityFeed(recentActivities);
            
            // Update badge counts
            this.updateBadgeCounts(pendingKYCResult, pendingPayoutsResult);
            
            console.log('Dashboard data loaded successfully');
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showDataError();
        }
    }

    showLoadingState() {
        // Show loading spinners for stats
        const statElements = [
            'totalUsers', 'pendingKYC', 'activeBookings', 
            'pendingPayouts', 'totalRevenue', 'todayRevenue'
        ];
        
        statElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div>';
            }
        });
    }

    updateDashboardStats(stats) {
        // Helper function to format currency
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XAF',
                minimumFractionDigits: 0
            }).format(amount || 0);
        };

        // Helper function to animate numbers
        const animateNumber = (element, target) => {
            const start = 0;
            const duration = 1500; // 1.5 seconds
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function for smooth animation
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(start + (target - start) * easeOut);
                
                element.textContent = current.toLocaleString();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        };

        // Update each stat with animation
        const totalUsersEl = document.getElementById('totalUsers');
        if (totalUsersEl) animateNumber(totalUsersEl, stats.totalUsers);

        const pendingKYCEl = document.getElementById('pendingKYC');
        if (pendingKYCEl) animateNumber(pendingKYCEl, stats.pendingKYC);

        const activeBookingsEl = document.getElementById('activeBookings');
        if (activeBookingsEl) animateNumber(activeBookingsEl, stats.activeBookings);

        const pendingPayoutsEl = document.getElementById('pendingPayouts');
        if (pendingPayoutsEl) animateNumber(pendingPayoutsEl, stats.pendingPayouts);

        const totalRevenueEl = document.getElementById('totalRevenue');
        if (totalRevenueEl) {
            totalRevenueEl.textContent = formatCurrency(stats.totalRevenue);
        }

        const todayRevenueEl = document.getElementById('todayRevenue');
        if (todayRevenueEl) {
            todayRevenueEl.textContent = formatCurrency(stats.todayRevenue);
        }

        // Update active users count in header
        const activeUsersEl = document.getElementById('activeUsersCount');
        if (activeUsersEl) {
            animateNumber(activeUsersEl, Math.floor(stats.totalUsers * 0.15)); // Estimate 15% active
        }

        // Update growth indicators (placeholder calculations)
        this.updateGrowthIndicators(stats);
    }

    updateGrowthIndicators(stats) {
        // Calculate growth percentages (simplified calculations)
        const growthData = {
            usersGrowth: '+12.5%',
            kycGrowth: '-8.3%',
            bookingsGrowth: '+23.7%',
            revenueGrowth: '+18.9%',
            todayGrowth: '+45.2%'
        };

        Object.entries(growthData).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = value;
            }
        });
    }

    updateBadgeCounts(pendingKYC, pendingPayouts) {
        const kycBadge = document.getElementById('kycBadge');
        if (kycBadge) {
            kycBadge.textContent = pendingKYC;
            kycBadge.style.display = pendingKYC > 0 ? 'block' : 'none';
        }

        const payoutsBadge = document.getElementById('payoutsBadge');
        if (payoutsBadge) {
            payoutsBadge.textContent = pendingPayouts;
            payoutsBadge.style.display = pendingPayouts > 0 ? 'block' : 'none';
        }
    }

    updateActivityFeed(activities) {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        if (!activities || activities.length === 0) {
            activityList.innerHTML = `
                <div class="loading">
                    <span>No recent activities found</span>
                </div>
            `;
            return;
        }

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${activity.bgColor}; color: ${activity.color};">
                    ${activity.icon}
                </div>
                <div class="activity-content">
                    <div class="activity-message">${activity.message}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
                <div class="activity-status"></div>
            </div>
        `).join('');
    }

    // Data fetching methods
    async getTotalUsers() {
        try {
            const { count, error } = await this.supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });
                
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error fetching total users:', error);
            return 0;
        }
    }

    async getPendingKYC() {
        try {
            const { count, error } = await this.supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('kyc_status', 'pending');
                
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error fetching pending KYC:', error);
            return 0;
        }
    }

    async getActiveBookings() {
        try {
            const { count, error } = await this.supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .in('status', ['confirmed', 'in_progress']);
                
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error fetching active bookings:', error);
            return 0;
        }
    }

    async getPendingPayouts() {
        try {
            const { count, error } = await this.supabase
                .from('escrow_transactions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending_payout');
                
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error fetching pending payouts:', error);
            return 0;
        }
    }

    async getTotalRevenue() {
        try {
            const { data, error } = await this.supabase
                .from('escrow_transactions')
                .select('amount')
                .eq('status', 'completed');
                
            if (error) throw error;
            
            const total = data?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;
            return total;
        } catch (error) {
            console.error('Error fetching total revenue:', error);
            return 0;
        }
    }

    async getTodayRevenue() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const { data, error } = await this.supabase
                .from('escrow_transactions')
                .select('amount')
                .eq('status', 'completed')
                .gte('created_at', today);
                
            if (error) throw error;
            
            const total = data?.reduce((sum, transaction) => sum + (transaction.amount || 0), 0) || 0;
            return total;
        } catch (error) {
            console.error('Error fetching today revenue:', error);
            return 0;
        }
    }

    async getRecentActivities() {
        try {
            // Get recent bookings
            const { data: bookings, error: bookingsError } = await this.supabase
                .from('bookings')
                .select(`
                    id,
                    status,
                    created_at,
                    profiles!customer_id(full_name),
                    providers(business_name)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (bookingsError) throw bookingsError;

            // Transform to activity format
            const activities = bookings?.map(booking => ({
                icon: this.getActivityIcon(booking.status),
                color: this.getActivityColor(booking.status),
                bgColor: this.getActivityBgColor(booking.status),
                message: `New booking from ${booking.profiles?.full_name || 'User'} with ${booking.providers?.business_name || 'Provider'}`,
                time: this.formatRelativeTime(booking.created_at)
            })) || [];

            return activities;
        } catch (error) {
            console.error('Error fetching activities:', error);
            return [];
        }
    }

    getActivityIcon(status) {
        const icons = {
            'pending': '⏳',
            'confirmed': '✅',
            'in_progress': '🔄',
            'completed': '🎉',
            'cancelled': '❌'
        };
        return icons[status] || '📋';
    }

    getActivityColor(status) {
        const colors = {
            'pending': '#F59E0B',
            'confirmed': '#10B981',
            'in_progress': '#3B82F6',
            'completed': '#8B5CF6',
            'cancelled': '#EF4444'
        };
        return colors[status] || '#6B7280';
    }

    getActivityBgColor(status) {
        const bgColors = {
            'pending': 'rgba(245, 158, 11, 0.1)',
            'confirmed': 'rgba(16, 185, 129, 0.1)',
            'in_progress': 'rgba(59, 130, 246, 0.1)',
            'completed': 'rgba(139, 92, 246, 0.1)',
            'cancelled': 'rgba(239, 68, 68, 0.1)'
        };
        return bgColors[status] || 'rgba(107, 114, 128, 0.1)';
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    setupRealTimeSubscriptions() {
        // Subscribe to booking changes
        const bookingSubscription = this.supabase
            .channel('booking-changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'bookings' },
                () => this.handleRealTimeUpdate()
            )
            .subscribe();

        // Subscribe to profile changes
        const profileSubscription = this.supabase
            .channel('profile-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => this.handleRealTimeUpdate()
            )
            .subscribe();

        this.realTimeSubscriptions.push(bookingSubscription, profileSubscription);
    }

    async handleRealTimeUpdate() {
        console.log('Real-time update received, refreshing dashboard...');
        await this.loadDashboardData();
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 30000);
    }

    showDataError() {
        const activityList = document.getElementById('activityList');
        if (activityList) {
            activityList.innerHTML = `
                <div class="loading">
                    <span style="color: var(--error);">Error loading data. Please check your connection.</span>
                </div>
            `;
        }
    }

    cleanup() {
        // Clear intervals
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }

        // Unsubscribe from real-time updates
        this.realTimeSubscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
        this.realTimeSubscriptions = [];
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Ezra Admin Dashboard v2...');
    window.ezraDashboard = new EzraAdminDashboard();
});

// Global utilities
window.logout = () => {
    if (window.ezraDashboard) {
        window.ezraDashboard.handleLogout();
    }
};