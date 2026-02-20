import { useState } from 'react';
import api from '../utils/api';

export type ExerciseItem = {
  name: string;
  sets: number;
  reps: number;
  rest: number;
  notes?: string | null;
};

type Props = {
  initialName?: string;
  initialExercises?: ExerciseItem[];
  onSubmit: (payload: { name: string; exercises: ExerciseItem[] }) => Promise<void>;
  submitting?: boolean;
};

type FormErrors = {
  name?: string;
  exercises?: string;
};

export const RoutineForm = ({ initialName = '', initialExercises = [], onSubmit, submitting = false }: Props) => {
  const [name, setName] = useState(initialName);
  const [exercises, setExercises] = useState<ExerciseItem[]>(initialExercises.length ? initialExercises : [{ name: '', sets: 3, reps: 10, rest: 60, notes: '' }]);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nombre obligatorio
    if (!name.trim()) {
      newErrors.name = 'El nombre de la rutina es obligatorio';
    }

    // Validar al menos 1 ejercicio
    if (exercises.length === 0) {
      newErrors.exercises = 'Debes agregar al menos 1 ejercicio';
    } else if (exercises.some(ex => !ex.name.trim())) {
      newErrors.exercises = 'Todos los ejercicios deben tener un nombre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateExercise = (idx: number, patch: Partial<ExerciseItem>) => {
    setExercises((s) => s.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };

  const addExercise = () => setExercises((s) => [...s, { name: '', sets: 3, reps: 10, rest: 60, notes: '' }]);
  const removeExercise = (idx: number) => setExercises((s) => s.filter((_, i) => i !== idx));

  // Reordenamiento con botones up/down
  const moveExerciseUp = (idx: number) => {
    if (idx === 0) return;
    setExercises((s) => {
      const newExercises = [...s];
      [newExercises[idx - 1], newExercises[idx]] = [newExercises[idx], newExercises[idx - 1]];
      return newExercises;
    });
  };

  const moveExerciseDown = (idx: number) => {
    if (idx === exercises.length - 1) return;
    setExercises((s) => {
      const newExercises = [...s];
      [newExercises[idx], newExercises[idx + 1]] = [newExercises[idx + 1], newExercises[idx]];
      return newExercises;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSubmit({ name, exercises });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre de la rutina</label>
        <input 
          value={name} 
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors({ ...errors, name: undefined });
          }} 
          className={`w-full p-2 rounded bg-slate-800 border ${errors.name ? 'border-red-500' : 'border-slate-700'}`}
          placeholder="Nombre" 
        />
        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ejercicios</h3>
          <button type="button" className="text-sm text-blue-400 hover:text-blue-300" onClick={addExercise}>+ Agregar ejercicio</button>
        </div>

        {errors.exercises && <p className="text-red-400 text-sm mt-2 mb-2">{errors.exercises}</p>}

        <div className="space-y-3 mt-3">
          {exercises.map((ex, idx) => (
            <div key={idx} className="p-3 bg-slate-800 rounded border border-slate-700">
              <div className="flex justify-between items-center mb-3">
                <strong>Ejercicio #{idx + 1}</strong>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    className="text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                    onClick={() => moveExerciseUp(idx)}
                    disabled={idx === 0}
                    title="Mover arriba"
                  >
                    ↑
                  </button>
                  <button 
                    type="button" 
                    className="text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                    onClick={() => moveExerciseDown(idx)}
                    disabled={idx === exercises.length - 1}
                    title="Mover abajo"
                  >
                    ↓
                  </button>
                  <button 
                    type="button" 
                    className="text-red-400 hover:text-red-300 text-sm transition" 
                    onClick={() => removeExercise(idx)}
                  >
                    ✕ Eliminar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input 
                  placeholder="Nombre ejercicio" 
                  value={ex.name} 
                  onChange={(e) => updateExercise(idx, { name: e.target.value })} 
                  className={`col-span-1 md:col-span-2 p-2 rounded bg-slate-900 border ${!ex.name.trim() && exercises.length > 0 ? 'border-red-400' : 'border-slate-700'}`}
                />
                <input 
                  type="number" 
                  placeholder="Sets" 
                  value={ex.sets} 
                  onChange={(e) => updateExercise(idx, { sets: Number(e.target.value) })} 
                  className="p-2 rounded bg-slate-900 border border-slate-700" 
                />
                <input 
                  type="number" 
                  placeholder="Reps" 
                  value={ex.reps} 
                  onChange={(e) => updateExercise(idx, { reps: Number(e.target.value) })} 
                  className="p-2 rounded bg-slate-900 border border-slate-700" 
                />
                <input 
                  type="number" 
                  placeholder="Rest (s)" 
                  value={ex.rest} 
                  onChange={(e) => updateExercise(idx, { rest: Number(e.target.value) })} 
                  className="p-2 rounded bg-slate-900 border border-slate-700" 
                />
              </div>

              <div className="mt-2">
                <textarea 
                  placeholder="Notas (opcional)" 
                  value={ex.notes ?? ''} 
                  onChange={(e) => updateExercise(idx, { notes: e.target.value })} 
                  className="w-full p-2 rounded bg-slate-900 border border-slate-700" 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={submitting} 
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold transition"
        >
          {submitting ? 'Guardando...' : 'Guardar rutina'}
        </button>
      </div>
    </form>
  );
};

export default RoutineForm;
