import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Trash2, Edit, Dumbbell, Play } from "./Icons";
import { useTranslation } from "react-i18next";

interface RawExercise {
  name?: string;
  exercise?: { name: string };
  sets: number;
  reps: number;
}

interface RoutineCardProps {
  id: number;
  name: string;
  createdAt?: string;
  exercises?: RawExercise[];
  assignedClients?: { id: number; username: string }[];
  /** Coach mode: open edit modal */
  onEdit?: (id: number) => void;
  /** Coach mode: delete routine */
  onDelete?: (id: number) => void;
  /** Client mode: navigate to workout */
  onStart?: (id: number) => void;
}

const AVATAR_COLORS = [
  "bg-orange-500/30 text-orange-300",
  "bg-blue-500/30 text-blue-300",
  "bg-green-500/30 text-green-300",
  "bg-purple-500/30 text-purple-300",
];

const RoutineCard = ({
  id,
  name,
  createdAt,
  exercises = [],
  assignedClients = [],
  onEdit,
  onDelete,
  onStart,
}: RoutineCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [clientsHover, setClientsHover] = useState(false);

  const isClientMode = !!onStart;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString([], {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const handleCardClick = () => {
    if (isClientMode) navigate(`/workout/${id}`);
    else navigate(`/routine/${id}/edit`);
  };

  return (
    <div
      className="relative bg-[#111] rounded-2xl border border-[#222] p-5 md:p-6 hover:border-orange-500/50 hover:bg-[#151515] transition-all duration-300 group cursor-pointer flex flex-col h-full shadow-lg shadow-black/20"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="p-2.5 bg-[#1a1a1a] group-hover:bg-orange-500/10 rounded-xl transition-colors border border-[#2a2a2a] group-hover:border-orange-500/20">
          <Dumbbell className="w-5 h-5 text-orange-500 opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="whitespace-nowrap shrink-0 text-xs font-medium text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2.5 py-1 rounded-full">
          {exercises.length} {t("routines.exercises")}
        </span>
      </div>

      {/* Body */}
      <div className="flex-grow">
        <h3 className="text-lg md:text-xl font-bold text-gray-100 mb-1.5 line-clamp-2 group-hover:text-orange-400 transition-colors">
          {name}
        </h3>
        {formattedDate && (
          <p className="text-xs font-medium text-gray-600 mb-4">
            {formattedDate}
          </p>
        )}

        {/* Exercise preview — client mode */}
        {isClientMode && exercises.length > 0 && (
          <div className="space-y-2.5 pt-4 border-t border-[#222] mt-auto">
            {exercises.slice(0, 3).map((re, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-gray-400 truncate pr-4 text-sm">
                  • {re.exercise?.name ?? re.name}
                </span>
                <span className="text-gray-500 text-xs font-mono bg-[#1a1a1a] px-2 py-0.5 rounded shrink-0">
                  {re.sets}×{re.reps}
                </span>
              </div>
            ))}
            {exercises.length > 3 && (
              <div className="text-xs text-gray-600 font-medium pt-1 text-center">
                +{exercises.length - 3} {t("routines.moreExercises")}
              </div>
            )}
          </div>
        )}

        {/* Assigned clients — coach mode */}
        {!isClientMode && assignedClients.length > 0 && (
          <div
            className="relative mt-3 w-fit"
            onMouseEnter={() => setClientsHover(true)}
            onMouseLeave={() => setClientsHover(false)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 cursor-default">
              <div className="flex -space-x-2">
                {assignedClients.slice(0, 4).map((c, idx) => (
                  <div
                    key={c.id}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-[#111] ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
                  >
                    {c.username.slice(0, 1).toUpperCase()}
                  </div>
                ))}
                {assignedClients.length > 4 && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-[#111] bg-zinc-700 text-gray-300">
                    +{assignedClients.length - 4}
                  </div>
                )}
              </div>
              <svg
                className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${clientsHover ? "rotate-180 text-gray-300" : ""}`}
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
                  {assignedClients.map((c, idx) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 px-3 py-2 select-none pointer-events-none"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
                      >
                        {c.username.slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-200 truncate">
                        {c.username}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer — client mode: Start button */}
      {isClientMode && (
        <div className="mt-6 pt-5 border-t border-[#222]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStart!(id);
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-orange-500/10 active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            {t("routines.startRoutine")}
          </button>
        </div>
      )}

      {/* Footer — coach mode: edit / delete */}
      {!isClientMode && (onEdit || onDelete) && (
        <div className="mt-6 pt-4 border-t border-[#222] flex gap-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(id);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1a1a1a] hover:bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              {t("routines.edit")}
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1a1a1a] hover:bg-red-500/10 border border-red-500/20 text-red-500 hover:text-red-400 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t("routines.delete")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RoutineCard;
