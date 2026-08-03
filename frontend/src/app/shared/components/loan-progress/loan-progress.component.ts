import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Loan } from '@shared/index';

/**
 * Componente presentacional para la barra de progreso de pago del préstamo.
 */
@Component({
  selector: 'app-loan-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loan-progress">
      <div class="loan-progress__bar">
        <div class="loan-progress__fill" [style.width.%]="paidPercentage()"></div>
      </div>
      <div class="loan-progress__text">
        <span>Inicial: {{ Number(loan().initialPrincipal) | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
        <span>Pagado: {{ paidPercentage() | number:'1.0-1' }}%</span>
      </div>
    </div>
  `,
  styleUrls: ['./loan-progress.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoanProgressComponent {
  public loan = input.required<Loan>();

  /** 
   * Calcula el porcentaje pagado localmente
   * @returns Porcentaje de 0 a 100
   */
  public paidPercentage(): number {
    const l = this.loan();
    const initial = Number(l.initialPrincipal);
    const current = Number(l.currentBalance);
    if (initial <= 0) return 0;
    const paid = initial - current;
    return (paid / initial) * 100;
  }

  // Permite usar Number en el template
  protected readonly Number = Number;
}
