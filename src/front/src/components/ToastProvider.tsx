import { ToastContextProvider } from '../context/ToastContext';
import { ToastContainer } from './ToastContainer';

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ToastContextProvider>
      <ToastContainer />
      {children}
    </ToastContextProvider>
  );
};
