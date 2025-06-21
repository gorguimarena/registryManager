// Configuration de l'API
const API_BASE_URL = "http://localhost:3000"

// État global de l'application
let currentUser = null
let currentView = "login"

// Initialisation de l'application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})

// Initialisation
function initializeApp() {
  // Vérifier si un utilisateur est connecté
  const savedUser = localStorage.getItem("currentUser")
  if (savedUser) {
    currentUser = JSON.parse(savedUser)
    showDashboard()
  } else {
    showView("loginView")
  }

  // Attacher les événements
  attachEventListeners()
}

// Attacher les événements
function attachEventListeners() {
  // Formulaire de connexion
  document.getElementById("loginForm").addEventListener("submit", handleLogin)

  // Formulaire d'inscription
  document.getElementById("registerForm").addEventListener("submit", handleRegister)

  // Formulaires
  document.getElementById("userForm").addEventListener("submit", handleUserSubmit)
  document.getElementById("xassidaForm").addEventListener("submit", handleXassidaSubmit)
  document.getElementById("evenementForm").addEventListener("submit", handleEvenementSubmit)
  document.getElementById("lectureForm").addEventListener("submit", handleLectureSubmit)
  document.getElementById("profilForm").addEventListener("submit", handleProfilSubmit)

  // Filtre de recensement
  document.getElementById("filterEvenement").addEventListener("change", loadRecensement)
}

// Gestion de la connexion
async function handleLogin(e) {
  e.preventDefault()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const errorDiv = document.getElementById("loginError")

  try {
    const response = await fetch(`${API_BASE_URL}/users?email=${email}&password=${password}`)
    const users = await response.json()

    if (users.length > 0) {
      currentUser = users[0]
      localStorage.setItem("currentUser", JSON.stringify(currentUser))
      showDashboard()
      showNotification("Connexion réussie !", "success")
    } else {
      errorDiv.textContent = "Email ou mot de passe incorrect"
    }
  } catch (error) {
    errorDiv.textContent = "Erreur de connexion"
    console.error("Erreur de connexion:", error)
  }
}

// Gestion de l'inscription
async function handleRegister(e) {
  e.preventDefault()

  const nom = document.getElementById("registerNom").value
  const email = document.getElementById("registerEmail").value
  const password = document.getElementById("registerPassword").value
  const diwaneId = Number.parseInt(document.getElementById("registerDiwane").value)
  const errorDiv = document.getElementById("registerError")

  try {
    // Vérifier si l'email existe déjà
    const existingUsers = await fetch(`${API_BASE_URL}/users?email=${email}`).then((r) => r.json())

    if (existingUsers.length > 0) {
      errorDiv.textContent = "Cet email est déjà utilisé"
      return
    }

    // Créer le nouveau compte membre
    const userData = {
      nom: nom,
      email: email,
      password: password,
      diwaneId: diwaneId,
      role: "membre",
    }

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })

    if (response.ok) {
      showNotification("Compte créé avec succès ! Vous pouvez maintenant vous connecter.", "success")
      showView("loginView")
      document.getElementById("registerForm").reset()
    } else {
      errorDiv.textContent = "Erreur lors de la création du compte"
    }
  } catch (error) {
    errorDiv.textContent = "Erreur de connexion"
    console.error("Erreur inscription:", error)
  }
}

// Déconnexion
function logout() {
  currentUser = null
  localStorage.removeItem("currentUser")
  showView("loginView")
  showNotification("Déconnexion réussie", "success")
}

// Affichage des vues
function showView(viewId) {
  // Masquer toutes les vues
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("active")
  })

  // Afficher la vue demandée
  document.getElementById(viewId).classList.add("active")
  currentView = viewId

  // Mettre à jour la navigation
  updateNavigation()

  // Charger les données spécifiques à la vue
  loadViewData(viewId)
}

// Mise à jour de la navigation
function updateNavigation() {
  const nav = document.getElementById("navigation")
  const userInfo = document.getElementById("userInfo")

  if (!currentUser) {
    nav.innerHTML = ""
    userInfo.innerHTML = ""
    return
  }

  // Navigation selon le rôle
  const navItems = [
    { id: "dashboardView", text: "📊 Tableau de bord", roles: ["membre", "gerant", "admin"] },
    { id: "xassidasView", text: "📖 Xassidas", roles: ["membre", "gerant", "admin"] },
    { id: "evenementsView", text: "📅 Événements", roles: ["gerant", "admin"] },
    { id: "lecturesView", text: "📚 Mes lectures", roles: ["membre", "gerant"] },
    { id: "recensementView", text: "📊 Recensement", roles: ["gerant", "admin"] },
    { id: "usersView", text: "👥 Utilisateurs", roles: ["admin"] },
    { id: "profilView", text: "👤 Mon profil", roles: ["membre", "gerant", "admin"] },
  ]

  nav.innerHTML = navItems
    .filter((item) => item.roles.includes(currentUser.role))
    .map(
      (item) => `
            <button class="nav-btn ${currentView === item.id ? "active" : ""}" 
                    onclick="showView('${item.id}')">
                ${item.text}
            </button>
        `,
    )
    .join("")

  // Informations utilisateur
  userInfo.innerHTML = `
        <span>👋 ${currentUser.nom} (${currentUser.role})</span>
        <button class="logout-btn" onclick="logout()">🚪 Déconnexion</button>
    `
}

// Chargement des données par vue
async function loadViewData(viewId) {
  switch (viewId) {
    case "dashboardView":
      await loadDashboard()
      break
    case "usersView":
      await loadUsers()
      await loadDiwanes()
      break
    case "xassidasView":
      await loadXassidas()
      break
    case "evenementsView":
      await loadEvenements()
      break
    case "lecturesView":
      await loadLectureForm()
      await loadMesLectures()
      break
    case "recensementView":
      await loadRecensementFilters()
      await loadRecensement()
      break
    case "profilView":
      loadProfil()
      break
    case "registerView":
      await loadDiwanesForRegister()
      break
  }
}

