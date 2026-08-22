// frontend/src/app/presentation/pages/register/register.page.ts
import { ChangeDetectionStrategy, Component, inject } from "@angular/core";

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonInput,
  IonItem,
  IonText,
  IonIcon,
  IonLabel,
  IonToggle,
  AlertController,
} from "@ionic/angular";
import { addIcons } from "ionicons";
import {
  personOutline,
  mailOutline,
  lockClosedOutline,
  keyOutline,
  arrowBackOutline,
  eyeOutline,
  eyeOffOutline,
} from "ionicons/icons";
import { AuthService } from "../../../core/services/auth.service";
import { PasswordStrengthComponent } from "../../components/password-strength/password-strength.component";
import { AuthHeaderComponent } from "../../../shared/components/auth-header/auth-header.component";
import { PasswordInputComponent } from "../../../shared/components/password-input/password-input.component";
import { RegisterStore } from "./register.store";
import { RegisterDto } from "@shared/index";

@Component({
  selector: "app-register",
  templateUrl: "./register.page.html",
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonInput,
    IonItem,
    IonText,
    IonIcon,
    IonLabel,
    IonToggle,
    PasswordStrengthComponent,
    AuthHeaderComponent,
    PasswordInputComponent,
  ],
  providers: [RegisterStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  public registerForm: FormGroup;
  public store = inject(RegisterStore);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private route: ActivatedRoute
  ) {
    addIcons({
      personOutline,
      mailOutline,
      lockClosedOutline,
      keyOutline,
      arrowBackOutline,
      eyeOutline,
      eyeOffOutline,
    });

    this.registerForm = this.fb.group({
      username: [
        "",
        [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(/^[a-zA-Z0-9._\-]+$/),
        ],
      ],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      isInvited: [false],
      invitationCode: [""],
    });

    // Listen to changes on isInvited to dynamically update validation requirements
    this.registerForm.get("isInvited")?.valueChanges.subscribe((isInvited) => {
      const codeControl = this.registerForm.get("invitationCode");
      if (isInvited) {
        codeControl?.setValidators([Validators.required]);
      } else {
        codeControl?.clearValidators();
        codeControl?.setValue("");
      }
      codeControl?.updateValueAndValidity();
    });

    // Auto-fill invitation code from URL query parameters (magic link)
    this.route.queryParams.subscribe((params) => {
      const code = params["code"];
      if (code) {
        this.registerForm.patchValue({
          isInvited: true,
          invitationCode: code,
        });
      }
    });
  }

  /**
   * Procesa la creación de la cuenta delegando al Store local.
   * @returns {Promise<void>} Resolutor vacío
   */
  async handleRegister(): Promise<void> {
    if (this.registerForm.invalid) {
      return;
    }

    const { username, email, password, isInvited, invitationCode } =
      this.registerForm.value;

    const payload: RegisterDto = {
      username,
      email,
      password,
      invitationCode: isInvited
        ? invitationCode.trim().toUpperCase()
        : undefined,
    };

    await this.store.register(payload);
  }
}
