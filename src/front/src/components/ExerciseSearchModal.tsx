import { useEffect, useState } from "react";
import api from "../utils/api";

interface Exercise {
  id: number;
  name: string;
  level?: string;
  category?: string;
  forceType?: string;
  mechanic?: string;
  equipment?: string;
  primaryMuscle?: string[];
  description?: string;
}

type Props = {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
};

export default function ExerciseSearchModal({ onSelect, onClose }: Props) {
  type Filters = {
    search?: string;
    page: number;
    limit: number;
    level?: "beginner" | "intermediate" | "advanced" | string;
    category?: string;
    force?: string;
    mechanic?: string;
    equipment?: string;
    primaryMuscle?: string;
    sort?: "name" | "level";
  };

  const [filters, setFilters] = useState<Filters>({
    search: "",
    page: 1,
    limit: 10,
  });
  const [results, setResults] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [showFilters, setShowFilters] = useState(false);

  // static options (could be fetched from backend)
  const LEVELS = [
    { value: "", label: "Any" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "expert", label: "Expert" },
  ];
  const CATEGORIES = [
    "Strength",
    "Stretching",
    "Plyometrics",
    "Strongman",
    "Powerlifting",
    "Cardio",
    "Olympic Weightlifting",
  ];
  const FORCES = ["Push", "Pull", "Static"];
  const MECHANICS = ["Compound", "Isolation"];
  const EQUIPMENT = [
    "Body Only",
    "Dumbbell",
    "Barbell",
    "Machine",
    "Bands",
    "Kettlebells",
    "Medicine Ball",
    "Exercise Ball",
    "E-Z Curl Bar",
    "Foam Roll",
  ];
  const MUSCLES = [
    "chest",
    "lower back",
    "forearms",
    "hamstrings",
    "glutes",
    "shoulders",
    "biceps",
    "triceps",
    "quadriceps",
    "calves",
    "abdominals",
    "traps",
    "lats",
    "neck",
    "abductors",
    "middle back",
  ];

  const updateFilters = (patch: Partial<Filters>, resetPage = true) => {
    setFilters((prev) => ({
      ...prev,
      ...(resetPage ? { page: 1 } : {}),
      ...patch,
    }));
  };

  const buildQuery = (f: Filters) => {
    const params: Record<string, any> = {};
    if (f.search && f.search.trim()) params.search = f.search.trim();
    if (f.page) params.page = f.page;
    if (f.limit) params.limit = f.limit;
    if (f.level) params.level = f.level;
    if (f.category) params.category = f.category;
    if (f.force) params.force = f.force;
    if (f.mechanic) params.mechanic = f.mechanic;
    if (f.equipment) params.equipment = f.equipment;
    if (f.primaryMuscle) params.primaryMuscle = f.primaryMuscle;
    if (f.sort) params.sort = f.sort;
    return params;
  };

  useEffect(() => {
    const current = { ...filters };
    const doSearch = async () => {
      try {
        const params = buildQuery(current);
        console.log("search params", params);
        const res = await api.get("/exercises/search", { params });
        console.log("search results count", res.data.length);
        setResults(res.data);
      } catch (error) {
        console.error("Exercise search failed", error);
      }
    };

    const t = setTimeout(() => doSearch(), 400);
    return () => clearTimeout(t);
  }, [filters]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-[#2a2a2a] p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
            Search Exercises
          </h2>
          <input
            type="text"
            value={filters.search || ""}
            onChange={(e) => {
              updateFilters({ search: e.target.value });
            }}
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 text-sm"
            placeholder="Search by name..."
            autoFocus
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowFilters((s) => !s)}
              className="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded"
            >
              {showFilters ? "Hide filters" : "Advanced filters"}
            </button>
            <div className="text-xs text-gray-400">
              {results.length} results
            </div>
          </div>

          {/* Active filters + Clear All */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {filters.search && (
              <button
                onClick={() => updateFilters({ search: "" })}
                className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
              >
                {filters.search} ✕
              </button>
            )}
            {filters.level && (
              <button
                onClick={() => updateFilters({ level: undefined })}
                className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
              >
                {filters.level} ✕
              </button>
            )}
            {filters.category && (
              <button
                onClick={() => updateFilters({ category: undefined })}
                className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
              >
                {filters.category} ✕
              </button>
            )}
            {filters.force && (
              <button
                onClick={() => updateFilters({ force: undefined })}
                className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
              >
                {filters.force} ✕
              </button>
            )}
            {filters.mechanic && (
              <button
                onClick={() => updateFilters({ mechanic: undefined })}
                className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
              >
                {filters.mechanic} ✕
              </button>
            )}
            {filters.equipment && (
              <button
                onClick={() => updateFilters({ equipment: undefined })}
                className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
              >
                {filters.equipment} ✕
              </button>
            )}
            {filters.primaryMuscle && (
              <button
                onClick={() => updateFilters({ primaryMuscle: undefined })}
                className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
              >
                {filters.primaryMuscle} ✕
              </button>
            )}

            {(filters.search ||
              filters.level ||
              filters.category ||
              filters.force ||
              filters.mechanic ||
              filters.equipment ||
              filters.primaryMuscle) && (
              <button
                onClick={() => setFilters({ search: "", page: 1, limit: 10 })}
                className="ml-2 text-xs px-3 py-1 bg-red-600 text-white rounded"
              >
                Clear All
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                value={filters.level || ""}
                onChange={(e) => updateFilters({ level: e.target.value })}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value} className="text-black">
                    {l.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.category || ""}
                onChange={(e) => updateFilters({ category: e.target.value })}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Any</option>
                {CATEGORIES.filter(Boolean).map((c) => (
                  <option key={c} value={c} className="text-black">
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={filters.force || ""}
                onChange={(e) => updateFilters({ force: e.target.value })}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Any</option>
                {FORCES.filter(Boolean).map((f) => (
                  <option key={f} value={f} className="text-black">
                    {f}
                  </option>
                ))}
              </select>

              <select
                value={filters.mechanic || ""}
                onChange={(e) => updateFilters({ mechanic: e.target.value })}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Any</option>
                {MECHANICS.filter(Boolean).map((m) => (
                  <option key={m} value={m} className="text-black">
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={filters.equipment || ""}
                onChange={(e) => updateFilters({ equipment: e.target.value })}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Any</option>
                {EQUIPMENT.filter(Boolean).map((eq) => (
                  <option key={eq} value={eq} className="text-black">
                    {eq}
                  </option>
                ))}
              </select>

              {/* Primary muscle chips */}
              <div className="md:col-span-3">
                <p className="text-xs text-gray-400 mb-1">Primary muscle</p>
                <div className="flex flex-wrap gap-2">
                  {MUSCLES.map((m) => (
                    <button
                      key={m}
                      onClick={() =>
                        updateFilters({
                          primaryMuscle:
                            filters.primaryMuscle === m ? undefined : m,
                        })
                      }
                      className={`px-3 py-1 rounded text-sm ${filters.primaryMuscle === m ? "bg-orange-500 text-white" : "bg-gray-800 text-white"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {filters.search && (
            <p className="text-xs text-gray-400 mb-2">
              Showing results for "{filters.search.trim()}"
            </p>
          )}
          {results.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              {filters.search ? "No exercises found" : "Start typing to search"}
            </div>
          ) : (
            <div className="divide-y divide-[#2a2a2a]">
              {results.map((exercise) => (
                <div
                  key={exercise.id}
                  onClick={() => setSelectedExercise(exercise)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedExercise?.id === exercise.id
                      ? "bg-orange-500/10 border-l-4 border-orange-500"
                      : "hover:bg-[#1a1a1a] border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm md:text-base">
                        {exercise.name}
                      </h3>
                      {exercise.category && (
                        <p className="text-xs text-gray-400 mt-1 capitalize">
                          {exercise.category}
                        </p>
                      )}
                    </div>
                    {exercise.level && (
                      <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs font-medium ml-2 whitespace-nowrap capitalize">
                        {exercise.level}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail View */}
        {selectedExercise && (
          <div className="border-t border-[#2a2a2a] p-4 md:p-6 bg-[#111]">
            <h3 className="text-lg font-bold text-white mb-3">
              {selectedExercise.name}
            </h3>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
              {selectedExercise.level && (
                <div className="bg-[#1a1a1a] rounded p-2">
                  <p className="text-gray-500 font-medium">Level</p>
                  <p className="text-white font-semibold capitalize">
                    {selectedExercise.level}
                  </p>
                </div>
              )}
              {selectedExercise.category && (
                <div className="bg-[#1a1a1a] rounded p-2">
                  <p className="text-gray-500 font-medium">Category</p>
                  <p className="text-white font-semibold capitalize">
                    {selectedExercise.category}
                  </p>
                </div>
              )}
              {selectedExercise.forceType && (
                <div className="bg-[#1a1a1a] rounded p-2">
                  <p className="text-gray-500 font-medium">Force Type</p>
                  <p className="text-white font-semibold capitalize">
                    {selectedExercise.forceType}
                  </p>
                </div>
              )}
              {selectedExercise.mechanic && (
                <div className="bg-[#1a1a1a] rounded p-2">
                  <p className="text-gray-500 font-medium">Mechanic</p>
                  <p className="text-white font-semibold capitalize">
                    {selectedExercise.mechanic}
                  </p>
                </div>
              )}
            </div>

            {/* Equipment */}
            {selectedExercise.equipment && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Equipment
                </p>
                <p className="text-sm text-white capitalize">
                  {selectedExercise.equipment}
                </p>
              </div>
            )}

            {/* Primary Muscle */}
            {selectedExercise.primaryMuscle &&
              selectedExercise.primaryMuscle.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    Primary Muscles
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedExercise.primaryMuscle.map((muscle: string) => (
                      <span
                        key={muscle}
                        className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs capitalize"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Instructions/Description */}
            {selectedExercise.description && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 font-medium mb-2">
                  Instructions
                </p>
                <div className="bg-[#1a1a1a] rounded p-3 max-h-32 overflow-y-auto">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {selectedExercise.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-[#2a2a2a] p-4 md:p-6 flex justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                updateFilters(
                  { page: Math.max((filters.page || 1) - 1, 1) },
                  false,
                );
                setSelectedExercise(null);
              }}
              disabled={filters.page === 1}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">Page {filters.page}</span>
            <button
              onClick={() => {
                updateFilters({ page: (filters.page || 1) + 1 }, false);
                setSelectedExercise(null);
              }}
              disabled={results.length < (filters.limit || 10)}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
            >
              Next
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedExercise) {
                  onSelect(selectedExercise);
                  onClose();
                }
              }}
              disabled={!selectedExercise}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
            >
              Select Exercise
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
