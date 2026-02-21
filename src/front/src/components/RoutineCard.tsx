import { Trash2, Edit, Calendar, Dumbbell } from "./Icons";

interface RoutineCardProps {
    id: number;
    name: string;
    exerciseCount: number;
    createdAt: string;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}

const RoutineCard = ({
    id,
    name,
    exerciseCount,
    createdAt,
    onEdit,
    onDelete,
}: RoutineCardProps) => {
    // Format date nicely
    const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <div className="bg-[#1a1a1a] rounded-xl p-5 border border-transparent hover:border-orange-500/20 transition-all duration-300 group shadow-lg hover:shadow-orange-500/5">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-lg bg-[#252525] text-orange-500 group-hover:scale-110 transition-transform duration-300">
                    <Dumbbell className="w-6 h-6" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(id); }}
                        className="p-1.5 hover:bg-[#333] rounded-md text-gray-400 hover:text-blue-400 transition-colors"
                        title="Edit Routine"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                        className="p-1.5 hover:bg-[#333] rounded-md text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Routine"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-orange-500 transition-colors truncate">
                {name}
            </h3>

            <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                <div className="flex items-center gap-1.5 bg-[#0a0a0a] px-2 py-1 rounded text-xs border border-[#2a2a2a]">
                    <span className="font-medium text-gray-300">{exerciseCount}</span> Exercises
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    {formattedDate}
                </div>
            </div>
        </div>
    );
};

export default RoutineCard;
