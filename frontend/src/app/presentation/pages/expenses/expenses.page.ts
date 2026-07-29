// frontend/src/app/presentation/pages/expenses/expenses.page.ts
import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
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
    IonIcon
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesPage implements OnInit {
  // Bind real session details using the reactive AuthService signal
  public currentUser = this.authService.currentUser;

  // Services State bindings
  public household = this.householdService.household;
  public expenses = this.expenseService.expenses;

  // Reactivity: sum total expenses inside the active household
  public totalExpenses = computed(() => {
    return this.expenses().reduce((sum, item) => sum + Number(item.amount), 0);
  });

  // Read real categories from ExpenseService signal
  public categories = this.expenseService.categories;

  constructor(
    private expenseService: ExpenseService,
    private householdService: HouseholdService,
    private authService: AuthService,
    private modalCtrl: ModalController
  ) {
    // Register IonIcons
    addIcons({
      lockClosedOutline,
      addOutline,
      walletOutline,
      eyeOffOutline,
      globeOutline
    });
  }

  async ngOnInit() {
    const user = this.currentUser();
    if (user && user.householdId) {
      await this.householdService.loadHousehold(user.householdId);
      await this.expenseService.loadExpenses();
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
      // Recargar gastos y actualizar el balance total reactivo en pantalla
      await this.expenseService.loadExpenses(true);
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
