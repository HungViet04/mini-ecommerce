/**
 * Global loading store
 * Tracks active loading operations across the app
 */
let activeCount = 0;
const listeners = new Set();

const notify = () => {
  const snapshot = { activeCount, isLoading: activeCount > 0 };
  listeners.forEach((listener) => listener(snapshot));
};

export const startGlobalLoading = () => {
  activeCount += 1;
  notify();
};

export const stopGlobalLoading = () => {
  activeCount = Math.max(0, activeCount - 1);
  notify();
};

export const resetGlobalLoading = () => {
  activeCount = 0;
  notify();
};

export const subscribeGlobalLoading = (listener) => {
  if (typeof listener !== 'function') {
    return () => {};
  }

  listeners.add(listener);
  listener({ activeCount, isLoading: activeCount > 0 });

  return () => listeners.delete(listener);
};
