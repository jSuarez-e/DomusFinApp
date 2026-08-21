// shared/models/cdts/cdt.interface.ts

export enum CdtPaymentType {
  MONTHLY = 'MONTHLY',
  AT_MATURITY = 'AT_MATURITY',
}

export interface Cdt {
  id: number;
  initialAmount: number;
  bankName: string;
  rate: number; // Stored as decimal (e.g. 0.10)
  termDays: number;
  paymentType: CdtPaymentType;
  isPublic: boolean;
  sharedWith: number[]; // User IDs inside the tenant that have access if it's public
  createdAt: Date;
  ownerId: number;
  householdId: number;
}
