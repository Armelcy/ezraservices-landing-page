// Admin Dashboard JavaScript
// Cameroon Service Marketplace - Ezra Admin Panel

// Authentication & Session Management
class AdminAuth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check for existing session
        const sessionData = localStorage.getItem('ezra_admin_session');
        if (sessionData) {
            try {
                this.currentUser = JSON.parse(sessionData);
                this.showDashboard();
            } catch (e) {
                this.logout();
            }
        }
    }

    login(email, password) {
        // Demo credentials for testing
        const validCredentials = {
            'admin@ezraservice.com': 'admin123'
        };

        if (validCredentials[email] === password) {
            this.currentUser = {
                email: email,
                name: 'Admin User',
                role: 'admin',
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('ezra_admin_session', JSON.stringify(this.currentUser));
            this.showDashboard();
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('ezra_admin_session');
        this.showLogin();
    }

    showLogin() {
        document.getElementById('auth').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('auth').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
        // Initialize dashboard
        dashboardManager.init();
    }
}

// Dashboard Navigation & Page Management
class DashboardManager {
    constructor() {
        this.currentPage = 'overview';
        this.charts = {};
        this.mockDataGenerator = new MockDataGenerator();
    }

    init() {
        this.showPage('overview');
        this.initializeCharts();
        this.populateTablesWithMockData();
        this.startRealTimeUpdates();
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Remove active class from nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show selected page
        const targetPage = document.getElementById(`page-${pageId}`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
        }

        // Add active class to current nav item
        const activeNavItem = document.querySelector(`[onclick="showPage('${pageId}')"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        this.currentPage = pageId;

        // Initialize page-specific content
        this.initializePage(pageId);
    }

    initializePage(pageId) {
        switch (pageId) {
            case 'overview':
                this.updateStats();
                this.renderOverviewCharts();
                break;
            case 'users':
                this.populateUsersTable();
                break;
            case 'providers':
                this.populateProvidersTable();
                break;
            case 'transactions':
                this.populateTransactionsTable();
                break;
            case 'analytics':
                this.renderAnalyticsCharts();
                break;
        }
    }

    updateStats() {
        // Simulate real-time stats updates
        const stats = this.mockDataGenerator.generateRealtimeStats();
        
        document.getElementById('total-users').textContent = stats.totalUsers.toLocaleString();
        document.getElementById('active-providers').textContent = stats.activeProviders.toLocaleString();
        document.getElementById('revenue').textContent = `${(stats.revenue / 1000000).toFixed(1)}M`;
        document.getElementById('mtn-transactions').textContent = stats.mtnTransactions.toLocaleString();
    }

    initializeCharts() {
        // Initialize Chart.js charts
        this.renderOverviewCharts();
        this.renderAnalyticsCharts();
    }

    renderOverviewCharts() {
        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart');
        if (revenueCtx && !this.charts.revenue) {
            this.charts.revenue = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: this.mockDataGenerator.getLast30Days(),
                    datasets: [{
                        label: 'Revenus (FCFA)',
                        data: this.mockDataGenerator.generateRevenueData(),
                        borderColor: '#1B365D',
                        backgroundColor: 'rgba(27, 54, 93, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString() + ' FCFA';
                                }
                            }
                        }
                    }
                }
            });
        }

        // Regional Distribution Chart
        const regionCtx = document.getElementById('regionChart');
        if (regionCtx && !this.charts.region) {
            this.charts.region = new Chart(regionCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua'],
                    datasets: [{
                        data: [35, 28, 15, 12, 10],
                        backgroundColor: [
                            '#1B365D',
                            '#FF6B35',
                            '#6B46C1',
                            '#10B981',
                            '#F59E0B'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    renderAnalyticsCharts() {
        // User Growth Chart
        const userGrowthCtx = document.getElementById('userGrowthChart');
        if (userGrowthCtx && !this.charts.userGrowth) {
            this.charts.userGrowth = new Chart(userGrowthCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                    datasets: [{
                        label: 'Nouveaux utilisateurs',
                        data: [1200, 1950, 1400, 2100, 1800, 2400],
                        backgroundColor: '#1B365D'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // Services Chart
        const servicesCtx = document.getElementById('servicesChart');
        if (servicesCtx && !this.charts.services) {
            this.charts.services = new Chart(servicesCtx, {
                type: 'horizontalBar',
                data: {
                    labels: ['Plomberie', 'Électricité', 'Ménage', 'Jardinage', 'Réparation'],
                    datasets: [{
                        label: 'Demandes',
                        data: [450, 380, 320, 280, 250],
                        backgroundColor: '#FF6B35'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }

        // Payment Methods Chart
        const paymentCtx = document.getElementById('paymentMethodsChart');
        if (paymentCtx && !this.charts.payments) {
            this.charts.payments = new Chart(paymentCtx, {
                type: 'pie',
                data: {
                    labels: ['MTN Mobile Money', 'Orange Money', 'Autres'],
                    datasets: [{
                        data: [65, 30, 5],
                        backgroundColor: ['#FF6B35', '#ff9800', '#6B46C1']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }

    populateTablesWithMockData() {
        this.populateUsersTable();
        this.populateProvidersTable();
        this.populateTransactionsTable();
    }

    populateUsersTable() {
        const users = this.mockDataGenerator.generateUsers(20);
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="status-badge ${user.type === 'client' ? 'status-approved' : 'status-pending'}">${user.type}</span></td>
                <td>${user.city}</td>
                <td>${user.registrationDate}</td>
                <td><span class="status-badge ${user.status === 'active' ? 'status-approved' : 'status-pending'}">${user.status}</span></td>
                <td>
                    <button class="action-btn btn-primary" onclick="viewUser('${user.id}')">Voir</button>
                    <button class="action-btn btn-danger" onclick="suspendUser('${user.id}')">Suspendre</button>
                </td>
            </tr>
        `).join('');
    }

    populateProvidersTable() {
        const providers = this.mockDataGenerator.generateProviders(15);
        const tbody = document.getElementById('providers-table-body');
        if (!tbody) return;

        tbody.innerHTML = providers.map(provider => `
            <tr>
                <td>${provider.name}</td>
                <td>${provider.service}</td>
                <td>${provider.city}</td>
                <td>⭐ ${provider.rating.toFixed(1)}</td>
                <td><span class="status-badge status-${provider.status}">${provider.status}</span></td>
                <td>
                    ${provider.status === 'pending' ? 
                        `<button class="action-btn btn-success" onclick="approveProvider('${provider.id}')">Approuver</button>
                         <button class="action-btn btn-danger" onclick="rejectProvider('${provider.id}')">Rejeter</button>` :
                        `<button class="action-btn btn-primary" onclick="viewProvider('${provider.id}')">Voir</button>`
                    }
                </td>
            </tr>
        `).join('');
    }

    populateTransactionsTable() {
        const transactions = this.mockDataGenerator.generateTransactions(25);
        const tbody = document.getElementById('transactions-table-body');
        if (!tbody) return;

        tbody.innerHTML = transactions.map(tx => `
            <tr>
                <td>${tx.id}</td>
                <td>
                    <span style="display: inline-flex; align-items: center; gap: 5px;">
                        ${tx.method === 'MTN' ? '📱' : '🍊'} ${tx.method} Mobile Money
                    </span>
                </td>
                <td>${tx.amount.toLocaleString()} FCFA</td>
                <td>${tx.client}</td>
                <td>${tx.provider}</td>
                <td>${tx.date}</td>
                <td><span class="status-badge status-${tx.status}">${tx.status}</span></td>
            </tr>
        `).join('');
    }

    startRealTimeUpdates() {
        // Update stats every 30 seconds
        setInterval(() => {
            this.updateStats();
        }, 30000);

        // Update charts every 5 minutes
        setInterval(() => {
            if (this.currentPage === 'overview') {
                this.updateChartData();
            }
        }, 300000);
    }

    updateChartData() {
        if (this.charts.revenue) {
            this.charts.revenue.data.datasets[0].data = this.mockDataGenerator.generateRevenueData();
            this.charts.revenue.update();
        }
    }
}

// Mock Data Generator for Cameroon Marketplace
class MockDataGenerator {
    constructor() {
        this.cameroonCities = ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 'Maroua', 'Ngaoundéré'];
        this.services = ['Plomberie', 'Électricité', 'Ménage', 'Jardinage', 'Réparation', 'Peinture', 'Coiffure'];
        this.firstNames = ['Jean', 'Marie', 'Paul', 'Alice', 'Pierre', 'Sophie', 'Michel', 'Anne', 'François', 'Hélène'];
        this.lastNames = ['Ngono', 'Biya', 'Fouda', 'Mbom', 'Nkomo', 'Manga', 'Kamdem', 'Tchoua', 'Ebanga', 'Mbassi'];
    }

    generateRealtimeStats() {
        const baseTime = new Date().getTime();
        return {
            totalUsers: 24567 + Math.floor(Math.random() * 100),
            activeProviders: 1245 + Math.floor(Math.random() * 20),
            revenue: 15200000 + Math.floor(Math.random() * 500000),
            mtnTransactions: 3456 + Math.floor(Math.random() * 50)
        };
    }

    generateUsers(count) {
        return Array.from({ length: count }, (_, i) => ({
            id: `user_${i + 1}`,
            name: `${this.getRandomElement(this.firstNames)} ${this.getRandomElement(this.lastNames)}`,
            email: `user${i + 1}@example.com`,
            type: Math.random() > 0.7 ? 'prestataire' : 'client',
            city: this.getRandomElement(this.cameroonCities),
            registrationDate: this.getRandomDate(30),
            status: Math.random() > 0.1 ? 'active' : 'inactive'
        }));
    }

    generateProviders(count) {
        return Array.from({ length: count }, (_, i) => ({
            id: `provider_${i + 1}`,
            name: `${this.getRandomElement(this.firstNames)} ${this.getRandomElement(this.lastNames)}`,
            service: this.getRandomElement(this.services),
            city: this.getRandomElement(this.cameroonCities),
            rating: 3.5 + Math.random() * 1.5,
            status: Math.random() > 0.3 ? 'approved' : 'pending'
        }));
    }

    generateTransactions(count) {
        return Array.from({ length: count }, (_, i) => ({
            id: `TXN${String(i + 1).padStart(6, '0')}`,
            method: Math.random() > 0.3 ? 'MTN' : 'Orange',
            amount: Math.floor(Math.random() * 50000) + 5000,
            client: `${this.getRandomElement(this.firstNames)} ${this.getRandomElement(this.lastNames)}`,
            provider: `${this.getRandomElement(this.firstNames)} ${this.getRandomElement(this.lastNames)}`,
            date: this.getRandomDate(7),
            status: Math.random() > 0.1 ? 'completed' : 'pending'
        }));
    }

    generateRevenueData() {
        return Array.from({ length: 30 }, () => 
            Math.floor(Math.random() * 800000) + 200000
        );
    }

    getLast30Days() {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
        }
        return days;
    }

    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    getRandomDate(daysAgo) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
        return date.toLocaleDateString('fr-FR');
    }
}

