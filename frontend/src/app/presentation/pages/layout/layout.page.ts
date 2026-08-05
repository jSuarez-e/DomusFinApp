// frontend/src/app/presentation/pages/layout/layout.page.ts
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
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
import { LayoutStore } from './layout.store';
import { MenuOptionItemComponent } from '../../../shared/components/menu-option-item/menu-option-item.component';

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
    IonButtons,
    MenuOptionItemComponent
  ],
  providers: [LayoutStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPage implements OnInit {
  public currentUser = this.authService.currentUser;
  public store = inject(LayoutStore);
  public activeTabIndex = signal<number>(0);

  // Mapeo de rutas a índices para el cutout
  private tabIndexMap: Record<string, number> = {
    'inicio': 0,
    'accounts': 1,
    'expenses': 2,
    'reports': 3,
    'mas': 4 // The "Más" button doesn't route, but we handle its active state visually if needed, though it's usually just a trigger
  };

  constructor(
    private authService: AuthService,
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

  /**
   * Inicializa la vista cargando los datos a través del Store local.
   * @returns {Promise<void>} Resolutor vacío
   */
  async ngOnInit(): Promise<void> {
    await this.store.loadInitialData();
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
   * @param {any} event - Evento del selector de Ionic.
   * @returns {Promise<void>}
   */
  async onHouseholdChange(event: any): Promise<void> {
    const selectedId = Number(event.detail.value);
    if (!selectedId || selectedId === this.currentUser()?.householdId) {
      return;
    }

    await this.store.switchHousehold(selectedId);
    await this.closeMenu();
  }

  /**
   * Gestiona el cierre de sesión
   */
  handleLogout(): void {
    this.closeMenu();
    this.authService.logout();
  }

  /**
   * Abre el modal "Acerca de"
   */
  openAboutModal(): void {
    this.closeMenu();
    this.store.setAboutModalOpen(true);
  }

  /**
   * Cierra el modal "Acerca de"
   */
  closeAboutModal(): void {
    this.store.setAboutModalOpen(false);
  }

  /**
   * Muestra un mensaje informativo para los ajustes de cuenta.
   * @returns {Promise<void>}
   */
  async triggerAccountSettingsAlert(): Promise<void> {
    await this.closeMenu();
    const alert = await this.alertController.create({
      header: 'Ajustes de Cuenta',
      message: 'La funcionalidad de actualización de perfil estará disponible en la próxima versión.',
      buttons: ['Ok'],
      cssClass: 'premium-alert'
    });
    await alert.present();
  }

  /**
   * Actualiza el índice activo cuando cambia la pestaña para animar el cutout
   * @param event - Evento ionTabsDidChange
   */
  onTabsDidChange(event: any): void {
    const tabName = event.tab;
    const newIndex = this.tabIndexMap[tabName];
    if (newIndex !== undefined) {
      this.activeTabIndex.set(newIndex);
    }
  }
}
