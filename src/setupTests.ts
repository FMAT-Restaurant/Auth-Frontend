import '@testing-library/jest-dom';
import { vi } from 'vitest';

// En las pruebas no hay otras pestañas: la petición de sesión a otras pestañas
// (#6) responde de inmediato con null en lugar de esperar el timeout.
// sessionSync.test.ts usa la implementación real (vi.unmock).
vi.mock('./services/sessionSync', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./services/sessionSync')>()),
  requestSessionFromOtherTabs: vi.fn().mockResolvedValue(null),
}));

let store: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = String(value);
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    store = {};
  },
  key: (index: number) => Object.keys(store)[index] ?? null,
  get length() {
    return Object.keys(store).length;
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}
