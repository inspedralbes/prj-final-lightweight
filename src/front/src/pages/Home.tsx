import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function Home() {
  const navigate = useNavigate();

  // Comprovem si hi ha token; si no, redirigim al login
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Contenidor principal amb sidebar i àrea de contingut */}
      <div className="flex">
        {/* Sidebar: componente reutilitzable amb paleta negre+taronja */}
        <Sidebar />

        {/* ------------------ */}
        {/* Contingut principal: capçalera i columnes */}
        {/* ------------------ */}
        <main className="flex-1 p-8">
          {/* Capçalera superior: cerca i accions */}
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">Panell</h1>
              <p className="text-sm text-gray-400">Benvingut de nou — tens 5 check-ins pendents avui</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                placeholder="Cerca clients, programes o aliments..."
                className="bg-gray-800 text-sm text-gray-200 px-3 py-2 rounded w-96 placeholder-gray-500"
              />
              <button className="bg-orange-600 hover:bg-orange-700 text-black px-4 py-2 rounded">+ Afegeix Client</button>
            </div>
          </header>

          {/* Estadístiques ràpides: targetes superiors */}
          <section className="grid grid-cols-4 gap-4 mb-6">
            {/* Total clients */}
            <div className="bg-gray-800 p-4 rounded shadow">
              <div className="text-sm text-gray-400">Clients totals</div>
              <div className="text-2xl font-bold text-white">42 <span className="text-sm text-green-400">+3</span></div>
              <div className="h-2 bg-gray-700 rounded mt-3 overflow-hidden">
                <div className="h-2 bg-orange-500 w-3/4" />
              </div>
              <div className="text-xs text-gray-500 mt-2">Objectiu: 50 clients</div>
            </div>

            {/* Programes actius */}
            <div className="bg-gray-800 p-4 rounded shadow">
              <div className="text-sm text-gray-400">Programes actius</div>
              <div className="text-2xl font-bold text-white">38</div>
              <div className="text-xs text-gray-500 mt-3">actius ara</div>
            </div>

            {/* Adherència mitjana */}
            <div className="bg-gray-800 p-4 rounded shadow">
              <div className="text-sm text-gray-400">Adherència mitjana</div>
              <div className="text-2xl font-bold text-white">87% <span className="text-xs text-gray-400">Top 10%</span></div>
            </div>

            {/* Ingressos */}
            <div className="bg-gray-800 p-4 rounded shadow">
              <div className="text-sm text-gray-400">Ingressos mensuals</div>
              <div className="text-2xl font-bold text-white">$8.4k <span className="text-sm text-green-400">+12%</span></div>
            </div>
          </section>

          <div className="grid grid-cols-3 gap-6">
            {/* ------------------ */}
            {/* Taula: Classificació d'adherència */}
            {/* ------------------ */}
            <section className="col-span-2 bg-gray-800 p-6 rounded shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Classificació de compliment</h2>
                <button className="text-sm text-orange-400">Veure-ho tot</button>
              </div>

              {/* Taula simplificada amb quatre files */}
              <table className="w-full text-left text-sm">
                <thead className="text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="py-2">Rang</th>
                    <th>Client</th>
                    <th>Programa</th>
                    <th>Adherència</th>
                    <th>Actiu</th>
                  </tr>
                </thead>
                <tbody className="mt-2">
                  {[
                    { rank: 1, name: 'Sarah Jenkins', program: 'Hipertrofia', adherence: '98%', active: '2h' },
                    { rank: 2, name: 'Marcus Ray', program: 'Pèrdua de pes', adherence: '94%', active: '5h' },
                    { rank: 3, name: 'Emily Davis', program: 'Força 5x5', adherence: '91%', active: '1d' },
                    { rank: 4, name: 'Alex Thompson', program: 'Rehab - Ginoc', adherence: '88%', active: '3h' },
                  ].map((r) => (
                    <tr key={r.rank} className="border-t border-gray-700">
                      <td className="py-3 w-12 text-gray-300">{r.rank}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img src={`https://i.pravatar.cc/40?img=${r.rank}`} className="w-8 h-8 rounded-full" />
                          <div className="text-sm text-white">{r.name}</div>
                        </div>
                      </td>
                      <td className="py-3 text-gray-300">{r.program}</td>
                      <td className="py-3 text-orange-400 font-semibold">{r.adherence}</td>
                      <td className="py-3 text-gray-400">{r.active}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* ------------------ */}
            {/* Barra lateral dreta: Activitat recent i accions ràpides */}
            {/* ------------------ */}
            <aside className="space-y-6">
              {/* Activitat recent */}
              <div className="bg-gray-800 p-4 rounded shadow">
                <h3 className="text-sm font-semibold mb-3">Activitat recent</h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li>
                    <div className="font-semibold text-white">Sarah Jenkins</div>
                    <div className="text-gray-400">Ha completat Dia de cames - Hipertrofia · 15 min</div>
                  </li>
                  <li>
                    <div className="font-semibold text-white">Marcus Ray</div>
                    <div className="text-gray-400">Pagament rebut · 2 h</div>
                  </li>
                  <li>
                    <div className="font-semibold text-white">Alex Thompson</div>
                    <div className="text-gray-400">Ha pujat fotos de progrés · 3 h</div>
                  </li>
                </ul>
              </div>

              {/* Accions ràpides */}
              <div className="bg-gray-800 p-4 rounded shadow">
                <h3 className="text-sm font-semibold mb-3">Accions ràpides</h3>
                <div className="grid grid-cols-1 gap-3">
                  <button className="w-full bg-gray-700 hover:bg-gray-700/80 py-3 rounded text-left px-4">Crea entrenament</button>
                  <button className="w-full bg-gray-700 hover:bg-gray-700/80 py-3 rounded text-left px-4">Envia missatge a tots</button>
                </div>
              </div>

              {/* Gràfica / Tendència (espai reservat) */}
              <div className="bg-gray-800 p-4 rounded shadow">
                <h3 className="text-sm font-semibold mb-3">Tendència de check-ins</h3>
                <div className="h-36 bg-gray-700 rounded flex items-center justify-center text-gray-500">Gràfica (placeholder)</div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
