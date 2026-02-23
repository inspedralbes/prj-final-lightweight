import { useToastContext } from '../context/ToastContext';

export const useToast = () => {
  const { addToast } = useToastContext();

  return {
    success: (message: string, description?: string) => {
      addToast({ message, description, type: 'success' });
    },
    error: (message: string, description?: string) => {
      addToast({ message, description, type: 'error' });
    },
    info: (message: string, description?: string) => {
      addToast({ message, description, type: 'info' });
    },
    warning: (message: string, description?: string) => {
      addToast({ message, description, type: 'warning' });
    },
  };
};
