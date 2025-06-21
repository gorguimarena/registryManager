# 🕌 Application de Gestion de Dahira

Application web pour la gestion d'un dahira religieux permettant de recenser les xassidas (poèmes religieux) lus par les membres selon leur diwane (cellule) et leurs événements.

## 🚀 Installation et démarrage

### Prérequis
- Node.js installé sur votre machine
- JSON Server pour la base de données

### Installation de JSON Server
\`\`\`bash
npm install -g json-server
\`\`\`

### Démarrage de l'application

1. **Démarrer JSON Server** (dans le dossier du projet) :
\`\`\`bash
json-server --watch db.json --port 3000
\`\`\`

2. **Ouvrir l'application** :
Ouvrez le fichier `index.html` dans votre navigateur web.

## 👥 Comptes de test

### Admin
- **Email** : admin@dahira.com
- **Mot de passe** : admin123
- **Permissions** : Toutes les fonctionnalités

### Gérant (Diwane Fass)
- **Email** : ali@dahira.com
- **Mot de passe** : gerant123
- **Permissions** : Gestion de son diwane, validation xassidas

### Membre
- **Email** : fatou@dahira.com
- **Mot de passe** : membre123
- **Permissions** : Enregistrement lectures, proposition xassidas

### Gérant (Diwane Medina)
- **Email** : moussa@dahira.com
- **Mot de passe** : gerant123
- **Permissions** : Gestion de son diwane

## 🎯 Fonctionnalités

### 🔐 Authentification
- Connexion sécurisée avec email/mot de passe
- Gestion des sessions avec localStorage
- Contrôle d'accès par rôles

### 👥 Gestion des utilisateurs (Admin)
- Créer, modifier, supprimer des utilisateurs
- Attribuer des rôles (membre, gérant, admin)
- Rattacher les utilisateurs à un diwane

### 📖 Gestion des xassidas
- Consultation de la liste des xassidas
- Proposition de nouveaux xassidas par tous les utilisateurs
- Validation/rejet par les gérants et admins
- Filtrage par statut (validé, en attente)

### 📅 Gestion des événements
- Création d'événements globaux (admin)
- Création d'événements locaux (gérants)
- Consultation des événements selon le diwane

### 📚 Enregistrement des lectures
- Enregistrement des lectures de xassidas
- Association avec un événement
- Nombre de lectures
- Historique personnel

### 📊 Recensement des lectures
- Vue d'ensemble des lectures par diwane (gérants)
- Filtrage par événement
- Statistiques globales (admin)

### 👤 Gestion du profil
- Modification des informations personnelles
- Changement de mot de passe
- Mise à jour en temps réel

## 🏗️ Structure technique

### Technologies utilisées
- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Backend** : JSON Server (simulation API REST)
- **Stockage** : localStorage pour les sessions
- **Architecture** : SPA (Single Page Application) avec navigation manuelle

### Structure des fichiers
\`\`\`
├── index.html          # Page principale
├── style.css          # Styles CSS
├── script.js          # Logique JavaScript
├── db.json            # Base de données JSON
└── README.md          # Documentation
\`\`\`

### API Endpoints (JSON Server)
- `GET/POST/PUT/DELETE /users` - Gestion des utilisateurs
- `GET/POST/PUT/DELETE /diwanes` - Gestion des diwanes
- `GET/POST/PUT/DELETE /xassidas` - Gestion des xassidas
- `GET/POST/PUT/DELETE /evenements` - Gestion des événements
- `GET/POST/PUT/DELETE /lectures` - Gestion des lectures

## 🔒 Contrôle d'accès par rôle

| Action | Membre | Gérant | Admin |
|--------|--------|--------|-------|
| Ajouter une lecture | ✅ | ✅ | ❌ |
| Proposer un xassida | ✅ | ✅ | ❌ |
| Valider xassidas | ❌ | ✅ | ✅ |
| Voir lectures d'un diwane | ❌ | ✅ | ✅ |
| Créer événement local | ❌ | ✅ | ❌ |
| Créer événement global | ❌ | ❌ | ✅ |
| Créer/gérer comptes | ❌ | ❌ | ✅ |
| Modifier son profil | ✅ | ✅ | ✅ |

## 📱 Responsive Design

L'application est entièrement responsive et s'adapte aux différentes tailles d'écran :
- Desktop (> 768px)
- Tablette (768px - 480px)
- Mobile (< 480px)

## 🎨 Interface utilisateur

- Design moderne avec dégradés et ombres
- Navigation intuitive adaptée au rôle
- Notifications en temps réel
- Formulaires avec validation
- Tableaux interactifs avec filtres
- Animations fluides

## 🔧 Personnalisation

Pour adapter l'application à vos besoins :

1. **Modifier les diwanes** : Éditez la section `diwanes` dans `db.json`
2. **Ajouter des xassidas** : Ajoutez des entrées dans la section `xassidas`
3. **Personnaliser les styles** : Modifiez `style.css`
4. **Étendre les fonctionnalités** : Ajoutez du code dans `script.js`

## 🐛 Dépannage

### JSON Server ne démarre pas
- Vérifiez que Node.js est installé
- Installez JSON Server globalement : `npm install -g json-server`
- Vérifiez que le port 3000 n'est pas utilisé

### Erreurs de connexion
- Assurez-vous que JSON Server fonctionne sur http://localhost:3000
- Vérifiez la console du navigateur pour les erreurs
- Videz le cache du navigateur si nécessaire

### Problèmes d'authentification
- Utilisez les comptes de test fournis
- Vérifiez que localStorage est activé dans votre navigateur

## 📞 Support

Pour toute question ou problème, consultez :
- Les logs de la console du navigateur
- Les logs de JSON Server
- La documentation des technologies utilisées

---

**Développé avec ❤️ pour la communauté religieuse**
