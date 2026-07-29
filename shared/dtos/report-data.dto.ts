// shared/dtos/report-data.dto.ts
export interface ReportDataDto {
  summary: {
    totalSpent: number;
    totalIncome: number;
    netSavings: number;
  };
  byCategory: {
    categoryId: number;
    categoryName: string;
    amount: number;
    percentage: number;
  }[];
  movements: {
    id: number;
    amount: number;
    transactionDate: Date;
    type: string;
    description: string | null;
    categoryName: string;
    categoryId: number;
    userName: string;
    isPrivate: boolean;
    is_auto_captured: boolean;
  }[];
}
