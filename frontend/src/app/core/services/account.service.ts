// frontend/src/app/core/services/account.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Account, CreateAccountDto, UpdateAccountDto } from '@shared/index';

/**
 * Servicio Angular para gestión de cuentas financieras.
 * Mantiene un estado reactivo local (Signal) con cache para evitar peticiones redundantes.
 */
@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private readonly baseUrl = '/api/accounts';

  private accountsState = signal<Account[]>([]);
  public accounts = this.accountsState.asReadonly();

  private isLoaded = false;

  constructor(private readonly http: HttpClient) {}

  /**
   * Carga las cuentas del hogar activo desde el backend.
   *
   * @param {boolean} [forceRefresh=false] Si es verdadero, ignora la caché local.
   * @returns {Promise<Account[]>} Lista de cuentas cargadas.
   */
  async loadAccounts(forceRefresh = false): Promise<Account[]> {
    if (this.isLoaded && !forceRefresh) {
      return this.accountsState();
    }

    try {
      const data = await firstValueFrom(this.http.get<Account[]>(this.baseUrl));
      this.accountsState.set(data || []);
      this.isLoaded = true;
      return data;
    } catch (error) {
      console.error('Error loading accounts:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva cuenta financiera y actualiza el estado local.
   *
   * @param {CreateAccountDto} dto Datos de la nueva cuenta.
   * @returns {Promise<Account>} La cuenta creada.
   */
  async createAccount(dto: CreateAccountDto): Promise<Account> {
    const newAccount = await firstValueFrom(this.http.post<Account>(this.baseUrl, dto));
    this.accountsState.update((current) => [newAccount, ...current]);
    return newAccount;
  }

  /**
   * Actualiza una cuenta existente y refleja los cambios en el estado local.
   *
   * @param {number} id ID de la cuenta a actualizar.
   * @param {UpdateAccountDto} dto Datos parciales de actualización.
   * @returns {Promise<Account>} La cuenta actualizada.
   */
  async updateAccount(id: number, dto: UpdateAccountDto): Promise<Account> {
    const updated = await firstValueFrom(this.http.patch<Account>(`${this.baseUrl}/${id}`, dto));
    this.accountsState.update((current) =>
      current.map((acc) => (acc.id === id ? { ...acc, ...updated } : acc))
    );
    return updated;
  }

  /**
   * Elimina una cuenta y la remueve del estado local.
   *
   * @param {number} id ID de la cuenta a eliminar.
   * @returns {Promise<void>}
   */
  async deleteAccount(id: number): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${id}`));
    this.accountsState.update((current) => current.filter((acc) => acc.id !== id));
  }
}
