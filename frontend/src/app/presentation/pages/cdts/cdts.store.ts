// frontend/src/app/presentation/pages/cdts/cdts.store.ts
import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { CdtService } from '../../../core/services/cdt.service';
import { Cdt } from '@shared/models/cdts/cdt.interface';
import { CreateCdtDto } from '@shared/models/cdts/cdt.dto';

type CdtsState = {
  cdts: Cdt[];
  isLoading: boolean;
  isModalOpen: boolean;
  selectedCdt: Cdt | null;
  error: string | null;
};

const initialState: CdtsState = {
  cdts: [],
  isLoading: false,
  isModalOpen: false,
  selectedCdt: null,
  error: null
};

export const CdtsStore = signalStore(
  withState(initialState),
  withMethods((
    store,
    cdtService = inject(CdtService)
  ) => ({
    async loadCdts(): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const cdts = await cdtService.getCdts();
        patchState(store, { cdts, isLoading: false });
      } catch (e: any) {
        patchState(store, { error: e.message, isLoading: false });
      }
    },
    
    async createCdt(dto: CreateCdtDto): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const newCdt = await cdtService.createCdt(dto);
        patchState(store, { 
          cdts: [newCdt, ...store.cdts()],
          isLoading: false,
          isModalOpen: false
        });
      } catch (e: any) {
        patchState(store, { error: e.message, isLoading: false });
      }
    },

    setModalOpen(isOpen: boolean): void {
      patchState(store, { isModalOpen: isOpen });
    },

    setSelectedCdt(cdt: Cdt | null): void {
      patchState(store, { selectedCdt: cdt });
    }
  }))
);
