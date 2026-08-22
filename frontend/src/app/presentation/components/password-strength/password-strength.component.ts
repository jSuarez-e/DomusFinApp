// frontend/src/app/presentation/components/password-strength/password-strength.component.ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonText } from '@ionic/angular';

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule, IonText],
  template: `
    <div class="strength-checker">
      <div class="strength-bars">
        @for (bar of [0, 1, 2, 3]; track bar) {
          <div 
            class="strength-bar" 
            [ngClass]="{
              'strength-bar--active': bar < strengthScore(),
              'strength-bar--danger': strengthScore() <= 1 && bar < strengthScore(),
              'strength-bar--warning': strengthScore() === 2 && bar < strengthScore(),
              'strength-bar--success': strengthScore() >= 3 && bar < strengthScore()
            }">
          </div>
        }
      </div>
      <div class="strength-label">
        <ion-text [color]="strengthColor()">
          <span>Fortaleza: {{ strengthText() }}</span>
        </ion-text>
      </div>
    </div>
  `,
  styles: [`
    .strength-checker {
      margin-top: 8px;
      width: 100%;
    }
    .strength-bars {
      display: flex;
      gap: 6px;
      height: 6px;
      margin-bottom: 6px;
    }
    .strength-bar {
      flex: 1;
      background: rgba(255, 255, 255, 0.12);
      border-radius: 4px;
      transition: background 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    .strength-bar--danger {
      background: var(--ion-color-danger, #eb445a);
      box-shadow: 0 0 8px rgba(235, 68, 90, 0.4);
    }
    .strength-bar--warning {
      background: var(--ion-color-warning, #ffc409);
      box-shadow: 0 0 8px rgba(255, 196, 9, 0.4);
    }
    .strength-bar--success {
      background: var(--ion-color-primary, #88DCCC);
      box-shadow: 0 0 8px rgba(136, 220, 204, 0.4);
    }
    .strength-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordStrengthComponent {
  // Input signal reading password state in real-time
  password = input.required<string>();

  // Derived reactive strength score calculation
  strengthScore = computed(() => {
    const pass = this.password();
    if (!pass) return 0;

    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    return score;
  });

  // Color label selector
  strengthColor = computed(() => {
    const score = this.strengthScore();
    if (score <= 1) return 'danger';
    if (score === 2) return 'warning';
    return 'primary';
  });

  // Strength message selector
  strengthText = computed(() => {
    const score = this.strengthScore();
    if (!this.password()) return 'Ingrese Contraseña';
    if (score <= 1) return 'Débil';
    if (score === 2) return 'Media';
    if (score === 3) return 'Fuerte';
    return 'Muy Fuerte';
  });
}
