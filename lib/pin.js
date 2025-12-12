export function hashPin(pin) {
  return btoa(pin);
}

export function hasPin() {
  return !!localStorage.getItem("pin");
}

export function verifyPin(pin) {
  const saved = localStorage.getItem("pin");
  if (!saved) return false;
  return saved === hashPin(pin);
}

export function setPin(pin) {
  localStorage.setItem("pin", hashPin(pin));
}
