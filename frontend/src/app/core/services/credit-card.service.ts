// frontend/src/app/core/services/credit-card.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { CreditCard, CreateCreditCardDto, PayCreditCardDto, AmortizationPeriod } from '@shared/index';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CreditCardService {
  private readonly baseUrlEnv = environment.apiUrl;
  private readonly apiUrlCreditCards = this.baseUrlEnv + '/credit-cards';

  private creditCardsState = signal<CreditCard[]>([]);
  public creditCards = this.creditCardsState.asReadonly();

  private isLoaded = false;

  constructor(private readonly http: HttpClient) {}

  /**
   * Carga las tarjetas de crédito del hogar activo.
   */
  async loadCreditCards(forceRefresh = false): Promise<CreditCard[]> {
    if (this.isLoaded && !forceRefresh) {
      return this.creditCardsState();
    }

    try {
      const data = await firstValueFrom(this.http.get<CreditCard[]>(this.apiUrlCreditCards));
      this.creditCardsState.set(data || []);
      this.isLoaded = true;
      return data;
    } catch (error) {
      console.error('Error loading credit cards:', error);
      throw error;
    }
  }

  /**
   * Registra una nueva tarjeta de crédito.
   */
  async createCreditCard(dto: CreateCreditCardDto): Promise<CreditCard> {
    const newCard = await firstValueFrom(this.http.post<CreditCard>(this.apiUrlCreditCards, dto));
    this.creditCardsState.update((current) => [newCard, ...current]);
    return newCard;
  }

  /**
   * Simula tabla de amortización para compras.
   */
  simulateInstallments(amount: number, interestRate: number, installments: number): Observable<AmortizationPeriod[]> {
    const params = {
      amount: amount.toString(),
      interestRate: interestRate.toString(),
      installments: installments.toString(),
    };
    return this.http.get<AmortizationPeriod[]>(`${this.apiUrlCreditCards}/simulate`, { params });
  }

  /**
   * Paga deuda de una tarjeta de crédito debitando saldo de una cuenta.
   */
  payCreditCard(dto: PayCreditCardDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrlCreditCards}/pay`, dto);
  }

  /**
   * Elimina una tarjeta de crédito si la deuda es cero.
   * 
   * @param id ID de la tarjeta a eliminar.
   */
  async deleteCreditCard(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.apiUrlCreditCards}/${id}`));
    this.creditCardsState.update((current) => current.filter((c) => c.id !== id));
  }
}
