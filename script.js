// ========================================
// CONFIGURATION ET VARIABLES GLOBALES
// ========================================

const API_BASE_URL = 'http://localhost:3000';
let currentUser = null;
let currentView = 'loginView';

// ========================================
// UTILITAIRES
// ========================================

// Fonction pour afficher les notifications
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification notification--${type} notification--show`;
    
    setTimeout(() => {
        notification.classList.remove('notification--show');
    }, 4000);
}

// Fonction pour afficher/masquer le loading
function showLoading(show = true) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (show) {
        loadingOverlay.classList.add('loading-overlay--show');
    } else {
        loadingOverlay.classList.remove('loading-overlay--show');
    }
}

// Fonction pour faire des requêtes API
async function apiRequest(endpoint, options = {}) {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur API:', error);
        showNotification('Erreur de connexion au serveur', 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

// ========================================
// GESTION DE L'AUTHENTIFICATION
// ========================================

// Vérifier si l'utilisateur est connecté
function checkAuth() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        showDashboard();
        return true;
    }
    return false;
}

// Connexion
async function login(email, password) {
    try {
        const users = await apiRequest('/users');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            showNotification('Connexion réussie !', 'success');
            showDashboard();
            return true;
        } else {
            showNotification('Email ou mot de passe incorrect', 'error');
            return false;
        }
    } catch (error) {
        showNotification('Erreur lors de la connexion', 'error');
        return false;
    }
}

// Déconnexion
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showNotification('Déconnexion réussie', 'info');
    showView('loginView');
}

// Inscription
async function register(userData) {
    try {
        const users = await apiRequest('/users');
        
        // Vérifier si l'email existe déjà
        if (users.find(u => u.email === userData.email)) {
            showNotification('Cet email est déjà utilisé', 'error');
            return false;
        }
        
        // Créer le nouvel utilisateur
        const newUser = {
            id: Date.now().toString(),
            nom: userData.nom,
            email: userData.email,
            password: userData.password,
            role: 'membre',
            diwane: userData.diwane,
            dateCreation: new Date().toISOString()
        };
        
        await apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify(newUser)
        });
        
        showNotification('Compte créé avec succès !', 'success');
        showView('loginView');
        return true;
    } catch (error) {
        showNotification('Erreur lors de la création du compte', 'error');
        return false;
    }
}

// ========================================
// GESTION DES VUES
// ========================================

function showView(viewId) {
    // Masquer toutes les vues
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('view--active');
    });
    
    // Afficher la vue demandée
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('view--active');
        currentView = viewId;
    }
    
    // Mettre à jour la navigation
    updateNavigation();
}

function showDashboard() {
    if (!currentUser) {
        showView('loginView');
        return;
    }
    
    updateUserInfo();
    updateNavigation();
    showView('dashboardView');
    loadDashboardStats();
}

// ========================================
// GESTION DE LA NAVIGATION
// ========================================

function updateNavigation() {
    const navList = document.getElementById('navList');
    const userInfo = document.getElementById('userInfo');
    
    if (!currentUser) {
        navList.innerHTML = '';
        userInfo.innerHTML = '';
        return;
    }
    
    // Navigation selon le rôle
    const navItems = getNavigationItems();
    navList.innerHTML = navItems.map(item => `
        <li class="nav__item">
            <button class="nav-btn ${currentView === item.view ? 'nav-btn--active' : ''}" 
                    onclick="showView('${item.view}')">
                ${item.label}
            </button>
        </li>
    `).join('');
    
    // Informations utilisateur
    userInfo.innerHTML = `
        <span class="user-info__name">👤 ${currentUser.nom}</span>
        <span class="user-info__role">${getRoleLabel(currentUser.role)}</span>
        <button class="logout-btn" onclick="logout()">Déconnexion</button>
    `;
}

function getNavigationItems() {
    const baseItems = [
        { label: '📊 Tableau de bord', view: 'dashboardView' },
        { label: '📚 Mes lectures', view: 'lecturesView' },
        { label: '📖 Xassidas', view: 'xassidasView' },
        { label: '📅 Événements', view: 'evenementsView' },
        { label: '👤 Mon profil', view: 'profilView' }
    ];
    
    if (currentUser.role === 'gerant' || currentUser.role === 'admin') {
        baseItems.splice(2, 0, { label: '📊 Recensement', view: 'recensementView' });
    }
    
    if (currentUser.role === 'admin') {
        baseItems.splice(1, 0, { label: '👥 Utilisateurs', view: 'usersView' });
    }
    
    return baseItems;
}

function getRoleLabel(role) {
    const roles = {
        'admin': 'Administrateur',
        'gerant': 'Gérant',
        'membre': 'Membre'
    };
    return roles[role] || role;
}

function updateUserInfo() {
    // Mettre à jour les informations utilisateur dans les formulaires
    const profilNom = document.getElementById('profilNom');
    const profilEmail = document.getElementById('profilEmail');
    
    if (profilNom) profilNom.value = currentUser.nom;
    if (profilEmail) profilEmail.value = currentUser.email;
}

// ========================================
// GESTION DU MENU MOBILE
// ========================================

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navigation = document.getElementById('navigation');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('menu-toggle--active');
            navigation.classList.toggle('nav--active');
        });
    }
}

// ========================================
// GESTION DES FORMULAIRES
// ========================================

function initForms() {
    // Formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await login(email, password);
        });
    }
    
    // Formulaire d'inscription
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                nom: document.getElementById('registerNom').value,
                email: document.getElementById('registerEmail').value,
                password: document.getElementById('registerPassword').value,
                diwane: document.getElementById('registerDiwane').value
            };
            await register(userData);
        });
    }
    
    // Formulaire de profil
    const profilForm = document.getElementById('profilForm');
    if (profilForm) {
        profilForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateProfile();
        });
    }
}

// ========================================
// GESTION DU TABLEAU DE BORD
// ========================================

async function loadDashboardStats() {
    try {
        const [users, xassidas, evenements, lectures] = await Promise.all([
            apiRequest('/users'),
            apiRequest('/xassidas'),
            apiRequest('/evenements'),
            apiRequest('/lectures')
        ]);
        
        const statsContainer = document.getElementById('dashboardStats');
        const userLectures = lectures.filter(l => l.userId === currentUser.id);
        
        let statsHTML = `
            <div class="stat-card">
                <h3 class="stat-card__title">Mes lectures</h3>
                <div class="stat-card__number">${userLectures.length}</div>
            </div>
            <div class="stat-card">
                <h3 class="stat-card__title">Xassidas disponibles</h3>
                <div class="stat-card__number">${xassidas.filter(x => x.statut === 'valide').length}</div>
            </div>
            <div class="stat-card">
                <h3 class="stat-card__title">Événements actifs</h3>
                <div class="stat-card__number">${evenements.filter(e => new Date(e.date) >= new Date()).length}</div>
            </div>
        `;
        
        if (currentUser.role === 'admin') {
            statsHTML += `
                <div class="stat-card">
                    <h3 class="stat-card__title">Total utilisateurs</h3>
                    <div class="stat-card__number">${users.length}</div>
                </div>
            `;
        }
        
        statsContainer.innerHTML = statsHTML;
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

// ========================================
// GESTION DES DIWANES
// ========================================

async function loadDiwanes() {
    try {
        const diwanes = await apiRequest('/diwanes');
        const selects = document.querySelectorAll('#registerDiwane, #userDiwane');
        
        selects.forEach(select => {
            select.innerHTML = '<option value="">Sélectionner un diwane</option>' +
                diwanes.map(d => `<option value="${d.id}">${d.nom}</option>`).join('');
        });
    } catch (error) {
        console.error('Erreur lors du chargement des diwanes:', error);
    }
}

// ========================================
// GESTION DU PROFIL
// ========================================

async function updateProfile() {
    try {
        const nom = document.getElementById('profilNom').value;
        const email = document.getElementById('profilEmail').value;
        const password = document.getElementById('profilPassword').value;
        
        const updatedUser = {
            ...currentUser,
            nom,
            email
        };
        
        if (password) {
            updatedUser.password = password;
        }
        
        await apiRequest(`/users/${currentUser.id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedUser)
        });
        
        currentUser = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        showNotification('Profil mis à jour avec succès !', 'success');
        updateUserInfo();
    } catch (error) {
        showNotification('Erreur lors de la mise à jour du profil', 'error');
    }
}

// ========================================
// GESTION DES MODALES
// ========================================

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('modal--active');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('modal--active');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }
}

// Fonctions spécifiques pour les modales
function showAddUserForm() {
    showModal('userFormContainer');
}

function hideUserForm() {
    hideModal('userFormContainer');
}

function showAddXassidaForm() {
    showModal('xassidaFormContainer');
}

function hideXassidaForm() {
    hideModal('xassidaFormContainer');
}

function showAddEvenementForm() {
    showModal('evenementFormContainer');
}

function hideEvenementForm() {
    hideModal('evenementFormContainer');
}

// ========================================
// INITIALISATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialiser les composants
        initMobileMenu();
        initForms();
        
        // Charger les données de base
        await loadDiwanes();
        
        // Vérifier l'authentification
        if (!checkAuth()) {
            showView('loginView');
        }
        
        // Fermer les modales en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                const modalId = e.target.id;
                hideModal(modalId);
            }
        });
        
        console.log('Application initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        showNotification('Erreur lors de l\'initialisation de l\'application', 'error');
    }
});

// ========================================
// FONCTIONS UTILITAIRES SUPPLÉMENTAIRES
// ========================================

// Formater les dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Valider les emails
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Générer un ID unique
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}