import { watch } from 'vue'

export function createPersistPlugin() {
  return ({ store }) => {
    const savedState = localStorage.getItem(`pinia_${store.$id}`)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        store.$patch(parsed)
      } catch (e) {
        console.error('Failed to restore state:', e)
      }
    }

    watch(
      () => store.$state,
      (state) => {
        const stateToSave = { ...state }
        delete stateToSave.token
        delete stateToSave.user
        delete stateToSave.gameState
        localStorage.setItem(`pinia_${store.$id}`, JSON.stringify(stateToSave))
      },
      { deep: true }
    )
  }
}
