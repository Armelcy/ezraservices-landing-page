// Ezra Admin - Promotional Codes JavaScript - Enhanced with Authentication

// Global state
let currentCodes = [];
let filteredCodes = [];
let isLoading = false;
let supabase = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // Check authentication first
    const isAuth = await requireAdminAuth();
    if (!isAuth) return;
    
    // Get authenticated Supabase client
    supabase = window.webAdminAuth.getSupabaseClient();
    
    // Display user info
    displayAdminUserInfo('admin-user-info');
    
    // Load data
    await loadPromotionalCodes();
    setupEventListeners();
    updateAnalytics();
}

function setupEventListeners() {
    // Search functionality
    document.getElementById('search-input').addEventListener('input', handleSearch);
    
    // Filter functionality
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    document.getElementById('type-filter').addEventListener('change', applyFilters);
    document.getElementById('user-type-filter').addEventListener('change', applyFilters);
    
    // Form submission
    document.getElementById('promo-form').addEventListener('submit', handleFormSubmit);
    
    // Discount type change
    document.getElementById('discount-type').addEventListener('change', updateDiscountInput);
    
    // Close modals on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideAllModals();
            }
        });
    });
}

// API Functions using Supabase client
async function loadPromotionalCodes() {
    try {
        setLoading(true);
        console.log('📝 Loading promotional codes...');
        
        const { data: codes, error } = await supabase
            .from('promotional_codes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error loading codes:', error);
            showNotification('Error loading promotional codes: ' + error.message, 'error');
            return;
        }

        currentCodes = codes || [];
        filteredCodes = [...currentCodes];
        
        console.log('✅ Loaded', currentCodes.length, 'promotional codes');
        displayCodes();
        updateAnalytics();
        
    } catch (error) {
        console.error('❌ Failed to load codes:', error);
        showNotification('Failed to load promotional codes', 'error');
    } finally {
        setLoading(false);
    }
}

async function createPromotionalCode(codeData) {
    try {
        console.log('💾 Creating promotional code:', codeData.code);
        
        const { data, error } = await supabase
            .from('promotional_codes')
            .insert([codeData])
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating code:', error);
            throw new Error(error.message);
        }

        console.log('✅ Code created successfully:', data.code);
        return data;
        
    } catch (error) {
        console.error('❌ Failed to create code:', error);
        throw error;
    }
}

async function deletePromotionalCode(codeId) {
    try {
        console.log('🗑️ Deleting promotional code:', codeId);
        
        const { error } = await supabase
            .from('promotional_codes')
            .update({ active: false })
            .eq('id', codeId);

        if (error) {
            console.error('❌ Error deleting code:', error);
            throw new Error(error.message);
        }

        console.log('✅ Code deactivated successfully');
        
    } catch (error) {
        console.error('❌ Failed to delete code:', error);
        throw error;
    }
}

async function getCodeUsageStats(codeId) {
    try {
        const { data: usage, error } = await supabase
            .from('promotional_code_usage')
            .select('*')
            .eq('promo_code_id', codeId);

        if (error) {
            console.error('❌ Error loading usage stats:', error);
            return [];
        }

        return usage || [];
        
    } catch (error) {
        console.error('❌ Failed to load usage stats:', error);
        return [];
    }
}

// Utility Functions
function setLoading(isLoading) {
    const existingOverlay = document.querySelector('.loading-overlay');
    
    if (isLoading) {
        if (!existingOverlay) {
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(overlay);
        }
    } else {
        if (existingOverlay) {
            existingOverlay.remove();
        }
    }
}

