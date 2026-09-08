export function loadState(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

export function saveState(key, obj) {
  try {
    localStorage.setItem(key, JSON.stringify(obj))
  } catch (e) {
    // ignore
  }
}
