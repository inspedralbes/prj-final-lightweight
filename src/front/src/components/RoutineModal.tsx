import { useState, useEffect } from "react";
import { X } from "./Icons";
import { useTranslation } from "react-i18next";

export interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; clientId?: number }) => Promise<void> | void;
  initialName?: string;
  initialClientId?: number | "";
  clients: { id: number; username: string }[];
  isEditing: boolean;
}

const RoutineModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialName = "",
  initialClientId = "",
  clients,
  isEditing,
}: RoutineModalProps) => {
  const [formName, setFormName] = useState(initialName);
  const [selectedClientId, setSelectedClientId] = useState<number | "">(
    initialClientId,
  );
  const { t } = useTranslation();

  useEffect(() => {
    setFormName(initialName);
    setSelectedClientId(initialClientId);
  }, [initialName, initialClientId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    await onSubmit({
      name: formName,
      clientId: selectedClientId !== "" ? Number(selectedClientId) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 md:p-5 border-b border-[#2a2a2a]">
          <h2 className="text-lg md:text-xl font-bold text-white">
            {isEditing
              ? t("routines.editRoutine")
              : t("routines.createRoutine")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6">
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {t("routines.name")}
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t("routines.exerciseName")}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-gray-700 text-sm md:text-base"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {t("sessions.selectRoutine")}
              </label>
              <select
                value={selectedClientId}
                onChange={(e) =>
                  setSelectedClientId(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all appearance-none text-sm md:text-base"
              >
                <option value="">-- {t("common.cancel")} --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.username}
                  </option>
                ))}
              </select>
              {clients.length === 0 && (
                <p className="text-xs text-yellow-500 mt-1">
                  No clients available.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-orange-500/20"
            >
              {isEditing ? t("common.save") : t("routines.createRoutine")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoutineModal;
