// frontend/src/app/presentation/pages/settings/settings.page.ts
import { ChangeDetectionStrategy, Component, OnInit, signal, effect, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators, 
  AbstractControl, 
  ValidationErrors 
} from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonInput, 
  IonButton, 
  IonSelect, 
  IonSelectOption, 
  IonIcon, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonButtons, 
  IonMenuButton, 
  ToastController,
  IonAvatar,
  IonProgressBar,
  AlertController,
  IonToggle,
  IonSegment,
  IonSegmentButton,
  IonModal,
  IonAlert
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  lockClosedOutline, 
  mailOutline, 
  settingsOutline, 
  saveOutline, 
  refreshOutline,
  cameraOutline,
  imageOutline,
  alertCircleOutline,
  eyeOutline,
  eyeOffOutline,
  addOutline,
  pencilOutline,
  trashOutline,
  closeOutline,
  listOutline,
  walletOutline,
  cardOutline,
  cashOutline
} from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Category, CategoryType } from '@shared/index';
import { SettingsStore } from './settings.store';
import { AdminWarningComponent } from '../../../shared/components/admin-warning/admin-warning.component';
import { CategoryListItemComponent } from '../../../shared/components/category-list-item/category-list-item.component';

/**
 * Validador cruzado para comprobar que la contraseña nueva y su confirmación coincidan.
 */
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  if (!newPassword || !confirmPassword) {
    return null;
  }

  return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons,
    IonMenuButton,
    IonAvatar,
    IonProgressBar,
    IonToggle,
    IonSegment,
    IonSegmentButton,
    IonModal,
    IonAlert,
    AdminWarningComponent,
    CategoryListItemComponent
  ],
  providers: [SettingsStore],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsPage implements OnInit {
  public store = inject(SettingsStore);
  public currentUser = this.authService.currentUser;
  
  // Categorías y segmentación centralizada en el Store local
  public activeSegment = this.store.activeSegment;
  public CategoryType = CategoryType;
  public expenseCategories = this.store.expenseCategories;
  public incomeCategories = this.store.incomeCategories;
  public isCategoryModalOpen = this.store.isCategoryModalOpen;
  public isCategoryEdit = this.store.isCategoryEdit;

  public isAdmin = computed(() => this.currentUser()?.role === 'admin');

  public categoryForm!: FormGroup;

  // Custom available icons for categories selection
  public availableIcons = [
    'fast-food-outline',
    'flash-outline',
    'car-outline',
    'camera-outline',
    'help-circle-outline',
    'list-outline',
    'wallet-outline',
    'card-outline',
    'cash-outline'
  ];

  // Password Visibility toggles
  public showCurrentPassword = signal(false);
  public showNewPassword = signal(false);
  public showConfirmPassword = signal(false);

  // Reactivo Forms
  public passwordForm!: FormGroup;
  public emailForm!: FormGroup;
  public deleteAccountForm!: FormGroup;

  // Loading States
  public isPasswordLoading = signal(false);
  public isEmailLoading = signal(false);
  public isPreferencesLoading = signal(false);
  public isAvatarLoading = signal(false);

  // Password Strength Reactive signals
  public newPasswordValue = signal('');

  public passwordStrengthInfo = computed(() => {
    const val = this.newPasswordValue();
    if (!val) return { score: 0, label: 'Sin ingresar', color: 'medium' };
    
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[a-z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[@$!%*?&]/.test(val)) score++;

    let label = 'Muy Débil';
    let color = 'danger';
    if (score >= 5) {
      label = 'Fuerte';
      color = 'success';
    } else if (score >= 3) {
      label = 'Medio';
      color = 'warning';
    } else if (score >= 1) {
      label = 'Débil';
      color = 'danger';
    }
    return { score: score / 5, label, color };
  });

  // Preference signals for selects
  public selectedDateFormat = signal('DD/MM/YYYY');

  // Theme support
  public isDarkTheme = this.themeService.isDark;

  public toggleTheme(event: any): void {
    const isDark = event.detail.checked;
    this.themeService.toggleTheme(isDark);
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly toastController: ToastController,
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly alertController: AlertController,
    private readonly themeService: ThemeService
  ) {
    addIcons({
      lockClosedOutline,
      mailOutline,
      settingsOutline,
      saveOutline,
      refreshOutline,
      cameraOutline,
      imageOutline,
      alertCircleOutline,
      eyeOutline,
      eyeOffOutline,
      addOutline,
      pencilOutline,
      trashOutline,
      closeOutline,
      listOutline,
      walletOutline,
      cardOutline,
      cashOutline
    });

    // Auto-update local preference signals when current user state loads or changes
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.selectedDateFormat.set(user.dateFormat || 'DD/MM/YYYY');
        if (this.emailForm) {
          this.emailForm.patchValue({ email: user.email });
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.initForms();
    this.loadCategories();
  }

  private initForms(): void {
    const user = this.currentUser();

    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      icon: ['list-outline'],
      type: [CategoryType.EXPENSE, Validators.required]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [
        Validators.required, 
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });

    // Track input updates for live strength meter rendering
    this.passwordForm.get('newPassword')?.valueChanges.subscribe((val) => {
      this.newPasswordValue.set(val || '');
    });

    this.emailForm = this.fb.group({
      email: [user?.email || '', [Validators.required, Validators.email]]
    });

    this.deleteAccountForm = this.fb.group({
      password: ['', [Validators.required]]
    });
  }

  public async onPasswordSubmit(): Promise<void> {
    if (this.passwordForm.invalid) {
      return;
    }

    this.isPasswordLoading.set(true);
    const { currentPassword, newPassword } = this.passwordForm.value;

    try {
      await this.authService.updatePassword(currentPassword, newPassword);
      this.showToast('Contraseña actualizada con éxito', 'success');
      this.passwordForm.reset();
    } catch (err: any) {
      const msg = err?.error?.message || 'Error al actualizar contraseña. Verifica tu contraseña actual.';
      this.showToast(msg, 'danger');
    } finally {
      this.isPasswordLoading.set(false);
    }
  }

  public async onEmailSubmit(): Promise<void> {
    if (this.emailForm.invalid) {
      return;
    }

    this.isEmailLoading.set(true);
    const { email } = this.emailForm.value;

    try {
      await this.authService.updateEmail(email);
      this.showToast('Correo electrónico actualizado con éxito', 'success');
    } catch (err: any) {
      const msg = err?.error?.message || 'Error al actualizar el correo electrónico.';
      this.showToast(msg, 'danger');
    } finally {
      this.isEmailLoading.set(false);
    }
  }

  public async onPreferencesSubmit(): Promise<void> {
    this.isPreferencesLoading.set(true);
    const dateFormat = this.selectedDateFormat();

    try {
      await this.authService.updatePreferences('COP', dateFormat);
      this.showToast('Preferencias guardadas con éxito', 'success');
    } catch (err: any) {
      const msg = err?.error?.message || 'Error al guardar preferencias.';
      this.showToast(msg, 'danger');
    } finally {
      this.isPreferencesLoading.set(false);
    }
  }

  public onDateFormatChange(event: any): void {
    this.selectedDateFormat.set(event.detail.value);
  }

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      cssClass: 'premium-toast'
    });
    await toast.present();
  }

  public async onFileSelected(event: any): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.showToast('Por favor, selecciona un archivo de imagen válido.', 'danger');
      return;
    }

    // Limit to 1MB
    if (file.size > 1024 * 1024) {
      this.showToast('La imagen no debe superar 1MB.', 'danger');
      return;
    }

    this.isAvatarLoading.set(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result as string;
      try {
        await this.authService.updateAvatar(base64Str);
        this.showToast('Foto de perfil actualizada con éxito', 'success');
      } catch (err) {
        console.error('Error al subir foto de perfil:', err);
        this.showToast('No se pudo actualizar la foto de perfil.', 'danger');
      } finally {
        this.isAvatarLoading.set(false);
      }
    };
    reader.readAsDataURL(file);
  }

  public async submitAccountDelete(): Promise<void> {
    if (this.deleteAccountForm.invalid) {
      return;
    }

    const password = this.deleteAccountForm.value.password;

    const confirmAlert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: '¿Está completamente seguro de que desea inactivar su cuenta? Esta acción no se puede deshacer de forma directa y perderá el acceso de forma inmediata.',
      cssClass: 'premium-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar Inactivar',
          handler: () => {
            this.http.post(`${this.authService.apiUrlUsers}/delete-account`, { password }).subscribe({
              next: () => {
                this.authService.logout();
                this.router.navigate(['/login']);
              },
              error: (err: any) => {
                console.error('Deactivation failed:', err);
                const msg = err?.error?.message || 'La contraseña provista es incorrecta.';
                this.showToast(msg, 'danger');
              }
            });
          }
        }
      ]
    });

    await confirmAlert.present();
  }

  // --- Category Actions ---
  public onSegmentChange(event: any): void {
    this.store.setActiveSegment(event.detail.value);
  }

  public loadCategories(): void {
    this.store.loadCategories();
  }

  public openAddCategory(defaultType = CategoryType.EXPENSE): void {
    this.store.openAddCategory();
    this.categoryForm.reset({ name: '', icon: 'list-outline', type: defaultType });
  }

  public openEditCategory(cat: Category): void {
    this.store.openEditCategory(cat.id);
    this.categoryForm.setValue({
      name: cat.name,
      icon: cat.icon || 'list-outline',
      type: cat.type || CategoryType.EXPENSE
    });
  }

  public closeCategoryModal(): void {
    this.store.closeCategoryModal();
  }

  public saveCategory(): void {
    if (this.categoryForm.invalid) return;

    const val = this.categoryForm.value;
    if (this.store.isCategoryEdit()) {
      this.http.put(`/api/categories/${this.store.currentEditingCategoryId()}`, val).subscribe({
        next: () => {
          this.showToast('Categoría actualizada con éxito.', 'success');
          this.store.loadCategories();
          this.store.closeCategoryModal();
        },
        error: (err) => {
          console.error('Failed to update category:', err);
          const msg = err?.error?.message || 'No se pudo actualizar la categoría.';
          this.showToast(msg, 'danger');
        }
      });
    } else {
      this.http.post('/api/categories', val).subscribe({
        next: () => {
          this.showToast('Categoría creada con éxito.', 'success');
          this.store.loadCategories();
          this.store.closeCategoryModal();
        },
        error: (err) => {
          console.error('Failed to create category:', err);
          const msg = err?.error?.message || 'No se pudo crear la categoría.';
          this.showToast(msg, 'danger');
        }
      });
    }
  }

  public async deleteCategory(cat: Category): Promise<void> {
    const confirmAlert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de que deseas eliminar la categoría "${cat.name}"? Esta acción no se puede deshacer.`,
      cssClass: 'premium-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.http.delete(`/api/categories/${cat.id}`).subscribe({
              next: () => {
                this.showToast('Categoría eliminada con éxito.', 'success');
                this.loadCategories();
              },
              error: (err) => {
                console.error('Failed to delete category:', err);
                const msg = err?.error?.message || 'No se puede eliminar la categoría porque está en uso.';
                this.showToast(msg, 'danger');
              }
            });
          }
        }
      ]
    });
    await confirmAlert.present();
  }
}
