// frontend/src/app/presentation/directives/block-scientific-notation.directive.ts
import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: 'input[type="number"], ion-input[type="number"]',
  standalone: true,
})
export class BlockScientificNotationDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }
}
