export class CreateRoutineDto {
  name!: string;
  exercises!: Array<{
    name: string;
    sets: number;
    reps: number;
    rest: number;
    notes?: string | null;
  }>;
}
