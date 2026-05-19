import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Ensure each test starts with a fresh DOM and mocks.
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
  }
});
