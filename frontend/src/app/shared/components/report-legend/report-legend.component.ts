import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente presentacional para renderizar un elemento de la leyenda del reporte.
 */
@Component({
  selector: 'app-report-legend',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="legend-item">
      <span class="legend-color-dot" [style.background-color]="color()"></span>
      <span class="legend-label">{{ categoryName() }}</span>
      <span class="legend-percentage">{{ percentage() }}%</span>
      <span class="legend-value">{{ amount() | currency:'COP':'symbol-narrow':'1.0-0' }}</span>
    </div>
  `,
  styleUrls: ['./report-legend.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportLegendComponent {
  /** Nombre de la categoría */
  public categoryName = input.required<string>();
  
  /** Porcentaje de distribución */
  public percentage = input.required<number>();
  
  /** Monto total consolidado de la categoría */
  public amount = input.required<number>();
  
  /** Color hexadecimal de la categoría */
  public color = input.required<string>();
}
