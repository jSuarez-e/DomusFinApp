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
   *
   * @param amount Monto de la compra.
   * @param interestRate Tasa de interés.
   * @param installments Número de cuotas.
   * @returns {Promise<AmortizationPeriod[]>} Promesa con la tabla de amortización simulada.
   * @throws {Error} Si falla la petición HTTP.
   */
  async simulateInstallments(amount: number, interestRate: number, installments: number): Promise<AmortizationPeriod[]> {
    const params = {
      amount: amount.toString(),
      interestRate: interestRate.toString(),
      installments: installments.toString(),
    };
    try {
      return await firstValueFrom(
        this.http.get<AmortizationPeriod[]>(`${this.apiUrlCreditCards}/simulate`, { params })
      );
    } catch (error) {
      console.error('Error simulating credit card installments:', error);
      throw error;
    }
  }

  /**
   * Paga deuda de una tarjeta de crédito debitando saldo de una cuenta.
   *
   * @param dto Datos del pago a procesar.
   * @returns {Promise<any>} Promesa con la respuesta del pago.
   * @throws {Error} Si falla la petición HTTP.
   */
  async payCreditCard(dto: PayCreditCardDto): Promise<any> {
    try {
      return await firstValueFrom(
        this.http.post<any>(`${this.apiUrlCreditCards}/pay`, dto)
      );
    } catch (error) {
      console.error('Error paying credit card:', error);
      throw error;
    }
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
