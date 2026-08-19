// frontend/src/app/presentation/pages/home/home.page.ts
import { ChangeDetectionStrategy, Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonButton,
  IonBadge,
  IonProgressBar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonAvatar,
  IonFab,
  IonFabButton,
  IonFabList,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  lockClosedOutline, 
  fastFoodOutline, 
  flashOutline, 
  carOutline, 
  cameraOutline, 
  helpCircleOutline, 
  calendarOutline, 
  cashOutline, 
  trendingUpOutline, 
  trendingDownOutline, 
  chevronForwardOutline,
  walletOutline,
  flash,
  swapHorizontalOutline,
  sunnyOutline,
  moonOutline,
  peopleOutline,
  alertCircleOutline,
  addOutline,
  closeOutline,
  lockClosed,
  receiptOutline,
  businessOutline,
  starOutline,
  cardOutline,
  listOutline
} from 'ionicons/icons';

import { MovementService } from '../../../core/services/movement.service';
import { AuthService } from '../../../core/services/auth.service';
import { HouseholdService } from '../../../core/services/household.service';
import { AccountService } from '../../../core/services/account.service';
import { CreditCardService } from '../../../core/services/credit-card.service';
import { SavingsService } from '../../../core/services/savings.service';
import { ThemeService } from '../../../core/services/theme.service';
import { TransactionFormComponent } from '../../components/transaction-form/transaction-form.component';
import { TransactionEventService } from '../../../core/services/transaction-event.service';
import { Movement, MonthlySummaryDto } from '@shared/index';
import { ListHeaderComponent } from '../../../shared/components/list-header/list-header.component';
import { SavingsItemComponent } from '../../../shared/components/savings-item/savings-item.component';

