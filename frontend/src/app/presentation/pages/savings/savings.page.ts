// frontend/src/app/presentation/pages/savings/savings.page.ts
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
  IonTextarea,
  IonToggle,
  ToastController,
  IonMenuButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  trendingUpOutline,
  cashOutline,
  closeOutline,
  checkmarkOutline,
  peopleOutline,
  lockClosedOutline,
  walletOutline,
  helpCircleOutline,
  informationCircleOutline,
  starOutline
} from 'ionicons/icons';

import { SavingsService } from '../../../core/services/savings.service';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { SavingsGoal } from '@shared/index';
import { MoneyMaskDirective } from '../../directives/money-mask.directive';
import { BlockScientificNotationDirective } from '../../directives/block-scientific-notation.directive';
import { SavingsStore } from './savings.store';
import { SavingsProgressComponent } from '../../../shared/components/savings-progress/savings-progress.component';
import { ListHeaderComponent } from '../../../shared/components/list-header/list-header.component';

@Component({
  selector: 'app-savings',
  templateUrl: './savings.page.html',
  styleUrls: ['./savings.page.css'],
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
    IonTextarea,
    IonToggle,
    IonMenuButton,
    MoneyMaskDirective,
    BlockScientificNotationDirective,
    SavingsProgressComponent,
    ListHeaderComponent
  ],
  providers: [SavingsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavingsPage implements OnInit {
  /** Inyección del store localizado de ahorros */
  public store = inject(SavingsStore);
  private savingsService = inject(SavingsService);

  // State Signals (Delegadas al Store)
  public activeSavingsGoals = this.store.activeSavingsGoals;
  public archivedSavingsGoals = this.store.archivedSavingsGoals;
  public totalSaved = this.store.totalSaved;
  public totalTarget = this.store.totalTarget;
  public globalProgress = this.store.globalProgress;

  public accounts = this.accountService.accounts;
  public currentUser = this.authService.currentUser;
  
  public householdMembers = signal<any[]>([]);
  public selectedGoal = signal<SavingsGoal | null>(null);
  
  // Modal Signals
  public isCreateModalOpen = signal(false);
  public isDepositModalOpen = signal(false);
  public isSubmitting = signal(false);

  // Forms
  public savingsForm!: FormGroup;
  public depositForm!: FormGroup;

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
      trendingUpOutline,
      cashOutline,
      closeOutline,
      checkmarkOutline,
      peopleOutline,
      lockClosedOutline,
      walletOutline,
      helpCircleOutline,
      informationCircleOutline,
      starOutline
    });

    // Recargar metas de ahorro reactivamente al detectar mutaciones financieras
    effect(() => {
      const changeCount = this.transactionEventService.transactionSaved();
      if (changeCount > 0) {
        this.store.loadSavings(true).then(() => {
          const goals = this.store.activeSavingsGoals();
          const current = this.selectedGoal();
          if (current) {
            const updated = goals.find((g: SavingsGoal) => g.id === current.id);
            if (updated) {
              this.selectedGoal.set(updated);
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
    this.savingsForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      targetAmount: [null, [Validators.required, Validators.min(1)]],
      isPrivate: [false],
      participantIds: [[]],
    });

    this.depositForm = this.fb.group({
      accountId: [null, [Validators.required]],
      amount: [null, [Validators.required, Validators.min(1)]],
    });

    // Listen to isPrivate changes to clear participants selection if set to private
    this.savingsForm.get('isPrivate')?.valueChanges.subscribe((isPrivate) => {
      if (isPrivate) {
        this.savingsForm.get('participantIds')?.setValue([]);
      }
    });
  }

  /**
   * Carga los datos iniciales de la vista.
   */
  private async loadData() {
    try {
      await Promise.all([
        this.store.loadSavings(true),
        this.accountService.loadAccounts(true),
        this.loadMembers(),
      ]);
    } catch (err) {
      console.error('Error loading savings page data:', err);
    }
  }

  private async loadMembers() {
    try {
      // Update to use environment.apiUrl for getting members
      const members = await firstValueFrom(this.http.get<any[]>(`${environment.apiUrl}/users/members`));
      // Filter out the current user from the list (the creator is implicitly added)
      const currentUserId = this.currentUser()?.id;
      this.householdMembers.set(members.filter((m) => m.id !== currentUserId));
    } catch (err) {
      console.warn('Could not load household members from API:', err);
    }
  }

  // Modals operations
  public openCreateModal() {
    this.savingsForm.reset({
      title: '',
      description: '',
      targetAmount: null,
      isPrivate: false,
      participantIds: [],
    });
    this.isCreateModalOpen.set(true);
  }

  public closeCreateModal() {
    this.isCreateModalOpen.set(false);
  }

  public openDepositModal(goal: SavingsGoal) {
    this.selectedGoal.set(goal);
    this.depositForm.reset({
      accountId: null,
      amount: null,
    });
    this.isDepositModalOpen.set(true);
  }

  public closeDepositModal() {
    this.isDepositModalOpen.set(false);
    this.selectedGoal.set(null);
  }

  // Submit operations
  public async handleCreateSavingsGoal() {
    if (this.savingsForm.invalid) {
      return;
    }

    this.isSubmitting.set(true);
    try {
      const dto = this.savingsForm.value;
      await this.savingsService.createSavingsGoal(dto);
      this.closeCreateModal();
      this.presentToast('Meta de ahorro creada con éxito.', 'success');
      this.transactionEventService.emitTransactionSaved();
    } catch (error: any) {
      const msg = error.error?.message || 'Error al crear la meta de ahorro.';
      this.presentToast(msg, 'danger');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public async handleDeposit() {
    const goal = this.selectedGoal();
    if (this.depositForm.invalid || !goal) {
      return;
    }

    this.isSubmitting.set(true);
    try {
      const dto = this.depositForm.value;
      await this.savingsService.depositToSavingsGoal(goal.id, dto);
      this.closeDepositModal();
      // Reload accounts since balance changed
      await this.accountService.loadAccounts(true);
      this.presentToast('Aporte registrado con éxito.', 'success');
      this.transactionEventService.emitTransactionSaved();
    } catch (error: any) {
      const msg = error.error?.message || 'Error al registrar el aporte.';
      this.presentToast(msg, 'danger');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public async handleArchive(goal: SavingsGoal) {
    this.isSubmitting.set(true);
    try {
      await this.savingsService.archiveGoal(goal.id);
      await this.store.loadSavings(true);
      this.presentToast('Meta movida al historial.', 'success');
    } catch (error: any) {
      const msg = error.error?.message || 'Error al archivar la meta.';
      this.presentToast(msg, 'danger');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Helpers
  public getProgressPercentage(goal: SavingsGoal): number {
    const target = Number(goal.targetAmount);
    if (target === 0) return 0;
    return Math.min(100, (Number(goal.currentAmount) / target) * 100);
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
