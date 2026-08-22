import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from "@angular/core";

import { HttpClient } from "@angular/common/http";
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { RouterModule, Router } from "@angular/router";
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonAlert,
  IonModal,
  AlertController,
  IonSelect,
  IonSelectOption,
  ToastController,
  IonSearchbar,
} from "@ionic/angular";
import { addIcons } from "ionicons";
import {
  trashOutline,
  addOutline,
  pencilOutline,
  walletOutline,
  listOutline,
  cardOutline,
  cashOutline,
  settingsOutline,
  closeOutline,
  lockClosedOutline,
  alertCircleOutline,
  arrowBackOutline,
  personOutline,
  swapHorizontalOutline,
  copyOutline,
  shareSocialOutline,
  mailOutline,
  fastFoodOutline,
  flashOutline,
  carOutline,
  cameraOutline,
  helpCircleOutline,
  paperPlaneOutline,
  saveOutline,
} from "ionicons/icons";

import { HouseholdService } from "../../../core/services/household.service";
import { AuthService } from "../../../core/services/auth.service";
import { Category, PaymentMethod, CategoryType } from "@shared/index";
import { environment } from "src/environments/environment"; // Import environment config for API URL
import { MoneyMaskDirective } from "../../directives/money-mask.directive";
import { AdminStore } from "./admin.store";
import { CategoryListItemComponent } from "../../../shared/components/category-list-item/category-list-item.component";
import { PaymentItemComponent } from "../../../shared/components/payment-item/payment-item.component";
import { MemberItemComponent } from "../../../shared/components/member-item/member-item.component";

