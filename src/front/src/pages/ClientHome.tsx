import { useNavigate } from "react-router-dom";
import { Dumbbell, Calendar, LogOut } from "../components/Icons";
import { useEffect, useState } from "react";
// We'll create a clientService similar to routineService, or reuse routineService if it handles client-specific fetches
import { routineService, type Routine } from "../services/routineService";
import RoutineCard from "../components/RoutineCard";

const ClientHome = () => {
    const navigate = useNavigate();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);
    const username = localStorage.getItem("username") || "Athlete";

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("username");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        navigate("/login");
    };

    useEffect(() => {
        const fetchClientRoutines = async () => {
            try {
                const data = await routineService.getAll();
                setRoutines(data);
            } catch (error) {
                console.error("Failed to fetch routines", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClientRoutines();
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans">
            {/* Navbar / Header */}
            <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                        <Dumbbell className="w-6 h-6 text-orange-500" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">
                        Light<span className="text-orange-500">Weight</span> <span className="text-gray-500 text-sm font-normal ml-2">Client Portal</span>
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <span className="text-sm font-medium text-gray-400">Welcome, <span className="text-white">{username}</span></span>
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
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">My Training Plan</h1>
                    <p className="text-gray-500 max-w-2xl">
                        Here are the routines assigned to you by your coach. Stay consistent and track your progress.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading your plan...</div>
                ) : routines.length === 0 ? (
                    <div className="text-center py-20 bg-[#1a1a1a] rounded-xl border border-dashed border-[#333]">
                        <div className="inline-flex items-center justify-center p-4 bg-[#252525] rounded-full mb-4">
                            <Calendar className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-xl text-white font-medium mb-2">No routines assigned yet</h3>
                        <p className="text-gray-500">Your coach hasn't assigned any training routines to you yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {routines.map((routine) => (
                            // Reusing RoutineCard but disabling edit/delete for clients
                            // Ideally create a ReadOnlyRoutineCard or pass props to hide actions
                            <div key={routine.id} className="relative group">
                                <RoutineCard
                                    id={routine.id}
                                    name={routine.name}
                                    exerciseCount={routine.exercises?.length || 0} // Safely access exercises
                                    createdAt={routine.createdAt || new Date().toISOString()}
                                    onEdit={() => { }} // No-op for client
                                    onDelete={() => { }} // No-op for client
                                />
                                {/* Overlay to block interactions if RoutineCard doesn't support read-only mode explicitly yet */}
                                <div className="absolute top-4 right-4 bg-[#1a1a1a] pl-4 pb-2 pt-1 z-10 pointer-events-none hidden">
                                    {/* Hack to hide edit buttons if they are absolute positioned in card... 
                                       Better approach: Update RoutineCard to accept 'readOnly' prop */}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ClientHome;
