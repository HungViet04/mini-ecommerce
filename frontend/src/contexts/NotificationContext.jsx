/**
 * Notification Context
 * Provides toast notifications for the whole app
 */
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const notifyToast = useCallback((message, options = {}) => {
    if (!message) return;
    const type = options.type || 'info';
    const duration = options.duration || 2200;

    if (type === 'success') {
      toast.success(message, { duration });
      return;
    }

    if (type === 'error') {
      toast.error(message, { duration });
      return;
    }

    toast(message, { duration });
  }, []);

  // Backward-compatible alias: old callers of notify(...) now use toast.
  const notify = useCallback(
    (message, options = {}) => {
      notifyToast(message, options);
    },
    [notifyToast]
  );

  const value = useMemo(
    () => ({
      notify,
      notifyToast,
      notifyModal: notify,
    }),
    [notify, notifyToast]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster position="top-right" toastOptions={{ duration: 2200 }} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
