// shared/dtos/native-capture.dto.ts

export interface NativeCaptureExpenseDto {
  amount: number;
  description: string;
  rawText?: string;
  date?: string;
  categoryId?: number;
}
