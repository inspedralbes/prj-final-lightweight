import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "./Icons";
import { useTranslation } from "react-i18next";

export interface ExerciseData {
  name: string;
  sets: number;
  reps: number;
  rest: number;
  notes?: string;
}

export interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; clientId?: number; exercises: ExerciseData[] }) => Promise<void> | void;
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
  const [exercises, setExercises] = useState<ExerciseData[]>([
    { name: "", sets: 3, reps: 10, rest: 60 }
  ]);
  const { t } = useTranslation();

  useEffect(() => {
    setFormName(initialName);
    setSelectedClientId(initialClientId);
  }, [initialName, initialClientId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    // Validación básica: al menos un ejercicio con nombre
    if (exercises.length === 0 || !exercises[0].name.trim()) {
      alert(t('messages.errorOccurred') + " (Afegiu almenys un exercici)");
      return;
    }

    await onSubmit({
      name: formName,
      clientId: selectedClientId !== "" ? Number(selectedClientId) : undefined,
      exercises: exercises,
    });
  };

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: 3, reps: 10, rest: 60 }]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_: ExerciseData, i: number) => i !== index));
  };

  const updateExercise = (index: number, field: keyof ExerciseData, value: string | number) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 md:p-5 border-b border-[#2a2a2a]">
          <h2 className="text-lg md:text-xl font-bold text-white">
            {isEditing ? t('routines.editRoutine') : t('routines.createRoutine')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 flex flex-col max-h-[70vh]">
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t('routines.name')}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t('routines.exerciseName')}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-gray-700 text-sm md:text-base"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t('sessions.selectRoutine')}
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
                  <option value="">-- {t('common.cancel')} --</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SECCIÓN DE EJERCICIOS */}
            <div className="space-y-4 pt-4 border-t border-[#2a2a2a]">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Exercicis</h3>
                <button
                  type="button"
                  onClick={addExercise}
                  className="text-orange-500 hover:text-orange-400 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Afegir exercici
                </button>
              </div>

              {exercises.map((ex: ExerciseData, index: number) => (
                <div key={index} className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3 space-y-3 relative group">
                  <div className="flex justify-between items-start gap-3">
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      placeholder="Nom de l'exercici (ex: Flexiones)"
                      className="flex-1 bg-transparent border-b border-[#333] focus:border-orange-500 text-white py-1 outline-none text-sm transition-colors"
                    />
                    {exercises.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExercise(index)}
                        className="text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">SÈRIES</label>
                      <input
                        type="number"
                        value={ex.sets}
                        min="1"
                        onChange={(e) => updateExercise(index, 'sets', Number(e.target.value))}
                        className="w-full bg-[#151515] border border-[#2a2a2a] rounded px-2 py-1 text-white text-xs outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">REPS</label>
                      <input
                        type="number"
                        value={ex.reps}
                        min="1"
                        onChange={(e) => updateExercise(index, 'reps', Number(e.target.value))}
                        className="w-full bg-[#151515] border border-[#2a2a2a] rounded px-2 py-1 text-white text-xs outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">DESCANS (s)</label>
                      <input
                        type="number"
                        value={ex.rest}
                        min="0"
                        onChange={(e) => updateExercise(index, 'rest', Number(e.target.value))}
                        className="w-full bg-[#151515] border border-[#2a2a2a] rounded px-2 py-1 text-white text-xs outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-orange-500/20"
            >
              {isEditing ? t('common.save') : t('routines.createRoutine')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoutineModal;