// Global instances
const adminAuth = new AdminAuth();
const dashboardManager = new DashboardManager();

// Global functions for UI interactions
function showPage(pageId) {
    dashboardManager.showPage(pageId);
}

function logout() {
    adminAuth.logout();
}

// User management functions
function viewUser(userId) {
    alert(`Affichage des détails de l'utilisateur: ${userId}`);
}

function suspendUser(userId) {
    if (confirm('Êtes-vous sûr de vouloir suspendre cet utilisateur?')) {
        alert(`Utilisateur ${userId} suspendu`);
        dashboardManager.populateUsersTable();
    }
}

// Provider management functions
function approveProvider(providerId) {
    if (confirm('Approuver ce prestataire?')) {
        alert(`Prestataire ${providerId} approuvé`);
        dashboardManager.populateProvidersTable();
    }
}

function rejectProvider(providerId) {
    if (confirm('Rejeter ce prestataire?')) {
        const reason = prompt('Raison du rejet:');
        if (reason) {
            alert(`Prestataire ${providerId} rejeté. Raison: ${reason}`);
            dashboardManager.populateProvidersTable();
        }
    }
}

function viewProvider(providerId) {
    alert(`Affichage des détails du prestataire: ${providerId}`);
}

// Authentication form handling
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorDiv = document.getElementById('error');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (adminAuth.login(email, password)) {
                errorDiv.classList.add('hidden');
            } else {
                errorDiv.textContent = 'Email ou mot de passe incorrect';
                errorDiv.classList.remove('hidden');
            }
        });
    }

    // Initialize demo data if dashboard is visible
    if (document.getElementById('dashboard').style.display !== 'none') {
        dashboardManager.init();
    }
});

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to stat cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add click animation to action buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('action-btn')) {
            e.target.style.transform = 'scale(0.95)';
            setTimeout(() => {
                e.target.style.transform = 'scale(1)';
            }, 150);
        }
    });
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminAuth, DashboardManager, MockDataGenerator };
}