// Tableau de bord
async function loadDashboard() {
  try {
    const [users, xassidas, evenements, lectures] = await Promise.all([
      fetch(`${API_BASE_URL}/users`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/xassidas`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/evenements`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/lectures`).then((r) => r.json()),
    ])

    const stats = document.getElementById("dashboardStats")

    let statsHtml = `
            <div class="stat-card">
                <h3>📖 Xassidas validés</h3>
                <div class="stat-number">${xassidas.filter((x) => x.valide).length}</div>
            </div>
            <div class="stat-card">
                <h3>📅 Événements</h3>
                <div class="stat-number">${evenements.length}</div>
            </div>
        `

    if (currentUser.role === "admin") {
      statsHtml += `
                <div class="stat-card">
                    <h3>👥 Utilisateurs</h3>
                    <div class="stat-number">${users.length}</div>
                </div>
            `
    }

    if (currentUser.role === "gerant" || currentUser.role === "admin") {
      const diwaneLectures = lectures.filter((l) => {
        const user = users.find((u) => u.id === l.userId)
        return currentUser.role === "admin" || user?.diwaneId === currentUser.diwaneId
      })

      statsHtml += `
                <div class="stat-card">
                    <h3>📚 Total lectures</h3>
                    <div class="stat-number">${diwaneLectures.reduce((sum, l) => sum + l.nombre, 0)}</div>
                </div>
            `
    } else {
      const mesLectures = lectures.filter((l) => l.userId === currentUser.id)
      statsHtml += `
                <div class="stat-card">
                    <h3>📚 Mes lectures</h3>
                    <div class="stat-number">${mesLectures.reduce((sum, l) => sum + l.nombre, 0)}</div>
                </div>
            `
    }

    stats.innerHTML = statsHtml
  } catch (error) {
    console.error("Erreur chargement dashboard:", error)
  }
}

// Gestion des utilisateurs
async function loadUsers() {
  try {
    const [users, diwanes] = await Promise.all([
      fetch(`${API_BASE_URL}/users`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/diwanes`).then((r) => r.json()),
    ])

    const tbody = document.getElementById("usersTableBody")
    tbody.innerHTML = users
      .map((user) => {
        const diwane = diwanes.find((d) => d.id === user.diwaneId)
        return `
                <tr>
                    <td>${user.nom}</td>
                    <td>${user.email}</td>
                    <td><span class="status-badge status-${user.role}">${user.role}</span></td>
                    <td>${diwane ? diwane.nom : "N/A"}</td>
                    <td>
                        <button class="btn btn-warning btn-small" onclick="editUser(${user.id})">✏️ Modifier</button>
                        <button class="btn btn-danger btn-small" onclick="deleteUser(${user.id})">🗑️ Supprimer</button>
                    </td>
                </tr>
            `
      })
      .join("")
  } catch (error) {
    console.error("Erreur chargement utilisateurs:", error)
  }
}

async function loadDiwanes() {
  try {
    const diwanes = await fetch(`${API_BASE_URL}/diwanes`).then((r) => r.json())
    const select = document.getElementById("userDiwane")
    select.innerHTML = diwanes.map((d) => `<option value="${d.id}">${d.nom}</option>`).join("")
  } catch (error) {
    console.error("Erreur chargement diwanes:", error)
  }
}

// Charger les diwanes pour l'inscription
async function loadDiwanesForRegister() {
  try {
    const diwanes = await fetch(`${API_BASE_URL}/diwanes`).then((r) => r.json())
    const select = document.getElementById("registerDiwane")
    select.innerHTML =
      '<option value="">Sélectionner votre diwane</option>' +
      diwanes.map((d) => `<option value="${d.id}">${d.nom}</option>`).join("")
  } catch (error) {
    console.error("Erreur chargement diwanes:", error)
  }
}

function showAddUserForm() {
  document.getElementById("userFormContainer").style.display = "block"
  document.getElementById("userFormTitle").textContent = "Ajouter un utilisateur"
  document.getElementById("userForm").reset()
  document.getElementById("userId").value = ""
}

function hideUserForm() {
  document.getElementById("userFormContainer").style.display = "none"
}

async function editUser(userId) {
  try {
    const user = await fetch(`${API_BASE_URL}/users/${userId}`).then((r) => r.json())

    document.getElementById("userId").value = user.id
    document.getElementById("userName").value = user.nom
    document.getElementById("userEmail").value = user.email
    document.getElementById("userPassword").value = user.password
    document.getElementById("userRole").value = user.role
    document.getElementById("userDiwane").value = user.diwaneId

    document.getElementById("userFormTitle").textContent = "Modifier un utilisateur"
    document.getElementById("userFormContainer").style.display = "block"
  } catch (error) {
    console.error("Erreur chargement utilisateur:", error)
  }
}

async function deleteUser(userId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return

  try {
    await fetch(`${API_BASE_URL}/users/${userId}`, { method: "DELETE" })
    showNotification("Utilisateur supprimé avec succès", "success")
    loadUsers()
  } catch (error) {
    showNotification("Erreur lors de la suppression", "error")
    console.error("Erreur suppression utilisateur:", error)
  }
}

async function handleUserSubmit(e) {
  e.preventDefault()

  const userId = document.getElementById("userId").value
  const userData = {
    nom: document.getElementById("userName").value,
    email: document.getElementById("userEmail").value,
    password: document.getElementById("userPassword").value,
    role: document.getElementById("userRole").value,
    diwaneId: Number.parseInt(document.getElementById("userDiwane").value),
  }

  try {
    if (userId) {
      // Modification
      await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...userData, id: Number.parseInt(userId) }),
      })
      showNotification("Utilisateur modifié avec succès", "success")
    } else {
      // Création
      await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })
      showNotification("Utilisateur créé avec succès", "success")
    }

    hideUserForm()
    loadUsers()
  } catch (error) {
    showNotification("Erreur lors de l'enregistrement", "error")
    console.error("Erreur sauvegarde utilisateur:", error)
  }
}