function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-header">
            <span class="notification-title">${type === 'error' ? 'Error' : 'Success'}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="notification-message">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function displayCodes() {
    const tableBody = document.querySelector('.codes-table tbody');
    if (!tableBody) return;
    
    if (filteredCodes.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-ticket-alt"></i>
                        <h3>No promotional codes found</h3>
                        <p>Create your first promotional code to get started</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = filteredCodes.map(code => `
        <tr>
            <td>
                <div class="font-semibold">${code.campaign_name}</div>
                <div class="text-sm text-secondary">${code.code}</div>
            </td>
            <td>
                <span class="type-badge type-${code.discount_type}">
                    ${code.discount_type === 'percentage' ? code.discount_value + '%' : 
                      code.discount_value + ' FCFA'}
                </span>
            </td>
            <td>${code.target_user_type}</td>
            <td>${formatDate(code.valid_until)}</td>
            <td>${code.usage_count || 0} / ${code.usage_limit || '∞'}</td>
            <td>
                <span class="status-badge status-${getCodeStatus(code)}">
                    ${getCodeStatus(code)}
                </span>
            </td>
            <td class="text-right">
                <button class="action-btn" onclick="viewCodeDetails('${code.id}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="duplicateCode('${code.id}')" title="Duplicate">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="action-btn danger" onclick="deleteCode('${code.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getCodeStatus(code) {
    const now = new Date();
    const validUntil = new Date(code.valid_until);
    
    if (!code.active) return 'inactive';
    if (validUntil < now) return 'expired';
    if (code.usage_limit && code.usage_count >= code.usage_limit) return 'limit-reached';
    return 'active';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR');
}

function updateAnalytics() {
    const activeCodes = currentCodes.filter(code => getCodeStatus(code) === 'active').length;
    const totalUsage = currentCodes.reduce((sum, code) => sum + (code.usage_count || 0), 0);
    const totalSavings = currentCodes.reduce((sum, code) => {
        const usage = code.usage_count || 0;
        const value = code.discount_type === 'percentage' ? 
            (usage * 10000 * code.discount_value / 100) : // Estimate
            (usage * code.discount_value);
        return sum + value;
    }, 0);
    
    document.getElementById('total-codes').textContent = activeCodes;
    document.getElementById('total-usage').textContent = totalUsage;
    document.getElementById('total-savings').textContent = Math.round(totalSavings).toLocaleString() + ' FCFA';
}

async function refreshCodes() {
    await loadPromotionalCodes();
    showNotification('Promotional codes refreshed successfully');
}

// Legacy API function (keeping for compatibility)
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    };
    
    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        showNotification('Erreur de connexion à la base de données', 'error');
        throw error;
    }
}

async function loadPromotionalCodes() {
    showLoading(true);
    
    try {
        const codes = await apiRequest('/promotional_codes?select=*&active=eq.true&order=created_at.desc');
        currentCodes = codes.map(code => ({
            ...code,
            status: getCodeStatus(code),
            formattedValue: formatDiscountValue(code),
            expiryDate: new Date(code.valid_until).toLocaleDateString('fr-FR')
        }));
        
        filteredCodes = [...currentCodes];
        renderCodesTable();
        updateAnalytics();
        
    } catch (error) {
        console.error('Error loading codes:', error);
        showEmptyState();
    } finally {
        showLoading(false);
    }
}

async function createPromotionalCode(codeData) {
    try {
        const response = await apiRequest('/promotional_codes', {
            method: 'POST',
            body: JSON.stringify(codeData)
        });
        
        showNotification('Code promotionnel créé avec succès!', 'success');
        await loadPromotionalCodes();
        return response[0];
        
    } catch (error) {
        console.error('Error creating code:', error);
        showNotification('Erreur lors de la création du code', 'error');
        throw error;
    }
}

async function deletePromotionalCode(codeId) {
    try {
        await apiRequest(`/promotional_codes?id=eq.${codeId}`, {
            method: 'PATCH',
            body: JSON.stringify({ active: false })
        });
        
        showNotification('Code promotionnel désactivé', 'success');
        await loadPromotionalCodes();
        
    } catch (error) {
        console.error('Error deleting code:', error);
        showNotification('Erreur lors de la suppression', 'error');
    }
}

async function getCodeAnalytics(codeId) {
    try {
        const usage = await apiRequest(`/promotional_code_usage?promo_code_id=eq.${codeId}&select=*`);
        return {
            totalUsage: usage.length,
            totalDiscount: usage.reduce((sum, u) => sum + u.discount_applied, 0),
            recentUsage: usage.slice(0, 10).map(u => ({
                ...u,
                used_at: new Date(u.used_at).toLocaleDateString('fr-FR')
            }))
        };
    } catch (error) {
        console.error('Error getting analytics:', error);
        return { totalUsage: 0, totalDiscount: 0, recentUsage: [] };
    }
}

// UI Functions
function renderCodesTable() {
    const tbody = document.getElementById('codes-table-body');
    
    if (filteredCodes.length === 0) {
        showEmptyState();
        return;
    }
    
    tbody.innerHTML = filteredCodes.map(code => `
        <tr class="fade-in">
            <td>
                <div class="code-cell">
                    <strong>${code.code}</strong>
                    <div class="code-description">${code.description}</div>
                </div>
            </td>
            <td>${code.campaign_name}</td>
            <td>
                <span class="type-badge type-${code.discount_type}">
                    ${getDiscountTypeLabel(code.discount_type)}
                </span>
            </td>
            <td><strong>${code.formattedValue}</strong></td>
            <td>
                <div class="usage-cell">
                    <span>${code.current_uses}/${code.max_uses || '∞'}</span>
                    <div class="usage-bar">
                        <div class="usage-fill" style="width: ${getUsagePercentage(code)}%"></div>
                    </div>
                </div>
            </td>
            <td>${code.expiryDate}</td>
            <td>
                <span class="status-badge status-${code.status}">
                    ${getStatusLabel(code.status)}
                </span>
            </td>
            <td>
                <button class="action-btn" onclick="showCodeDetails('${code.id}')" title="Voir détails">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" onclick="duplicateCode('${code.id}')" title="Dupliquer">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="action-btn danger" onclick="confirmDeleteCode('${code.id}')" title="Supprimer">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    hideEmptyState();
}

function updateAnalytics() {
    const totalCodes = currentCodes.length;
    const totalUsage = currentCodes.reduce((sum, code) => sum + code.current_uses, 0);
    const totalSavings = currentCodes.reduce((sum, code) => {
        return sum + (code.current_uses * code.discount_value);
    }, 0);
    const conversionRate = totalCodes > 0 ? ((totalUsage / totalCodes) * 100).toFixed(1) : 0;
    
    document.getElementById('total-codes').textContent = totalCodes;
    document.getElementById('total-usage').textContent = totalUsage;
    document.getElementById('total-savings').textContent = `${totalSavings.toLocaleString()} FCFA`;
    document.getElementById('conversion-rate').textContent = `${conversionRate}%`;
}

function handleSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    applyFilters(searchTerm);
}

function applyFilters(searchTerm = null) {
    const search = searchTerm || document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    const userTypeFilter = document.getElementById('user-type-filter').value;
    
    filteredCodes = currentCodes.filter(code => {
        const matchesSearch = !search || 
            code.code.toLowerCase().includes(search) ||
            code.campaign_name.toLowerCase().includes(search) ||
            code.description.toLowerCase().includes(search);
            
        const matchesStatus = !statusFilter || code.status === statusFilter;
        const matchesType = !typeFilter || code.discount_type === typeFilter;
        const matchesUserType = !userTypeFilter || code.user_type === userTypeFilter;
        
        return matchesSearch && matchesStatus && matchesType && matchesUserType;
    });
    
    renderCodesTable();
}

// Modal Functions
function showCreateModal() {
    document.getElementById('modal-title').textContent = '🎯 Nouvelle Campagne';
    document.getElementById('promo-form').reset();
    document.getElementById('valid-days').value = '30';
    updateDiscountInput();
    document.getElementById('create-modal').style.display = 'flex';
}

function hideCreateModal() {
    document.getElementById('create-modal').style.display = 'none';
}

function showQuickCampaigns() {
    document.getElementById('quick-campaigns-modal').style.display = 'flex';
}

function hideQuickCampaigns() {
    document.getElementById('quick-campaigns-modal').style.display = 'none';
}

function showDetailsModal() {
    document.getElementById('details-modal').style.display = 'flex';
}

function hideDetailsModal() {
    document.getElementById('details-modal').style.display = 'none';
}

function showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-action').onclick = () => {
        onConfirm();
        hideConfirmModal();
    };
    document.getElementById('confirm-modal').style.display = 'flex';
}

