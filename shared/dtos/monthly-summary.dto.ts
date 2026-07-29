// shared/dtos/monthly-summary.dto.ts
import { Movement } from '../models/movement.model';

export interface MonthlySummaryDto {
  summary: {
    totalSpent: number;
    remainingBudget: number;
    income: number;
  };
  recentMovements: Movement[];
}
