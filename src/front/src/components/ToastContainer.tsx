import { useToastContext } from '../context/ToastContext';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastContext();

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: 'w-5 h-5 text-green-600 bg-green-100',
          iconPath: 'M5 13l4 4L19 7',
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'w-5 h-5 text-red-600 bg-red-100',
          iconPath: 'M6 18L18 6M6 6l12 12',
        };
      case 'warning':
        return {
          container: 'bg-amber-50 border-amber-200 text-amber-800',
          icon: 'w-5 h-5 text-amber-600 bg-amber-100',
          iconPath: 'M12 9v2m0 4v2m0-12a9 9 0 110 18 9 9 0 010-18z',
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'w-5 h-5 text-blue-600 bg-blue-100',
          iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        };
    }
  };

  return (
    <div className="fixed top-5 right-5 z-50 space-y-3 max-w-sm">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        return (
          <div
            key={toast.id}
            className={`flex items-start w-full p-4 rounded-lg shadow-md border animate-in fade-in slide-in-from-top-4 duration-300 ${styles.container}`}
            role="alert"
          >
            <div className={`inline-flex items-center justify-center shrink-0 ${styles.icon} rounded`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={styles.iconPath} />
              </svg>
            </div>
            <div className="ms-3 flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
              {toast.description && (
                <p className="text-xs mt-1 opacity-80">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ms-3 flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded hover:opacity-70 transition-opacity focus:outline-none"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};
