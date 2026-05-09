export class SessionHistoryItemDto {
  id: number;
  routineName: string;
  completedAt: Date | null;
  completionPercentage: number | null;
  completedSets: number | null;
  completedExercises: number | null;
}
