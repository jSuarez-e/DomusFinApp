// shared/models/payment-method.model.ts
export interface PaymentMethod {
  id: number;
  name: string;
  householdId: number | null;
}
