import { useNavigate } from "react-router-dom";
import { Dumbbell, Calendar, LogOut } from "../components/Icons";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { routineService, type Routine } from "../services/routineService";

const POLL_INTERVAL_MS = 10_000; // Refresca cada 10 segundos sin que el usuario haga nada

const ClientHome = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    // Función de fetch extraída para reutilizarla en el polling
    const fetchClientRoutines = useCallback(async (showLoader = false) => {
        if (showLoader) setLoading(true);
        try {
            const data = await routineService.getMyRoutines();
            setRoutines(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error al obtener rutinas del cliente:", error);
        } finally {
            if (showLoader) setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Carga inicial con spinner
        fetchClientRoutines(true);

        // Polling: actualiza en segundo plano cada 10 segundos
        const interval = setInterval(() => {
            fetchClientRoutines(false); // sin spinner para que no parpadee
        }, POLL_INTERVAL_MS);

        return () => clearInterval(interval); // limpieza al desmontar
    }, [fetchClientRoutines]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans">
            {/* Navbar */}
            <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4 flex justify-between items-center sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                        <Dumbbell className="w-6 h-6 text-orange-500" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">
                        Light<span className="text-orange-500">Weight</span>{" "}
                        <span className="text-gray-500 text-sm font-normal ml-2">Client Portal</span>
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    {/* Indicador de última actualización */}
                    {lastUpdated && (
                        <span className="hidden sm:block text-xs text-gray-600">
                            Actualizado {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                    <span className="text-sm font-medium text-gray-400">
                        Welcome, <span className="text-white">{user?.username ?? "Athlete"}</span>
                    </span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="mb-10 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">My Training Plan</h1>
                        <p className="text-gray-500 max-w-2xl">
                            Here are the routines assigned to you by your coach. Stay consistent and track your progress.
                        </p>
                    </div>
                    {/* Botón de refresh manual */}
                    <button
                        onClick={() => fetchClientRoutines(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white border border-[#2a2a2a] hover:border-orange-500/40 rounded-lg transition-all"
                        title="Refresh routines"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-500 text-sm">Loading your plan...</p>
                    </div>
                ) : routines.length === 0 ? (
                    <div className="text-center py-20 bg-[#1a1a1a] rounded-xl border border-dashed border-[#333]">
                        <div className="inline-flex items-center justify-center p-4 bg-[#252525] rounded-full mb-4">
                            <Calendar className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-xl text-white font-medium mb-2">No routines assigned yet</h3>
                        <p className="text-gray-500">Your coach hasn't assigned any training routines to you yet.</p>
                        <p className="text-gray-600 text-sm mt-2">This page updates automatically every 10 seconds.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {routines.map((routine) => (
                            <div
                                key={routine.id}
                                className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-5 hover:border-orange-500/30 transition-all group"
                            >
                                {/* Header de la tarjeta */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                                        <Dumbbell className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <span className="text-xs text-gray-600 bg-[#252525] px-2 py-1 rounded-full">
                                        {routine.exercises?.length ?? 0} exercise{(routine.exercises?.length ?? 0) !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-1 truncate">{routine.name}</h3>
                                <p className="text-xs text-gray-600 mb-4">
                                    {routine.createdAt
                                        ? `Assigned ${new Date(routine.createdAt).toLocaleDateString()}`
                                        : "Recently assigned"}
                                </p>

                                {/* Lista de ejercicios */}
                                {routine.exercises && routine.exercises.length > 0 && (
                                    <ul className="space-y-2">
                                        {routine.exercises.slice(0, 3).map((re: any, i: number) => (
                                            <li key={i} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-300 truncate">{re.exercise?.name ?? re.name}</span>
                                                <span className="text-gray-600 text-xs ml-2 shrink-0">
                                                    {re.sets}×{re.reps}
                                                </span>
                                            </li>
                                        ))}
                                        {routine.exercises.length > 3 && (
                                            <li className="text-xs text-gray-600 pt-1">
                                                +{routine.exercises.length - 3} more exercises...
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ClientHome;
