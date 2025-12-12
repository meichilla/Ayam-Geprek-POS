const DEFAULT_IDLE_MINUTES = 3;

// ===== IDLE =====
export function getIdleMinutes() {
  const v = localStorage.getItem("idle_minutes");
  return v ? Number(v) : DEFAULT_IDLE_MINUTES;
}

export function setIdleMinutes(minutes) {
  localStorage.setItem("idle_minutes", String(minutes));
}

// ===== AUTO LOCK =====
export function isAutoLockEnabled() {
  const v = localStorage.getItem("auto_lock");
  return v === null ? true : v === "true";
}

export function setAutoLockEnabled(value) {
  localStorage.setItem("auto_lock", value ? "true" : "false");
}

// ===== PIN =====
export function isPinEnabled() {
  return localStorage.getItem("pin_enabled") === "true";
}

export function setPinEnabled(value) {
  localStorage.setItem("pin_enabled", value ? "true" : "false");
}

export function hasPin() {
  return !!localStorage.getItem("pin");
}