// Gestion des xassidas
async function loadXassidas() {
  try {
    const [xassidas, users] = await Promise.all([
      fetch(`${API_BASE_URL}/xassidas`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/users`).then((r) => r.json()),
    ])

    window.allXassidas = xassidas
    window.allUsers = users

    // Afficher l'onglet "En attente" seulement pour les gérants/admins
    const pendingTab = document.getElementById("pendingTab")
    if (currentUser.role === "gerant" || currentUser.role === "admin") {
      pendingTab.style.display = "block"
    } else {
      pendingTab.style.display = "none"
    }

    // Configurer l'interface selon le rôle
    configureXassidaInterface()

    filterXassidas("all")
  } catch (error) {
    console.error("Erreur chargement xassidas:", error)
  }
}

// Configuration de l'interface selon le rôle
function configureXassidaInterface() {
  const addBtn = document.getElementById("addXassidaBtn")
  const roleInfo = document.getElementById("xassidaRoleInfo")

  if (currentUser.role === "admin" || currentUser.role === "gerant") {
    addBtn.innerHTML = "➕ Créer un xassida"
    addBtn.title = "Créer un xassida directement validé"

    roleInfo.style.display = "block"
    roleInfo.innerHTML = `
      <h3>ℹ️ Information</h3>
      <p>En tant que ${currentUser.role}, vous créez des xassidas directement validés et disponibles pour la lecture.</p>
    `
  } else {
    addBtn.innerHTML = "➕ Proposer un xassida"
    addBtn.title = "Proposer un xassida pour validation"

    roleInfo.style.display = "block"
    roleInfo.innerHTML = `
      <h3>ℹ️ Information</h3>
      <p>En tant que membre, vos propositions de xassidas doivent être validées par un gérant ou administrateur avant d'être disponibles pour la lecture.</p>
    `
  }
}

function filterXassidas(filter) {
  // Mettre à jour les onglets
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"))
  event.target.classList.add("active")

  let filteredXassidas = window.allXassidas || []

  switch (filter) {
    case "valide":
      filteredXassidas = filteredXassidas.filter((x) => x.valide)
      break
    case "pending":
      filteredXassidas = filteredXassidas.filter((x) => !x.valide)
      break
  }

  displayXassidas(filteredXassidas)
}

// Fonctions utilitaires pour le chargement
function showLoading(elementId = null) {
  if (elementId) {
    const element = document.getElementById(elementId)
    if (element) {
      element.classList.add("loading")
      element.disabled = true
    }
  } else {
    document.getElementById("loadingOverlay").classList.add("show")
  }
}

function hideLoading(elementId = null) {
  if (elementId) {
    const element = document.getElementById(elementId)
    if (element) {
      element.classList.remove("loading")
      element.disabled = false
    }
  } else {
    document.getElementById("loadingOverlay").classList.remove("show")
  }
}

// Fonction pour animer la mise à jour d'une ligne
function animateRowUpdate(rowElement) {
  rowElement.classList.add("row-updated")
  setTimeout(() => {
    rowElement.classList.add("fade-out")
    setTimeout(() => {
      rowElement.classList.remove("row-updated", "fade-out")
    }, 500)
  }, 1000)
}

// Validation de xassida optimisée
async function validateXassida(xassidaId) {
  const buttonId = `validate-btn-${xassidaId}`

  try {
    showLoading(buttonId)

    const xassida = await fetch(`${API_BASE_URL}/xassidas/${xassidaId}`).then((r) => r.json())

    await fetch(`${API_BASE_URL}/xassidas/${xassidaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...xassida, valide: true }),
    })

    // Mise à jour optimisée : juste mettre à jour la ligne concernée
    updateXassidaRow(xassidaId, { ...xassida, valide: true })

    showNotification("Xassida validé avec succès", "success")

    // Recharger seulement si on est sur l'onglet "En attente"
    const activeTab = document.querySelector(".tab-btn.active")
    if (activeTab && activeTab.textContent.includes("En attente")) {
      // Retirer la ligne de l'affichage actuel
      const row = document.querySelector(`tr[data-xassida-id="${xassidaId}"]`)
      if (row) {
        row.style.opacity = "0"
        setTimeout(() => row.remove(), 300)
      }
    }
  } catch (error) {
    showNotification("Erreur lors de la validation", "error")
    console.error("Erreur validation xassida:", error)
  } finally {
    hideLoading(buttonId)
  }
}

// Fonction pour mettre à jour une ligne de xassida
function updateXassidaRow(xassidaId, updatedXassida) {
  const row = document.querySelector(`tr[data-xassida-id="${xassidaId}"]`)
  if (row) {
    const statusCell = row.querySelector(".status-badge")
    if (statusCell) {
      statusCell.className = "status-badge status-valide"
      statusCell.textContent = "✅ Validé"
    }

    // Animer la mise à jour
    animateRowUpdate(row)

    // Mettre à jour les données globales
    if (window.allXassidas) {
      const index = window.allXassidas.findIndex((x) => x.id === xassidaId)
      if (index !== -1) {
        window.allXassidas[index] = updatedXassida
      }
    }
  }
}