function hideConfirmModal() {
    document.getElementById('confirm-modal').style.display = 'none';
}

function hideAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Form Functions
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
    const formData = new FormData(e.target);
    const codeData = {
        campaign_name: document.getElementById('campaign-name').value,
        description: document.getElementById('description').value,
        discount_type: document.getElementById('discount-type').value,
        discount_value: parseInt(document.getElementById('discount-value').value),
        max_uses: document.getElementById('max-uses').value ? parseInt(document.getElementById('max-uses').value) : null,
        valid_days: parseInt(document.getElementById('valid-days').value),
        user_type: document.getElementById('user-type').value,
        custom_code: document.getElementById('custom-code').value || null
    };
    
    // Validation
    if (!validateForm(codeData)) {
        return;
    }
    
    try {
        setLoading(true);
        await createPromotionalCode(codeData);
        hideCreateModal();
        
    } catch (error) {
        console.error('Form submission error:', error);
    } finally {
        setLoading(false);
    }
}

function validateForm(data) {
    if (!data.campaign_name.trim()) {
        showNotification('Le nom de la campagne est requis', 'error');
        return false;
    }
    
    if (!data.description.trim()) {
        showNotification('La description est requise', 'error');
        return false;
    }
    
    if (!data.discount_value || data.discount_value <= 0) {
        showNotification('La valeur de réduction doit être supérieure à 0', 'error');
        return false;
    }
    
    if (data.discount_type === 'percentage' && data.discount_value > 100) {
        showNotification('Le pourcentage ne peut pas dépasser 100%', 'error');
        return false;
    }
    
    return true;
}

