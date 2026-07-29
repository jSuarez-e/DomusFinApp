// frontend/src/app/presentation/pages/savings/savings.page.ts
import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
} from 'ionicons/icons';

import { SavingsService } from '../../../core/services/savings.service';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { SavingsGoal, Account, User } from '@shared/index';
import { MoneyMaskDirective } from '../../directives/money-mask.directive';
import { BlockScientificNotationDirective } from '../../directives/block-scientific-notation.directive';

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
    MoneyMaskDirective,
    BlockScientificNotationDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavingsPage implements OnInit {
  // State Signals
  public savingsGoals = this.savingsService.savingsGoals;
  public accounts = this.accountService.accounts;
  public currentUser = this.authService.currentUser;
  
  public householdMembers = signal<any[]>([]);
  public selectedGoal = signal<SavingsGoal | null>(null);

  // Active savings goals computed (current amount < target amount)
  public activeSavingsGoals = computed(() => {
    return this.savingsGoals().filter((g) => Number(g.currentAmount) < Number(g.targetAmount));
  });
  
  // Modal Signals
  public isCreateModalOpen = signal(false);
  public isDepositModalOpen = signal(false);
  public isSubmitting = signal(false);
  public readonly Number = Number;
  public readonly Math = Math;

  // Forms
  public savingsForm!: FormGroup;
  public depositForm!: FormGroup;

  // Computed totals for dashboard stats based on active goals
  public totalTarget = computed(() => {
    return this.activeSavingsGoals().reduce((sum, goal) => sum + Number(goal.targetAmount), 0);
  });

  public totalSaved = computed(() => {
    return this.activeSavingsGoals().reduce((sum, goal) => sum + Number(goal.currentAmount), 0);
  });

  public globalProgress = computed(() => {
    const target = this.totalTarget();
    if (target === 0) return 0;
    return Math.min(100, (this.totalSaved() / target) * 100);
  });

  constructor(
    private readonly savingsService: SavingsService,
    private readonly accountService: AccountService,
    private readonly authService: AuthService,
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly toastController: ToastController,
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

  private async loadData() {
    try {
      await Promise.all([
        this.savingsService.loadSavingsGoals(true),
        this.accountService.loadAccounts(true),
        this.loadMembers(),
      ]);
    } catch (err) {
      console.error('Error loading page data:', err);
    }
  }

  private async loadMembers() {
    try {
      const members = await firstValueFrom(this.http.get<any[]>('/api/users/members'));
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
      await firstValueFrom(this.savingsService.depositToSavingsGoal(goal.id, dto));
      this.closeDepositModal();
      // Reload accounts since balance changed
      await this.accountService.loadAccounts(true);
      this.presentToast('Aporte registrado con éxito.', 'success');
    } catch (error: any) {
      const msg = error.error?.message || 'Error al registrar el aporte.';
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
