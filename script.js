// Configuration de l'API
const isLocal = location.hostname === "localhost";
const API_BASE_URL = isLocal
  ? "http://localhost:3000"
  : "https://serverdata-7k3i.onrender.com";


// Système de mise à jour en temps réel amélioré
const RealtimeUpdater = {
  updateQueue: new Map(),
  isProcessing: false,
  batchTimeout: null,
  BATCH_DELAY: 100, // ms

  // Ajouter une mise à jour à la queue
  queueUpdate(viewId, updateType, data) {
    const key = `${viewId}_${updateType}`;
    this.updateQueue.set(key, { viewId, updateType, data, timestamp: Date.now() });
    
    this.scheduleBatchProcess();
  },

  // Programmer le traitement par batch
  scheduleBatchProcess() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  },

  // Traiter toutes les mises à jour en attente
  async processBatch() {
    if (this.isProcessing || this.updateQueue.size === 0) return;
    
    this.isProcessing = true;
    const updates = Array.from(this.updateQueue.values());
    this.updateQueue.clear();

    try {
      // Grouper les mises à jour par vue
      const updatesByView = updates.reduce((acc, update) => {
        if (!acc[update.viewId]) acc[update.viewId] = [];
        acc[update.viewId].push(update);
        return acc;
      }, {});

      // Traiter chaque vue
      for (const [viewId, viewUpdates] of Object.entries(updatesByView)) {
        await this.processViewUpdates(viewId, viewUpdates);
      }
    } catch (error) {
      console.error('Erreur traitement batch:', error);
    } finally {
      this.isProcessing = false;
    }
  },

  // Traiter les mises à jour d'une vue spécifique
  async processViewUpdates(viewId, updates) {
    // Optimiser en ne gardant que la dernière mise à jour de chaque type
    const latestUpdates = updates.reduce((acc, update) => {
      const key = update.updateType;
      if (!acc[key] || update.timestamp > acc[key].timestamp) {
        acc[key] = update;
      }
      return acc;
    }, {});

    // Appliquer les mises à jour
    for (const update of Object.values(latestUpdates)) {
      await this.applyUpdate(update);
    }
  },

  // Appliquer une mise à jour spécifique
  async applyUpdate(update) {
    const { viewId, updateType, data } = update;
    
    try {
      switch (viewId) {
        case 'usersView':
          await this.updateUsersView(updateType, data);
          break;
        case 'xassidasView':
          await this.updateXassidasView(updateType, data);
          break;
        case 'evenementsView':
          await this.updateEvenementsView(updateType, data);
          break;
        case 'lecturesView':
          await this.updateLecturesView(updateType, data);
          break;
        case 'recensementView':
          await this.updateRecensementView(updateType, data);
          break;
        case 'dashboardView':
          await this.updateDashboardView(updateType, data);
          break;
      }
    } catch (error) {
      console.error(`Erreur mise à jour ${viewId}:`, error);
    }
  },

  // Mises à jour spécifiques par vue
  async updateUsersView(updateType, data) {
    if (currentView !== 'usersView') return;
    
    switch (updateType) {
      case 'ADD':
        this.addUserToTable(data);
        break;
      case 'UPDATE':
        this.updateUserInTable(data);
        break;
      case 'DELETE':
        this.removeUserFromTable(data.id);
        break;
      case 'REFRESH':
        await loadUsers(currentUserPage || 1);
        break;
    }
  },

  async updateXassidasView(updateType, data) {
    if (currentView !== 'xassidasView') return;
    
    switch (updateType) {
      case 'ADD':
        this.addXassidaToTable(data);
        break;
      case 'UPDATE':
        this.updateXassidaInTable(data);
        break;
      case 'DELETE':
        this.removeXassidaFromTable(data.id);
        break;
      case 'VALIDATE':
        this.updateXassidaStatus(data.id, true);
        break;
      case 'REJECT':
        this.removeXassidaFromTable(data.id);
        break;
      case 'REFRESH':
        await loadXassidas();
        break;
    }
  },

  async updateEvenementsView(updateType, data) {
    if (currentView !== 'evenementsView') return;
    
    switch (updateType) {
      case 'ADD':
        this.addEvenementToTable(data);
        break;
      case 'UPDATE':
        this.updateEvenementInTable(data);
        break;
      case 'DELETE':
        this.removeEvenementFromTable(data.id);
        break;
      case 'TOGGLE_STATUS':
        this.updateEvenementStatus(data.id, data.status);
        break;
      case 'REFRESH':
        await loadEvenements();
        break;
    }
  },

  async updateLecturesView(updateType, data) {
    if (currentView !== 'lecturesView') return;
    
    switch (updateType) {
      case 'ADD':
        this.addLectureToTable(data);
        await this.refreshLectureForm();
        break;
      case 'REFRESH':
        await loadMesLectures();
        await loadLectureForm();
        break;
    }
  },

  async updateRecensementView(updateType, data) {
    if (currentView !== 'recensementView') return;
    
    switch (updateType) {
      case 'REFRESH':
        await loadRecensement();
        break;
    }
  },

  async updateDashboardView(updateType, data) {
    if (currentView !== 'dashboardView') return;
    
    switch (updateType) {
      case 'REFRESH':
        await loadDashboard();
        break;
    }
  },

  // Méthodes d'animation et de mise à jour DOM
  addUserToTable(user) {
    if (!allUsers) return;
    
    // Ajouter aux données
    allUsers.unshift(user);
    filteredUsers.unshift(user);
    
    // Recharger la page courante
    renderUsersPage(currentUserPage || 1);
    
    // Animation d'ajout
    setTimeout(() => {
      const newRow = document.querySelector(`tr[data-user-id="${user.id}"]`);
      if (newRow) {
        newRow.classList.add('row-added');
        setTimeout(() => newRow.classList.remove('row-added'), 1000);
      }
    }, 100);
  },

  updateUserInTable(user) {
    if (!allUsers) return;
    
    // Mettre à jour les données
    const index = allUsers.findIndex(u => u.id === user.id);
    if (index !== -1) {
      allUsers[index] = user;
      const filteredIndex = filteredUsers.findIndex(u => u.id === user.id);
      if (filteredIndex !== -1) {
        filteredUsers[filteredIndex] = user;
      }
    }
    
    // Recharger la page courante
    renderUsersPage(currentUserPage || 1);
    
    // Animation de mise à jour
    setTimeout(() => {
      const row = document.querySelector(`tr[data-user-id="${user.id}"]`);
      if (row) {
        row.classList.add('row-updated');
        setTimeout(() => row.classList.remove('row-updated'), 1000);
      }
    }, 100);
  },

  removeUserFromTable(userId) {
    if (!allUsers) return;
    
    // Animation de suppression
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (row) {
      row.classList.add('row-removing');
      setTimeout(() => {
        // Supprimer des données
        allUsers = allUsers.filter(u => u.id !== userId);
        filteredUsers = filteredUsers.filter(u => u.id !== userId);
        
        // Recharger la page
        renderUsersPage(currentUserPage || 1);
      }, 300);
    }
  },

  addXassidaToTable(xassida) {
    if (!window.allXassidas) return;
    
    window.allXassidas.unshift(xassida);
    
    // Recharger l'affichage avec le filtre actuel
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
      const filter = this.getXassidaFilter(activeTab);
      this.refreshXassidasDisplay(filter);
    }
    
    // Animation d'ajout
    setTimeout(() => {
      const newRow = document.querySelector(`tr[data-xassida-id="${xassida.id}"]`);
      if (newRow) {
        newRow.classList.add('row-added');
        setTimeout(() => newRow.classList.remove('row-added'), 1000);
      }
    }, 100);
  },

  updateXassidaInTable(xassida) {
    if (!window.allXassidas) return;
    
    const index = window.allXassidas.findIndex(x => x.id === xassida.id);
    if (index !== -1) {
      window.allXassidas[index] = xassida;
    }
    
    // Recharger l'affichage
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
      const filter = this.getXassidaFilter(activeTab);
      this.refreshXassidasDisplay(filter);
    }
    
    // Animation de mise à jour
    setTimeout(() => {
      const row = document.querySelector(`tr[data-xassida-id="${xassida.id}"]`);
      if (row) {
        row.classList.add('row-updated');
        setTimeout(() => row.classList.remove('row-updated'), 1000);
      }
    }, 100);
  },

  updateXassidaStatus(xassidaId, isValid) {
    const row = document.querySelector(`tr[data-xassida-id="${xassidaId}"]`);
    if (!row) return;
    
    // Mettre à jour le badge de statut
    const statusBadge = row.querySelector('.status-badge');
    if (statusBadge) {
      statusBadge.className = `status-badge ${isValid ? 'status-valide' : 'status-pending'}`;
      statusBadge.textContent = isValid ? '✅ Validé' : '⏳ En attente';
    }
    
    // Mettre à jour les boutons d'action
    const actionsCell = row.querySelector('td:last-child');
    if (actionsCell && isValid) {
      actionsCell.innerHTML = `
        <button class="btn btn-warning btn-small" onclick="editXassida('${xassidaId}')">✏️ Modifier</button>
        <button class="btn btn-danger btn-small" onclick="deleteXassida('${xassidaId}')">🗑️ Supprimer</button>
      `;
    }
    
    // Animation de validation
    row.classList.add('row-validated');
    setTimeout(() => row.classList.remove('row-validated'), 1000);
  },

  removeXassidaFromTable(xassidaId) {
    const row = document.querySelector(`tr[data-xassida-id="${xassidaId}"]`);
    if (row) {
      row.classList.add('row-removing');
      setTimeout(() => {
        if (window.allXassidas) {
          window.allXassidas = window.allXassidas.filter(x => x.id !== xassidaId);
        }
        
        // Recharger l'affichage
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
          const filter = this.getXassidaFilter(activeTab);
          this.refreshXassidasDisplay(filter);
        }
      }, 300);
    }
  },

  addEvenementToTable(evenement) {
    // Recharger complètement la vue événements
    loadEvenements();
  },

  updateEvenementInTable(evenement) {
    loadEvenements();
  },

  updateEvenementStatus(evenementId, newStatus) {
    const row = document.querySelector(`tr[data-evenement-id="${evenementId}"]`);
    if (!row) return;
    
    // Mettre à jour le badge de statut
    const statusBadge = row.querySelector('.status-badge.status-active, .status-badge.status-inactive');
    if (statusBadge) {
      statusBadge.className = `status-badge status-${newStatus}`;
      statusBadge.textContent = newStatus === 'active' ? '✅ Actif' : '❌ Inactif';
    }
    
    // Animation de changement de statut
    row.classList.add('row-status-changed');
    setTimeout(() => row.classList.remove('row-status-changed'), 1000);
  },

  removeEvenementFromTable(evenementId) {
    const row = document.querySelector(`tr[data-evenement-id="${evenementId}"]`);
    if (row) {
      row.classList.add('row-removing');
      setTimeout(() => {
        loadEvenements();
      }, 300);
    }
  },

  addLectureToTable(lecture) {
    // Recharger les lectures
    loadMesLectures();
  },

  // Méthodes utilitaires
  getXassidaFilter(activeTab) {
    if (activeTab.textContent.includes('Validés')) return 'valide';
    if (activeTab.textContent.includes('En attente')) return 'pending';
    return 'all';
  },

  refreshXassidasDisplay(filter = 'all') {
    if (!window.allXassidas) return;
    
    let filteredXassidas = window.allXassidas;
    
    switch (filter) {
      case 'valide':
        filteredXassidas = filteredXassidas.filter(x => x.valide);
        break;
      case 'pending':
        filteredXassidas = filteredXassidas.filter(x => !x.valide);
        break;
    }
    
    displayXassidas(filteredXassidas);
  },

  async refreshLectureForm() {
    // Recharger les options du formulaire de lecture
    await loadLectureForm();
  }
};