// Rejet de xassida optimisé
async function rejectXassida(xassidaId) {
  if (!confirm("Êtes-vous sûr de vouloir rejeter ce xassida ?")) return

  const buttonId = `reject-btn-${xassidaId}`

  try {
    showLoading(buttonId)

    await fetch(`${API_BASE_URL}/xassidas/${xassidaId}`, { method: "DELETE" })

    // Retirer la ligne avec animation
    const row = document.querySelector(`tr[data-xassida-id="${xassidaId}"]`)
    if (row) {
      row.style.opacity = "0"
      row.style.transform = "translateX(-100%)"
      setTimeout(() => row.remove(), 300)
    }

    // Mettre à jour les données globales
    if (window.allXassidas) {
      window.allXassidas = window.allXassidas.filter((x) => x.id !== xassidaId)
    }

    showNotification("Xassida rejeté", "warning")
  } catch (error) {
    showNotification("Erreur lors du rejet", "error")
    console.error("Erreur rejet xassida:", error)
  } finally {
    hideLoading(buttonId)
  }
}

// Affichage des xassidas avec IDs pour les lignes
function displayXassidas(xassidas) {
  const tbody = document.getElementById("xassidasTableBody")
  tbody.innerHTML = xassidas
    .map((xassida) => {
      const createdBy = window.allUsers?.find((u) => u.id === xassida.createdBy)
      const canValidate = (currentUser.role === "gerant" || currentUser.role === "admin") && !xassida.valide

      // Déterminer le type de création
      const creationType =
        createdBy && (createdBy.role === "admin" || createdBy.role === "gerant") ? "Créé par" : "Proposé par"

      return `
        <tr data-xassida-id="${xassida.id}">
          <td>${xassida.titre}</td>
          <td>${xassida.auteur}</td>
          <td>
            <span class="status-badge ${xassida.valide ? "status-valide" : "status-pending"}">
              ${xassida.valide ? "✅ Validé" : "⏳ En attente"}
            </span>
          </td>
          <td>
            <div>
              <strong>${createdBy ? createdBy.nom : "N/A"}</strong>
              <br>
              <small class="text-muted">${creationType}</small>
            </div>
          </td>
          <td>
            ${
              canValidate
                ? `
                <button id="validate-btn-${xassida.id}" class="btn btn-success btn-small" onclick="validateXassida(${xassida.id})">✅ Valider</button>
                <button id="reject-btn-${xassida.id}" class="btn btn-danger btn-small" onclick="rejectXassida(${xassida.id})">❌ Rejeter</button>
              `
                : xassida.valide && (currentUser.role === "admin" || currentUser.role === "gerant")
                  ? `
                <button class="btn btn-warning btn-small" onclick="editXassida(${xassida.id})">✏️ Modifier</button>
                <button class="btn btn-danger btn-small" onclick="deleteXassida(${xassida.id})">🗑️ Supprimer</button>
              `
                  : ""
            }
          </td>
        </tr>
      `
    })
    .join("")
}

// Modifier un xassida (admin/gérant seulement)
async function editXassida(xassidaId) {
  try {
    const xassida = await fetch(`${API_BASE_URL}/xassidas/${xassidaId}`).then((r) => r.json())

    // Pré-remplir le formulaire
    document.getElementById("xassidaTitre").value = xassida.titre
    document.getElementById("xassidaAuteur").value = xassida.auteur

    // Modifier le formulaire pour la modification
    const formTitle = document.getElementById("xassidaFormTitle")
    const submitBtn = document.querySelector("#xassidaForm button[type='submit']")

    formTitle.textContent = "Modifier le xassida"
    submitBtn.innerHTML = "💾 Modifier"

    // Stocker l'ID pour la modification
    document.getElementById("xassidaForm").dataset.editId = xassidaId

    document.getElementById("xassidaFormContainer").style.display = "block"
  } catch (error) {
    showNotification("Erreur lors du chargement du xassida", "error")
    console.error("Erreur chargement xassida:", error)
  }
}

// Supprimer un xassida (admin/gérant seulement)
async function deleteXassida(xassidaId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce xassida ? Cette action est irréversible.")) return

  try {
    await fetch(`${API_BASE_URL}/xassidas/${xassidaId}`, { method: "DELETE" })

    // Retirer la ligne avec animation
    const row = document.querySelector(`tr[data-xassida-id="${xassidaId}"]`)
    if (row) {
      row.style.opacity = "0"
      row.style.transform = "translateX(-100%)"
      setTimeout(() => row.remove(), 300)
    }

    // Mettre à jour les données globales
    if (window.allXassidas) {
      window.allXassidas = window.allXassidas.filter((x) => x.id !== xassidaId)
    }

    showNotification("Xassida supprimé avec succès", "success")
  } catch (error) {
    showNotification("Erreur lors de la suppression", "error")
    console.error("Erreur suppression xassida:", error)
  }
}

function showAddXassidaForm() {
  const formTitle = document.getElementById("xassidaFormTitle")
  const submitBtn = document.querySelector("#xassidaForm button[type='submit']")

  if (currentUser.role === "admin" || currentUser.role === "gerant") {
    formTitle.textContent = "Créer un nouveau xassida"
    submitBtn.innerHTML = "💾 Créer"
  } else {
    formTitle.textContent = "Proposer un nouveau xassida"
    submitBtn.innerHTML = "💾 Proposer"
  }

  document.getElementById("xassidaFormContainer").style.display = "block"
}

function hideXassidaForm() {
  const form = document.getElementById("xassidaForm")
  form.reset()
  delete form.dataset.editId // Nettoyer l'ID d'édition
  document.getElementById("xassidaFormContainer").style.display = "none"
}

