// shared/models/cdts/cdt.dto.ts
import { CdtPaymentType } from './cdt.interface';

export class CreateCdtDto {
  initialAmount!: number;
  bankName!: string;
  rate!: number; // Received as decimal
  termDays!: number;
  paymentType!: CdtPaymentType;
  isPublic!: boolean;
  sharedWith?: number[]; // IDs of users to share with if public
}

export class UpdateCdtDto {
  initialAmount?: number;
  bankName?: string;
  rate?: number;
  termDays?: number;
  paymentType?: CdtPaymentType;
  isPublic?: boolean;
  sharedWith?: number[];
}
