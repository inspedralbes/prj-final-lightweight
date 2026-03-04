import { useToastContext } from "../context/ToastContext";

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastContext();

  const getToastStyles = (type: string) => {
    switch (type) {
      case "success":
        return {
          container: "bg-[#0f1f0f] border-green-700/60 text-green-300",
          icon: "w-5 h-5 text-green-400 bg-green-900/50",
          iconPath: "M5 13l4 4L19 7",
        };
      case "error":
        return {
          container: "bg-[#1f0f0f] border-red-700/60 text-red-300",
          icon: "w-5 h-5 text-red-400 bg-red-900/50",
          iconPath: "M6 18L18 6M6 6l12 12",
        };
      case "warning":
        return {
          container: "bg-[#1f180a] border-amber-700/60 text-amber-300",
          icon: "w-5 h-5 text-amber-400 bg-amber-900/50",
          iconPath:
            "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
        };
      default:
        return {
          container: "bg-[#1a1205] border-orange-700/60 text-orange-300",
          icon: "w-5 h-5 text-orange-400 bg-orange-900/50",
          iconPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        };
    }
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] space-y-3 max-w-sm">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        return (
          <div
            key={toast.id}
            className={`flex items-start w-full p-4 rounded-lg shadow-lg border animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-sm ${styles.container}`}
            role="alert"
          >
            <div
              className={`inline-flex items-center justify-center shrink-0 ${styles.icon} rounded`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={styles.iconPath}
                />
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
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};
