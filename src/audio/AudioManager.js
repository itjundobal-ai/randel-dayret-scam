export default class AudioManager {
  constructor({ enabled = true } = {}) {
    this.enabled = enabled
  }

  play(name) {
    if (!this.enabled) return
    if (typeof window === 'undefined') return
    const key = `audio:${name}`
    if (!window.__slotAudioHooks) {
      window.__slotAudioHooks = {}
    }
    const hook = window.__slotAudioHooks[key]
    if (typeof hook === 'function') {
      hook()
    }
  }

  toggle(enabled) {
    this.enabled = Boolean(enabled)
  }
}
