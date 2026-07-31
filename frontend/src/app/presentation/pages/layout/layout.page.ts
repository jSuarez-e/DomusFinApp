// frontend/src/app/presentation/pages/layout/layout.page.ts
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonTabs, 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel, 
  IonMenu, 
  IonList, 
  IonItem, 
  IonAvatar, 
  IonSelect, 
  IonSelectOption, 
  IonModal, 
  IonButton,
  IonButtons,
  MenuController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  homeOutline, 
  barChartOutline, 
  menuOutline, 
  logOutOutline, 
  settingsOutline, 
  informationCircleOutline, 
  peopleOutline,
  walletOutline,
  flashOutline,
  cashOutline,
  cardOutline,
  trendingUpOutline,
  calculatorOutline,
  archiveOutline
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { HouseholdService } from '../../../core/services/household.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.page.html',
  styleUrls: ['./layout.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonMenu,
    IonList,
    IonItem,
    IonAvatar,
    IonSelect,
    IonSelectOption,
    IonModal,
    IonButton,
    IonButtons
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPage implements OnInit {
  public currentUser = this.authService.currentUser;
  public households = signal<any[]>([]);
  public isAboutModalOpen = signal(false);
  public membersCount = signal<number>(0);

  constructor(
    private authService: AuthService,
    private expenseService: ExpenseService,
    private householdService: HouseholdService,
    private http: HttpClient,
    private menuCtrl: MenuController,
    private alertController: AlertController
  ) {
    addIcons({
      homeOutline,
      barChartOutline,
      menuOutline,
      logOutOutline,
      settingsOutline,
      informationCircleOutline,
      peopleOutline,
      walletOutline,
      flashOutline,
      cashOutline,
      cardOutline,
      trendingUpOutline,
      calculatorOutline,
      archiveOutline
    });
  }

  async ngOnInit() {
    try {
      const list = await firstValueFrom(this.http.get<any[]>(`${this.authService.apiUrlUsers}/households`));
      this.households.set(list || []);

      const members = await firstValueFrom(this.http.get<any[]>(`${this.authService.apiUrlUsers}/members`));
      this.membersCount.set(members?.length || 1);
    } catch (err) {
      console.warn('No se pudo cargar la lista de hogares del backend, usando mock para demo.', err);
      this.households.set([
        { id: 1, name: 'Hogar Familiar Principal' },
        { id: 2, name: 'Hogar Secundario (Trabajo)' }
      ]);
      this.membersCount.set(1);
    }
  }

  /**
   * Abre el menú lateral mediante el controlador.
   */
  async openMenu() {
    await this.menuCtrl.enable(true, 'main-menu');
    await this.menuCtrl.open('main-menu');
  }

  /**
   * Cierra el menú lateral.
   */
  async closeMenu() {
    await this.menuCtrl.close('main-menu');
  }

  /**
   * Cambia el inquilino activo del usuario y recarga la información.
   */
  async onHouseholdChange(event: any) {
    const selectedId = Number(event.detail.value);
    if (!selectedId || selectedId === this.currentUser()?.householdId) {
      return;
    }

    try {
      await this.authService.switchHousehold(selectedId);
      // Forzar recarga de los servicios centrales con el nuevo ID del inquilino
      await this.householdService.loadHousehold(selectedId, true);
      await this.expenseService.loadExpenses(true);

      const members = await firstValueFrom(this.http.get<any[]>(`${this.authService.apiUrlUsers}/members`));
      this.membersCount.set(members?.length || 1);

      await this.closeMenu();
    } catch (err) {
      console.error('Error switching tenant:', err);
    }
  }

  handleLogout() {
    this.closeMenu();
    this.authService.logout();
  }

  openAboutModal() {
    this.closeMenu();
    this.isAboutModalOpen.set(true);
  }

  closeAboutModal() {
    this.isAboutModalOpen.set(false);
  }

  async triggerAccountSettingsAlert() {
    await this.closeMenu();
    const alert = await this.alertController.create({
      header: 'Ajustes de Cuenta',
      message: 'La funcionalidad de actualización de perfil estará disponible en la próxima versión.',
      buttons: ['Ok'],
      cssClass: 'premium-alert'
    });
    await alert.present();
  }
}
