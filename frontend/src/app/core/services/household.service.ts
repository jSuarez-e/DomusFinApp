// frontend/src/app/core/services/household.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Household } from '@shared/index';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HouseholdService {
  private readonly baseUrlEnv = environment.apiUrl;
  private readonly apiUrlHouseholds = this.baseUrlEnv + '/households';

  // Reactivity State with Signals
  private householdState = signal<Household | null>(null);
  public household = this.householdState.asReadonly();

  // Cache flag to prevent redundant network calls
  private isLoaded = false;

  constructor(private http: HttpClient) {}

  /**
   * Carga la información del hogar actual desde la API REST.
   * Si ocurre un error, utiliza un hogar predeterminado de respaldo.
   * 
   * @param {number} householdId ID único del hogar a cargar.
   * @param {boolean} [forceRefresh=false] Si es verdadero, ignora la caché local y realiza la petición HTTP.
   * @returns {Promise<void>} Una promesa que se resuelve cuando los datos han sido cargados.
   */
  async loadHousehold(householdId: number, forceRefresh = false): Promise<void> {
    if (this.isLoaded && !forceRefresh && this.householdState()?.id === householdId) {
      return;
    }

    try {
      const data = await firstValueFrom(this.http.get<Household>(`${this.apiUrlHouseholds}/${householdId}`));
      this.householdState.set(data);
      this.isLoaded = true;
    } catch (error) {
      console.warn('Household API not available, falling back to mock household data.', error);
      // Fallback a datos simulados consistentes con la regla Multi-Tenant
      this.householdState.set({
        id: householdId,
        name: 'Hogar Familiar Principal',
        createdAt: new Date(),
        monthlyBudget: 1000.00,
      });
      this.isLoaded = true;
    }
  }

  /**
   * Actualiza la meta de presupuesto mensual del hogar en el backend.
   * 
   * @param {number} monthlyBudget Nuevo presupuesto mensual.
   * @returns {Promise<Household>} Promesa con el hogar actualizado.
   * @throws {Error} Si falla la petición HTTP.
   */
  async updateHouseholdBudget(monthlyBudget: number): Promise<Household> {
    try {
      const updatedHousehold = await firstValueFrom(
        this.http.put<Household>(`${this.apiUrlHouseholds}/budget`, { monthlyBudget })
      );
      this.householdState.set(updatedHousehold);
      return updatedHousehold;
    } catch (error) {
      console.error('Error updating household budget:', error);
      throw error;
    }
  }
}
