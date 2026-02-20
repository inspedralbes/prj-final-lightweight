import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RoutineForm from '../components/RoutineForm';
import api from '../utils/api';

export const RoutineEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/routines/${id}`);
        const r = res.data;
        const exercises = (r.exercises || []).map((ex: any) => ({
          name: ex.exercise?.name ?? '',
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          notes: ex.notes,
        }));
        setInitial({ name: r.name, exercises });
      } catch (err) {
        console.error(err);
        alert('Error cargando rutina');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleSubmit = async (payload: { name: string; exercises: any[] }) => {
    try {
      await api.put(`/routines/${id}/edit`, payload);
      navigate('/home');
    } catch (err) {
      console.error(err);
      alert('Error guardando rutina');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!initial) return <div className="min-h-screen flex items-center justify-center">Rutina no encontrada</div>;

  return (
    <div className="min-h-screen p-8 bg-slate-900 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Editar rutina</h1>
        <RoutineForm initialName={initial.name} initialExercises={initial.exercises} onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default RoutineEdit;
