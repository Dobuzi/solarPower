import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock ResizeObserver for components using it (SearchDropdown)
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

// Mock matchMedia for useMediaQuery
if (!window.matchMedia) {
  window.matchMedia = (query: string) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  };
}

// Mock visualViewport for positioning logic
if (!window.visualViewport) {
  window.visualViewport = {
    addEventListener: () => {},
    removeEventListener: () => {},
    onresize: null,
    onscroll: null,
    dispatchEvent: () => false,
    width: 0,
    height: 0,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    scale: 1,
  } as unknown as VisualViewport;
}

// Ensure localStorage exists in test environment
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => (store.has(key) ? store.get(key) || null : null),
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => {
    store.clear();
  },
} as Storage;

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});

afterEach(() => {
  cleanup();
});

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => {};
}
