// frontend/src/app/presentation/pages/capture-settings/capture-settings.page.ts
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from "@angular/core";

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButtons,
  IonMenuButton,
  ToastController,
  IonButton,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  flashOutline,
  notificationsOutline,
  chatbubbleEllipsesOutline,
  shieldCheckmarkOutline,
  settingsOutline,
} from "ionicons/icons";
import { AuthService } from "../../../core/services/auth.service";
import { CaptureSettingsStore } from "./capture-settings.store";
import { CaptureChannelItemComponent } from "../../../shared/components/capture-channel-item/capture-channel-item.component";

@Component({
  selector: "app-capture-settings",
  templateUrl: "./capture-settings.page.html",
  styleUrls: ["./capture-settings.page.css"],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons,
    IonMenuButton,
    IonButton,
    CaptureChannelItemComponent,
  ],
  providers: [CaptureSettingsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaptureSettingsPage implements OnInit {
  public store = inject(CaptureSettingsStore);

  public isSmsEnabled = this.store.isSmsEnabled;
  public isPushEnabled = this.store.isPushEnabled;
  public isBackgroundSyncEnabled = this.store.isBackgroundSyncEnabled;

  constructor(
    private readonly authService: AuthService,
    private readonly toastController: ToastController
  ) {
    addIcons({
      flashOutline,
      notificationsOutline,
      chatbubbleEllipsesOutline,
      shieldCheckmarkOutline,
      settingsOutline,
    });
  }

  ngOnInit(): void {
    // El store maneja la inicialización mediante withHooks
  }

  /**
   * Maneja el cambio del toggle de SMS
   * @param event - Evento del componente IonToggle
   * @returns {Promise<void>} Resolutor
   */
  public async toggleSms(event: any): Promise<void> {
    const val = event.detail.checked;
    this.store.toggleSms(val);
    await this.showToast(
      val ? "Lectura de SMS activada" : "Lectura de SMS desactivada"
    );
  }

  /**
   * Maneja el cambio del toggle de Push
   * @param event - Evento del componente IonToggle
   * @returns {Promise<void>} Resolutor
   */
  public async togglePush(event: any): Promise<void> {
    const val = event.detail.checked;
    this.store.togglePush(val);
    await this.showToast(
      val
        ? "Escucha de Notificaciones activada"
        : "Escucha de Notificaciones desactivada"
    );
  }

  /**
   * Maneja el cambio del toggle de Background Sync
   * @param event - Evento del componente IonToggle
   * @returns {Promise<void>} Resolutor
   */
  public async toggleBgSync(event: any): Promise<void> {
    const val = event.detail.checked;
    this.store.toggleBgSync(val);
    await this.showToast(
      val
        ? "Sincronización en segundo plano activada"
        : "Sincronización en segundo plano desactivada"
    );
  }

  /**
   * Solicita al plugin nativo abrir la configuración de acceso a notificaciones.
   * @returns {Promise<void>} Resolutor
   * @throws Puede lanzar error si no se encuentra en un entorno nativo (Capacitor).
   */
  public async requestNotificationPermission(): Promise<void> {
    try {
      const { registerPlugin } = await import("@capacitor/core");
      interface AndroidSettingsPlugin {
        openNotificationSettings(): Promise<{ success: boolean }>;
      }
      const AndroidSettings =
        registerPlugin<AndroidSettingsPlugin>("AndroidSettings");
      await AndroidSettings.openNotificationSettings();
      await this.showToast(
        "Abriendo configuración de lectura de notificaciones"
      );
    } catch (err) {
      console.error("Failed to open settings:", err);
      await this.showToast(
        "La función de permisos solo está disponible en Android nativo."
      );
    }
  }

  /**
   * Muestra un toast visual de éxito
   * @param {string} message - Mensaje a mostrar
   * @returns {Promise<void>}
   */
  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: "bottom",
      color: "success",
    });
    await toast.present();
  }
}
