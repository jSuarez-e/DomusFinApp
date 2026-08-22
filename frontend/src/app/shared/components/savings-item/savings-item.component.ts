import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavingsGoal } from '@shared/index';
import { SavingsProgressComponent } from '../savings-progress/savings-progress.component';

@Component({
  selector: 'app-savings-item',
  standalone: true,
  imports: [CommonModule, SavingsProgressComponent],
  template: `
    <div class="savings-item">
      <div class="savings-item__header">
        <span class="savings-item__title">{{ goal().title }}</span>
        <span class="savings-item__value u-text-success">
          {{ Number(goal().currentAmount) | currency:'COP':'symbol-narrow':'1.0-0' }} / 
          {{ Number(goal().targetAmount) | currency:'COP':'symbol-narrow':'1.0-0' }}
        </span>
      </div>
      <div class="savings-item__progress-container">
        <app-savings-progress [goal]="goal()"></app-savings-progress>
      </div>
    </div>
  `,
  styles: [`
    .savings-item {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .savings-item__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .savings-item__title {
      flex: 1;
      line-height: 1.3;
      margin-bottom: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--ion-text-color, #1e293b);
    }
    .savings-item__value {
      flex-shrink: 0;
      text-align: right;
      font-size: 1rem;
      font-weight: 700;
    }
    .savings-item__progress-container {
      margin-bottom: 8px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
/**
 * Componente presentacional para visualizar un ítem de meta de ahorro,
 * incluyendo su título, monto actual y barra de progreso.
 */
export class SavingsItemComponent {
  public goal = input.required<SavingsGoal>();
  public readonly Number = Number;
}
