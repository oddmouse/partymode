export function updateLocalStorage(key: string, newValue: string | null) {
  const oldValue = localStorage.getItem(key);

  if (oldValue === newValue) return;

  if (newValue === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, newValue);
  }

  const storageEvent = new StorageEvent("storage", {
    key: key,
    newValue: newValue,
    oldValue: oldValue,
    storageArea: localStorage,
    url: window.location.href,
  });

  window.dispatchEvent(storageEvent);
}
