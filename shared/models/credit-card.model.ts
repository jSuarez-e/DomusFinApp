// shared/models/credit-card.model.ts

export interface CreditCard {
  id: number;
  aliasName: string;
  lastFourDigits: string;
  interestRate: number; // Tasa de interés mensual/efectiva (%)
  lateFeeRate: number; // Tasa de mora (%)
  handlingFee: number; // Cuota de manejo ($)
  lifeInsurance: number;
  otherCharges: number;
  cutDate: number; // Día de corte (1-31)
  paymentDueDate: number; // Día límite de pago (1-31)
  currentDebt: number; // Deuda total acumulada
  isPrivate: boolean;
  householdId: number;
  userId: number;
  createdAt: Date;
}
