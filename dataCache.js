// Cache système pour optimiser les performances
export const DataCache = {
  data: new Map(),
  timestamps: new Map(),
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  set(key, value) {
    this.data.set(key, value)
    this.timestamps.set(key, Date.now())
  },

  get(key) {
    const timestamp = this.timestamps.get(key)
    if (!timestamp || Date.now() - timestamp > this.CACHE_DURATION) {
      this.data.delete(key)
      this.timestamps.delete(key)
      return null
    }
    return this.data.get(key)
  },

  invalidate(key) {
    this.data.delete(key)
    this.timestamps.delete(key)
  },

  clear() {
    this.data.clear()
    this.timestamps.clear()
  },
}