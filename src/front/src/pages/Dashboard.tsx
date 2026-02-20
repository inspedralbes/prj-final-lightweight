import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import RoutineCard from "../components/RoutineCard";
import { Plus, X } from "../components/Icons";
import { routineService, type Routine } from "../services/routineService";
import axios from "axios";

// Mock user for MVP - In real app get from Auth Context
const MOCK_COACH_ID = 1;

const Dashboard = () => {
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRoutine, setCurrentRoutine] = useState<{ id?: number; name: string } | null>(null);
    const [formName, setFormName] = useState("");

    const fetchRoutines = async () => {
        try {
            setLoading(true);
            const data = await routineService.getAll();
            setRoutines(data);
        } catch (error) {
            console.error("Failed to fetch routines", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutines();
    }, []);

    const handleCreateClick = () => {
        setCurrentRoutine(null);
        setFormName("");
        setIsModalOpen(true);
    };

    const handleEditClick = (id: number) => {
        const routine = routines.find((r) => r.id === id);
        if (routine) {
            setCurrentRoutine({ id: routine.id, name: routine.name });
            setFormName(routine.name);
            setIsModalOpen(true);
        }
    };

    const handleDeleteClick = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this routine?")) {
            try {
                await routineService.delete(id);
                // Optimistic update or refetch
                setRoutines((prev) => prev.filter((r) => r.id !== id));
            } catch (error) {
                console.error("Failed to delete routine", error);
                alert("Failed to delete routine");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) return;

        try {
            if (currentRoutine?.id) {
                // Update
                const updated = await routineService.update(currentRoutine.id, { name: formName });
                setRoutines((prev) =>
                    prev.map((r) => (r.id === updated.id ? updated : r))
                );
            } else {
                // Create
                // Note: Coach ID is hardcoded for now as per Context, assumed User is Coach with ID 1
                const created = await routineService.create({ coachId: MOCK_COACH_ID, name: formName });
                setRoutines((prev) => [created, ...prev]);
            }
            setIsModalOpen(false);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Error saving routine:", error.response?.data);
                alert(`Error: ${JSON.stringify(error.response?.data?.message || 'Unknown error')}`);
            } else {
                console.error("Error saving routine:", error);
            }

        }
    };

    return (
        <Layout>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Coach</h1>
                        <p className="text-gray-500">Welcome back, Coach.</p>
                    </div>
                    <button
                        onClick={handleCreateClick}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-orange-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        Add Routine
                    </button>
                </div>

                {/* Filters/Search placeholder if needed */}
                {/* Could go here */}

                {/* Content */}
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading routines...</div>
                ) : routines.length === 0 ? (
                    <div className="text-center py-20 bg-[#1a1a1a] rounded-xl border border-dashed border-gray-800">
                        <h3 className="text-xl text-white font-medium mb-2">No routines found</h3>
                        <p className="text-gray-500 mb-6">Get started by creating your first training routine.</p>
                        <button
                            onClick={handleCreateClick}
                            className="text-orange-500 font-medium hover:underline"
                        >
                            Create New Routine
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {routines.map((routine) => (
                            <RoutineCard
                                key={routine.id}
                                id={routine.id}
                                name={routine.name}
                                exerciseCount={routine.exercises?.length || 0}
                                createdAt={routine.createdAt || new Date().toISOString()} // Fallback if API lacks it
                                onEdit={handleEditClick}
                                onDelete={handleDeleteClick}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-[#2a2a2a]">
                            <h2 className="text-xl font-bold text-white">
                                {currentRoutine ? "Edit Routine" : "Create New Routine"}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-6">
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

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-orange-500/20"
                                >
                                    {currentRoutine ? "Save Changes" : "Create Routine"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Dashboard;
