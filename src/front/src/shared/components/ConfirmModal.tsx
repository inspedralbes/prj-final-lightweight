import { X } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  loading = false,
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const confirmStyles =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 disabled:bg-red-800"
      : "bg-orange-500 hover:bg-orange-600 disabled:bg-orange-700";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-sm text-gray-400">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-[#3a3a3a] text-gray-300 hover:bg-[#2a2a2a] transition-colors text-sm font-medium disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:cursor-not-allowed ${confirmStyles}`}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
