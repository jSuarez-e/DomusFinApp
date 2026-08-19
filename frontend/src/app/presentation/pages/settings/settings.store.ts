import { computed, inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { Category, CategoryType } from '@shared/index';
import { firstValueFrom } from 'rxjs';
import { CategoryService } from '../../../core/services/category.service';

/**
 * Estado del módulo de configuraciones.
 */
type SettingsState = {
  activeSegment: 'profile' | 'preferences' | 'expenses_cat' | 'income_cat';
  categories: Category[];
  isCategoryModalOpen: boolean;
  isCategoryEdit: boolean;
  currentEditingCategoryId: number | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: SettingsState = {
  activeSegment: 'profile',
  categories: [],
  isCategoryModalOpen: false,
  isCategoryEdit: false,
  currentEditingCategoryId: null,
  isLoading: false,
  error: null
};

/**
 * Store reactivo para la gestión de Ajustes y Categorías.
 */
export const SettingsStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    /**
     * Categorías de tipo Gasto
     * @returns {Category[]} Lista de categorías de gasto
     */
    expenseCategories: computed(() => store.categories().filter((c) => c.type === CategoryType.EXPENSE || !c.type)),
    
    /**
     * Categorías de tipo Ingreso
     * @returns {Category[]} Lista de categorías de ingreso
     */
    incomeCategories: computed(() => store.categories().filter((c) => c.type === CategoryType.INCOME))
  })),
  withMethods((store, categoryService = inject(CategoryService)) => ({
    /**
     * Cambia el segmento activo en la vista de ajustes.
     * @param segment - 'profile' | 'preferences' | 'expenses_cat' | 'income_cat'
     */
    setActiveSegment(segment: 'profile' | 'preferences' | 'expenses_cat' | 'income_cat'): void {
      patchState(store, { activeSegment: segment });
    },

    /**
     * Carga asincrónicamente la lista de categorías del hogar.
     * @returns {Promise<void>} Promesa resolutora
     */
    async loadCategories(): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const data = await firstValueFrom(categoryService.getAll());
        patchState(store, { categories: data || [], isLoading: false });
      } catch (err: unknown) {
        patchState(store, { error: 'Error al cargar las categorías', isLoading: false });
      }
    },

    /**
     * Abre el modal de creación de categoría.
     */
    openAddCategory(): void {
      patchState(store, { isCategoryModalOpen: true, isCategoryEdit: false, currentEditingCategoryId: null });
    },

    /**
     * Abre el modal de edición para una categoría existente.
     * @param categoryId - ID de la categoría a editar
     */
    openEditCategory(categoryId: number): void {
      patchState(store, { isCategoryModalOpen: true, isCategoryEdit: true, currentEditingCategoryId: categoryId });
    },

    /**
     * Cierra el modal de categorías.
     */
    closeCategoryModal(): void {
      patchState(store, { isCategoryModalOpen: false });
    }
  }))
);