async function handleXassidaSubmit(e) {
  e.preventDefault()

  const editId = e.target.dataset.editId
  const submitBtn = e.target.querySelector('button[type="submit"]')

  try {
    showLoading(submitBtn.id || "xassida-submit-btn")

    if (editId) {
      // Mode modification
      const xassidaData = {
        id: Number.parseInt(editId),
        titre: document.getElementById("xassidaTitre").value,
        auteur: document.getElementById("xassidaAuteur").value,
        valide: true, // Les modifications par admin/gérant restent validées
        createdBy: currentUser.id,
      }

      const response = await fetch(`${API_BASE_URL}/xassidas/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(xassidaData),
      })

      if (response.ok) {
        showNotification("Xassida modifié avec succès", "success")
        delete e.target.dataset.editId // Nettoyer l'ID d'édition
        hideXassidaForm()
        loadXassidas()
      }
    } else {
      // Mode création
      // Déterminer si le xassida est directement validé selon le rôle
      const isDirectlyValid = currentUser.role === "admin" || currentUser.role === "gerant"

      const xassidaData = {
        titre: document.getElementById("xassidaTitre").value,
        auteur: document.getElementById("xassidaAuteur").value,
        valide: isDirectlyValid, // Validé directement pour admin/gérant
        createdBy: currentUser.id,
      }

      const response = await fetch(`${API_BASE_URL}/xassidas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(xassidaData),
      })

      if (response.ok) {
        const successMessage = isDirectlyValid
          ? "Xassida créé et disponible pour la lecture !"
          : "Xassida proposé avec succès, en attente de validation"

        showNotification(successMessage, "success")
        hideXassidaForm()
        loadXassidas()
      } else {
        throw new Error("Erreur lors de l'enregistrement")
      }
    }
  } catch (error) {
    const errorMessage =
      currentUser.role === "admin" || currentUser.role === "gerant"
        ? "Erreur lors de la création"
        : "Erreur lors de la proposition"

    showNotification(errorMessage, "error")
    console.error("Erreur xassida:", error)
  } finally {
    hideLoading(submitBtn.id || "xassida-submit-btn")
  }
}

// Chargement du formulaire de lecture avec vérifications
async function loadLectureForm() {
  try {
    showLoading()

    const [xassidas, evenements] = await Promise.all([
      fetch(`${API_BASE_URL}/xassidas?valide=true`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/evenements`).then((r) => r.json()),
    ])

    // Filtrer les événements selon le diwane ET le statut actif
    const filteredEvenements = evenements.filter(
      (e) => (e.type === "global" || e.diwaneId === currentUser.diwaneId) && e.status === "active",
    )

    const xassidaSelect = document.getElementById("lectureXassida")
    const evenementSelect = document.getElementById("lectureEvenement")
    const lectureForm = document.getElementById("lectureForm")
    const lectureSection = lectureForm.parentElement

    // Vérifier s'il y a des données disponibles
    if (xassidas.length === 0 && filteredEvenements.length === 0) {
      // Aucune donnée disponible
      lectureForm.style.display = "none"
      const existingMessage = lectureSection.querySelector(".info-message")
      if (existingMessage) existingMessage.remove()

      const infoMessage = document.createElement("div")
      infoMessage.className = "info-message"
      infoMessage.innerHTML = `
        <h3>📋 Aucun enregistrement possible</h3>
        <p>Il n'y a actuellement aucun xassida validé et aucun événement actif.<br>
        Contactez votre gérant pour plus d'informations.</p>
      `
      lectureSection.insertBefore(infoMessage, lectureForm)
    } else if (xassidas.length === 0) {
      // Pas de xassidas validés
      lectureForm.style.display = "none"
      const existingMessage = lectureSection.querySelector(".info-message")
      if (existingMessage) existingMessage.remove()

      const infoMessage = document.createElement("div")
      infoMessage.className = "info-message"
      infoMessage.innerHTML = `
        <h3>📖 Aucun xassida disponible</h3>
        <p>Il n'y a actuellement aucun xassida validé pour l'enregistrement.<br>
        Vous pouvez proposer de nouveaux xassidas dans la section "Xassidas".</p>
      `
      lectureSection.insertBefore(infoMessage, lectureForm)
    } else if (filteredEvenements.length === 0) {
      // Pas d'événements actifs
      lectureForm.style.display = "none"
      const existingMessage = lectureSection.querySelector(".info-message")
      if (existingMessage) existingMessage.remove()

      const infoMessage = document.createElement("div")
      infoMessage.className = "info-message"
      infoMessage.innerHTML = `
        <h3>📅 Aucun événement actif</h3>
        <p>Il n'y a actuellement aucun événement actif pour votre diwane.<br>
        Les enregistrements de lectures ne sont possibles que pendant les événements actifs.</p>
      `
      lectureSection.insertBefore(infoMessage, lectureForm)
    } else {
      // Tout est disponible, afficher le formulaire
      lectureForm.style.display = "block"
      const existingMessage = lectureSection.querySelector(".info-message")
      if (existingMessage) existingMessage.remove()

      xassidaSelect.innerHTML =
        '<option value="">Sélectionner un xassida</option>' +
        xassidas.map((x) => `<option value="${x.id}">${x.titre} - ${x.auteur}</option>`).join("")

      evenementSelect.innerHTML =
        '<option value="">Sélectionner un événement</option>' +
        filteredEvenements.map((e) => `<option value="${e.id}">${e.nom}</option>`).join("")
    }
  } catch (error) {
    console.error("Erreur chargement formulaire lecture:", error)
    showNotification("Erreur lors du chargement du formulaire", "error")
  } finally {
    hideLoading()
  }
}

// Gestion du profil
function loadProfil() {
  document.getElementById("profilNom").value = currentUser.nom
  document.getElementById("profilEmail").value = currentUser.email
  document.getElementById("profilPassword").value = ""
}

async function handleProfilSubmit(e) {
  e.preventDefault()

  const profilData = {
    ...currentUser,
    nom: document.getElementById("profilNom").value,
    email: document.getElementById("profilEmail").value,
  }

  const newPassword = document.getElementById("profilPassword").value
  if (newPassword) {
    profilData.password = newPassword
  }

  try {
    await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profilData),
    })

    // Mettre à jour l'utilisateur local
    currentUser = profilData
    localStorage.setItem("currentUser", JSON.stringify(currentUser))

    showNotification("Profil mis à jour avec succès", "success")
    updateNavigation()
  } catch (error) {
    showNotification("Erreur lors de la mise à jour", "error")
    console.error("Erreur mise à jour profil:", error)
  }
}

// Fonctions utilitaires
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification")
  notification.textContent = message
  notification.className = `notification ${type} show`

  setTimeout(() => {
    notification.classList.remove("show")
  }, 3000)
}

function showDashboard() {
  showView("dashboardView")
}

// Gestion des erreurs globales
window.addEventListener("error", (e) => {
  console.error("Erreur globale:", e.error)
  showNotification("Une erreur est survenue", "error")
})

// Gestion des erreurs de fetch
window.addEventListener("unhandledrejection", (e) => {
  console.error("Promesse rejetée:", e.reason)
  showNotification("Erreur de connexion au serveur", "error")
})

// Remplacer les fonctions manquantes par les implémentations complètes :

// Gestion des événements
async function loadEvenements() {
  try {
    const [evenements, diwanes] = await Promise.all([
      fetch(`${API_BASE_URL}/evenements`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/diwanes`).then((r) => r.json()),
    ])

    // Filtrer selon le rôle
    let filteredEvenements = evenements
    if (currentUser.role === "gerant") {
      filteredEvenements = evenements.filter((e) => e.type === "global" || e.diwaneId === currentUser.diwaneId)
    }

    const tbody = document.getElementById("evenementsTableBody")
    tbody.innerHTML = filteredEvenements
      .map((evenement) => {
        const diwane = diwanes.find((d) => d.id === evenement.diwaneId)
        const canManage =
          currentUser.role === "admin" || (currentUser.role === "gerant" && evenement.diwaneId === currentUser.diwaneId)
        const isActive = evenement.status === "active"

        return `
          <tr>
            <td>${evenement.nom}</td>
            <td>${new Date(evenement.date).toLocaleDateString("fr-FR")}</td>
            <td>
              <span class="status-badge status-${evenement.type}">
                ${evenement.type === "global" ? "🌍 Global" : "🏠 Local"}
              </span>
            </td>
            <td>
              <span class="status-badge status-${isActive ? "active" : "inactive"}">
                ${isActive ? "✅ Actif" : "❌ Inactif"}
              </span>
            </td>
            <td>${diwane ? diwane.nom : "Tous"}</td>
            <td>
              ${
                canManage
                  ? `
                <label class="status-toggle">
                  <input type="checkbox" ${isActive ? "checked" : ""} 
                         onchange="toggleEvenementStatus(${evenement.id}, ${isActive})">
                  <span class="slider"></span>
                </label>
                <button class="btn btn-danger btn-small" onclick="deleteEvenement(${evenement.id})">🗑️ Supprimer</button>
                <button class="btn btn-primary btn-small" onclick="generateEvenementReport(${evenement.id})">📊 Rapport</button>
              `
                  : `
                <button class="btn btn-primary btn-small" onclick="generateEvenementReport(${evenement.id})">📊 Rapport</button>
              `
              }
            </td>
          </tr>
        `
      })
      .join("")

    // Configurer le formulaire selon le rôle
    const typeGroup = document.getElementById("evenementTypeGroup")
    const typeSelect = document.getElementById("evenementType")

    if (currentUser.role === "admin") {
      typeGroup.style.display = "block"
      typeSelect.innerHTML = `
                <option value="local">Local (mon diwane)</option>
                <option value="global">Global (tous les diwanes)</option>
            `
    } else if (currentUser.role === "gerant") {
      typeGroup.style.display = "none"
      typeSelect.value = "local"
    }
  } catch (error) {
    console.error("Erreur chargement événements:", error)
  }
}

