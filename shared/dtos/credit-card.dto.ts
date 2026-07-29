// shared/dtos/credit-card.dto.ts

export interface CreateCreditCardDto {
  aliasName: string;
  lastFourDigits: string;
  interestRate: number;
  lateFeeRate: number;
  handlingFee: number;
  lifeInsurance?: number;
  otherCharges?: number;
  cutDate: number;
  paymentDueDate: number;
}

export interface SimulateInstallmentsDto {
  amount: number;
  interestRate: number;
  installments: number;
}

export interface PayCreditCardDto {
  creditCardId: number;
  accountId: number;
  amount: number;
}

export interface AmortizationPeriod {
  period: number;
  capital: number;
  interest: number;
  totalFee: number;
  remainingBalance: number;
  dueDate: string;
}