function updateDiscountInput() {
    const discountType = document.getElementById('discount-type').value;
    const suffix = document.getElementById('discount-suffix');
    
    switch (discountType) {
        case 'percentage':
            suffix.textContent = '%';
            break;
        case 'fixed_amount':
        case 'referral_bonus':
            suffix.textContent = 'FCFA';
            break;
    }
}

// Template Functions
function useTemplate(templateType) {
    const templates = {
        welcome: {
            campaignName: 'Welcome New Users',
            description: 'Code de bienvenue pour les nouveaux utilisateurs - 20% de réduction',
            discountType: 'percentage',
            discountValue: '20',
            maxUses: '1000',
            validDays: '30',
            userType: 'both',
            customCode: 'WELCOME20'
        },
        easter: {
            campaignName: 'Easter Special 2025',
            description: 'Promotion spéciale Pâques 2025 - 15% de réduction',
            discountType: 'percentage',
            discountValue: '15',
            maxUses: '500',
            validDays: '7',
            userType: 'both',
            customCode: 'EASTER25'
        },
        provider: {
            campaignName: 'Provider Boost Campaign',
            description: 'Bonus de 10,000 FCFA pour nouveaux prestataires',
            discountType: 'fixed_amount',
            discountValue: '10000',
            maxUses: '200',
            validDays: '60',
            userType: 'provider',
            customCode: 'PROVIDER10K'
        },
        weekend: {
            campaignName: 'Weekend Special',
            description: 'Réduction de 5,000 FCFA pour réservations weekend',
            discountType: 'fixed_amount',
            discountValue: '5000',
            maxUses: '',
            validDays: '7',
            userType: 'customer',
            customCode: 'WEEKEND5K'
        }
    };
    
    const template = templates[templateType];
    if (!template) return;
    
    // Fill form with template data
    document.getElementById('campaign-name').value = template.campaignName;
    document.getElementById('description').value = template.description;
    document.getElementById('discount-type').value = template.discountType;
    document.getElementById('discount-value').value = template.discountValue;
    document.getElementById('max-uses').value = template.maxUses;
    document.getElementById('valid-days').value = template.validDays;
    document.getElementById('user-type').value = template.userType;
    document.getElementById('custom-code').value = template.customCode;
    
    updateDiscountInput();
    hideQuickCampaigns();
    showCreateModal();
}

