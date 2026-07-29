// frontend/src/app/presentation/pages/capture-settings/capture-settings.page.ts
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  flashOutline, 
  notificationsOutline, 
  chatbubbleEllipsesOutline, 
  shieldCheckmarkOutline,
  settingsOutline
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-capture-settings',
  templateUrl: './capture-settings.page.html',
  styleUrls: ['./capture-settings.page.css'],
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
    IonToggle,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons,
    IonMenuButton,
    IonButton
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaptureSettingsPage implements OnInit {
  public isSmsEnabled = signal(true);
  public isPushEnabled = signal(true);
  public isBackgroundSyncEnabled = signal(true);

  constructor(
    private readonly authService: AuthService,
    private readonly toastController: ToastController
  ) {
    addIcons({
      flashOutline,
      notificationsOutline,
      chatbubbleEllipsesOutline,
      shieldCheckmarkOutline,
      settingsOutline
    });
  }

  ngOnInit(): void {
    // Cargar configuraciones guardadas localmente si existen
    const savedSms = localStorage.getItem('sms_capture_enabled');
    const savedPush = localStorage.getItem('push_capture_enabled');
    const savedBg = localStorage.getItem('bg_sync_enabled');

    if (savedSms !== null) this.isSmsEnabled.set(savedSms === 'true');
    if (savedPush !== null) this.isPushEnabled.set(savedPush === 'true');
    if (savedBg !== null) this.isBackgroundSyncEnabled.set(savedBg === 'true');
  }

  public async toggleSms(event: any): Promise<void> {
    const val = event.detail.checked;
    this.isSmsEnabled.set(val);
    localStorage.setItem('sms_capture_enabled', String(val));
    await this.showToast(val ? 'Lectura de SMS activada' : 'Lectura de SMS desactivada');
  }

  public async togglePush(event: any): Promise<void> {
    const val = event.detail.checked;
    this.isPushEnabled.set(val);
    localStorage.setItem('push_capture_enabled', String(val));
    await this.showToast(val ? 'Escucha de Notificaciones activada' : 'Escucha de Notificaciones desactivada');
  }

  public async toggleBgSync(event: any): Promise<void> {
    const val = event.detail.checked;
    this.isBackgroundSyncEnabled.set(val);
    localStorage.setItem('bg_sync_enabled', String(val));
    await this.showToast(val ? 'Sincronización en segundo plano activada' : 'Sincronización en segundo plano desactivada');
  }

  public async requestNotificationPermission(): Promise<void> {
    try {
      const { registerPlugin } = await import('@capacitor/core');
      interface AndroidSettingsPlugin {
        openNotificationSettings(): Promise<{ success: boolean }>;
      }
      const AndroidSettings = registerPlugin<AndroidSettingsPlugin>('AndroidSettings');
      await AndroidSettings.openNotificationSettings();
      await this.showToast('Abriendo configuración de lectura de notificaciones');
    } catch (err) {
      console.error('Failed to open settings:', err);
      await this.showToast('La función de permisos solo está disponible en Android nativo.');
    }
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      cssClass: 'premium-toast'
    });
    await toast.present();
  }
}
