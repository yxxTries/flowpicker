// Vitest setup: reset localStorage + global App between tests.
import { afterEach, beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  // Drop any globals tests attached so the next test starts fresh.
  delete globalThis.App;
  delete globalThis.LAYERS;
  delete globalThis.SavedFlows;
  delete globalThis.SelectionsStore;
  delete globalThis.FlowpickerAuth;
  delete globalThis.COMPATIBILITY_RULES;
  delete globalThis.ATTRIBUTE_LABELS;
});