// Cache système pour optimiser les performances
const DataCache = {
  data: new Map(),
  timestamps: new Map(),
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  set(key, value) {
    this.data.set(key, value);
    this.timestamps.set(key, Date.now());
  },

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() - timestamp > this.CACHE_DURATION) {
      this.data.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    return this.data.get(key);
  },

  invalidate(key) {
    this.data.delete(key);
    this.timestamps.delete(key);
  },

  clear() {
    this.data.clear();
    this.timestamps.clear();
  },
};

// Gestionnaire d'événements pour les mises à jour en temps réel
const EventManager = {
  listeners: new Map(),

  // Écouter un type d'événement
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  },

  // Déclencher un événement
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erreur dans le listener ${eventType}:`, error);
        }
      });
    }
  },

  // Supprimer tous les listeners d'un type
  off(eventType) {
    this.listeners.delete(eventType);
  },
};

// Gestionnaire d'état global pour la synchronisation
const StateManager = {
  state: {
    users: [],
    xassidas: [],
    evenements: [],
    lectures: [],
    diwanes: [],
  },

  // Mettre à jour l'état et notifier les changements
  updateState(dataType, newData) {
    this.state[dataType] = newData;
    EventManager.emit(`${dataType}Updated`, newData);

    // Mettre à jour le cache
    DataCache.set(`/${dataType}`, newData);
  },

  // Ajouter un élément à l'état
  addItem(dataType, item) {
    this.state[dataType].push(item);
    EventManager.emit(`${dataType}Added`, {
      item,
      allData: this.state[dataType],
    });

    // Mettre à jour le cache
    DataCache.set(`/${dataType}`, this.state[dataType]);
    
    // Déclencher la mise à jour en temps réel
    this.triggerRealtimeUpdate(dataType, 'ADD', item);
  },

  // Mettre à jour un élément dans l'état
  updateItem(dataType, itemId, updatedItem) {
    const index = this.state[dataType].findIndex((item) => item.id == itemId);
    if (index !== -1) {
      this.state[dataType][index] = updatedItem;
      EventManager.emit(`${dataType}ItemUpdated`, {
        item: updatedItem,
        index,
        allData: this.state[dataType],
      });

      // Mettre à jour le cache
      DataCache.set(`/${dataType}`, this.state[dataType]);
      
      // Déclencher la mise à jour en temps réel
      this.triggerRealtimeUpdate(dataType, 'UPDATE', updatedItem);
    }
  },

  // Supprimer un élément de l'état
  removeItem(dataType, itemId) {
    const index = this.state[dataType].findIndex((item) => item.id == itemId);
    if (index !== -1) {
      const removedItem = this.state[dataType].splice(index, 1)[0];
      EventManager.emit(`${dataType}ItemRemoved`, {
        item: removedItem,
        index,
        allData: this.state[dataType],
      });

      // Mettre à jour le cache
      DataCache.set(`/${dataType}`, this.state[dataType]);
      
      // Déclencher la mise à jour en temps réel
      this.triggerRealtimeUpdate(dataType, 'DELETE', { id: itemId });
    }
  },

  // Obtenir l'état actuel
  getState(dataType) {
    return this.state[dataType] || [];
  },

  // Déclencher les mises à jour en temps réel
  triggerRealtimeUpdate(dataType, action, data) {
    const viewMappings = {
      users: ['usersView', 'dashboardView'],
      xassidas: ['xassidasView', 'lecturesView', 'dashboardView'],
      evenements: ['evenementsView', 'lecturesView', 'recensementView'],
      lectures: ['lecturesView', 'recensementView', 'dashboardView'],
      diwanes: ['usersView']
    };

    const views = viewMappings[dataType] || [];
    views.forEach(viewId => {
      RealtimeUpdater.queueUpdate(viewId, action, data);
    });
  }
};

// Gestionnaire de requêtes optimisé avec mise à jour d'état
const ApiManager = {
  pendingRequests: new Map(),

  async fetch(endpoint, options = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;

    // Vérifier le cache d'abord
    const cached = DataCache.get(cacheKey);
    if (
      cached &&
      options.method !== "POST" &&
      options.method !== "PUT" &&
      options.method !== "DELETE"
    ) {
      return cached;
    }

    // Éviter les requêtes en double
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const requestPromise = fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        // Mettre en cache les données GET
        if (!options.method || options.method === "GET") {
          DataCache.set(cacheKey, data);
        }
        return data;
      })
      .finally(() => {
        this.pendingRequests.delete(cacheKey);
      });

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  },

  async batchFetch(endpoints) {
    const promises = endpoints.map((endpoint) => this.fetch(endpoint));
    return Promise.all(promises);
  },

  // Méthodes avec mise à jour automatique de l'état
  async create(dataType, item) {
    const result = await this.fetch(`/${dataType}`, {
      method: "POST",
      body: JSON.stringify(item),
    });

    // Mettre à jour l'état global
    StateManager.addItem(dataType, result);

    return result;
  },

  async update(dataType, itemId, item) {
    const result = await this.fetch(`/${dataType}/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(item),
    });

    // Mettre à jour l'état global
    StateManager.updateItem(dataType, itemId, result);

    return result;
  },

  async delete(dataType, itemId) {
    await this.fetch(`/${dataType}/${itemId}`, {
      method: "DELETE",
    });

    // Mettre à jour l'état global
    StateManager.removeItem(dataType, itemId);
  },

  // Charger et synchroniser les données initiales
  async loadAndSyncData(dataType) {
    const data = await this.fetch(`/${dataType}`);
    StateManager.updateState(dataType, data);
    return data;
  },
};

