// shared/dtos/create-loan.dto.ts

export interface CreateLoanDto {
  purposeDescription: string;
  initialPrincipal: number;
  interestRate: number;
  termMonths: number;
  handlingFee?: number;
  lifeInsurance?: number;
  otherCharges?: number;
  isPrivate: boolean;
  participantIds?: number[]; // User IDs of invited members (only if not private)
}