// Basculer le statut d'un événement
async function toggleEvenementStatus(evenementId, currentStatus) {
  try {
    const evenement = await fetch(`${API_BASE_URL}/evenements/${evenementId}`).then((r) => r.json())

    await fetch(`${API_BASE_URL}/evenements/${evenementId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...evenement, status: currentStatus ? "inactive" : "active" }),
    })

    showNotification(`Événement ${currentStatus ? "désactivé" : "activé"} avec succès`, "success")
    loadEvenements()
  } catch (error) {
    showNotification("Erreur lors de la modification du statut", "error")
    console.error("Erreur toggle statut:", error)
  }
}

async function handleEvenementSubmit(e) {
  e.preventDefault()

  const submitBtn = e.target.querySelector('button[type="submit"]')

  try {
    showLoading(submitBtn.id || "evenement-submit-btn")

    const type = document.getElementById("evenementType").value
    const evenementData = {
      nom: document.getElementById("evenementNom").value,
      date: document.getElementById("evenementDate").value,
      type: type,
      status: "active", // Statut actif par défaut
      diwaneId: type === "global" ? null : currentUser.diwaneId,
    }

    const response = await fetch(`${API_BASE_URL}/evenements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evenementData),
    })

    if (response.ok) {
      showNotification("Événement créé avec succès", "success")
      document.getElementById("evenementForm").reset()
      loadEvenements()
    } else {
      throw new Error("Erreur lors de la création")
    }
  } catch (error) {
    showNotification("Erreur lors de la création", "error")
    console.error("Erreur création événement:", error)
  } finally {
    hideLoading(submitBtn.id || "evenement-submit-btn")
  }
}

async function deleteEvenement(evenementId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) return

  try {
    await fetch(`${API_BASE_URL}/evenements/${evenementId}`, { method: "DELETE" })
    showNotification("Événement supprimé avec succès", "success")
    loadEvenements()
  } catch (error) {
    showNotification("Erreur lors de la suppression", "error")
    console.error("Erreur suppression événement:", error)
  }
}

