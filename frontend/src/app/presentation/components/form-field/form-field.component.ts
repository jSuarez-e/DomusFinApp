import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'dma-form-field',
  standalone: true,
  imports: [
    IonicModule
  ],
  styleUrl: './form-field.component.css',
  template: `
    <div class="input-wrapper">
      <label class="input-label">{{ label }}</label>
      <div class="input-field" [class.input-field--textarea]="isTextarea">
        <ion-icon [name]="icon" class="field-icon"></ion-icon>
        <!-- Aquí Angular inyectará el input o select que le pasemos -->
        <ng-content></ng-content>
      </div>
      @if (showError) {
        <div class="error-text">{{ errorMessage }}</div>
      }
    </div>
  `
  // Los estilos (.input-wrapper, .field-icon, etc.) irían en form-field.component.css
})
export class FormFieldComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) icon!: string;
  @Input() isTextarea = false;
  @Input() showError: boolean | null | undefined = false;
  @Input() errorMessage = '';
}