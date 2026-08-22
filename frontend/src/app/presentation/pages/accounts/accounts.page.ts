// frontend/src/app/presentation/pages/accounts/accounts.page.ts
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
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
  ToastController,
  IonMenuButton
} from '@ionic/angular';
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
  peopleOutline,
  businessOutline
} from 'ionicons/icons';

import { AccountType, Account } from '@shared/index';
import { AccountsStore } from './accounts.store';
import { AccountItemComponent } from '../../../shared/components/account-item/account-item.component';
import { MoneyMaskDirective } from '../../directives/money-mask.directive';
import { BlockScientificNotationDirective } from '../../directives/block-scientific-notation.directive';

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.page.html',
  styleUrls: ['./accounts.page.scss'],
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
    IonMenuButton,
    MoneyMaskDirective,
    BlockScientificNotationDirective,
    AccountItemComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsPage implements OnInit {
  public store = inject(AccountsStore);

  public accounts = this.store.accounts;
  public totalBalance = this.store.totalBalance;
  
  public isModalOpen = signal(false);
  public accountForm: FormGroup;
  public isSubmitting = this.store.isLoading;

  /** Referencia del enum para binding en el template */
  public AccountType = AccountType;

  constructor(
    private readonly fb: FormBuilder,
    private readonly alertCtrl: AlertController,
    private readonly toastCtrl: ToastController
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
      peopleOutline,
      businessOutline
    });

    this.accountForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: [AccountType.BANK, Validators.required],
      initialBalance: [null, [Validators.required, Validators.min(0)]],
      isPrivate: [false],
    });

    effect(() => {
      // Cualquier reacción extra al store puede ir aquí
    });
  }

  async ngOnInit() {
    await this.store.loadAccounts(true);
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

    try {
      const val = this.accountForm.value;
      await this.store.createAccount({
        name: val.name,
        type: val.type,
        initialBalance: Number(val.initialBalance),
        isPrivate: val.isPrivate ?? false,
      });
      this.closeModal();
      await this.showToast('Cuenta creada exitosamente');
    } catch (err: unknown) {
      const message = (err as any)?.message || 'Error al crear la cuenta';
      await this.showToast(message, 'danger');
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
              await this.store.deleteAccount(account.id);
              await this.showToast('Cuenta eliminada');
            } catch (err: unknown) {
              const message = (err as any)?.message || 'No se pudo eliminar la cuenta';
              await this.showToast(message, 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  // Retirados getAccountTypeIcon y getAccountTypeLabel (delegados a AccountItemComponent)

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
