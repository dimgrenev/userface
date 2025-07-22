import '@testing-library/react';
import '@testing-library/jest-dom';
import 'vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
 
// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
}); 