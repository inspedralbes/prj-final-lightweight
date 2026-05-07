export class CoachClientSummaryDto {
  clientId: number;
  username: string;
  lastSessionAt: Date | null;
  totalSessions: number;
}
