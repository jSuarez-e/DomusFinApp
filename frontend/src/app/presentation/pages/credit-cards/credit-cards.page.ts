// frontend/src/app/presentation/pages/credit-cards/credit-cards.page.ts
import { ChangeDetectionStrategy, Component, OnInit, signal, effect, inject } from '@angular/core';
import { TransactionEventService } from '../../../core/services/transaction-event.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
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
  IonMenuButton,
  IonSegmentButton,
  IonToggle,
  AlertController,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  cardOutline,
  cashOutline,
  calculatorOutline,
  calendarOutline,
  closeOutline,
  checkmarkOutline,
  walletOutline,
  trendingUpOutline,
  swapHorizontalOutline,
  informationCircleOutline,
  lockClosedOutline,
  peopleOutline
} from 'ionicons/icons';

import { CreditCardService } from '../../../core/services/credit-card.service';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { CreditCard, Account, AmortizationPeriod } from '@shared/index';
import { MoneyMaskDirective } from '../../directives/money-mask.directive';
import { BlockScientificNotationDirective } from '../../directives/block-scientific-notation.directive';
import { CreditCardsStore } from './credit-cards.store';
import { CreditCardUiComponent } from '../../../shared/components/credit-card-ui/credit-card-ui.component';

@Component({
  selector: 'app-credit-cards',
  templateUrl: './credit-cards.page.html',
  styleUrls: ['./credit-cards.page.scss'],
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
    IonMenuButton,
    MoneyMaskDirective,
    BlockScientificNotationDirective,
    CreditCardUiComponent
  ],
  providers: [CreditCardsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditCardsPage implements OnInit {
  public store = inject(CreditCardsStore);
  private transactionEventService = inject(TransactionEventService);
  private creditCardService = inject(CreditCardService);

  // Reemplazo de los Signals directos por los consumidos desde la tienda localizada
  public creditCards = this.store.creditCards;
  public totalDebt = this.store.totalDebt;
  public isSubmitting = signal(false);

  // Signals state
  public accounts = inject(AccountService).accounts;
  public currentUser = inject(AuthService).currentUser;
  public selectedCard = signal<CreditCard | null>(null);
  public householdMembers = signal<any[]>([]);

  // Modals state
  public isCreateModalOpen = signal(false);
  public isPayModalOpen = signal(false);
  public activeTab = signal<'details' | 'simulator'>('details');

  // Form groups
  public cardForm: FormGroup;
  public payForm: FormGroup;

  // Simulator state
  public simAmount = signal<number>(1000000);
  public simInstallments = signal<number>(12);
  public amortizationPlan = signal<AmortizationPeriod[]>([]);

  constructor(
    private accountService: AccountService,
    private fb: FormBuilder,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      addOutline,
      cardOutline,
      cashOutline,
      calculatorOutline,
      calendarOutline,
      closeOutline,
      checkmarkOutline,
      walletOutline,
      trendingUpOutline,
      swapHorizontalOutline,
      informationCircleOutline,
      lockClosedOutline,
      peopleOutline
    });

    this.cardForm = this.fb.group({
      aliasName: ['', [Validators.required, Validators.minLength(2)]],
      lastFourDigits: ['', [Validators.required, Validators.pattern('^[0-9]{4}$')]],
      interestRate: [null, [Validators.required, Validators.min(0)]],
      lateFeeRate: [null, [Validators.required, Validators.min(0)]],
      handlingFee: [null, [Validators.required, Validators.min(0)]],
      lifeInsurance: [null, [Validators.min(0)]],
      otherCharges: [null, [Validators.min(0)]],
      cutDate: [null, [Validators.required, Validators.min(1), Validators.max(31)]],
      paymentDueDate: [null, [Validators.required, Validators.min(1), Validators.max(31)]],
      isPrivate: [true],
      participantIds: [[]]
    });

    this.cardForm.get('isPrivate')?.valueChanges.subscribe((isPrivate) => {
      const parts = this.cardForm.get('participantIds');
      if (isPrivate) {
        parts?.setValue([]);
        parts?.clearValidators();
      } else {
        parts?.setValidators([Validators.required]);
      }
      parts?.updateValueAndValidity();
    });

    this.payForm = this.fb.group({
      accountId: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(100)]]
    });

    // Recargar tarjetas reactivamente al detectar mutaciones financieras
    effect(() => {
      const changeCount = this.transactionEventService.transactionSaved();
      if (changeCount > 0) {
        this.store.loadCreditCards(true).then(() => {
          const cards = this.store.creditCards();
          const current = this.selectedCard();
          if (current) {
            const updated = cards.find(c => c.id === current.id);
            if (updated) {
              this.selectedCard.set(updated);
            }
          }
        });
        this.accountService.loadAccounts(true);
      }
    });
  }

  async ngOnInit() {
    await this.store.loadCreditCards(true);
    await this.accountService.loadAccounts(true);
    await this.loadMembers();

    // Select first card by default if available
    const cards = this.creditCards();
    if (cards.length > 0) {
      this.selectCard(cards[0]);
    }
  }

  selectCard(card: CreditCard) {
    this.selectedCard.set(card);
    this.runSimulation();
  }

  private async loadMembers() {
    try {
      const members = await firstValueFrom(this.http.get<any[]>(`${environment.apiUrl}/users/members`));
      const currentUserId = this.currentUser()?.id;
      this.householdMembers.set(members.filter((m) => m.id !== currentUserId));
    } catch (err) {
      console.warn('Could not load household members:', err);
    }
  }

  // Card creation modals
  openCreateModal() {
    this.cardForm.reset({
      aliasName: '',
      lastFourDigits: '',
      interestRate: 2.5,
      lateFeeRate: 3.5,
      handlingFee: 15000,
      lifeInsurance: 0,
      otherCharges: 0,
      cutDate: 15,
      paymentDueDate: 5,
      isPrivate: true,
      participantIds: []
    });
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal() {
    this.isCreateModalOpen.set(false);
  }

  async handleCreateCard() {
    if (this.cardForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    try {
      const val = this.cardForm.value;
      const newCard = await this.creditCardService.createCreditCard({
        aliasName: val.aliasName,
        lastFourDigits: val.lastFourDigits,
        interestRate: Number(val.interestRate),
        lateFeeRate: Number(val.lateFeeRate),
        handlingFee: Number(val.handlingFee),
        lifeInsurance: val.lifeInsurance ? Number(val.lifeInsurance) : 0,
        otherCharges: val.otherCharges ? Number(val.otherCharges) : 0,
        cutDate: Number(val.cutDate),
        paymentDueDate: Number(val.paymentDueDate),
        isPrivate: val.isPrivate,
        participantIds: val.isPrivate ? [] : val.participantIds
      });
      this.selectCard(newCard);
      this.closeCreateModal();
      await this.showToast('Tarjeta de crédito registrada');
      this.transactionEventService.emitTransactionSaved();
    } catch (err: any) {
      const msg = err?.error?.message || 'Error al guardar la tarjeta';
      await this.showToast(msg, 'danger');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Payment methods
  openPayModal() {
    const card = this.selectedCard();
    if (!card) return;
    this.payForm.reset({
      accountId: '',
      amount: Math.min(1000000, card.currentDebt)
    });
    this.isPayModalOpen.set(true);
  }

  closePayModal() {
    this.isPayModalOpen.set(false);
  }

  async handlePayDebt() {
    const card = this.selectedCard();
    if (this.payForm.invalid || !card || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    try {
      const val = this.payForm.value;
      await this.creditCardService.payCreditCard({
        creditCardId: card.id,
        accountId: Number(val.accountId),
        amount: Number(val.amount)
      });
      // Refresh list to update debts
      await this.store.loadCreditCards(true);
      await this.accountService.loadAccounts(true);
      
      // Select updated card
      const updatedCard = this.creditCards().find(c => c.id === card.id);
      if (updatedCard) {
        this.selectedCard.set(updatedCard);
      }
      this.closePayModal();
      await this.showToast('Pago registrado correctamente');
      this.transactionEventService.emitTransactionSaved();
    } catch (err: any) {
      const msg = err?.error?.message || 'Error al procesar el pago';
      await this.showToast(msg, 'danger');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // Simulator actions
  public onSegmentChange(event: any) {
    this.activeTab.set(event.detail.value);
    if (event.detail.value === 'simulator') {
      this.runSimulation();
    }
  }

  public onSimAmountChange(event: any) {
    const val = Number(event.detail.value);
    if (val > 0) {
      this.simAmount.set(val);
      this.runSimulation();
    }
  }

  public onSimInstallmentsChange(event: any) {
    const val = Number(event.detail.value);
    if (val > 0) {
      this.simInstallments.set(val);
      this.runSimulation();
    }
  }

  private async runSimulation() {
    const card = this.selectedCard();
    if (!card) return;

    try {
      const plan = await this.creditCardService.simulateInstallments(
        this.simAmount(),
        card.interestRate,
        this.simInstallments()
      );
      this.amortizationPlan.set(plan || []);
    } catch (err) {
      console.error('Error simulating plan:', err);
      await this.showToast('Error al simular la tabla de amortización.', 'danger');
    }
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
      cssClass: 'premium-toast'
    });
    await toast.present();
  }
}
