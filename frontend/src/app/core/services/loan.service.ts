// frontend/src/app/core/services/loan.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Loan, CreateLoanDto, PayLoanDto, AmortizationPeriod } from '@shared/index';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoanService {
  private readonly baseUrlEnv = environment.apiUrl;
  private readonly apiUrlLoans = this.baseUrlEnv + '/loans';

  private loansState = signal<Loan[]>([]);
  public loans = this.loansState.asReadonly();

  private isLoaded = false;

  constructor(private readonly http: HttpClient) {}

  /**
   * Carga las deudas/créditos del hogar activo del usuario.
   * 
   * @param forceRefresh Forza la recarga de datos ignorando la caché.
   * @returns Listado de créditos.
   */
  async loadLoans(forceRefresh = false): Promise<Loan[]> {
    if (this.isLoaded && !forceRefresh) {
      return this.loansState();
    }

    try {
      const data = await firstValueFrom(this.http.get<Loan[]>(this.apiUrlLoans));
      this.loansState.set(data || []);
      this.isLoaded = true;
      return data;
    } catch (error) {
      console.error('Error loading loans:', error);
      throw error;
    }
  }

  /**
   * Registra un nuevo crédito/deuda en el backend.
   * 
   * @param dto Los datos del crédito a registrar.
   * @returns El crédito creado.
   */
  async createLoan(dto: CreateLoanDto): Promise<Loan> {
    const newLoan = await firstValueFrom(this.http.post<Loan>(this.apiUrlLoans, dto));
    this.loansState.update((current) => [newLoan, ...current]);
    return newLoan;
  }

  /**
   * Registra un pago de capital e interés en el crédito.
   * 
   * @param id ID del crédito.
   * @param dto Datos del pago (cuenta origen, capital e interés).
   * @returns {Promise<Loan>} Promesa con el crédito actualizado.
   * @throws {Error} Si falla la petición HTTP.
   */
  async payLoan(id: number, dto: PayLoanDto): Promise<Loan> {
    try {
      const updatedLoan = await firstValueFrom(
        this.http.post<Loan>(`${this.apiUrlLoans}/${id}/pay`, dto)
      );
      this.loansState.update((current) =>
        current.map((l) => (l.id === id ? updatedLoan : l))
      );
      return updatedLoan;
    } catch (error) {
      console.error('Error paying loan:', error);
      throw error;
    }
  }

  /**
   * Simula tabla de amortización para préstamos.
   *
   * @param amount Monto del préstamo.
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
        this.http.get<AmortizationPeriod[]>(`${this.apiUrlLoans}/simulate`, { params })
      );
    } catch (error) {
      console.error('Error simulating installments:', error);
      throw error;
    }
  }

  /**
   * Invalida la caché local.
   */
  clearCache(): void {
    this.isLoaded = false;
  }

  /**
   * Elimina un crédito o deuda si el saldo es cero.
   * 
   * @param id ID del crédito a eliminar.
   */
  async deleteLoan(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.apiUrlLoans}/${id}`));
    this.loansState.update((current) => current.filter((l) => l.id !== id));
  }
}