// Action Functions
async function showCodeDetails(codeId) {
    const code = currentCodes.find(c => c.id === codeId);
    if (!code) return;
    
    try {
        const analytics = await getCodeAnalytics(codeId);
        
        const detailsContent = `
            <div class="code-details">
                <div class="detail-header">
                    <h3>${code.campaign_name}</h3>
                    <span class="status-badge status-${code.status}">${getStatusLabel(code.status)}</span>
                </div>
                
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Code:</label>
                        <span class="code-value">${code.code}</span>
                    </div>
                    <div class="detail-item">
                        <label>Description:</label>
                        <span>${code.description}</span>
                    </div>
                    <div class="detail-item">
                        <label>Type de réduction:</label>
                        <span>${getDiscountTypeLabel(code.discount_type)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Valeur:</label>
                        <span>${code.formattedValue}</span>
                    </div>
                    <div class="detail-item">
                        <label>Utilisations:</label>
                        <span>${code.current_uses}/${code.max_uses || '∞'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Expire le:</label>
                        <span>${code.expiryDate}</span>
                    </div>
                    <div class="detail-item">
                        <label>Type d'utilisateur:</label>
                        <span>${getUserTypeLabel(code.user_type)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Total économisé:</label>
                        <span>${analytics.totalDiscount.toLocaleString()} FCFA</span>
                    </div>
                </div>
                
                ${analytics.recentUsage.length > 0 ? `
                    <div class="recent-usage">
                        <h4>Utilisations récentes</h4>
                        <div class="usage-list">
                            ${analytics.recentUsage.map(usage => `
                                <div class="usage-item">
                                    <span>Utilisé le ${usage.used_at}</span>
                                    <span>${usage.discount_applied.toLocaleString()} FCFA</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('details-title').textContent = `Détails - ${code.code}`;
        document.getElementById('code-details-content').innerHTML = detailsContent;
        showDetailsModal();
        
    } catch (error) {
        console.error('Error showing code details:', error);
        showNotification('Erreur lors du chargement des détails', 'error');
    }
}

function duplicateCode(codeId) {
    const code = currentCodes.find(c => c.id === codeId);
    if (!code) return;
    
    // Fill form with existing code data
    document.getElementById('campaign-name').value = `${code.campaign_name} (Copie)`;
    document.getElementById('description').value = code.description;
    document.getElementById('discount-type').value = code.discount_type;
    document.getElementById('discount-value').value = code.discount_value;
    document.getElementById('max-uses').value = code.max_uses || '';
    document.getElementById('valid-days').value = '30';
    document.getElementById('user-type').value = code.user_type;
    document.getElementById('custom-code').value = '';
    
    updateDiscountInput();
    showCreateModal();
}

function confirmDeleteCode(codeId) {
    const code = currentCodes.find(c => c.id === codeId);
    if (!code) return;
    
    showConfirmModal(
        'Supprimer le code promotionnel',
        `Êtes-vous sûr de vouloir supprimer le code "${code.code}"? Cette action est irréversible.`,
        () => deletePromotionalCode(codeId)
    );
}

async function refreshCodes() {
    await loadPromotionalCodes();
    showNotification('Codes actualisés', 'success');
}

function exportCodes() {
    const csvContent = [
        ['Code', 'Campagne', 'Type', 'Valeur', 'Utilisations', 'Max', 'Expire le', 'Statut'].join(','),
        ...filteredCodes.map(code => [
            code.code,
            `"${code.campaign_name}"`,
            code.discount_type,
            code.discount_value,
            code.current_uses,
            code.max_uses || 'Illimité',
            code.expiryDate,
            getStatusLabel(code.status)
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codes-promotionnels-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Utility Functions
function getCodeStatus(code) {
    const now = new Date();
    const expiry = new Date(code.valid_until);
    
    if (expiry < now) return 'expired';
    if (code.max_uses && code.current_uses >= code.max_uses) return 'limit-reached';
    return 'active';
}

function formatDiscountValue(code) {
    switch (code.discount_type) {
        case 'percentage':
            return `${code.discount_value}%`;
        case 'fixed_amount':
        case 'referral_bonus':
            return `${code.discount_value.toLocaleString()} FCFA`;
        default:
            return code.discount_value.toString();
    }
}

function getDiscountTypeLabel(type) {
    const labels = {
        percentage: 'Pourcentage',
        fixed_amount: 'Montant fixe',
        referral_bonus: 'Bonus parrainage'
    };
    return labels[type] || type;
}

function getStatusLabel(status) {
    const labels = {
        active: 'Actif',
        expired: 'Expiré',
        'limit-reached': 'Limite atteinte'
    };
    return labels[status] || status;
}

function getUserTypeLabel(userType) {
    const labels = {
        customer: 'Clients',
        provider: 'Prestataires',
        both: 'Tous'
    };
    return labels[userType] || userType;
}

function getUsagePercentage(code) {
    if (!code.max_uses) return 0;
    return Math.min((code.current_uses / code.max_uses) * 100, 100);
}

function showLoading(show) {
    isLoading = show;
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
    
    if (show) {
        hideEmptyState();
    }
}

function setLoading(loading) {
    isLoading = loading;
    const submitBtn = document.querySelector('#promo-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = loading;
        submitBtn.innerHTML = loading ? 
            '<i class="fas fa-spinner fa-spin"></i> Création...' : 
            '<i class="fas fa-rocket"></i> Créer le Code';
    }
}

function showEmptyState() {
    document.getElementById('empty-state').style.display = 'block';
    document.querySelector('.table-container').style.display = 'none';
}

function hideEmptyState() {
    document.getElementById('empty-state').style.display = 'none';
    document.querySelector('.table-container').style.display = 'block';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                z-index: 1001;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            .notification-success { border-left: 4px solid var(--success-color); }
            .notification-error { border-left: 4px solid var(--error-color); }
            .notification-info { border-left: 4px solid var(--primary-color); }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                color: var(--text-light);
                padding: 4px;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Add CSS for code details
const detailsStyle = document.createElement('style');
detailsStyle.textContent = `
    .code-details {
        max-width: 100%;
    }
    .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--border-color);
    }
    .detail-grid {
        display: grid;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
    }
    .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm) 0;
        border-bottom: 1px solid var(--border-light);
    }
    .detail-item label {
        font-weight: 600;
        color: var(--text-secondary);
    }
    .code-value {
        font-family: 'Courier New', monospace;
        background: var(--bg-tertiary);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: 4px;
        font-weight: bold;
    }
    .recent-usage h4 {
        margin-bottom: var(--spacing-md);
        color: var(--primary-color);
    }
    .usage-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
    }
    .usage-item {
        display: flex;
        justify-content: space-between;
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--bg-secondary);
        border-radius: 4px;
        font-size: 0.9rem;
    }
    .code-cell {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .code-description {
        font-size: 0.8rem;
        color: var(--text-secondary);
    }
    .usage-cell {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .usage-bar {
        width: 60px;
        height: 4px;
        background: var(--border-color);
        border-radius: 2px;
        overflow: hidden;
    }
    .usage-fill {
        height: 100%;
        background: var(--success-color);
        transition: width 0.3s ease;
    }
`;
document.head.appendChild(detailsStyle);