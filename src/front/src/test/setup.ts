import "@testing-library/jest-dom";

// jsdom requereix un origen vàlid per inicialitzar localStorage.
// Proveïm un mock fiable per a tots els tests.
const store: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string): void => {
    store[key] = value;
  },
  removeItem: (key: string): void => {
    delete store[key];
  },
  clear: (): void => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
  get length(): number {
    return Object.keys(store).length;
  },
  key: (index: number): string | null => Object.keys(store)[index] ?? null,
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});
