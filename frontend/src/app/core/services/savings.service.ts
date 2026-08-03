// frontend/src/app/core/services/savings.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { SavingsGoal, CreateSavingsGoalDto, DepositSavingsGoalDto } from '@shared/index';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SavingsService {
  private readonly baseUrlEnv = environment.apiUrl;
  private readonly apiUrl = this.baseUrlEnv + '/savings-goals';

  private savingsGoalsState = signal<SavingsGoal[]>([]);
  public savingsGoals = this.savingsGoalsState.asReadonly();

  private isLoaded = false;

  constructor(private readonly http: HttpClient) {}

  /**
   * Carga las metas de ahorro del hogar activo.
   * 
   * @param forceRefresh Fuerza la recarga de datos ignorando la caché.
   * @returns Listado de metas de ahorro.
   */
  async loadSavingsGoals(forceRefresh = false): Promise<SavingsGoal[]> {
    if (this.isLoaded && !forceRefresh) {
      return this.savingsGoalsState();
    }

    try {
      const data = await firstValueFrom(this.http.get<SavingsGoal[]>(this.apiUrl));
      this.savingsGoalsState.set(data || []);
      this.isLoaded = true;
      return data;
    } catch (error) {
      console.error('Error loading savings goals:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva meta de ahorro.
   * 
   * @param dto Datos del ahorro a crear.
   * @returns La meta de ahorro creada.
   */
  async createSavingsGoal(dto: CreateSavingsGoalDto): Promise<SavingsGoal> {
    const newGoal = await firstValueFrom(this.http.post<SavingsGoal>(this.apiUrl, dto));
    this.savingsGoalsState.update((current) => [newGoal, ...current]);
    return newGoal;
  }

  /**
   * Registra un aporte monetario a una meta de ahorro.
   * Actualiza el estado local de la meta de ahorro correspondiente.
   * 
   * @param id ID de la meta de ahorro.
   * @param dto Datos del aporte (cuenta origen y monto).
   * @returns {Promise<SavingsGoal>} Promesa con la respuesta del aporte.
   * @throws {Error} Si falla la petición HTTP.
   */
  async depositToSavingsGoal(id: number, dto: DepositSavingsGoalDto): Promise<SavingsGoal> {
    try {
      const updatedGoal = await firstValueFrom(
        this.http.post<SavingsGoal>(`${this.apiUrl}/${id}/deposit`, dto)
      );
      this.savingsGoalsState.update((current) =>
        current.map((g) => (g.id === id ? updatedGoal : g))
      );
      return updatedGoal;
    } catch (error) {
      console.error('Error depositing to savings goal:', error);
      throw error;
    }
  }

  /**
   * Invalida la caché local para forzar la recarga en el siguiente acceso.
   */
  clearCache(): void {
    this.isLoaded = false;
  }

  /**
   * Elimina una meta de ahorro y actualiza el estado local.
   * 
   * @param id ID de la meta a eliminar.
   */
  async deleteSavingsGoal(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    this.savingsGoalsState.update((current) => current.filter((g) => g.id !== id));
  }
}