// État global de l'application
let currentUser = null;
let currentView = "loginView";
let currentUserPage = 1;
const viewData = new Map(); // Cache des données par vue

// Pagination
const PaginationManager = {
  pageSize: 10,
  currentPages: new Map(),

  paginate(data, page = 1, pageSize = this.pageSize) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return {
      data: data.slice(startIndex, endIndex),
      currentPage: page,
      totalPages: Math.ceil(data.length / pageSize),
      totalItems: data.length,
      hasNext: endIndex < data.length,
      hasPrev: page > 1,
    };
  },

  renderPagination(containerId, paginationData, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container || paginationData.totalPages <= 1) {
      if (container) container.innerHTML = "";
      return;
    }

    let html = '<div class="pagination-controls">';

    if (paginationData.hasPrev) {
      html += `<button class="btn btn-secondary btn-small" onclick="${onPageChange}(${
        paginationData.currentPage - 1
      })">← Précédent</button>`;
    }

    // Pages
    const startPage = Math.max(1, paginationData.currentPage - 2);
    const endPage = Math.min(
      paginationData.totalPages,
      paginationData.currentPage + 2
    );

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === paginationData.currentPage;
      html += `<button class="btn ${
        isActive ? "btn-primary" : "btn-secondary"
      } btn-small" 
               onclick="${onPageChange}(${i})">${i}</button>`;
    }

    if (paginationData.hasNext) {
      html += `<button class="btn btn-secondary btn-small" onclick="${onPageChange}(${
        paginationData.currentPage + 1
      })">Suivant →</button>`;
    }

    html += "</div>";
    container.innerHTML = html;
  },
};

// Initialisation de l'application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

// Initialisation optimisée
async function initializeApp() {
  try {
    // Vérifier si un utilisateur est connecté
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      currentUser = JSON.parse(savedUser);

      // Pré-charger les données essentielles en arrière-plan
      preloadEssentialData();

      showDashboard();
    } else {
      showView("loginView");
    }

    // Attacher les événements
    attachEventListeners();
  } catch (error) {
    console.error("Erreur initialisation:", error);
    showNotification("Erreur lors de l'initialisation", "error");
  }
}

// Pré-chargement des données essentielles avec synchronisation
async function preloadEssentialData() {
  try {
    // Charger les données de base en parallèle et synchroniser l'état
    const promises = [
      ApiManager.loadAndSyncData("users"),
      ApiManager.loadAndSyncData("diwanes"),
      ApiManager.loadAndSyncData("xassidas"),
      ApiManager.loadAndSyncData("evenements"),
      ApiManager.loadAndSyncData("lectures"),
    ];

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("Erreur pré-chargement:", error);
  }
}

// Attacher les événements
function attachEventListeners() {
  // Formulaire de connexion
  document.getElementById("loginForm").addEventListener("submit", handleLogin);

  // Formulaire d'inscription
  document
    .getElementById("registerForm")
    .addEventListener("submit", handleRegister);

  // Formulaires
  document
    .getElementById("userForm")
    .addEventListener("submit", handleUserSubmit);
  document
    .getElementById("xassidaForm")
    .addEventListener("submit", handleXassidaSubmit);
  document
    .getElementById("evenementForm")
    .addEventListener("submit", handleEvenementSubmit);
  document
    .getElementById("lectureForm")
    .addEventListener("submit", handleLectureSubmit);
  document
    .getElementById("profilForm")
    .addEventListener("submit", handleProfilSubmit);

  // Filtre de recensement
  document
    .getElementById("filterEvenement")
    .addEventListener("change", loadRecensement);
}

// Gestion de la connexion optimisée
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("loginError");
  const submitBtn = e.target.querySelector('button[type="submit"]');

  try {
    showLoading(submitBtn.id);

    const users = await ApiManager.fetch(
      `/users?email=${email}&password=${password}`
    );

    if (users.length > 0) {
      currentUser = users[0];
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      // Pré-charger les données après connexion
      preloadEssentialData();

      showDashboard();
      showNotification("Connexion réussie !", "success");
    } else {
      errorDiv.textContent = "Email ou mot de passe incorrect";
    }
  } catch (error) {
    errorDiv.textContent = "Erreur de connexion";
    console.error("Erreur de connexion:", error);
  } finally {
    hideLoading(submitBtn.id);
  }
}

// Gestion de l'inscription optimisée
async function handleRegister(e) {
  e.preventDefault();

  const nom = document.getElementById("registerNom").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const diwaneId = Number.parseInt(
    document.getElementById("registerDiwane").value
  );
  const errorDiv = document.getElementById("registerError");
  const submitBtn = e.target.querySelector('button[type="submit"]');

  try {
    showLoading(submitBtn.id);

    // Vérifier si l'email existe déjà
    const existingUsers = await ApiManager.fetch(`/users?email=${email}`);

    if (existingUsers.length > 0) {
      errorDiv.textContent = "Cet email est déjà utilisé";
      return;
    }

    // Créer le nouveau compte membre
    const userData = {
      nom: nom,
      email: email,
      password: password,
      diwaneId: diwaneId,
      role: "membre",
      createdAt: new Date().toISOString(),
      isActive: true
    };

    await ApiManager.create("users", userData);

    showNotification(
      "Compte créé avec succès ! Vous pouvez maintenant vous connecter.",
      "success"
    );
    showView("loginView");
    document.getElementById("registerForm").reset();
  } catch (error) {
    errorDiv.textContent = "Erreur lors de la création du compte";
    console.error("Erreur inscription:", error);
  } finally {
    hideLoading(submitBtn.id);
  }
}

// Déconnexion
function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  DataCache.clear();
  viewData.clear();

  // Nettoyer l'état global
  StateManager.state = {
    users: [],
    xassidas: [],
    evenements: [],
    lectures: [],
    diwanes: [],
  };

  showView("loginView");
  showNotification("Déconnexion réussie", "success");
}

// Affichage des vues optimisé
function showView(viewId) {
  // Masquer toutes les vues
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("active");
  });

  // Afficher la vue demandée
  document.getElementById(viewId).classList.add("active");
  currentView = viewId;

  // Mettre à jour la navigation
  updateNavigation();

  // Charger les données spécifiques à la vue (avec cache)
  loadViewData(viewId);
}