// Recensement
async function loadRecensementFilters() {
  try {
    const evenements = await fetch(`${API_BASE_URL}/evenements`).then((r) => r.json())

    // Filtrer selon le rôle
    let filteredEvenements = evenements
    if (currentUser.role === "gerant") {
      filteredEvenements = evenements.filter((e) => e.type === "global" || e.diwaneId === currentUser.diwaneId)
    }

    const select = document.getElementById("filterEvenement")
    select.innerHTML =
      '<option value="">Tous les événements</option>' +
      filteredEvenements.map((e) => `<option value="${e.id}">${e.nom}</option>`).join("")
  } catch (error) {
    console.error("Erreur chargement filtres recensement:", error)
  }
}

async function loadRecensement() {
  try {
    showLoading()

    const [lectures, users, xassidas, evenements] = await Promise.all([
      fetch(`${API_BASE_URL}/lectures`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/users`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/xassidas`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/evenements`).then((r) => r.json()),
    ])

    // Filtrer les lectures selon le rôle et le filtre d'événement
    let filteredLectures = lectures

    if (currentUser.role === "gerant") {
      // Gérant ne voit que les lectures de son diwane
      filteredLectures = lectures.filter((l) => {
        const user = users.find((u) => u.id === l.userId)
        return user && user.diwaneId === currentUser.diwaneId
      })
    }

    // Filtre par événement
    const evenementFilter = document.getElementById("filterEvenement").value
    if (evenementFilter) {
      filteredLectures = filteredLectures.filter((l) => l.evenementId === Number.parseInt(evenementFilter))
    }

    const tbody = document.getElementById("recensementTableBody")
    tbody.innerHTML = filteredLectures
      .map((lecture) => {
        const user = users.find((u) => u.id === lecture.userId)
        const xassida = xassidas.find((x) => x.id === lecture.xassidaId)
        const evenement = evenements.find((e) => e.id === lecture.evenementId)

        return `
          <tr>
            <td>${user ? user.nom : "N/A"}</td>
            <td>${xassida ? `${xassida.titre} - ${xassida.auteur}` : "N/A"}</td>
            <td>${evenement ? evenement.nom : "N/A"}</td>
            <td>${lecture.nombre}</td>
            <td>${new Date().toLocaleDateString("fr-FR")}</td>
          </tr>
        `
      })
      .join("")
  } catch (error) {
    console.error("Erreur chargement recensement:", error)
    showNotification("Erreur lors du chargement du recensement", "error")
  } finally {
    hideLoading()
  }
}

// Gestion des lectures
async function loadMesLectures() {
  try {
    const [lectures, xassidas, evenements] = await Promise.all([
      fetch(`${API_BASE_URL}/lectures?userId=${currentUser.id}`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/xassidas`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/evenements`).then((r) => r.json()),
    ])

    const tbody = document.getElementById("mesLecturesTableBody")
    tbody.innerHTML = lectures
      .map((lecture) => {
        const xassida = xassidas.find((x) => x.id === lecture.xassidaId)
        const evenement = evenements.find((e) => e.id === lecture.evenementId)

        return `
          <tr>
            <td>${xassida ? `${xassida.titre} - ${xassida.auteur}` : "N/A"}</td>
            <td>${evenement ? evenement.nom : "N/A"}</td>
            <td>${lecture.nombre}</td>
            <td>${new Date().toLocaleDateString("fr-FR")}</td>
          </tr>
        `
      })
      .join("")
  } catch (error) {
    console.error("Erreur chargement mes lectures:", error)
  }
}

async function handleLectureSubmit(e) {
  e.preventDefault()

  const submitBtn = e.target.querySelector('button[type="submit"]')

  try {
    showLoading(submitBtn.id || "lecture-submit-btn")

    const lectureData = {
      userId: currentUser.id,
      xassidaId: Number.parseInt(document.getElementById("lectureXassida").value),
      evenementId: Number.parseInt(document.getElementById("lectureEvenement").value),
      nombre: Number.parseInt(document.getElementById("lectureNombre").value),
    }

    const response = await fetch(`${API_BASE_URL}/lectures`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lectureData),
    })

    if (response.ok) {
      showNotification("Lecture enregistrée avec succès", "success")
      document.getElementById("lectureForm").reset()
      loadMesLectures()
    } else {
      throw new Error("Erreur lors de l'enregistrement")
    }
  } catch (error) {
    showNotification("Erreur lors de l'enregistrement", "error")
    console.error("Erreur enregistrement lecture:", error)
  } finally {
    hideLoading(submitBtn.id || "lecture-submit-btn")
  }
}

// Nouvelle fonctionnalité : Génération de rapport d'événement
async function generateEvenementReport(evenementId) {
  try {
    showLoading()

    const [lectures, users, xassidas, evenements] = await Promise.all([
      fetch(`${API_BASE_URL}/lectures?evenementId=${evenementId}`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/users`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/xassidas`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/evenements/${evenementId}`).then((r) => r.json()),
    ])

    // Filtrer les lectures selon le rôle
    let filteredLectures = lectures
    if (currentUser.role === "gerant") {
      filteredLectures = lectures.filter((l) => {
        const user = users.find((u) => u.id === l.userId)
        return user && user.diwaneId === currentUser.diwaneId
      })
    }

    // Générer les statistiques
    const stats = generateEventStats(filteredLectures, users, xassidas, evenements)

    // Afficher le rapport dans une modal
    showEventReportModal(stats)
  } catch (error) {
    console.error("Erreur génération rapport:", error)
    showNotification("Erreur lors de la génération du rapport", "error")
  } finally {
    hideLoading()
  }
}

