import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente presentacional para advertencias de administrador.
 */
@Component({
  selector: 'app-admin-warning',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-warning">
      ℹ️ Solo los administradores del hogar pueden crear, editar o eliminar categorías.
    </div>
  `,
  styles: [`
    .admin-warning {
      background: rgba(136, 220, 204, 0.05);
      border: 1px solid rgba(136, 220, 204, 0.15);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #88DCCC;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminWarningComponent {}