/**
 * @class HomePage
 * @description Main presentation page for the dashboard, displaying financial KPIs, recent movements, and quick actions.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonBadge,
    IonProgressBar,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonAvatar,
    IonFab,
    IonFabButton,
    IonFabList,
    ListHeaderComponent,
    SavingsItemComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage implements OnInit {
  public currentUser = this.authService.currentUser;
  
  // Reactivity State
  public currentDate = signal<Date>(new Date());
  public selectedMonth = signal<string>('');
  public summaryData = signal<MonthlySummaryDto | null>(null);
  public dashboardData = signal<{ total_liquidity: number; total_debt: number; monthly_budget_remaining: number } | null>(null);
  public availableMonths: { value: string; label: string }[] = [];

  // Theme support
  public isDarkTheme = this.themeService.isDark;
  public readonly Number = Number;

  // Real Service lists
  public accounts = this.accountService.accounts;
  public creditCards = this.creditCardService.creditCards;
  public savingsGoals = this.savingsService.savingsGoals;

  // Computed Values
  public netWorth = computed(() => {
    const data = this.dashboardData();
    if (!data) return 0;
    return (data.total_liquidity || 0) - (data.total_debt || 0);
  });
  public totalSpent = computed(() => {
    const remaining = this.dashboardData()?.monthly_budget_remaining ?? this.budget();
    return Math.max(0, this.budget() - remaining);
  });

  public income = computed(() => this.summaryData()?.summary.income || 0);
  public recentMovements = computed(() => this.summaryData()?.recentMovements || []);

  public budget = computed(() => Number(this.householdService.household()?.monthlyBudget || 1000000.00));
  
  public remainingBudget = computed(() => this.dashboardData()?.monthly_budget_remaining ?? this.budget());

  public spentRatio = computed(() => {
    const budget = this.budget();
    if (budget === 0) return 0;
    return Math.min(this.totalSpent() / budget, 1);
  });

  public progressBarColor = computed(() => {
    const ratio = this.spentRatio();
    if (ratio > 0.7) return 'danger';
    if (ratio >= 0.5) return 'warning';
    return 'success';
  });

  // 1. Featured Savings Goal (Closest to completion (<100%))
  public featuredGoal = this.savingsService.featuredGoal;

  // 2. Upcoming Payment Alerts (Credit Card due within 5 days)
  public upcomingAlerts = this.creditCardService.upcomingAlerts;

  constructor(
    private readonly movementService: MovementService,
    private readonly authService: AuthService,
    private readonly householdService: HouseholdService,
    private readonly accountService: AccountService,
    private readonly creditCardService: CreditCardService,
    private readonly savingsService: SavingsService,
    private readonly themeService: ThemeService,
    private readonly transactionEventService: TransactionEventService,
    private readonly modalCtrl: ModalController
  ) {
    addIcons({
      lockClosedOutline,
      fastFoodOutline,
      flashOutline,
      carOutline,
      cameraOutline,
      helpCircleOutline,
      calendarOutline,
      cashOutline,
      trendingUpOutline,
      trendingDownOutline,
      chevronForwardOutline,
      walletOutline,
      flash,
      swapHorizontalOutline,
      sunnyOutline,
      moonOutline,
      peopleOutline,
      alertCircleOutline,
      addOutline,
      closeOutline,
      lockClosed,
      receiptOutline,
      businessOutline,
      starOutline,
      cardOutline,
      listOutline
    });

    this.generateAvailableMonths();

    // Reactively refresh dashboard when a transaction is saved
    effect(() => {
      const changeCount = this.transactionEventService.transactionSaved();
      if (changeCount > 0) {
        this.loadDashboardData();
        // Also reload accounts and credit cards to update mini-cards
        this.accountService.loadAccounts(true);
        this.creditCardService.loadCreditCards(true);
      }
    });
  }

  async ngOnInit() {
    this.loadDashboardData();
    const user = this.currentUser();
    if (user && user.householdId) {
      await this.householdService.loadHousehold(user.householdId);
    }
    // Pre-load all lists
    await Promise.all([
      this.accountService.loadAccounts(true),
      this.creditCardService.loadCreditCards(true),
      this.savingsService.loadSavingsGoals(true)
    ]);
  }

  private generateAvailableMonths() {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    this.availableMonths = monthNames.map((name, i) => ({
      value: String(i + 1).padStart(2, '0'),
      label: name
    }));
    
    // Default to current month
    const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');
    this.selectedMonth.set(currentMonthStr);
  }

  /**
   * Loads the financial summary and dashboard metrics for the selected month.
   */
  public loadDashboardData() {
    const currentYear = new Date().getFullYear();
    const queryMonth = `${currentYear}-${this.selectedMonth()}`;

    this.movementService.getMonthlySummary(queryMonth).subscribe({
      next: (data) => {
        this.summaryData.set(data);
      },
      error: (err) => {
        console.error('Failed to load dashboard monthly summary data:', err);
      }
    });

    this.movementService.getDashboardSummary(queryMonth).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
      },
      error: (err) => {
        console.error('Failed to load dashboard summary metrics:', err);
      }
    });
  }

  /**
   * Handles the month selection change event and reloads the dashboard data.
   * @param event The ionChange event containing the new month value.
   */
  public onMonthChange(event: any) {
    const newMonth = event.detail.value;
    if (newMonth) {
      this.summaryData.set(null);
      this.dashboardData.set(null);
      this.selectedMonth.set(newMonth);
      this.loadDashboardData();
    }
  }

  public getCategoryIcon(categoryId: number): string {
    switch (categoryId) {
      case 1: return 'fast-food-outline';
      case 2: return 'flash-outline';
      case 3: return 'car-outline';
      case 4: return 'camera-outline';
      default: return 'help-circle-outline';
    }
  }

  public getMovementIcon(m: any): string {
    if (m.type === 'Ahorro' || m.type === 'Pago Crédito' || m.type === 'Pago TC' || m.type === 'Transferencia') {
      return 'swap-horizontal-outline';
    }
    return this.getCategoryIcon(m.categoryId);
  }

  public toggleTheme(): void {
    this.themeService.toggleTheme(!this.isDarkTheme());
  }

  /**
   * Opens the transaction creation modal.
   * @param defaultType Optional default transaction type to pre-select.
   */
  public async openAddModal(defaultType?: string) {
    const modal = await this.modalCtrl.create({
      component: TransactionFormComponent,
      componentProps: { isModal: true, defaultType },
      cssClass: 'premium-modal'
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' || role === 'success') {
      this.loadDashboardData();
      await Promise.all([
        this.accountService.loadAccounts(true),
        this.creditCardService.loadCreditCards(true),
        this.savingsService.loadSavingsGoals(true)
      ]);
    }
  }
}
