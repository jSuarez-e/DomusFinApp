// frontend/src/app/presentation/pages/cdts/cdts.page.ts
import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonIcon, IonBadge, IonList, IonButton, IonFab, IonFabButton,
  IonModal, IonInput, IonSelect, IonSelectOption, IonToggle, IonLabel
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  documentTextOutline, addOutline, closeOutline, businessOutline, cashOutline, 
  calendarOutline, timeOutline, lockClosedOutline, lockOpenOutline
} from 'ionicons/icons';

import { CdtsStore } from './cdts.store';
import { CdtItemComponent } from '../../../shared/components/cdt-item/cdt-item.component';
import { CdtPaymentType, Cdt } from '@shared/models/cdts/cdt.interface';
import { CreateCdtDto } from '@shared/models/cdts/cdt.dto';

@Component({
  selector: 'app-cdts',
  standalone: true,
  templateUrl: './cdts.page.html',
  styleUrls: ['./cdts.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CdtsStore],
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonCard, IonCardContent, IonIcon, IonBadge, IonList, IonButton, IonFab, IonFabButton,
    IonModal, IonInput, IonSelect, IonSelectOption, IonToggle, IonLabel,
    CdtItemComponent
  ]
})
export class CdtsPage implements OnInit {
  public store = inject(CdtsStore);
  private fb = inject(FormBuilder);

  public isCreateModalOpen = signal(false);
  public isDetailsModalOpen = signal(false);

  public cdtForm: FormGroup;
  public CdtPaymentType = CdtPaymentType;

  public totalAmount = computed(() => {
    return this.store.cdts().reduce((acc, cdt) => acc + Number(cdt.initialAmount), 0);
  });

  // Details calculations
  public grossReturns = computed(() => {
    const cdt = this.store.selectedCdt();
    if (!cdt) return 0;
    // Assuming Rate is Nominal Annual
    // Rendimiento = Capital * (Tasa/360) * Plazo
    return cdt.initialAmount * (cdt.rate / 360) * cdt.termDays;
  });

  public taxDeduction = computed(() => {
    return this.grossReturns() * 0.04; // 4% retefuente
  });

  public netReturns = computed(() => {
    return this.grossReturns() - this.taxDeduction();
  });
  
  public detailsMaturityDate = computed(() => {
    const cdt = this.store.selectedCdt();
    if (!cdt) return new Date();
    const createdDate = new Date(cdt.createdAt);
    return new Date(createdDate.getTime() + cdt.termDays * 24 * 60 * 60 * 1000);
  });

  public detailsDaysToMaturity = computed(() => {
    const maturityDate = this.detailsMaturityDate();
    const now = new Date();
    const diffTime = Math.max(0, maturityDate.getTime() - now.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  constructor() {
    addIcons({
      documentTextOutline, addOutline, closeOutline, businessOutline, cashOutline,
      calendarOutline, timeOutline, lockClosedOutline, lockOpenOutline
    });

    this.cdtForm = this.fb.group({
      initialAmount: ['', [Validators.required, Validators.min(0)]],
      bankName: ['', [Validators.required, Validators.minLength(2)]],
      rateUi: ['', [Validators.required, Validators.min(0)]], // 10 for 10%
      termDays: ['', [Validators.required, Validators.min(1)]],
      paymentType: [CdtPaymentType.AT_MATURITY, Validators.required],
      isPublic: [false]
    });
  }

  ngOnInit() {
    this.store.loadCdts();
  }

  openCreateModal() {
    this.cdtForm.reset({ paymentType: CdtPaymentType.AT_MATURITY, isPublic: false });
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal() {
    this.isCreateModalOpen.set(false);
  }

  openDetailsModal(cdt: Cdt) {
    this.store.setSelectedCdt(cdt);
    this.isDetailsModalOpen.set(true);
  }

  closeDetailsModal() {
    this.isDetailsModalOpen.set(false);
    this.store.setSelectedCdt(null);
  }

  async handleCreate() {
    if (this.cdtForm.invalid) {
      this.cdtForm.markAllAsTouched();
      return;
    }

    const formValue = this.cdtForm.value;
    const dto: CreateCdtDto = {
      initialAmount: Number(formValue.initialAmount),
      bankName: formValue.bankName,
      rate: Number(formValue.rateUi) / 100, // Convert percentage back to decimal
      termDays: Number(formValue.termDays),
      paymentType: formValue.paymentType,
      isPublic: formValue.isPublic
    };

    await this.store.createCdt(dto);
    if (!this.store.error()) {
      this.closeCreateModal();
    }
  }
}