// Mise à jour de la navigation
function updateNavigation() {
  const nav = document.getElementById("navigation");
  const userInfo = document.getElementById("userInfo");

  if (!currentUser) {
    nav.innerHTML = "";
    userInfo.innerHTML = "";
    return;
  }

  // Navigation selon le rôle
  const navItems = [
    {
      id: "dashboardView",
      text: "📊 Tableau de bord",
      roles: ["membre", "gerant", "admin"],
    },
    {
      id: "xassidasView",
      text: "📖 Xassidas",
      roles: ["membre", "gerant", "admin"],
    },
    { id: "evenementsView", text: "📅 Événements", roles: ["gerant", "admin"] },
    {
      id: "lecturesView",
      text: "📚 Mes lectures",
      roles: ["membre", "gerant"],
    },
    {
      id: "recensementView",
      text: "📊 Recensement",
      roles: ["gerant", "admin"],
    },
    { id: "usersView", text: "👥 Utilisateurs", roles: ["admin"] },
    {
      id: "profilView",
      text: "👤 Mon profil",
      roles: ["membre", "gerant", "admin"],
    },
  ];

  nav.innerHTML = navItems
    .filter((item) => item.roles.includes(currentUser.role))
    .map(
      (item) => `
            <button class="nav-btn ${currentView === item.id ? "active" : ""}" 
                    onclick="showView('${item.id}')">
                ${item.text}
            </button>
        `
    )
    .join("");

  // Informations utilisateur
  userInfo.innerHTML = `
        <span>👋 ${currentUser.nom} (${currentUser.role})</span>
        <button class="logout-btn" onclick="logout()">🚪 Déconnexion</button>
    `;
}

// Chargement des données par vue optimisé
async function loadViewData(viewId) {
  // Vérifier si les données sont déjà en cache
  if (
    viewData.has(viewId) &&
    Date.now() - viewData.get(viewId).timestamp < 60000
  ) {
    return; // Données récentes, pas besoin de recharger
  }

  try {
    showLoading();

    switch (viewId) {
      case "dashboardView":
        await loadDashboard();
        break;
      case "usersView":
        await loadUsers();
        break;
      case "xassidasView":
        await loadXassidas();
        break;
      case "evenementsView":
        await loadEvenements();
        break;
      case "lecturesView":
        await loadLectureForm();
        await loadMesLectures();
        break;
      case "recensementView":
        await loadRecensementFilters();
        await loadRecensement();
        break;
      case "profilView":
        loadProfil();
        break;
      case "registerView":
        await loadDiwanesForRegister();
        break;
    }

    // Marquer les données comme chargées
    viewData.set(viewId, { timestamp: Date.now() });
  } catch (error) {
    console.error(`Erreur chargement vue ${viewId}:`, error);
    showNotification("Erreur lors du chargement des données", "error");
  } finally {
    hideLoading();
  }
}

// Tableau de bord optimisé avec données synchronisées
async function loadDashboard() {
  try {
    // Utiliser les données de l'état global si disponibles
    let users = StateManager.getState("users");
    let xassidas = StateManager.getState("xassidas");
    let evenements = StateManager.getState("evenements");
    let lectures = StateManager.getState("lectures");

    // Si pas de données dans l'état, les charger
    if (users.length === 0 || xassidas.length === 0) {
      [users, xassidas, evenements, lectures] = await ApiManager.batchFetch([
        "/users",
        "/xassidas",
        "/evenements",
        "/lectures",
      ]);

      // Synchroniser l'état
      StateManager.updateState("users", users);
      StateManager.updateState("xassidas", xassidas);
      StateManager.updateState("evenements", evenements);
      StateManager.updateState("lectures", lectures);
    }

    const stats = document.getElementById("dashboardStats");

    let statsHtml = `
            <div class="stat-card">
                <h3>📖 Xassidas validés</h3>
                <div class="stat-number">${
                  xassidas.filter((x) => x.valide).length
                }</div>
            </div>
            <div class="stat-card">
                <h3>📅 Événements actifs</h3>
                <div class="stat-number">${evenements.filter(e => e.status === 'active').length}</div>
            </div>
        `;

    if (currentUser.role === "admin") {
      statsHtml += `
                <div class="stat-card">
                    <h3>👥 Utilisateurs actifs</h3>
                    <div class="stat-number">${users.filter(u => u.isActive).length}</div>
                </div>
            `;
    }

    if (currentUser.role === "gerant" || currentUser.role === "admin") {
      const diwaneLectures = lectures.filter((l) => {
        const user = users.find((u) => u.id == l.userId);
        return (
          currentUser.role === "admin" ||
          (user && user.diwaneId === currentUser.diwaneId)
        );
      });

      statsHtml += `
                <div class="stat-card">
                    <h3>📚 Total lectures</h3>
                    <div class="stat-number">${diwaneLectures.reduce(
                      (sum, l) => sum + l.nombre,
                      0
                    )}</div>
                </div>
            `;
    } else {
      const mesLectures = lectures.filter((l) => l.userId == currentUser.id);
      statsHtml += `
                <div class="stat-card">
                    <h3>📚 Mes lectures</h3>
                    <div class="stat-number">${mesLectures.reduce(
                      (sum, l) => sum + l.nombre,
                      0
                    )}</div>
                </div>
            `;
    }

    stats.innerHTML = statsHtml;
  } catch (error) {
    console.error("Erreur chargement dashboard:", error);
  }
}

// Gestion des utilisateurs avec pagination et synchronisation
let allUsers = [];
let filteredUsers = [];

async function loadUsers(page = 1) {
  try {
    currentUserPage = page;
    
    // Utiliser les données synchronisées si disponibles
    let users = StateManager.getState("users");
    let diwanes = StateManager.getState("diwanes");

    if (users.length === 0) {
      [users, diwanes] = await ApiManager.batchFetch(["/users", "/diwanes"]);
      StateManager.updateState("users", users);
      StateManager.updateState("diwanes", diwanes);
    }

    allUsers = users;
    filteredUsers = users;

    renderUsersPage(page);
    await loadDiwanes();
  } catch (error) {
    console.error("Erreur chargement utilisateurs:", error);
  }
}

function renderUsersPage(page = 1) {
  const paginationData = PaginationManager.paginate(filteredUsers, page);
  const tbody = document.getElementById("usersTableBody");
  const diwanes = StateManager.getState("diwanes");

  // Afficher les utilisateurs de la page courante
  tbody.innerHTML = paginationData.data
    .map((user) => {
      const diwane = diwanes.find((d) => d.id == user.diwaneId);
      return `
                <tr data-user-id="${user.id}">
                    <td>
                      <div class="user-info-cell">
                        <strong>${user.nom}</strong>
                        ${user.isActive ? '' : '<span class="status-badge status-inactive">Inactif</span>'}
                      </div>
                    </td>
                    <td>${user.email}</td>
                    <td><span class="status-badge status-${user.role}">${
        user.role
      }</span></td>
                    <td>${diwane ? diwane.nom : "N/A"}</td>
                    <td class="actions-cell">
                        <button class="btn btn-warning btn-small" onclick="editUser('${
                          user.id
                        }')">✏️ Modifier</button>
                        <button class="btn btn-danger btn-small" onclick="deleteUser('${
                          user.id
                        }')">🗑️ Supprimer</button>
                    </td>
                </tr>
            `;
    })
    .join("");

  // Afficher les informations de pagination
  const paginationInfo = document.getElementById("userPaginationInfo");
  if (paginationInfo) {
    paginationInfo.innerHTML = `Affichage ${
      (paginationData.currentPage - 1) * PaginationManager.pageSize + 1
    }-${Math.min(
      paginationData.currentPage * PaginationManager.pageSize,
      paginationData.totalItems
    )} sur ${paginationData.totalItems} utilisateurs`;
  }

  // Afficher les contrôles de pagination
  PaginationManager.renderPagination(
    "userPagination",
    paginationData,
    "loadUsers"
  );
}

function filterUsers() {
  const searchTerm = document.getElementById("userSearch").value.toLowerCase();
  filteredUsers = allUsers.filter(
    (user) =>
      user.nom.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
  );
  renderUsersPage(1);
}

