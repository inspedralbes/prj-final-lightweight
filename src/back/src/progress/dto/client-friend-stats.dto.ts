export class PartnerStatsDto {
  username: string;
  sessionCount: number;
}

export class ClientFriendStatsDto {
  totalCoopSessions: number;
  totalCoopSets: number;
  totalCoopExercises: number;
  partners: PartnerStatsDto[];
}