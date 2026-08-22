import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SavingsGoal } from "@shared/index";

/**
 * Componente presentacional para renderizar la barra de progreso de una meta de ahorro.
 */
@Component({
  selector: "app-savings-progress",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="savings-progress">
      <div class="savings-progress__bar">
        <div
          class="savings-progress__fill"
          [style.width.%]="progressPercentage()"
        ></div>
      </div>
      <div class="savings-progress__text">
        <span>Progreso: {{ progressPercentage() | number : "1.0-1" }}%</span>

        @if (!goal().isPrivate && goal().participants &&
        goal().participants?.length! > 0) {
        <div class="savings-progress__participants">
          <span class="savings-progress__participants-label">Compartido:</span>
          @for (p of goal().participants; track p) {
          <span class="savings-progress__badge">👤 {{ p.name }}</span>
          }
        </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./savings-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavingsProgressComponent {
  /** Meta de ahorro a mostrar. */
  public goal = input.required<SavingsGoal>();

  /**
   * Calcula el porcentaje de avance de la meta.
   * @returns {number} Porcentaje de avance entre 0 y 100
   */
  public progressPercentage(): number {
    const g = this.goal();
    const target = Number(g.targetAmount);
    const current = Number(g.currentAmount);
    if (target <= 0) return 0;
    return Math.min(100, (current / target) * 100);
  }
}