async function loadDiwanes() {
  try {
    let diwanes = StateManager.getState("diwanes");

    if (diwanes.length === 0) {
      diwanes = await ApiManager.loadAndSyncData("diwanes");
    }

    const select = document.getElementById("userDiwane");
    if (select) {
      select.innerHTML = diwanes
        .map((d) => `<option value="${d.id}">${d.nom}</option>`)
        .join("");
    }
  } catch (error) {
    console.error("Erreur chargement diwanes:", error);
  }
}

// Charger les diwanes pour l'inscription
async function loadDiwanesForRegister() {
  try {
    let diwanes = StateManager.getState("diwanes");

    if (diwanes.length === 0) {
      diwanes = await ApiManager.loadAndSyncData("diwanes");
    }

    const select = document.getElementById("registerDiwane");
    if (select) {
      select.innerHTML =
        '<option value="">Sélectionner votre diwane</option>' +
        diwanes.filter(d => d.isActive).map((d) => `<option value="${d.id}">${d.nom}</option>`).join("");
    }
  } catch (error) {
    console.error("Erreur chargement diwanes:", error);
  }
}

function showAddUserForm() {
  document.getElementById("userFormContainer").style.display = "block";
  document.getElementById("userFormTitle").textContent =
    "Ajouter un utilisateur";
  document.getElementById("userForm").reset();
  document.getElementById("userId").value = "";
}

function hideUserForm() {
  document.getElementById("userFormContainer").style.display = "none";
}

async function editUser(userId) {
  try {
    const user = await ApiManager.fetch(`/users/${userId}`);

    document.getElementById("userId").value = user.id;
    document.getElementById("userName").value = user.nom;
    document.getElementById("userEmail").value = user.email;
    document.getElementById("userPassword").value = user.password;
    document.getElementById("userRole").value = user.role;
    document.getElementById("userDiwane").value = user.diwaneId;

    document.getElementById("userFormTitle").textContent =
      "Modifier un utilisateur";
    document.getElementById("userFormContainer").style.display = "block";
  } catch (error) {
    console.error("Erreur chargement utilisateur:", error);
  }
}

async function deleteUser(userId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

  try {
    await ApiManager.delete("users", userId);
    showNotification("Utilisateur supprimé avec succès", "success");
  } catch (error) {
    showNotification("Erreur lors de la suppression", "error");
    console.error("Erreur suppression utilisateur:", error);
  }
}

async function handleUserSubmit(e) {
  e.preventDefault();

  const userId = document.getElementById("userId").value;
  const userData = {
    nom: document.getElementById("userName").value,
    email: document.getElementById("userEmail").value,
    password: document.getElementById("userPassword").value,
    role: document.getElementById("userRole").value,
    diwaneId: Number.parseInt(document.getElementById("userDiwane").value),
    isActive: true
  };

  const submitBtn = e.target.querySelector('button[type="submit"]');

  try {
    showLoading(submitBtn.id);

    if (userId) {
      // Modification avec mise à jour automatique
      await ApiManager.update("users", userId, {
        ...userData,
        id: userId,
      });
      showNotification("Utilisateur modifié avec succès", "success");
    } else {
      // Création avec mise à jour automatique
      userData.createdAt = new Date().toISOString();
      await ApiManager.create("users", userData);
      showNotification("Utilisateur créé avec succès", "success");
    }

    hideUserForm();
  } catch (error) {
    showNotification("Erreur lors de l'enregistrement", "error");
    console.error("Erreur sauvegarde utilisateur:", error);
  } finally {
    hideLoading(submitBtn.id);
  }
}

// Gestion des xassidas optimisée avec synchronisation
async function loadXassidas() {
  try {
    // Utiliser les données synchronisées si disponibles
    let xassidas = StateManager.getState("xassidas");
    let users = StateManager.getState("users");

    if (xassidas.length === 0 || users.length === 0) {
      [xassidas, users] = await ApiManager.batchFetch(["/xassidas", "/users"]);
      StateManager.updateState("xassidas", xassidas);
      StateManager.updateState("users", users);
    }

    window.allXassidas = xassidas;
    window.allUsers = users;

    // Afficher l'onglet "En attente" seulement pour les gérants/admins
    const pendingTab = document.getElementById("pendingTab");
    if (currentUser.role === "gerant" || currentUser.role === "admin") {
      pendingTab.style.display = "block";
    } else {
      pendingTab.style.display = "none";
    }

    // Configurer l'interface selon le rôle
    configureXassidaInterface();

    filterXassidas("all");
  } catch (error) {
    console.error("Erreur chargement xassidas:", error);
  }
}

// Configuration de l'interface selon le rôle
function configureXassidaInterface() {
  const addBtn = document.getElementById("addXassidaBtn");
  const roleInfo = document.getElementById("xassidaRoleInfo");

  if (currentUser.role === "admin" || currentUser.role === "gerant") {
    addBtn.innerHTML = "➕ Créer un xassida";
    addBtn.title = "Créer un xassida directement validé";

    roleInfo.style.display = "block";
    roleInfo.innerHTML = `
      <h3>ℹ️ Information</h3>
      <p>En tant que ${currentUser.role}, vous créez des xassidas directement validés et disponibles pour la lecture.</p>
    `;
  } else {
    addBtn.innerHTML = "➕ Proposer un xassida";
    addBtn.title = "Proposer un xassida pour validation";

    roleInfo.style.display = "block";
    roleInfo.innerHTML = `
      <h3>ℹ️ Information</h3>
      <p>En tant que membre, vos propositions de xassidas doivent être validées par un gérant ou administrateur avant d'être disponibles pour la lecture.</p>
    `;
  }
}

function filterXassidas(filter) {
  // Mettre à jour les onglets
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  
  // Trouver le bon bouton à activer
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach(btn => {
    if ((filter === 'all' && btn.textContent.includes('Tous')) ||
        (filter === 'valide' && btn.textContent.includes('Validés')) ||
        (filter === 'pending' && btn.textContent.includes('En attente'))) {
      btn.classList.add("active");
    }
  });

  let filteredXassidas = window.allXassidas || [];

  switch (filter) {
    case "valide":
      filteredXassidas = filteredXassidas.filter((x) => x.valide);
      break;
    case "pending":
      filteredXassidas = filteredXassidas.filter((x) => !x.valide);
      break;
  }

  displayXassidas(filteredXassidas);
}

// Validation de xassida optimisée avec mise à jour automatique
async function validateXassida(xassidaId) {
  const buttonId = `validate-btn-${xassidaId}`;

  try {
    showLoading(buttonId);

    const xassida = await ApiManager.fetch(`/xassidas/${xassidaId}`);
    const updatedXassida = { 
      ...xassida, 
      valide: true,
      validatedAt: new Date().toISOString(),
      validatedBy: currentUser.id
    };

    // Utiliser la méthode de mise à jour automatique
    await ApiManager.update("xassidas", xassidaId, updatedXassida);

    showNotification("Xassida validé avec succès", "success");

    // Déclencher une mise à jour spéciale pour la validation
    RealtimeUpdater.queueUpdate('xassidasView', 'VALIDATE', { id: xassidaId });
  } catch (error) {
    showNotification("Erreur lors de la validation", "error");
    console.error("Erreur validation xassida:", error);
  } finally {
    hideLoading(buttonId);
  }
}

// Rejet de xassida optimisé avec mise à jour automatique
async function rejectXassida(xassidaId) {
  if (!confirm("Êtes-vous sûr de vouloir rejeter ce xassida ?")) return;

  const buttonId = `reject-btn-${xassidaId}`;

  try {
    showLoading(buttonId);

    // Utiliser la méthode de suppression automatique
    await ApiManager.delete("xassidas", xassidaId);

    showNotification("Xassida rejeté", "warning");

    // Déclencher une mise à jour spéciale pour le rejet
    RealtimeUpdater.queueUpdate('xassidasView', 'REJECT', { id: xassidaId });
  } catch (error) {
    showNotification("Erreur lors du rejet", "error");
    console.error("Erreur rejet xassida:", error);
  } finally {
    hideLoading(buttonId);
  }
}

