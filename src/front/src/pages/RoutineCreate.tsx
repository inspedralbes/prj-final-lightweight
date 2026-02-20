import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoutineForm from '../components/RoutineForm';
import api from '../utils/api';

export const RoutineCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload: { name: string; exercises: any[] }) => {
    try {
      setLoading(true);
      const res = await api.post('/routines/create', payload);
      const id = res.data?.id;
      // If backend returns full object, navigate to edit or home
      navigate('/home');
    } catch (err) {
      console.error(err);
      alert('Error creando rutina');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-slate-900 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Crear rutina</h1>
        <RoutineForm onSubmit={handleSubmit} submitting={loading} />
      </div>
    </div>
  );
};

export default RoutineCreate;
