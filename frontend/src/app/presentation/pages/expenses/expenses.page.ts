// frontend/src/app/presentation/pages/expenses/expenses.page.ts
import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { TransactionEventService } from '../../../core/services/transaction-event.service';
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
  IonList,
  IonItem,
  IonLabel,
  IonFab,
  IonFabButton,
  IonText,
  IonIcon,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, addOutline, walletOutline, eyeOffOutline, globeOutline } from 'ionicons/icons';
import { ExpenseService } from '../../../core/services/expense.service';
import { HouseholdService } from '../../../core/services/household.service';
import { AuthService } from '../../../core/services/auth.service';
import { TransactionFormComponent } from '../../components/transaction-form/transaction-form.component';
import { ExpenseItemComponent } from '../../../shared/components/expense-item/expense-item.component';
import { ExpensesStore } from './expenses.store';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.page.html',
  styleUrls: ['./expenses.page.css'],
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
    IonList,
    IonItem,
    IonLabel,
    IonFab,
    IonFabButton,
    IonText,
    IonIcon,
    ExpenseItemComponent
  ],
  providers: [ExpensesStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesPage implements OnInit {
  public store = inject(ExpensesStore);

  /** Usuario actualmente autenticado provisto por AuthService */
  public currentUser = this.authService.currentUser;

  /** Hogar al que pertenece el usuario */
  public household = this.householdService.household;
  
  /** Lista reactiva de gastos delegada al store */
  public expenses = this.store.expenses;

  /** Total computado delegado al store */
  public totalExpenses = this.store.totalExpenses;

  /** Categorías reactivas delegadas al store */
  public categories = this.store.categories;

  constructor(
    private householdService: HouseholdService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private transactionEventService: TransactionEventService
  ) {
    // Register IonIcons
    addIcons({
      lockClosedOutline,
      addOutline,
      walletOutline,
      eyeOffOutline,
      globeOutline
    });

    // Recargar gastos reactivamente al detectar mutaciones financieras
    effect(() => {
      const changeCount = this.transactionEventService.transactionSaved();
      if (changeCount > 0) {
        this.store.loadExpenses(true);
      }
    });
  }

  /**
   * Carga de forma asíncrona los datos requeridos por la vista:
   * Inicializa la información del hogar y carga la lista de gastos
   * a través de los correspondientes servicios de estado.
   */
  async ngOnInit() {
    const user = this.currentUser();
    if (user && user.householdId) {
      await this.householdService.loadHousehold(user.householdId);
      await this.store.loadExpenses();
    }
  }

  /**
   * Abre el formulario de registro de transacciones de forma dinámica.
   */
  async openAddModal() {
    const modal = await this.modalCtrl.create({
      component: TransactionFormComponent,
      componentProps: { isModal: true },
      cssClass: 'premium-modal'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      // Recargar gastos y actualizar el balance total reactivo en pantalla a través de Store
      await this.store.loadExpenses(true);
    }
  }

  /**
   * Mapea un ID de categoría a su correspondiente nombre.
   */
  getCategoryName(categoryId: number): string {
    const cat = this.categories().find(c => c.id === categoryId);
    return cat ? cat.name : 'Sin Categoría';
  }
}