// Affichage des xassidas avec IDs pour les lignes
function displayXassidas(xassidas) {
  const tbody = document.getElementById("xassidasTableBody");
  tbody.innerHTML = xassidas
    .map((xassida) => {
      const createdBy = (window.allUsers || []).find(
        (u) => String(u.id) === String(xassida.createdBy)
      );
      const canValidate =
        (currentUser.role === "gerant" || currentUser.role === "admin") &&
        !xassida.valide;

      // Déterminer le type de création
      const creationType =
        createdBy && (createdBy.role === "admin" || createdBy.role === "gerant")
          ? "Créé par"
          : "Proposé par";

      return `
        <tr data-xassida-id="${xassida.id}">
          <td>
            <div class="xassida-info">
              <strong>${xassida.titre}</strong>
              ${xassida.category ? `<span class="category-badge">${xassida.category}</span>` : ''}
            </div>
          </td>
          <td>${xassida.auteur}</td>
          <td>
            <span class="status-badge ${
              xassida.valide ? "status-valide" : "status-pending"
            }">
              ${xassida.valide ? "✅ Validé" : "⏳ En attente"}
            </span>
          </td>
          <td>
            <div>
              <small class="text-muted">${creationType}</small>
              <br>
              <strong>${createdBy ? createdBy.nom : "N/A"}</strong>
            </div>
          </td>
          <td class="actions-cell">
            ${
              canValidate
                ? `
                <button id="validate-btn-${xassida.id}" class="btn btn-success btn-small" onclick="validateXassida('${xassida.id}')">✅ Valider</button>
                <button id="reject-btn-${xassida.id}" class="btn btn-danger btn-small" onclick="rejectXassida('${xassida.id}')">❌ Rejeter</button>
              `
                : xassida.valide &&
                  (currentUser.role === "admin" ||
                    currentUser.role === "gerant")
                ? `
                <button class="btn btn-warning btn-small" onclick="editXassida('${xassida.id}')">✏️ Modifier</button>
                <button class="btn btn-danger btn-small" onclick="deleteXassida('${xassida.id}')">🗑️ Supprimer</button>
              `
                : ""
            }
          </td>
        </tr>
      `;
    })
    .join("");
}

function showAddXassidaForm() {
  const formTitle = document.getElementById("xassidaFormTitle");
  const submitBtn = document.querySelector(
    "#xassidaForm button[type='submit']"
  );

  if (currentUser.role === "admin" || currentUser.role === "gerant") {
    formTitle.textContent = "Créer un nouveau xassida";
    submitBtn.innerHTML = "💾 Créer";
  } else {
    formTitle.textContent = "Proposer un nouveau xassida";
    submitBtn.innerHTML = "💾 Proposer";
  }

  document.getElementById("xassidaFormContainer").style.display = "block";
}

function hideXassidaForm() {
  const form = document.getElementById("xassidaForm");
  form.reset();
  delete form.dataset.editId;
  document.getElementById("xassidaFormContainer").style.display = "none";
}

async function handleXassidaSubmit(e) {
  e.preventDefault();

  const editId = e.target.dataset.editId;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  try {
    showLoading(submitBtn.id || "xassida-submit-btn");

    if (editId) {
      // Mode modification avec mise à jour automatique
      const xassidaData = {
        id: editId,
        titre: document.getElementById("xassidaTitre").value,
        auteur: document.getElementById("xassidaAuteur").value,
        valide: true,
        createdBy: currentUser.id,
      };

      await ApiManager.update("xassidas", editId, xassidaData);

      showNotification("Xassida modifié avec succès", "success");
      delete e.target.dataset.editId;
      hideXassidaForm();
    } else {
      // Mode création avec mise à jour automatique
      const isDirectlyValid =
        currentUser.role === "admin" || currentUser.role === "gerant";

      const xassidaData = {
        titre: document.getElementById("xassidaTitre").value,
        auteur: document.getElementById("xassidaAuteur").value,
        valide: isDirectlyValid,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        category: "spirituel", // Valeur par défaut
        difficulty: "facile"
      };

      if (isDirectlyValid) {
        xassidaData.validatedAt = new Date().toISOString();
        xassidaData.validatedBy = currentUser.id;
      }

      await ApiManager.create("xassidas", xassidaData);

      const successMessage = isDirectlyValid
        ? "Xassida créé et disponible pour la lecture !"
        : "Xassida proposé avec succès, en attente de validation";

      showNotification(successMessage, "success");
      hideXassidaForm();
    }
  } catch (error) {
    const errorMessage =
      currentUser.role === "admin" || currentUser.role === "gerant"
        ? "Erreur lors de la création"
        : "Erreur lors de la proposition";

    showNotification(errorMessage, "error");
    console.error("Erreur xassida:", error);
  } finally {
    hideLoading(submitBtn.id || "xassida-submit-btn");
  }
}

// Chargement du formulaire de lecture avec vérifications optimisé
async function loadLectureForm() {
  try {
    showLoading();

    // Utiliser les données synchronisées
    let xassidas = StateManager.getState("xassidas").filter((x) => x.valide);
    let evenements = StateManager.getState("evenements");

    if (xassidas.length === 0 || evenements.length === 0) {
      [xassidas, evenements] = await ApiManager.batchFetch([
        "/xassidas?valide=true",
        "/evenements",
      ]);
    }

    // Filtrer les événements selon le diwane ET le statut actif
    const filteredEvenements = evenements.filter(
      (e) =>
        (e.type === "global" || e.diwaneId == currentUser.diwaneId) &&
        e.status === "active"
    );

    const xassidaSelect = document.getElementById("lectureXassida");
    const evenementSelect = document.getElementById("lectureEvenement");
    const lectureForm = document.getElementById("lectureForm");
    const lectureSection = lectureForm.parentElement;

    // Vérifier s'il y a des données disponibles
    if (xassidas.length === 0 && filteredEvenements.length === 0) {
      lectureForm.style.display = "none";
      const existingMessage = lectureSection.querySelector(".info-message");
      if (existingMessage) existingMessage.remove();

      const infoMessage = document.createElement("div");
      infoMessage.className = "info-message";
      infoMessage.innerHTML = `
        <h3>📋 Aucun enregistrement possible</h3>
        <p>Il n'y a actuellement aucun xassida validé et aucun événement actif.<br>
        Contactez votre gérant pour plus d'informations.</p>
      `;
      lectureSection.insertBefore(infoMessage, lectureForm);
    } else if (xassidas.length === 0) {
      lectureForm.style.display = "none";
      const existingMessage = lectureSection.querySelector(".info-message");
      if (existingMessage) existingMessage.remove();

      const infoMessage = document.createElement("div");
      infoMessage.className = "info-message";
      infoMessage.innerHTML = `
        <h3>📖 Aucun xassida disponible</h3>
        <p>Il n'y a actuellement aucun xassida validé pour l'enregistrement.<br>
        Vous pouvez proposer de nouveaux xassidas dans la section "Xassidas".</p>
      `;
      lectureSection.insertBefore(infoMessage, lectureForm);
    } else if (filteredEvenements.length === 0) {
      lectureForm.style.display = "none";
      const existingMessage = lectureSection.querySelector(".info-message");
      if (existingMessage) existingMessage.remove();

      const infoMessage = document.createElement("div");
      infoMessage.className = "info-message";
      infoMessage.innerHTML = `
        <h3>📅 Aucun événement actif</h3>
        <p>Il n'y a actuellement aucun événement actif pour votre diwane.<br>
        Les enregistrements de lectures ne sont possibles que pendant les événements actifs.</p>
      `;
      lectureSection.insertBefore(infoMessage, lectureForm);
    } else {
      lectureForm.style.display = "block";
      const existingMessage = lectureSection.querySelector(".info-message");
      if (existingMessage) existingMessage.remove();

      xassidaSelect.innerHTML =
        '<option value="">Sélectionner un xassida</option>' +
        xassidas
          .map(
            (x) => `<option value="${x.id}">${x.titre} - ${x.auteur}</option>`
          )
          .join("");

      evenementSelect.innerHTML =
        '<option value="">Sélectionner un événement</option>' +
        filteredEvenements
          .map((e) => `<option value="${e.id}">${e.nom}</option>`)
          .join("");
    }
  } catch (error) {
    console.error("Erreur chargement formulaire lecture:", error);
    showNotification("Erreur lors du chargement du formulaire", "error");
  } finally {
    hideLoading();
  }
}

