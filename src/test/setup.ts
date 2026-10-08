/**
 * S19: Global test setup
 *
 * Imported by Vitest before each test file.
 * Extends expect() with @testing-library/jest-dom matchers
 * (e.g. toBeInTheDocument, toHaveValue, toBeDisabled).
 */
import '@testing-library/jest-dom';

/**
 * Node 25+ ships an experimental global `localStorage`/`sessionStorage` that, without
 * `--localstorage-file`, is an object with no methods, and it shadows jsdom's.
 * Install a simple in-memory Storage when the global one isn't usable.
 */
class MemoryStorage implements Storage {
  private items = new Map<string, string>();
  get length() {
    return this.items.size;
  }
  clear() {
    this.items.clear();
  }
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
  setItem(key: string, value: string) {
    this.items.set(key, String(value));
  }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  if (typeof globalThis[name]?.clear !== 'function') {
    Object.defineProperty(globalThis, name, { value: new MemoryStorage(), configurable: true });
  }
}
