// frontend/src/app/core/services/expense.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Expense, Category, CategoryType } from '@shared/index';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private readonly baseUrlEnv = environment.apiUrl;
  private readonly apiUrlExpenses = this.baseUrlEnv + '/expenses';

  // Reactivity State with Signals
  private expensesState = signal<Expense[]>([]);
  public expenses = this.expensesState.asReadonly();

  // Static Categories matching database logic (serves as initial fallback)
  private categoriesState = signal<Category[]>([
    { id: 1, name: 'Alimentación', householdId: null, isGlobal: true, type: CategoryType.EXPENSE, createdAt: new Date() },
    { id: 2, name: 'Servicios Básicos', householdId: null, isGlobal: true, type: CategoryType.EXPENSE, createdAt: new Date() },
    { id: 3, name: 'Transporte', householdId: null, isGlobal: true, type: CategoryType.EXPENSE, createdAt: new Date() },
    { id: 4, name: 'Captura Automática', householdId: null, isGlobal: true, type: CategoryType.EXPENSE, createdAt: new Date() },
    { id: 5, name: 'Otros', householdId: null, isGlobal: true, type: CategoryType.EXPENSE, createdAt: new Date() }
  ]);
  public categories = this.categoriesState.asReadonly();

  // Cache flag to prevent redundant network calls
  private isLoaded = false;

  constructor(private http: HttpClient) {}

  /**
   * Carga las categorías globales y personalizadas del hogar desde el backend.
   */
  async loadCategories(): Promise<Category[]> {
    try {
      const data = await firstValueFrom(this.http.get<Category[]>(`${this.baseUrlEnv}/categories`));
      this.categoriesState.set(data || []);
      return data;
    } catch (error) {
      console.error('Error loading categories:', error);
      return this.categoriesState();
    }
  }

  /**
   * Carga los gastos del hogar del usuario actual desde la API REST.
   * Utiliza almacenamiento en caché en la señal reactiva y evita peticiones duplicadas a menos que se fuerce.
   * 
   * @param {boolean} [forceRefresh=false] Si es verdadero, ignora la caché local y realiza la petición HTTP.
   * @returns {Promise<void>} Una promesa que se resuelve cuando los datos han sido cargados.
   */
  async loadExpenses(forceRefresh = false): Promise<void> {
    if (this.isLoaded && !forceRefresh) {
      return;
    }

    try {
      const data = await firstValueFrom(this.http.get<Expense[]>(this.apiUrlExpenses));
      this.expensesState.set(data || []);
      await this.loadCategories();
      this.isLoaded = true;
    } catch (error) {
      console.error('Error loading expenses:', error);
      throw error;
    }
  }

  /**
   * Registra un nuevo gasto y actualiza de inmediato el estado local del listado.
   * 
   * @param {Partial<Expense>} dto Datos parciales del gasto a registrar.
   * @returns {Promise<Expense>} El objeto del gasto recién registrado y guardado.
   */
  async createExpense(dto: Partial<Expense>): Promise<Expense> {
    try {
      const newExpense = await firstValueFrom(this.http.post<Expense>(this.apiUrlExpenses, dto));
      this.expensesState.update((current) => [newExpense, ...current]);
      return newExpense;
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }
}
