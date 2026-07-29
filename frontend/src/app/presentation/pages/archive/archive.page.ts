// frontend/src/app/presentation/pages/archive/archive.page.ts
import { ChangeDetectionStrategy, Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonIcon, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonButtons, 
  IonMenuButton, 
  IonSegment, 
  IonSegmentButton,
  IonBadge,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  archiveOutline, 
  trendingUpOutline, 
  calculatorOutline, 
  cardOutline,
  lockClosedOutline,
  peopleOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { SavingsService } from '../../../core/services/savings.service';
import { LoanService } from '../../../core/services/loan.service';
import { CreditCardService } from '../../../core/services/credit-card.service';
import { AuthService } from '../../../core/services/auth.service';
import { SavingsGoal, Loan, CreditCard } from '@shared/index';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.page.html',
  styleUrls: ['./archive.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons,
    IonMenuButton,
    IonSegment,
    IonSegmentButton,
    IonBadge
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArchivePage implements OnInit {
  // Services data mapping
  public savings = this.savingsService.savingsGoals;
  public loans = this.loanService.loans;
  public creditCards = this.creditCardService.creditCards;
  public currentUser = this.authService.currentUser;

  // View state
  public activeSegment = signal<'savings' | 'loans' | 'cc'>('savings');
  public isLoading = signal(false);

  // Computeds for completed/clean entities
  public completedSavings = computed(() => {
    return this.savings().filter(s => Number(s.currentAmount) >= Number(s.targetAmount));
  });

  public completedLoans = computed(() => {
    return this.loans().filter(l => Number(l.currentBalance) <= 0);
  });

  public completedCreditCards = computed(() => {
    return this.creditCards().filter(c => Number(c.currentDebt) <= 0);
  });

  public readonly Number = Number;

  constructor(
    private readonly savingsService: SavingsService,
    private readonly loanService: LoanService,
    private readonly creditCardService: CreditCardService,
    private readonly authService: AuthService,
    private readonly toastController: ToastController
  ) {
    addIcons({
      archiveOutline,
      trendingUpOutline,
      calculatorOutline,
      cardOutline,
      lockClosedOutline,
      peopleOutline,
      checkmarkCircleOutline
    });
  }

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      await Promise.all([
        this.savingsService.loadSavingsGoals(true),
        this.loanService.loadLoans(true),
        this.creditCardService.loadCreditCards(true)
      ]);
    } catch (err) {
      console.error('Failed to load archive data:', err);
      const toast = await this.toastController.create({
        message: 'Error al cargar el archivo histórico.',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isLoading.set(false);
    }
  }

  public onSegmentChange(event: any): void {
    this.activeSegment.set(event.detail.value);
  }

  public getSavedPercentage(goal: SavingsGoal): number {
    const target = Number(goal.targetAmount);
    if (target === 0) return 100;
    return Math.min(100, Math.max(0, (Number(goal.currentAmount) / target) * 100));
  }

  public getPaidPercentage(loan: Loan): number {
    const initial = Number(loan.initialPrincipal);
    if (initial === 0) return 100;
    const paid = initial - Number(loan.currentBalance);
    return Math.min(100, Math.max(0, (paid / initial) * 100));
  }
}
