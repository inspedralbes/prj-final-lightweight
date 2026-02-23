import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown } from "./Icons";
import { useTranslation } from "react-i18next";

export type ExerciseItem = {
  name: string;
  sets: number;
  reps: number;
  rest: number;
  notes?: string | null;
};

type Props = {
  initialExercises?: ExerciseItem[];
  onSubmit: (payload: { exercises: ExerciseItem[] }) => Promise<void>;
  submitting?: boolean;
};

type FormErrors = {
  exercises?: string;
};

const inputClass =
  "w-full bg-[#0a0a0a] border border-[#333] rounded-lg px-3 md:px-4 py-2 md:py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-gray-700 text-sm md:text-base";

const labelClass =
  "block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider";

export const ExercisesForm = ({
  initialExercises = [],
  onSubmit,
  submitting = false,
}: Props) => {
  const [exercises, setExercises] = useState<ExerciseItem[]>(
    initialExercises.length
      ? initialExercises
      : [{ name: "", sets: 3, reps: 10, rest: 60, notes: "" }],
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const { t } = useTranslation();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (exercises.length === 0) {
      newErrors.exercises = t('routines.addExercise');
    } else if (exercises.some((ex) => !ex.name.trim())) {
      newErrors.exercises = t('messages.invalidInput');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateExercise = (idx: number, patch: Partial<ExerciseItem>) =>
    setExercises((s) => s.map((e, i) => (i === idx ? { ...e, ...patch } : e)));

  const addExercise = () =>
    setExercises((s) => [
      ...s,
      { name: "", sets: 3, reps: 10, rest: 60, notes: "" },
    ]);

  const removeExercise = (idx: number) =>
    setExercises((s) => s.filter((_, i) => i !== idx));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setExercises((s) => {
      const n = [...s];
      [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]];
      return n;
    });
  };

  const moveDown = (idx: number) => {
    if (idx === exercises.length - 1) return;
    setExercises((s) => {
      const n = [...s];
      [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]];
      return n;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit({ exercises });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Exercises */}
      <div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-semibold text-white">{t('routines.exercises')}</h3>
            {errors.exercises && (
              <p className="text-red-400 text-sm mt-0.5">{errors.exercises}</p>
            )}
          </div>
          <button
            type="button"
            onClick={addExercise}
            className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center md:justify-start gap-2 text-sm font-medium transition-colors shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            {t('routines.addExercise')}
          </button>
        </div>

        <div className="space-y-4">
          {exercises.map((ex, idx) => (
            <div
              key={idx}
              className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 md:p-5 hover:border-[#333] transition-colors"
            >
              {/* Card header */}
              <div className="flex justify-between items-center mb-5">
                <span className="text-xs font-semibold text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-full">
                  #{idx + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    title={t('common.back')}
                    className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === exercises.length - 1}
                    title={t('common.save')}
                    className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExercise(idx)}
                    title={t('routines.delete')}
                    className="p-1.5 rounded-md text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Exercise name */}
              <div className="mb-4">
                <label className={labelClass}>{t('routines.exerciseName')}</label>
                <input
                  placeholder="e.g. Bench Press"
                  value={ex.name}
                  onChange={(e) =>
                    updateExercise(idx, { name: e.target.value })
                  }
                  className={`${inputClass} ${!ex.name.trim() ? "!border-red-500/50" : ""}`}
                />
              </div>

              {/* Sets / Reps / Rest - Responsive Grid */}
              <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
                <div>
                  <label className={labelClass}>{t('routines.series')}</label>
                  <input
                    type="number"
                    min={1}
                    value={ex.sets}
                    onChange={(e) =>
                      updateExercise(idx, { sets: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('routines.reps')}</label>
                  <input
                    type="number"
                    min={1}
                    value={ex.reps}
                    onChange={(e) =>
                      updateExercise(idx, { reps: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('routines.rest')}</label>
                  <input
                    type="number"
                    min={0}
                    value={ex.rest}
                    onChange={(e) =>
                      updateExercise(idx, { rest: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={labelClass}>
                  Notes{" "}
                  <span className="normal-case text-gray-600">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Keep elbows tucked, tempo 3-1-1"
                  value={ex.notes ?? ""}
                  onChange={(e) =>
                    updateExercise(idx, { notes: e.target.value })
                  }
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          ))}

          {exercises.length === 0 && (
            <div className="text-center py-8 md:py-12 bg-[#1a1a1a] rounded-xl border border-dashed border-gray-800">
              <p className="text-gray-500 mb-4 text-sm md:text-base">
                {t('routines.noRoutines')}
              </p>
              <button
                type="button"
                onClick={addExercise}
                className="text-orange-500 font-medium hover:underline text-sm"
              >
                {t('routines.addExercise')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white px-6 md:px-8 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-orange-500/20"
        >
          {submitting ? t('common.loading') : t('routines.save')}
        </button>
      </div>
    </form>
  );
};

export default ExercisesForm;
