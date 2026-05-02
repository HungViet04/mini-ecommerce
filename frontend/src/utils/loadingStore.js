/**
 * Global loading store
 * Tracks active loading operations across the app
 */
const DEFAULT_DELAY_MS = 250;
let activeCount = 0;
let isVisible = false;
let showTimer = null;
const listeners = new Set();

const notify = () => {
  const snapshot = { activeCount, isLoading: isVisible };
  listeners.forEach((listener) => listener(snapshot));
};

export const startGlobalLoading = (options = {}) => {
  const delayMs = typeof options.delayMs === 'number' ? options.delayMs : DEFAULT_DELAY_MS;

  activeCount += 1;

  if (isVisible) {
    notify();
    return;
  }

  if (delayMs <= 0) {
    isVisible = true;
    notify();
    return;
  }

  if (!showTimer) {
    showTimer = setTimeout(() => {
      showTimer = null;
      if (activeCount > 0 && !isVisible) {
        isVisible = true;
        notify();
      }
    }, delayMs);
  }

  notify();
};

export const stopGlobalLoading = () => {
  activeCount = Math.max(0, activeCount - 1);

  if (activeCount === 0) {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }
    if (isVisible) {
      isVisible = false;
    }
  }

  notify();
};

export const resetGlobalLoading = () => {
  activeCount = 0;
  isVisible = false;
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
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
