// frontend/src/app/core/services/movement.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateMovementDto, Movement, PaymentMethod, MonthlySummaryDto } from '@shared/index';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MovementService {
  private readonly baseUrlEnv = environment.apiUrl;
  private readonly apiUrl = this.baseUrlEnv + '/movements';

  constructor(private readonly http: HttpClient) {}

  /**
   * Guarda un nuevo movimiento financiero en el backend.
   * 
   * @param {CreateMovementDto} movement Datos del movimiento.
   * @returns {Observable<Movement>} El movimiento guardado.
   */
  saveMovement(movement: CreateMovementDto): Observable<Movement> {
    return this.http.post<Movement>(`${this.apiUrl}`, movement);
  }

  /**
   * Obtiene la lista de todos los movimientos del hogar.
   * 
   * @returns {Observable<Movement[]>} Lista de movimientos.
   */
  getMovementList(): Observable<Movement[]> {
    return this.http.get<Movement[]>(`${this.apiUrl}`);
  }

  /**
   * Obtiene los medios de pago del hogar.
   * 
   * @returns {Observable<PaymentMethod[]>} Lista de medios de pago.
   */
  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.baseUrlEnv}/payment-methods`);
  }

  /**
   * Registra un nuevo medio de pago personalizado.
   * 
   * @param {string} name Nombre del medio de pago.
   * @returns {Observable<PaymentMethod>}
   */
  createPaymentMethod(name: string): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(`${this.baseUrlEnv}/payment-methods`, { name });
  }

  /**
   * Obtiene el resumen mensual y los últimos 5 movimientos del hogar.
   * 
   * @param {string} [month] Mes a consultar (formato YYYY-MM).
   * @returns {Observable<MonthlySummaryDto>}
   */
  getMonthlySummary(month?: string): Observable<MonthlySummaryDto> {
    const params: Record<string, string> = month ? { month } : {}; // Explicitly typed key-value string dictionary
    return this.http.get<MonthlySummaryDto>(`${this.apiUrl}/monthly-summary`, { params });
  }

  /**
   * Obtiene el resumen del dashboard (liquidez visible, deuda visible y presupuesto disponible).
   */
  getDashboardSummary(month?: string): Observable<{ total_liquidity: number; total_debt: number; monthly_budget_remaining: number }> {
    const params: Record<string, string> = month ? { month } : {};
    return this.http.get<{ total_liquidity: number; total_debt: number; monthly_budget_remaining: number }>(`${this.baseUrlEnv}/dashboard/summary`, { params });
  }
}
