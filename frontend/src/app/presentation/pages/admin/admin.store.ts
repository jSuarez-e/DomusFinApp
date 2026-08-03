import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category, PaymentMethod, CategoryType } from '@shared/index';
import { environment } from 'src/environments/environment';

/** Interface del estado local de Admin */
type AdminState = {
  activeTab: 'categories' | 'payments' | 'budget' | 'account' | 'members';
  searchTerm: string;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  members: any[];
  isLoading: boolean;
  isCategoryModalOpen: boolean;
  isPaymentModalOpen: boolean;
  isCategoryEdit: boolean;
  isPaymentEdit: boolean;
};

const initialState: AdminState = {
  activeTab: 'categories',
  searchTerm: '',
  categories: [],
  paymentMethods: [],
  members: [],
  isLoading: false,
  isCategoryModalOpen: false,
  isPaymentModalOpen: false,
  isCategoryEdit: false,
  isPaymentEdit: false
};

/** Store reactivo de la vista de Administración */
export const AdminStore = signalStore(
  withState(initialState),
  withComputed((store) => {
    const expenseCategories = computed(() => store.categories().filter((c) => c.type === CategoryType.EXPENSE || !c.type));
    const incomeCategories = computed(() => store.categories().filter((c) => c.type === CategoryType.INCOME));

    return {
      expenseCategories,
      incomeCategories,
      filteredExpenseCategories: computed(() => {
        const term = store.searchTerm().toLowerCase().trim();
        const list = expenseCategories();
        if (!term) return list;
        return list.filter(c => c.name.toLowerCase().includes(term));
      }),
      filteredIncomeCategories: computed(() => {
        const term = store.searchTerm().toLowerCase().trim();
        const list = incomeCategories();
        if (!term) return list;
        return list.filter(c => c.name.toLowerCase().includes(term));
      }),
      filteredPaymentMethods: computed(() => {
        const term = store.searchTerm().toLowerCase().trim();
        const list = store.paymentMethods();
        if (!term) return list;
        return list.filter(pm => pm.name.toLowerCase().includes(term));
      }),
      filteredMembers: computed(() => {
        const term = store.searchTerm().toLowerCase().trim();
        const list = store.members();
        if (!term) return list;
        return list.filter(m => 
          (m.name || '').toLowerCase().includes(term) || 
          (m.email || '').toLowerCase().includes(term)
        );
      })
    };
  }),
  withMethods((
    store,
    http = inject(HttpClient)
  ) => ({
    /**
     * Carga las categorías del sistema.
     */
    loadCategories(): void {
      http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe({
        next: (data) => patchState(store, { categories: data || [] }),
        error: (err) => console.error('Failed to load categories:', err)
      });
    },

    /**
     * Carga los medios de pago.
     */
    loadPaymentMethods(): void {
      http.get<PaymentMethod[]>(`${environment.apiUrl}/payment-methods`).subscribe({
        next: (data) => patchState(store, { paymentMethods: data || [] }),
        error: (err) => console.error('Failed to load payment methods:', err)
      });
    },

    /**
     * Carga los miembros del hogar.
     */
    loadMembers(): void {
      http.get<any[]>(`${environment.apiUrl}/users/members`).subscribe({
        next: (data) => patchState(store, { members: data || [] }),
        error: (err) => console.error('Failed to load members:', err)
      });
    },

    setSearchTerm(term: string): void {
      patchState(store, { searchTerm: term });
    },

    setActiveTab(tab: 'categories' | 'payments' | 'budget' | 'account' | 'members'): void {
      patchState(store, { activeTab: tab, searchTerm: '' });
    },

    setCategoryModalOpen(isOpen: boolean): void {
      patchState(store, { isCategoryModalOpen: isOpen });
    },

    setPaymentModalOpen(isOpen: boolean): void {
      patchState(store, { isPaymentModalOpen: isOpen });
    },

    setCategoryEdit(isEdit: boolean): void {
      patchState(store, { isCategoryEdit: isEdit });
    },

    setPaymentEdit(isEdit: boolean): void {
      patchState(store, { isPaymentEdit: isEdit });
    }
  }))
);