@Component({
  selector: "app-admin",
  templateUrl: "./admin.page.html",
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSegment,
    IonSegmentButton,
    IonAlert,
    IonModal,
    IonSelect,
    IonSelectOption,
    MoneyMaskDirective,
    IonSearchbar,
    CategoryListItemComponent,
    PaymentItemComponent,
    MemberItemComponent,
  ],
  providers: [AdminStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * @class AdminPage
 * @description Componente de vista para la administración del sistema. Gestiona categorías, métodos de pago, el presupuesto del hogar y los miembros.
 */
export class AdminPage implements OnInit {
  public store = inject(AdminStore);

  public household = this.householdService.household;
  public currentUser = this.authService.currentUser;

  // Enum reference for template
  public CategoryType = CategoryType;

  // Reactivo Forms
  public categoryForm!: FormGroup;
  public paymentForm!: FormGroup;
  public budgetForm!: FormGroup;
  public suspendMemberForm!: FormGroup;
  public inviteForm!: FormGroup;

  // Editing state trackers
  public currentEditingCategoryId: number | null = null;
  public currentEditingPaymentId: number | null = null;

  // Custom available icons for categories selection
  public availableIcons = [
    "fast-food-outline",
    "flash-outline",
    "car-outline",
    "camera-outline",
    "help-circle-outline",
    "list-outline",
    "wallet-outline",
    "card-outline",
    "cash-outline",
  ];

  constructor(
    private readonly http: HttpClient,
    private readonly fb: FormBuilder,
    private readonly householdService: HouseholdService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly alertController: AlertController,
    private readonly toastController: ToastController
  ) {
    addIcons({
      trashOutline,
      addOutline,
      pencilOutline,
      walletOutline,
      listOutline,
      cardOutline,
      cashOutline,
      settingsOutline,
      closeOutline,
      lockClosedOutline,
      alertCircleOutline,
      arrowBackOutline,
      personOutline,
      swapHorizontalOutline,
      copyOutline,
      shareSocialOutline,
      mailOutline,
      fastFoodOutline,
      flashOutline,
      carOutline,
      cameraOutline,
      helpCircleOutline,
      paperPlaneOutline,
      saveOutline,
    });
  }

  ngOnInit() {
    if (this.currentUser()?.role !== "admin") {
      this.router.navigate(["/dashboard/inicio"]);
      return;
    }
    this.initForms();
    this.loadCategories();
    this.loadPaymentMethods();
    this.loadHouseholdInfo();
    this.loadMembers();
  }

  private initForms() {
    this.categoryForm = this.fb.group({
      name: ["", [Validators.required, Validators.maxLength(50)]],
      icon: ["list-outline"],
      type: [CategoryType.EXPENSE, Validators.required],
    });

    this.paymentForm = this.fb.group({
      name: ["", [Validators.required, Validators.maxLength(50)]],
    });

    this.budgetForm = this.fb.group({
      monthlyBudget: [1000.0, [Validators.required, Validators.min(1)]],
    });

    this.suspendMemberForm = this.fb.group({
      memberId: ["", [Validators.required]],
    });

    this.inviteForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
    });
  }

  // --- Data Loading API ---
  public loadCategories(): void {
    this.store.loadCategories();
  }

  public loadPaymentMethods(): void {
    this.store.loadPaymentMethods();
  }

  public loadHouseholdInfo() {
    const user = this.currentUser();
    if (user && user.householdId) {
      this.householdService.loadHousehold(user.householdId, true).then(() => {
        const hh = this.household();
        if (hh && hh.monthlyBudget) {
          this.budgetForm.patchValue({ monthlyBudget: hh.monthlyBudget });
        }
      });
    }
  }

  public onTabChange(event: any): void {
    this.store.setActiveTab(event.detail.value);
  }

  public onSearch(event: any): void {
    this.store.setSearchTerm(event.detail.value ?? "");
  }

  // --- Category Actions ---
  public openAddCategory(defaultType = CategoryType.EXPENSE): void {
    this.store.setCategoryEdit(false);
    this.categoryForm.reset({
      name: "",
      icon: "list-outline",
      type: defaultType,
    });
    this.store.setCategoryModalOpen(true);
  }

  public openEditCategory(cat: Category): void {
    this.store.setCategoryEdit(true);
    this.currentEditingCategoryId = cat.id;
    this.categoryForm.setValue({
      name: cat.name,
      icon: cat.icon || "list-outline",
      type: cat.type || CategoryType.EXPENSE,
    });
    this.store.setCategoryModalOpen(true);
  }

  public closeCategoryModal(): void {
    this.store.setCategoryModalOpen(false);
  }

  /**
   * Guarda o actualiza una categoría en el sistema.
   * Dependiendo de `isCategoryEdit` en el store, realizará una petición POST o PUT.
   * @returns {void}
   */
  public saveCategory(): void {
    if (this.categoryForm.invalid) return;

    const val = this.categoryForm.value;
    if (this.store.isCategoryEdit()) {
      // Update to use environment.apiUrl for category updates
      this.http
        .put(
          `${environment.apiUrl}/categories/${this.currentEditingCategoryId}`,
          val
        )
        .subscribe({
          next: () => {
            this.triggerAlert("Éxito", "Categoría actualizada con éxito.");
            this.loadCategories();
            this.closeCategoryModal();
          },
          error: (err) => {
            console.error("Failed to update category:", err);
            const msg =
              err?.error?.message || "No se pudo actualizar la categoría.";
            this.triggerAlert("Error", msg);
          },
        });
    } else {
      // Update to use environment.apiUrl for category creation
      this.http.post(`${environment.apiUrl}/categories`, val).subscribe({
        next: () => {
          this.triggerAlert("Éxito", "Categoría creada con éxito.");
          this.loadCategories();
          this.closeCategoryModal();
        },
        error: (err) => {
          console.error("Failed to create category:", err);
          const msg = err?.error?.message || "No se pudo crear la categoría.";
          this.triggerAlert("Error", msg);
        },
      });
    }
  }

  public async deleteCategory(cat: Category) {
    const confirmAlert = await this.alertController.create({
      header: "Confirmar Eliminación",
      message: `¿Estás seguro de que deseas eliminar la categoría "${cat.name}"? Esta acción no se puede deshacer.`,
      cssClass: "premium-alert",
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Eliminar",
          role: "destructive",
          handler: () => {
            // Update to use environment.apiUrl for category deletion
            this.http
              .delete(`${environment.apiUrl}/categories/${cat.id}`)
              .subscribe({
                next: () => {
                  this.triggerAlert("Éxito", "Categoría eliminada con éxito.");
                  this.loadCategories();
                },
                error: (err) => {
                  console.error("Failed to delete category:", err);
                  const msg =
                    err?.error?.message || "No se pudo eliminar la categoría.";
                  this.triggerAlert("Error", msg);
                },
              });
          },
        },
      ],
    });
    await confirmAlert.present();
  }

  // --- Payment Method Actions ---
  public openAddPayment(): void {
    this.store.setPaymentEdit(false);
    this.paymentForm.reset({ name: "" });
    this.store.setPaymentModalOpen(true);
  }

  public openEditPayment(pm: PaymentMethod): void {
    this.store.setPaymentEdit(true);
    this.currentEditingPaymentId = pm.id;
    this.paymentForm.setValue({ name: pm.name });
    this.store.setPaymentModalOpen(true);
  }

  public closePaymentModal(): void {
    this.store.setPaymentModalOpen(false);
  }

  public savePayment(): void {
    if (this.paymentForm.invalid) return;

    const val = this.paymentForm.value;
    if (this.store.isPaymentEdit()) {
      // Update to use environment.apiUrl for payment method updates
      this.http
        .put(
          `${environment.apiUrl}/payment-methods/${this.currentEditingPaymentId}`,
          val
        )
        .subscribe({
          next: () => {
            this.triggerAlert("Éxito", "Medio de pago actualizado con éxito.");
            this.loadPaymentMethods();
            this.closePaymentModal();
          },
          error: (err) => {
            console.error("Failed to update payment method:", err);
            const msg =
              err?.error?.message || "No se pudo actualizar el medio de pago.";
            this.triggerAlert("Error", msg);
          },
        });
    } else {
      // Update to use environment.apiUrl for payment method creation
      this.http.post(`${environment.apiUrl}/payment-methods`, val).subscribe({
        next: () => {
          this.triggerAlert("Éxito", "Medio de pago creado con éxito.");
          this.loadPaymentMethods();
          this.closePaymentModal();
        },
        error: (err) => {
          console.error("Failed to create payment method:", err);
          const msg =
            err?.error?.message || "No se pudo crear el medio de pago.";
          this.triggerAlert("Error", msg);
        },
      });
    }
  }

  public async deletePayment(pm: PaymentMethod) {
    const confirmAlert = await this.alertController.create({
      header: "Confirmar Eliminación",
      message: `¿Estás seguro de que deseas eliminar el medio de pago "${pm.name}"? Esta acción no se puede deshacer.`,
      cssClass: "premium-alert",
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Eliminar",
          role: "destructive",
          handler: () => {
            // Update to use environment.apiUrl for payment method deletion
            this.http
              .delete(`${environment.apiUrl}/payment-methods/${pm.id}`)
              .subscribe({
                next: () => {
                  this.triggerAlert(
                    "Éxito",
                    "Medio de pago eliminado con éxito."
                  );
                  this.loadPaymentMethods();
                },
                error: (err) => {
                  console.error("Failed to delete payment method:", err);
                  const msg =
                    err?.error?.message ||
                    "No se pudo eliminar el medio de pago.";
                  this.triggerAlert("Error", msg);
                },
              });
          },
        },
      ],
    });
    await confirmAlert.present();
  }

  // --- Budget Goal Actions ---
  public async saveBudgetGoal(): Promise<void> {
    if (this.budgetForm.invalid) return;

    const val = this.budgetForm.value;
    try {
      await this.householdService.updateHouseholdBudget(val.monthlyBudget);
      this.loadHouseholdInfo();
      this.triggerAlert(
        "Éxito",
        "Meta de presupuesto mensual actualizada correctamente."
      );
    } catch (err) {
      console.error("Failed to update household budget goal:", err);
    }
  }

  // --- Member Suspension Actions ---
  public getOtherMembers(): any[] {
    return this.store
      .members()
      .filter((m) => m.id !== this.currentUser()?.id && m.isActive !== false);
  }

  /**
   * Envía la solicitud para suspender a un miembro del hogar, desactivándolo de forma lógica.
   * Presenta un diálogo de confirmación antes de proceder con la petición HTTP DELETE.
   * @returns {Promise<void>} Promesa que se resuelve tras la operación o cancelación.
   */
  public async submitSuspendMember(): Promise<void> {
    if (this.suspendMemberForm.invalid) {
      return;
    }

    const memberId = this.suspendMemberForm.value.memberId;
    const member = this.store.members().find((m) => m.id === memberId);
    if (!member) {
      return;
    }

    const confirmAlert = await this.alertController.create({
      header: "Confirmar Suspensión",
      message: `¿Está seguro de que desea suspender la cuenta del miembro ${member.name}? Perderá el acceso de forma inmediata.`,
      cssClass: "premium-alert",
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
        },
        {
          text: "Suspender",
          handler: () => {
            // Update to use environment.apiUrl for user suspension
            this.http
              .delete(`${environment.apiUrl}/users/${member.id}`)
              .subscribe({
                next: () => {
                  this.triggerAlert(
                    "Éxito",
                    `La cuenta de ${member.name} ha sido suspendida.`
                  );
                  this.loadMembers();
                  this.suspendMemberForm.reset();
                },
                error: (err) => {
                  console.error("Suspension failed:", err);
                  const msg =
                    err?.error?.message || "No se pudo suspender la cuenta.";
                  this.triggerAlert("Error", msg);
                },
              });
          },
        },
      ],
    });

    await confirmAlert.present();
  }

  public getInvitationLink(): string {
    const hhId = this.currentUser()?.householdId;
    return `http://localhost:8100/register?code=HOGAR-${hhId}`;
  }

  public async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      const toast = await this.toastController.create({
        message: "¡Enlace copiado al portapapeles!",
        duration: 2000,
        position: "bottom",
        color: "success",
        cssClass: "premium-toast",
      });
      await toast.present();
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      this.triggerAlert(
        "Error",
        "No se pudo copiar el enlace al portapapeles."
      );
    }
  }

  public async sendInvitation(): Promise<void> {
    if (this.inviteForm.invalid) {
      return;
    }

    const email = this.inviteForm.value.email;
    // Update to use environment.apiUrl for sending household invitations
    this.http.post(`${environment.apiUrl}/users/invite`, { email }).subscribe({
      next: (res: any) => {
        this.triggerAlert(
          "Invitación Enviada (Simulado)",
          `Se envió con éxito el enlace a ${email}.`
        );
        this.inviteForm.reset();
      },
      error: (err) => {
        console.error("Failed to send invitation:", err);
        const msg = err?.error?.message || "No se pudo enviar la invitación.";
        this.triggerAlert("Error", msg);
      },
    });
  }

  // Helper alert
  private async triggerAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ["Ok"],
      cssClass: "premium-alert",
    });
    await alert.present();
  }

  public loadMembers(): void {
    this.store.loadMembers();
  }

  public toggleMemberRole(member: any) {
    const newRole = member.role === "admin" ? "user" : "admin";
    // Update to use environment.apiUrl for updating member role
    this.http
      .patch(`${environment.apiUrl}/users/${member.id}/role`, { role: newRole })
      .subscribe({
        next: () => {
          this.triggerAlert(
            "Éxito",
            `Rol de ${member.name} cambiado a ${newRole}.`
          );
          this.loadMembers();
        },
        error: (err) => {
          console.error("Failed to change member role:", err);
          const msg =
            err?.error?.message || "No se pudo cambiar el rol del miembro.";
          this.triggerAlert("Error", msg);
        },
      });
  }

  public async confirmDeleteMember(member: any) {
    const confirmAlert = await this.alertController.create({
      header: "Confirmar Eliminación",
      message: `¿Estás seguro de que deseas eliminar (desactivar) de forma lógica al miembro ${member.name}? Esta acción no se puede deshacer de forma directa.`,
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
        },
        {
          text: "Eliminar Miembro",
          handler: () => {
            // Update to use environment.apiUrl for logical member deletion
            this.http
              .delete(`${environment.apiUrl}/users/${member.id}`)
              .subscribe({
                next: () => {
                  this.triggerAlert(
                    "Éxito",
                    `Miembro ${member.name} desactivado.`
                  );
                  this.loadMembers();
                },
                error: (err) => {
                  console.error("Failed to deactivate member:", err);
                  const msg =
                    err?.error?.message || "No se pudo desactivar el miembro.";
                  this.triggerAlert("Error", msg);
                },
              });
          },
        },
      ],
      cssClass: "premium-alert",
    });

    await confirmAlert.present();
  }
}
