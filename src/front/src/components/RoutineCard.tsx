import { useNavigate } from "react-router-dom";
import { Trash2, Edit, Calendar } from "./Icons";
import { useTranslation } from "react-i18next";

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
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Format date nicely
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 md:p-5 border border-transparent hover:border-orange-500/20 transition-all duration-300 group shadow-lg hover:shadow-orange-500/5">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 md:p-3 rounded-lg bg-[#252525] text-orange-500 group-hover:scale-110 transition-transform duration-300">
          <img
            src="/LW_logo.png"
            alt="LightWeight"
            className="w-6 h-6 md:w-7 md:h-7 object-contain"
          />
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(id);
            }}
            className="p-1.5 hover:bg-[#333] rounded-md text-gray-400 hover:text-blue-400 transition-colors"
            title={t("routines.edit")}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            className="p-1.5 hover:bg-[#333] rounded-md text-gray-400 hover:text-red-500 transition-colors"
            title={t("routines.delete")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h3 className="text-base md:text-lg font-semibold text-white mb-1 group-hover:text-orange-500 transition-colors truncate">
        {name}
      </h3>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-4 text-sm text-gray-500 mt-4">
        <button
          onClick={() => navigate(`/routine/${id}/edit`)}
          className="flex items-center gap-1.5 bg-[#0a0a0a] px-2 py-1 rounded text-xs border border-[#2a2a2a] hover:border-orange-500/40 hover:text-orange-400 transition-colors cursor-pointer w-full sm:w-auto justify-center sm:justify-start"
          title={t("routines.exercises")}
        >
          <span className="font-medium text-gray-300">{exerciseCount}</span>{" "}
          {t("routines.exercises")}
        </button>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Calendar className="w-3 h-3 flex-shrink-0" />
          {formattedDate}
        </div>
      </div>
    </div>
  );
};

export default RoutineCard;
