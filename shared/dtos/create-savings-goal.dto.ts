// shared/dtos/create-savings-goal.dto.ts

export interface CreateSavingsGoalDto {
  title: string;
  description?: string;
  targetAmount: number;
  isPrivate: boolean;
  participantIds?: number[]; // User IDs of invited members (only if not private)
}