// Gestion du profil
function loadProfil() {
  document.getElementById("profilNom").value = currentUser.nom;
  document.getElementById("profilEmail").value = currentUser.email;
  document.getElementById("profilPassword").value = "";
}

async function handleProfilSubmit(e) {
  e.preventDefault();

  const profilData = {
    ...currentUser,
    nom: document.getElementById("profilNom").value,
    email: document.getElementById("profilEmail").value,
  };

  const newPassword = document.getElementById("profilPassword").value;
  if (newPassword) {
    profilData.password = newPassword;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');

  try {
    showLoading(submitBtn.id);

    // Utiliser la méthode de mise à jour automatique
    await ApiManager.update("users", currentUser.id, profilData);

    // Mettre à jour l'utilisateur local
    currentUser = profilData;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    showNotification("Profil mis à jour avec succès", "success");
    updateNavigation();
  } catch (error) {
    showNotification("Erreur lors de la mise à jour", "error");
    console.error("Erreur mise à jour profil:", error);
  } finally {
    hideLoading(submitBtn.id);
  }
}

// Gestion des événements optimisée avec synchronisation
async function loadEvenements() {
  try {
    // Utiliser les données synchronisées
    let evenements = StateManager.getState("evenements");
    let diwanes = StateManager.getState("diwanes");

    if (evenements.length === 0 || diwanes.length === 0) {
      [evenements, diwanes] = await ApiManager.batchFetch([
        "/evenements",
        "/diwanes",
      ]);
      StateManager.updateState("evenements", evenements);
      StateManager.updateState("diwanes", diwanes);
    }

    // Filtrer selon le rôle
    let filteredEvenements = evenements;
    if (currentUser.role === "gerant") {
      filteredEvenements = evenements.filter(
        (e) => e.type === "global" || e.diwaneId == currentUser.diwaneId
      );
    }

    const tbody = document.getElementById("evenementsTableBody");
    tbody.innerHTML = filteredEvenements
      .map((evenement) => {
        const diwane = diwanes.find((d) => d.id == evenement.diwaneId);
        const canManage =
          currentUser.role === "admin" ||
          (currentUser.role === "gerant" &&
            evenement.diwaneId == currentUser.diwaneId);
        const isActive = evenement.status === "active";

        return `
          <tr data-evenement-id="${evenement.id}">
            <td>
              <div class="evenement-info">
                <strong>${evenement.nom}</strong>
                ${evenement.description ? `<br><small class="text-muted">${evenement.description}</small>` : ''}
              </div>
            </td>
            <td>
              <div class="date-info">
                <strong>${new Date(evenement.date).toLocaleDateString("fr-FR")}</strong>
                ${evenement.dateDebut && evenement.dateFin ? 
                  `<br><small class="text-muted">Du ${new Date(evenement.dateDebut).toLocaleDateString("fr-FR")} au ${new Date(evenement.dateFin).toLocaleDateString("fr-FR")}</small>` 
                  : ''}
              </div>
            </td>
            <td>
              <span class="status-badge status-${evenement.type}">
                ${evenement.type === "global" ? "🌍 Global" : "🏠 Local"}
              </span>
            </td>
            <td>
              <span class="status-badge status-${
                isActive ? "active" : "inactive"
              }">
                ${isActive ? "✅ Actif" : "❌ Inactif"}
              </span>
            </td>
            <td>${diwane ? diwane.nom : "Tous"}</td>
            <td class="actions-cell">
              ${
                canManage
                  ? `
                <label class="status-toggle">
                  <input type="checkbox" ${isActive ? "checked" : ""} 
                         onchange="toggleEvenementStatus('${
                           evenement.id
                         }', ${isActive})">
                  <span class="slider"></span>
                </label>
                <button class="btn btn-danger btn-small" onclick="deleteEvenement('${
                  evenement.id
                }')">🗑️ Supprimer</button>
              `
                  : ""
              }
            </td>
          </tr>
        `;
      })
      .join("");

    // Configurer le formulaire selon le rôle
    const typeGroup = document.getElementById("evenementTypeGroup");
    const typeSelect = document.getElementById("evenementType");

    if (currentUser.role === "admin") {
      typeGroup.style.display = "block";
      typeSelect.innerHTML = `
                <option value="local">Local (mon diwane)</option>
                <option value="global">Global (tous les diwanes)</option>
            `;
    } else if (currentUser.role === "gerant") {
      typeGroup.style.display = "none";
      typeSelect.value = "local";
    }
  } catch (error) {
    console.error("Erreur chargement événements:", error);
  }
}

// Basculer le statut d'un événement avec mise à jour automatique
async function toggleEvenementStatus(evenementId, currentStatus) {
  try {
    const evenement = await ApiManager.fetch(`/evenements/${evenementId}`);
    const updatedEvenement = {
      ...evenement,
      status: currentStatus ? "inactive" : "active",
    };

    // Utiliser la méthode de mise à jour automatique
    await ApiManager.update("evenements", evenementId, updatedEvenement);

    showNotification(
      `Événement ${currentStatus ? "désactivé" : "activé"} avec succès`,
      "success"
    );

    // Déclencher une mise à jour spéciale pour le changement de statut
    RealtimeUpdater.queueUpdate('evenementsView', 'TOGGLE_STATUS', { 
      id: evenementId, 
      status: updatedEvenement.status 
    });
  } catch (error) {
    showNotification("Erreur lors de la modification du statut", "error");
    console.error("Erreur toggle statut:", error);
  }
}

async function handleEvenementSubmit(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');

  try {
    showLoading(submitBtn.id || "evenement-submit-btn");

    const type = document.getElementById("evenementType").value;
    const evenementData = {
      nom: document.getElementById("evenementNom").value,
      date: document.getElementById("evenementDate").value,
      type: type,
      status: "active",
      diwaneId: type === "global" ? null : currentUser.diwaneId,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      description: `Événement ${type} créé par ${currentUser.nom}`
    };

    // Utiliser la méthode de création automatique
    await ApiManager.create("evenements", evenementData);

    showNotification("Événement créé avec succès", "success");
    document.getElementById("evenementForm").reset();
    hideEvenementForm();
  } catch (error) {
    showNotification("Erreur lors de la création", "error");
    console.error("Erreur création événement:", error);
  } finally {
    hideLoading(submitBtn.id || "evenement-submit-btn");
  }
}

async function deleteEvenement(evenementId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) return;

  try {
    // Utiliser la méthode de suppression automatique
    await ApiManager.delete("evenements", evenementId);
    showNotification("Événement supprimé avec succès", "success");
  } catch (error) {
    showNotification("Erreur lors de la suppression", "error");
    console.error("Erreur suppression événement:", error);
  }
}

function showAddEvenementForm() {
  document.getElementById("evenementFormContainer").style.display = "block";
}

function hideEvenementForm() {
  document.getElementById("evenementFormContainer").style.display = "none";
}

// Recensement optimisé avec synchronisation
async function loadRecensementFilters() {
  try {
    let evenements = StateManager.getState("evenements");

    if (evenements.length === 0) {
      evenements = await ApiManager.loadAndSyncData("evenements");
    }

    // Filtrer selon le rôle
    let filteredEvenements = evenements;
    if (currentUser.role === "gerant") {
      filteredEvenements = evenements.filter(
        (e) => e.type === "global" || e.diwaneId == currentUser.diwaneId
      );
    }

    const select = document.getElementById("filterEvenement");
    if (select) {
      select.innerHTML =
        '<option value="">Tous les événements</option>' +
        filteredEvenements
          .map((e) => `<option value="${e.id}">${e.nom}</option>`)
          .join("");
    }
  } catch (error) {
    console.error("Erreur chargement filtres recensement:", error);
  }
}

