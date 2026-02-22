import { useState, useEffect } from "react";
import { X } from "./Icons";

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

  // Sync internal state when the modal opens or initial values change
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
        <div className="flex justify-between items-center p-5 border-b border-[#2a2a2a]">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? "Edit Routine" : "Create New Routine"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Routine Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Hypertrophy Block A"
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-gray-700"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Assign to Client (Optional)
              </label>
              <select
                value={selectedClientId}
                onChange={(e) =>
                  setSelectedClientId(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all appearance-none"
              >
                <option value="">-- No Client Assigned --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.username}
                  </option>
                ))}
              </select>
              {clients.length === 0 && (
                <p className="text-xs text-yellow-500 mt-1">
                  No clients available. Register a client account to assign
                  routines.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-orange-500/20"
            >
              {isEditing ? "Save Changes" : "Create Routine"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoutineModal;
