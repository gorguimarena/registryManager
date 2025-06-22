// Gestionnaire d'événements pour les mises à jour en temps réel
export const EventManager = {
  listeners: new Map(),

  // Écouter un type d'événement
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType).push(callback)
  },

  // Déclencher un événement
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Erreur dans le listener ${eventType}:`, error)
        }
      })
    }
  },

  // Supprimer tous les listeners d'un type
  off(eventType) {
    this.listeners.delete(eventType)
  },
}