// frontend/src/app/presentation/components/transaction-form/transaction-form.component.ts
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, Optional, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  IonContent, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonSelect, 
  IonSelectOption, 
  IonToggle, 
  IonButton, 
  IonIcon, 
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cashOutline, 
  swapHorizontalOutline, 
  listOutline, 
  cardOutline, 
  eyeOffOutline, 
  documentTextOutline,
  closeOutline,
  flashOutline,
  walletOutline,
  calculatorOutline
} from 'ionicons/icons';

import { MovementService } from '../../../core/services/movement.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { AccountService } from '../../../core/services/account.service';
import { CreditCardService } from '../../../core/services/credit-card.service';
import { Category, PaymentMethod, CreateMovementDto, Account, TransactionType, CreditCard, CategoryType } from '@shared/index';
import { MoneyMaskDirective } from '../../directives/money-mask.directive';
import { BlockScientificNotationDirective } from '../../directives/block-scientific-notation.directive';
import { TransactionEventService } from '../../../core/services/transaction-event.service';

@Component({
  selector: 'app-transaction-form',
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonButton,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    MoneyMaskDirective,
    BlockScientificNotationDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionFormComponent implements OnInit {
  @Input() isModal = false;
  @Input() defaultType?: string;
  @Output() onSave = new EventEmitter<unknown>();

  public transactionForm: FormGroup;
  public categories = signal<Category[]>([]);
  public paymentMethods = signal<PaymentMethod[]>([]);
  public accounts = signal<Account[]>([]);
  public creditCards = signal<CreditCard[]>([]);

  // Reactivity for category type filtering
  public selectedType = signal<TransactionType>(TransactionType.EXPENSE);
  public filteredCategories = computed(() => {
    const typeVal = this.selectedType();
    const all = this.categories();
    if (typeVal === TransactionType.INCOME) {
      return all.filter((c) => c.type === CategoryType.INCOME);
    } else {
      return all.filter((c) => !c.type || c.type === CategoryType.EXPENSE);
    }
  });

  /** Enum reference for template */
  public TransactionType = TransactionType;
  public readonly Number = Number;

  constructor(
    private fb: FormBuilder,
    private movementService: MovementService,
    private expenseService: ExpenseService,
    private accountService: AccountService,
    private creditCardService: CreditCardService,
    private transactionEventService: TransactionEventService,
    private toastController: ToastController,
    @Optional() private modalCtrl: ModalController
  ) {
    addIcons({
      cashOutline,
      swapHorizontalOutline,
      listOutline,
      cardOutline,
      eyeOffOutline,
      documentTextOutline,
      closeOutline,
      flashOutline,
      walletOutline,
      calculatorOutline
    });

    this.transactionForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      type: [TransactionType.EXPENSE, Validators.required],
      categoryId: ['', Validators.required],
      paymentMethodId: ['', Validators.required],
      accountId: ['', Validators.required],
      destinationAccountId: [''],
      creditCardId: [''],
      installments: [null],
      isPrivate: [false],
      description: [''],
      sourceApp: ['Webapp', Validators.required]
    });

    // Escuchar cambios de medio de pago para validaciones dinámicas
    this.transactionForm.get('paymentMethodId')?.valueChanges.subscribe((pmId) => {
      const pm = this.paymentMethods().find((p) => p.id === Number(pmId));
      const accountCtrl = this.transactionForm.get('accountId');
      const cardCtrl = this.transactionForm.get('creditCardId');
      const instCtrl = this.transactionForm.get('installments');

      if (pm?.name === 'Tarjeta de Crédito') {
        accountCtrl?.clearValidators();
        cardCtrl?.setValidators(Validators.required);
        instCtrl?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        accountCtrl?.setValidators(Validators.required);
        cardCtrl?.clearValidators();
        instCtrl?.clearValidators();
      }
      accountCtrl?.updateValueAndValidity();
      cardCtrl?.updateValueAndValidity();
      instCtrl?.updateValueAndValidity();
    });

    // Escuchar cambios de tipo de movimiento para validación de Cuenta Destino
    this.transactionForm.get('type')?.valueChanges.subscribe((typeVal) => {
      this.selectedType.set(typeVal);
      const destAccCtrl = this.transactionForm.get('destinationAccountId');
      if (typeVal === TransactionType.TRANSFER) {
        destAccCtrl?.setValidators(Validators.required);
        
        // Auto-seleccionar categoría 'Otros' o primera categoría
        const catCtrl = this.transactionForm.get('categoryId');
        if (!catCtrl?.value) {
          const defaultCat = this.categories().find(c => c.name.toLowerCase().includes('otros') || c.name.toLowerCase().includes('transferencia')) || this.categories()[0];
          if (defaultCat) {
            catCtrl?.patchValue(defaultCat.id);
          }
        }

        // Auto-seleccionar medio de pago 'Transferencia' o 'Efectivo'
        const pmCtrl = this.transactionForm.get('paymentMethodId');
        if (!pmCtrl?.value) {
          const defaultPm = this.paymentMethods().find(p => p.name.toLowerCase().includes('transferencia')) || this.paymentMethods()[0];
          if (defaultPm) {
            pmCtrl?.patchValue(defaultPm.id);
          }
        }
      } else {
        destAccCtrl?.clearValidators();
      }
      destAccCtrl?.updateValueAndValidity();
    });
  }

  async ngOnInit() {
    if (this.defaultType) {
      this.transactionForm.patchValue({ type: this.defaultType });
    }
    // Cargar categorías del backend
    try {
      const cats = await this.expenseService.loadCategories();
      this.categories.set(cats || []);
    } catch (e) {
      console.warn('Fallo al recuperar categorías del backend, usando caché local.', e);
      this.categories.set(this.expenseService.categories());
    }

    // Cargar medios de pago del backend
    try {
      this.movementService.getPaymentMethods().subscribe({
        next: (methods) => {
          this.paymentMethods.set(methods || []);
        },
        error: (err) => {
          console.warn('Fallo al recuperar medios de pago, usando mock en fallback.', err);
          this.paymentMethods.set([
            { id: 1, name: 'Efectivo', householdId: null },
            { id: 2, name: 'Tarjeta de Crédito', householdId: null },
            { id: 3, name: 'Transferencia Bancaria', householdId: null }
          ]);
        }
      });
    } catch (e) {
      console.error(e);
    }

    // Cargar cuentas financieras del hogar
    try {
      const accs = await this.accountService.loadAccounts();
      this.accounts.set(accs || []);
    } catch (e) {
      console.warn('Fallo al recuperar cuentas financieras.', e);
    }

    // Cargar tarjetas de crédito del hogar
    try {
      const cards = await this.creditCardService.loadCreditCards();
      this.creditCards.set(cards || []);
    } catch (e) {
      console.warn('Fallo al recuperar tarjetas de crédito.', e);
    }
  }

  /**
   * Retorna la etiqueta dinámica del selector de cuenta según el tipo de movimiento.
   */
  getAccountLabel(): string {
    const type = this.transactionForm.get('type')?.value;
    if (type === TransactionType.INCOME) {
      return 'Cuenta de Destino';
    }
    return 'Cuenta de Origen';
  }

  /**
   * Indica si el medio de pago actual es tarjeta de crédito.
   */
  isCreditCardPayment(): boolean {
    const pmId = this.transactionForm.get('paymentMethodId')?.value;
    const pm = this.paymentMethods().find((p) => p.id === Number(pmId));
    return pm?.name === 'Tarjeta de Crédito';
  }

  async handleSubmit() {
    if (this.transactionForm.invalid) {
      return;
    }

    const formVal = this.transactionForm.value;
    const isCc = this.isCreditCardPayment();

    const payload: CreateMovementDto = {
      amount: Number(formVal.amount),
      transactionDate: new Date().toISOString(),
      type: formVal.type,
      categoryId: Number(formVal.categoryId),
      paymentMethodId: Number(formVal.paymentMethodId),
      isPrivate: formVal.isPrivate ?? false,
      description: formVal.description || '',
      sourceApp: formVal.sourceApp || 'Webapp'
    };

    if (isCc) {
      payload.creditCardId = Number(formVal.creditCardId);
      payload.installments = Number(formVal.installments);
    } else {
      payload.accountId = Number(formVal.accountId);
      if (formVal.type === TransactionType.TRANSFER) {
        payload.destinationAccountId = Number(formVal.destinationAccountId);
      }
    }

    this.movementService.saveMovement(payload).subscribe({
      next: (savedMovement) => {
        this.showToast('Movimiento registrado con éxito', 'success');
        this.transactionEventService.emitTransactionSaved();
        this.onSave.emit(savedMovement);
        // Refrescar cuentas y tarjetas para actualizar saldos
        this.accountService.loadAccounts(true);
        this.creditCardService.loadCreditCards(true);
        if (this.isModal && this.modalCtrl) {
          this.modalCtrl.dismiss(savedMovement, 'confirm');
        }
      },
      error: (err) => {
        this.showToast('Error al registrar el movimiento', 'danger');
        console.error('Error saving movement:', err);
      }
    });
  }

  async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      buttons: [{ text: 'Ok', role: 'cancel' }]
    });
    await toast.present();
  }

  handleCancel() {
    if (this.isModal && this.modalCtrl) {
      this.modalCtrl.dismiss(null, 'cancel');
    }
  }
}
