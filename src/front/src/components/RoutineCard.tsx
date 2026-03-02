import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Trash2, Edit, Calendar } from "./Icons";
import { useTranslation } from "react-i18next";

interface RoutineCardProps {
  id: number;
  name: string;
  exerciseCount: number;
  createdAt: string;
  assignedClients?: { id: number; username: string }[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const RoutineCard = ({
  id,
  name,
  exerciseCount,
  createdAt,
  assignedClients = [],
  onEdit,
  onDelete,
}: RoutineCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [clientsHover, setClientsHover] = useState(false);

  // Format date nicely
  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="bg-[#1a1a1a] rounded-xl p-4 md:p-5 border border-transparent hover:border-orange-500/20 transition-all duration-300 group shadow-lg hover:shadow-orange-500/5 cursor-pointer"
      onClick={() => navigate(`/routine/${id}/edit`)}
    >
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

      {assignedClients.length > 0 && (
        <div
          className="relative mt-2 w-fit"
          onMouseEnter={() => setClientsHover(true)}
          onMouseLeave={() => setClientsHover(false)}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Stacked avatars row */}
          <div className="flex items-center cursor-default">
            <div className="flex -space-x-2">
              {assignedClients.slice(0, 4).map((c, idx) => {
                const colors = [
                  "bg-orange-500/30 text-orange-300 ring-orange-500/20",
                  "bg-blue-500/30 text-blue-300 ring-blue-500/20",
                  "bg-green-500/30 text-green-300 ring-green-500/20",
                  "bg-purple-500/30 text-purple-300 ring-purple-500/20",
                ];
                return (
                  <div
                    key={c.id}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-[#1a1a1a] ${colors[idx % colors.length]}`}
                  >
                    {c.username.slice(0, 1).toUpperCase()}
                  </div>
                );
              })}
              {assignedClients.length > 4 && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-[#1a1a1a] bg-zinc-700 text-gray-300">
                  +{assignedClients.length - 4}
                </div>
              )}
            </div>
            {/* chevron */}
            <svg
              className={`ml-2 w-3 h-3 text-gray-500 transition-transform duration-200 ${clientsHover ? "rotate-180 text-gray-300" : ""}`}
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Dropdown */}
          {clientsHover && (
            <div
              className="absolute left-0 top-full mt-2 w-52 bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden z-50"
              onMouseEnter={() => setClientsHover(false)}
            >
              <div className="px-3 py-2 border-b border-[#1f1f1f]">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                  {t("routines.assignedTo")}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto py-1">
                {assignedClients.map((c, idx) => {
                  const colors = [
                    "bg-orange-500/30 text-orange-300",
                    "bg-blue-500/30 text-blue-300",
                    "bg-green-500/30 text-green-300",
                    "bg-purple-500/30 text-purple-300",
                  ];
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 px-3 py-2 select-none pointer-events-none"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colors[idx % colors.length]}`}
                      >
                        {c.username.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-200 truncate">
                        {c.username}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-4 text-sm text-gray-500 mt-4">
        <button
          // onClick={() => navigate(`/routine/${id}/edit`)}
          className="flex items-center gap-1.5 bg-[#0a0a0a] px-2 py-1 rounded text-xs border border-[#2a2a2a] transition-colors cursor-pointer w-full sm:w-auto justify-center sm:justify-start"
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
