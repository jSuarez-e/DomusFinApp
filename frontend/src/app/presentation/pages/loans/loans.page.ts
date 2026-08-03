// frontend/src/app/presentation/pages/loans/loans.page.ts
import { ChangeDetectionStrategy, Component, OnInit, signal, effect, inject } from '@angular/core';
import { TransactionEventService } from '../../../core/services/transaction-event.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment'; // Import environment config for API URL
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonButton,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonFab,
  IonFabButton,
  IonModal,
  IonButtons,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonToggle,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  cashOutline,
  closeOutline,
  checkmarkOutline,
  peopleOutline,
  lockClosedOutline,
  walletOutline,
  calculatorOutline,
  informationCircleOutline,
  swapHorizontalOutline,
  calendarOutline,
} from 'ionicons/icons';

import { LoanService } from '../../../core/services/loan.service';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { Loan, Account, User, AmortizationPeriod } from '@shared/index';
import { MoneyMaskDirective } from '../../directives/money-mask.directive';
import { BlockScientificNotationDirective } from '../../directives/block-scientific-notation.directive';
import { LoansStore } from './loans.store';
import { LoanProgressComponent } from '../../../shared/components/loan-progress/loan-progress.component';

@Component({
  selector: 'app-loans',
  templateUrl: './loans.page.html',
  styleUrls: ['./loans.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardContent,
    IonButton,
    IonBadge,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonFab,
    IonFabButton,
    IonModal,
    IonButtons,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonToggle,
    MoneyMaskDirective,
    BlockScientificNotationDirective,
    LoanProgressComponent
  ],
  providers: [LoansStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoansPage implements OnInit {
  public store = inject(LoansStore);
  private loanService = inject(LoanService);

  // State Signals
  public activeLoans = this.store.activeLoans;
  public totalDebt = this.store.totalDebt;
  public totalInitial = this.store.totalInitial;
  public debtPaidPercent = this.store.debtPaidPercent;
  
  public accounts = this.accountService.accounts;
  public currentUser = this.authService.currentUser;
  
  public householdMembers = signal<any[]>([]);
  public selectedLoan = signal<Loan | null>(null);
  public activeSegment = signal<'debts' | 'simulator'>('debts');
  public amortizationPlan = signal<AmortizationPeriod[]>([]);

  // Modal & Async states
  public isCreateModalOpen = signal(false);
  public isPayModalOpen = signal(false);
  public isSubmitting = signal(false);

  // Forms
  public loanForm!: FormGroup;
  public payForm!: FormGroup;
  public simForm!: FormGroup;

  // Expose global namespaces to templates
  public readonly Number = Number;
  public readonly Math = Math;

  constructor(
    private readonly accountService: AccountService,
    private readonly authService: AuthService,
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly toastController: ToastController,
    private readonly transactionEventService: TransactionEventService
  ) {
    addIcons({
      addOutline,
      cashOutline,
      closeOutline,
      checkmarkOutline,
      peopleOutline,
      lockClosedOutline,
      walletOutline,
      calculatorOutline,
      informationCircleOutline,
      swapHorizontalOutline,
      calendarOutline,
    });

    // Recargar créditos reactivamente al detectar mutaciones financieras
    effect(() => {
      const changeCount = this.transactionEventService.transactionSaved();
      if (changeCount > 0) {
        this.store.loadLoans(true).then(() => {
          const loans = this.store.activeLoans();
          const current = this.selectedLoan();
          if (current) {
            const updated = loans.find((l: Loan) => l.id === current.id);
            if (updated) {
              this.selectedLoan.set(updated);
            }
          }
        });
        this.accountService.loadAccounts(true);
      }
    });
  }

  async ngOnInit() {
    this.initForms();
    await this.loadData();
  }

  private initForms() {
    this.loanForm = this.fb.group({
      purposeDescription: ['', [Validators.required, Validators.maxLength(255)]],
      initialPrincipal: [null, [Validators.required, Validators.min(1)]],
      interestRate: [null, [Validators.required, Validators.min(0)]],
      handlingFee: [null, [Validators.min(0)]],
      lifeInsurance: [null, [Validators.min(0)]],
      otherCharges: [null, [Validators.min(0)]],
      isPrivate: [false],
      participantIds: [[]],
    });

    this.payForm = this.fb.group({
      accountId: [null, [Validators.required]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
    });

    this.simForm = this.fb.group({
      simAmount: [1000000, [Validators.required, Validators.min(1)]],
      simRate: [2.0, [Validators.required, Validators.min(0)]],
      simInstallments: [12, [Validators.required, Validators.min(1)]],
    });

    // Clear participants list if set to private
    this.loanForm.get('isPrivate')?.valueChanges.subscribe((isPrivate) => {
      const parts = this.loanForm.get('participantIds');
      if (isPrivate) {
        parts?.setValue([]);
        parts?.clearValidators();
      } else {
        parts?.setValidators([Validators.required]);
      }
      parts?.updateValueAndValidity();
    });
  }

  private async loadData() {
    try {
      await Promise.all([
        this.store.loadLoans(true),
        this.accountService.loadAccounts(true),
        this.loadMembers(),
      ]);
    } catch (err) {
      console.error('Error loading loans page data:', err);
    }
  }

  private async loadMembers() {
    try {
      // Update to use environment.apiUrl for getting members
      const members = await firstValueFrom(this.http.get<any[]>(`${environment.apiUrl}/users/members`));
      const currentUserId = this.currentUser()?.id;
      this.householdMembers.set(members.filter((m) => m.id !== currentUserId));
    } catch (err) {
      console.warn('Could not load household members:', err);
    }
  }

  // Segment Operations
  public onSegmentChange(event: any) {
    this.activeSegment.set(event.detail.value);
  }

  // Modal Handlers
  public openCreateModal() {
    this.loanForm.reset({
      purposeDescription: '',
      initialPrincipal: null,
      interestRate: null,
      handlingFee: 0,
      lifeInsurance: 0,
      otherCharges: 0,
      isPrivate: false,
      participantIds: [],
    });
    this.isCreateModalOpen.set(true);
  }

  public closeCreateModal() {
    this.isCreateModalOpen.set(false);
  }

  public openPayModal(loan: Loan) {
    this.selectedLoan.set(loan);
    this.payForm.reset({
      accountId: null,
      amount: null,
    });
    this.isPayModalOpen.set(true);
  }

  public closePayModal() {
    this.isPayModalOpen.set(false);
    this.selectedLoan.set(null);
  }

  // Operations
  public async handleCreateLoan() {
    if (this.loanForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    try {
      const dto = this.loanForm.value;
      await this.loanService.createLoan(dto);
      this.closeCreateModal();
      this.presentToast('Crédito registrado con éxito.', 'success');
      this.transactionEventService.emitTransactionSaved();
    } catch (error: any) {
      const msg = error.error?.message || 'Error al registrar el crédito.';
      this.presentToast(msg, 'danger');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public async handlePayLoan() {
    const loan = this.selectedLoan();
    if (this.payForm.invalid || !loan) {
      return;
    }

    this.isSubmitting.set(true);
    try {
      const dto = this.payForm.value;
      await this.loanService.payLoan(loan.id, dto);
      this.closePayModal();
      await this.accountService.loadAccounts(true);
      this.presentToast('Pago registrado con éxito.', 'success');
      this.transactionEventService.emitTransactionSaved();
    } catch (error: any) {
      const msg = error.error?.message || 'Error al registrar el pago.';
      this.presentToast(msg, 'danger');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public async handleSimulate() {
    if (this.simForm.invalid) {
      return;
    }

    const { simAmount, simRate, simInstallments } = this.simForm.value;
    try {
      const data = await this.loanService.simulateInstallments(simAmount, simRate, simInstallments);
      this.amortizationPlan.set(data || []);
    } catch (err) {
      console.error('Error simulating plan:', err);
      this.presentToast('Error al simular la tabla de amortización.', 'danger');
    }
  }

  // Helpers
  public getPaidPercentage(loan: Loan): number {
    const initial = Number(loan.initialPrincipal);
    if (initial === 0) return 0;
    const paid = initial - Number(loan.currentBalance);
    return Math.min(100, Math.max(0, (paid / initial) * 100));
  }

  private async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