async function loadRecensement() {
  try {
    showLoading();

    // Utiliser les données synchronisées
    let lectures = StateManager.getState("lectures");
    let users = StateManager.getState("users");
    let xassidas = StateManager.getState("xassidas");
    let evenements = StateManager.getState("evenements");

    if (lectures.length === 0 || users.length === 0) {
      [lectures, users, xassidas, evenements] = await ApiManager.batchFetch([
        "/lectures",
        "/users",
        "/xassidas",
        "/evenements",
      ]);

      StateManager.updateState("lectures", lectures);
      StateManager.updateState("users", users);
      StateManager.updateState("xassidas", xassidas);
      StateManager.updateState("evenements", evenements);
    }

    // Filtrer les lectures selon le rôle et le filtre d'événement
    let filteredLectures = lectures;

    if (currentUser.role === "gerant") {
      // Gérant ne voit que les lectures de son diwane
      filteredLectures = lectures.filter((l) => {
        const user = users.find((u) => u.id == l.userId);
        return user && user.diwaneId == currentUser.diwaneId;
      });
    }

    // Filtre par événement
    const evenementFilter = document.getElementById("filterEvenement").value;
    if (evenementFilter) {
      filteredLectures = filteredLectures.filter(
        (l) => l.evenementId == evenementFilter
      );
    }

    const tbody = document.getElementById("recensementTableBody");
    tbody.innerHTML = filteredLectures
      .map((lecture) => {
        const user = users.find((u) => u.id == lecture.userId);
        const xassida = xassidas.find(
          (x) => x.id == lecture.xassidaId
        );
        const evenement = evenements.find(
          (e) => e.id == lecture.evenementId
        );

        return `
          <tr>
            <td>
              <div class="user-lecture-info">
                <strong>${user ? user.nom : "N/A"}</strong>
                ${user ? `<br><small class="text-muted">${user.email}</small>` : ''}
              </div>
            </td>
            <td>
              <div class="xassida-lecture-info">
                <strong>${xassida ? xassida.titre : "N/A"}</strong>
                ${xassida ? `<br><small class="text-muted">${xassida.auteur}</small>` : ''}
              </div>
            </td>
            <td>${evenement ? evenement.nom : "N/A"}</td>
            <td>
              <span class="lecture-count">${lecture.nombre}</span>
              ${lecture.notes ? `<br><small class="text-muted">${lecture.notes}</small>` : ''}
            </td>
            <td>${new Date(lecture.createdAt || Date.now()).toLocaleDateString("fr-FR")}</td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Erreur chargement recensement:", error);
    showNotification("Erreur lors du chargement du recensement", "error");
  } finally {
    hideLoading();
  }
}

// Gestion des lectures optimisée avec synchronisation
async function loadMesLectures() {
  try {
    // Utiliser les données synchronisées
    let lectures = StateManager.getState("lectures");
    let xassidas = StateManager.getState("xassidas");
    let evenements = StateManager.getState("evenements");

    if (lectures.length === 0) {
      [lectures, xassidas, evenements] = await ApiManager.batchFetch([
        "/lectures",
        "/xassidas",
        "/evenements",
      ]);
      StateManager.updateState("lectures", lectures);
      StateManager.updateState("xassidas", xassidas);
      StateManager.updateState("evenements", evenements);
    }

    // Filtrer les lectures de l'utilisateur actuel
    const mesLectures = lectures.filter((l) => l.userId == currentUser.id);

    const tbody = document.getElementById("mesLecturesTableBody");
    tbody.innerHTML = mesLectures
      .map((lecture) => {
        const xassida = xassidas.find((x) => x.id == lecture.xassidaId);
        const evenement = evenements.find((e) => e.id == lecture.evenementId);

        return `
          <tr>
            <td>
              <div class="xassida-lecture-info">
                <strong>${xassida ? xassida.titre : "N/A"}</strong>
                ${xassida ? `<br><small class="text-muted">${xassida.auteur}</small>` : ''}
              </div>
            </td>
            <td>${evenement ? evenement.nom : "N/A"}</td>
            <td>
              <span class="lecture-count">${lecture.nombre}</span>
              ${lecture.notes ? `<br><small class="text-muted">${lecture.notes}</small>` : ''}
            </td>
            <td>${new Date(lecture.createdAt || Date.now()).toLocaleDateString("fr-FR")}</td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Erreur chargement mes lectures:", error);
  }
}

async function handleLectureSubmit(e) {
  e.preventDefault();

  const submitBtn = e.target.querySelector('button[type="submit"]');

  try {
    showLoading(submitBtn.id || "lecture-submit-btn");

    const lectureData = {
      userId: currentUser.id,
      xassidaId: document.getElementById("lectureXassida").value,
      evenementId: document.getElementById("lectureEvenement").value,
      nombre: Number.parseInt(document.getElementById("lectureNombre").value),
      createdAt: new Date().toISOString(),
      notes: "" // Peut être étendu avec un champ notes
    };

    // Utiliser la méthode de création automatique
    await ApiManager.create("lectures", lectureData);

    showNotification("Lecture enregistrée avec succès", "success");
    document.getElementById("lectureForm").reset();
  } catch (error) {
    showNotification("Erreur lors de l'enregistrement", "error");
    console.error("Erreur enregistrement lecture:", error);
  } finally {
    hideLoading(submitBtn.id || "lecture-submit-btn");
  }
}

// Fonctions utilitaires optimisées
function showLoading(elementId = null) {
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add("loading");
      element.disabled = true;
    }
  } else {
    document.getElementById("loadingOverlay").classList.add("show");
  }
}

function hideLoading(elementId = null) {
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove("loading");
      element.disabled = false;
    }
  } else {
    document.getElementById("loadingOverlay").classList.remove("show");
  }
}

// Fonctions utilitaires
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification ${type} show`;

  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

function showDashboard() {
  showView("dashboardView");
}

// Gestion des erreurs globales
window.addEventListener("error", (e) => {
  console.error("Erreur globale:", e.error);
  showNotification("Une erreur est survenue", "error");
});

// Gestion des erreurs de fetch
window.addEventListener("unhandledrejection", (e) => {
  console.error("Promesse rejetée:", e.reason);
  showNotification("Erreur de connexion au serveur", "error");
});

// Fonctions manquantes pour la compatibilité
async function editXassida(xassidaId) {
  try {
    const xassida = await ApiManager.fetch(`/xassidas/${xassidaId}`);

    document.getElementById("xassidaTitre").value = xassida.titre;
    document.getElementById("xassidaAuteur").value = xassida.auteur;

    const formTitle = document.getElementById("xassidaFormTitle");
    const submitBtn = document.querySelector(
      "#xassidaForm button[type='submit']"
    );

    formTitle.textContent = "Modifier le xassida";
    submitBtn.innerHTML = "💾 Modifier";

    document.getElementById("xassidaForm").dataset.editId = xassidaId;
    document.getElementById("xassidaFormContainer").style.display = "block";
  } catch (error) {
    showNotification("Erreur lors du chargement du xassida", "error");
    console.error("Erreur chargement xassida:", error);
  }
}

async function deleteXassida(xassidaId) {
  if (
    !confirm(
      "Êtes-vous sûr de vouloir supprimer ce xassida ? Cette action est irréversible."
    )
  )
    return;

  try {
    // Utiliser la méthode de suppression automatique
    await ApiManager.delete("xassidas", xassidaId);
    showNotification("Xassida supprimé avec succès", "success");
  } catch (error) {
    showNotification("Erreur lors de la suppression", "error");
    console.error("Erreur suppression xassida:", error);
  }
}