// frontend/src/app/presentation/pages/accounts/accounts.page.ts
import { ChangeDetectionStrategy, Component, computed, effect, OnInit, signal } from '@angular/core';
import { TransactionEventService } from '../../../core/services/transaction-event.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonToggle,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  walletOutline,
  cashOutline,
  cardOutline,
  phonePortraitOutline,
  trashOutline,
  createOutline,
  closeOutline,
  checkmarkOutline,
  lockClosedOutline,
  peopleOutline
} from 'ionicons/icons';

import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { AccountType, Account } from '@shared/index';
import { MoneyMaskDirective } from '../../directives/money-mask.directive';
import { BlockScientificNotationDirective } from '../../directives/block-scientific-notation.directive';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.page.html',
  styleUrls: ['./accounts.page.css'],
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
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonToggle,
    MoneyMaskDirective,
    BlockScientificNotationDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsPage implements OnInit {
  public accounts = this.accountService.accounts;
  public isModalOpen = signal(false);
  public accountForm: FormGroup;
  public isSubmitting = signal(false);

  /** Enum reference for template binding */
  public AccountType = AccountType;

  /** Suma total de saldos actuales */
  public totalBalance = computed(() =>
    this.accounts().reduce((sum, acc) => sum + Number(acc.currentBalance), 0)
  );

  constructor(
    private readonly accountService: AccountService,
    private readonly authService: AuthService,
    private readonly fb: FormBuilder,
    private readonly alertCtrl: AlertController,
    private readonly toastCtrl: ToastController,
    private readonly transactionEventService: TransactionEventService
  ) {
    addIcons({
      addOutline,
      walletOutline,
      cashOutline,
      cardOutline,
      phonePortraitOutline,
      trashOutline,
      createOutline,
      closeOutline,
      checkmarkOutline,
      lockClosedOutline,
      peopleOutline
    });

    this.accountForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: [AccountType.BANK, Validators.required],
      initialBalance: [null, [Validators.required, Validators.min(0)]],
      isPrivate: [false],
    });

    // Recargar cuentas reactivamente al detectar mutaciones financieras
    effect(() => {
      const changeCount = this.transactionEventService.transactionSaved();
      if (changeCount > 0) {
        this.accountService.loadAccounts(true);
      }
    });
  }

  async ngOnInit() {
    await this.accountService.loadAccounts(true);
  }

  /**
   * Abre el modal de creación de nueva cuenta.
   */
  openModal() {
    this.accountForm.reset({ name: '', type: AccountType.BANK, initialBalance: null, isPrivate: false });
    this.isModalOpen.set(true);
  }

  /**
   * Cierra el modal de creación.
   */
  closeModal() {
    this.isModalOpen.set(false);
  }

  /**
   * Crea una nueva cuenta financiera desde el formulario.
   */
  async handleCreate() {
    if (this.accountForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    try {
      const val = this.accountForm.value;
      await this.accountService.createAccount({
        name: val.name,
        type: val.type,
        initialBalance: Number(val.initialBalance),
        isPrivate: val.isPrivate ?? false,
      });
      this.closeModal();
      await this.showToast('Cuenta creada exitosamente');
      this.transactionEventService.emitTransactionSaved();
    } catch (err: unknown) {
      const message = (err as { error?: { message?: string } })?.error?.message || 'Error al crear la cuenta';
      await this.showToast(message, 'danger');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Elimina una cuenta previa confirmación del usuario.
   *
   * @param {Account} account La cuenta a eliminar.
   */
  async handleDelete(account: Account) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Cuenta',
      message: `¿Estás seguro de eliminar la cuenta "${account.name}"? Esta acción no se puede deshacer.`,
      cssClass: 'premium-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.accountService.deleteAccount(account.id);
              await this.showToast('Cuenta eliminada');
              this.transactionEventService.emitTransactionSaved();
            } catch (err: unknown) {
              const message = (err as { error?: { message?: string } })?.error?.message || 'No se pudo eliminar la cuenta';
              await this.showToast(message, 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  /**
   * Retorna el ícono correspondiente al tipo de cuenta.
   */
  getAccountTypeIcon(type: string): string {
    switch (type) {
      case AccountType.BANK: return 'card-outline';
      case AccountType.CASH: return 'cash-outline';
      case AccountType.WALLET: return 'phone-portrait-outline';
      default: return 'wallet-outline';
    }
  }

  /**
   * Retorna la etiqueta legible del tipo de cuenta.
   */
  getAccountTypeLabel(type: string): string {
    switch (type) {
      case AccountType.BANK: return 'Banco';
      case AccountType.CASH: return 'Efectivo';
      case AccountType.WALLET: return 'Billetera';
      default: return type;
    }
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
      cssClass: 'premium-toast',
    });
    await toast.present();
  }
}