// Générer les statistiques d'un événement
function generateEventStats(lectures, users, xassidas, evenement) {
  const stats = {
    evenement: evenement,
    totalLectures: lectures.reduce((sum, l) => sum + l.nombre, 0),
    totalParticipants: new Set(lectures.map((l) => l.userId)).size,
    xassidasStats: {},
    participantsStats: {},
    topXassidas: [],
    topParticipants: [],
  }

  // Statistiques par xassida
  lectures.forEach((lecture) => {
    const xassida = xassidas.find((x) => x.id === lecture.xassidaId)
    if (xassida) {
      const key = `${xassida.titre} - ${xassida.auteur}`
      if (!stats.xassidasStats[key]) {
        stats.xassidasStats[key] = { total: 0, participants: new Set() }
      }
      stats.xassidasStats[key].total += lecture.nombre
      stats.xassidasStats[key].participants.add(lecture.userId)
    }
  })

  // Statistiques par participant
  lectures.forEach((lecture) => {
    const user = users.find((u) => u.id === lecture.userId)
    if (user) {
      if (!stats.participantsStats[user.nom]) {
        stats.participantsStats[user.nom] = { total: 0, xassidas: new Set() }
      }
      stats.participantsStats[user.nom].total += lecture.nombre
      stats.participantsStats[user.nom].xassidas.add(lecture.xassidaId)
    }
  })

  // Top 5 xassidas
  stats.topXassidas = Object.entries(stats.xassidasStats)
    .map(([nom, data]) => ({ nom, total: data.total, participants: data.participants.size }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Top 5 participants
  stats.topParticipants = Object.entries(stats.participantsStats)
    .map(([nom, data]) => ({ nom, total: data.total, xassidas: data.xassidas.size }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return stats
}

// Afficher le rapport dans une modal
function showEventReportModal(stats) {
  // Créer la modal si elle n'existe pas
  let modal = document.getElementById("eventReportModal")
  if (!modal) {
    modal = document.createElement("div")
    modal.id = "eventReportModal"
    modal.className = "modal"
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="modalTitle">📊 Rapport d'événement</h2>
          <span class="close" onclick="closeEventReportModal()">&times;</span>
        </div>
        <div class="modal-body" id="modalBody">
          <!-- Contenu dynamique -->
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="exportEventReport()">📄 Exporter</button>
          <button class="btn btn-secondary" onclick="closeEventReportModal()">Fermer</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  }

  // Remplir le contenu
  document.getElementById("modalTitle").textContent = `📊 Rapport - ${stats.evenement.nom}`
  document.getElementById("modalBody").innerHTML = `
    <div class="report-section">
      <h3>📈 Statistiques générales</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Total lectures :</span>
          <span class="stat-value">${stats.totalLectures}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Participants :</span>
          <span class="stat-value">${stats.totalParticipants}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Date événement :</span>
          <span class="stat-value">${new Date(stats.evenement.date).toLocaleDateString("fr-FR")}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Type :</span>
          <span class="stat-value">${stats.evenement.type === "global" ? "🌍 Global" : "🏠 Local"}</span>
        </div>
      </div>
    </div>

    <div class="report-section">
      <h3>🏆 Top 5 Xassidas les plus lus</h3>
      <div class="top-list">
        ${stats.topXassidas
          .map(
            (item, index) => `
          <div class="top-item">
            <span class="rank">${index + 1}</span>
            <span class="name">${item.nom}</span>
            <span class="count">${item.total} lectures</span>
            <span class="participants">${item.participants} participants</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>

    <div class="report-section">
      <h3>👥 Top 5 Participants</h3>
      <div class="top-list">
        ${stats.topParticipants
          .map(
            (item, index) => `
          <div class="top-item">
            <span class="rank">${index + 1}</span>
            <span class="name">${item.nom}</span>
            <span class="count">${item.total} lectures</span>
            <span class="participants">${item.xassidas} xassidas différents</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>

    <div class="report-section">
      <h3>📋 Détail par Xassida</h3>
      <div class="detail-table">
        <table class="table">
          <thead>
            <tr>
              <th>Xassida</th>
              <th>Total lectures</th>
              <th>Participants</th>
              <th>Moyenne par participant</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(stats.xassidasStats)
              .map(
                ([nom, data]) => `
              <tr>
                <td>${nom}</td>
                <td>${data.total}</td>
                <td>${data.participants.size}</td>
                <td>${(data.total / data.participants.size).toFixed(1)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `

  // Stocker les stats pour l'export
  window.currentReportStats = stats

  // Afficher la modal
  modal.style.display = "block"
}

// Fermer la modal de rapport
function closeEventReportModal() {
  const modal = document.getElementById("eventReportModal")
  if (modal) {
    modal.style.display = "none"
  }
}

// Exporter le rapport (simple version texte)
function exportEventReport() {
  if (!window.currentReportStats) return

  const stats = window.currentReportStats
  let reportText = `RAPPORT D'ÉVÉNEMENT - ${stats.evenement.nom}\n`
  reportText += `Date: ${new Date(stats.evenement.date).toLocaleDateString("fr-FR")}\n`
  reportText += `Type: ${stats.evenement.type === "global" ? "Global" : "Local"}\n`
  reportText += `Généré le: ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}\n\n`

  reportText += `STATISTIQUES GÉNÉRALES\n`
  reportText += `- Total lectures: ${stats.totalLectures}\n`
  reportText += `- Participants: ${stats.totalParticipants}\n\n`

  reportText += `TOP 5 XASSIDAS\n`
  stats.topXassidas.forEach((item, index) => {
    reportText += `${index + 1}. ${item.nom} - ${item.total} lectures (${item.participants} participants)\n`
  })

  reportText += `\nTOP 5 PARTICIPANTS\n`
  stats.topParticipants.forEach((item, index) => {
    reportText += `${index + 1}. ${item.nom} - ${item.total} lectures (${item.xassidas} xassidas différents)\n`
  })

  // Créer et télécharger le fichier
  const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `rapport-${stats.evenement.nom.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  showNotification("Rapport exporté avec succès", "success")
}

// Fonction pour masquer le formulaire d'événement
function hideEvenementForm() {
  document.getElementById("evenementFormContainer").style.display = "none"
}
