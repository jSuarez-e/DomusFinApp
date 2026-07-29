// frontend/src/app/presentation/directives/money-mask.directive.ts
import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Directive({
  selector: '[appMoneyMask]',
  standalone: true,
})
export class MoneyMaskDirective implements OnInit {
  private currencySymbol = '$';

  constructor(
    private el: ElementRef,
    private control: NgControl,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const pref = this.authService.currentUser()?.currency;
    if (pref === 'EUR') this.currencySymbol = '€';
    else if (pref === 'GBP') this.currencySymbol = '£';
    else this.currencySymbol = '$';

    // Format initial value if already present
    if (this.control.value !== null && this.control.value !== undefined && this.control.value !== '') {
      this.formatValue(this.control.value.toString());
    }

    // Subscribe to future programmatic changes (e.g., API loading or resets)
    this.control.control?.valueChanges.subscribe((val) => {
      if (val !== null && val !== undefined && val !== '') {
        const clean = val.toString().replace(/\D/g, '');
        const displayClean = this.el.nativeElement.value.replace(/\D/g, '');
        if (clean !== displayClean) {
          this.formatValue(val.toString());
        }
      }
    });
  }

  @HostListener('input', ['$event.target.value'])
  onInput(value: string) {
    this.formatValue(value);
  }

  @HostListener('ionInput', ['$event.target.value'])
  onIonInput(value: string) {
    this.formatValue(value);
  }

  private formatValue(value: string) {
    if (value === null || value === undefined || value === '') {
      this.control.control?.setValue(null, { emitEvent: false });
      return;
    }

    const clean = value.toString().replace(/\D/g, '');
    if (!clean) {
      this.control.control?.setValue(null, { emitEvent: false });
      this.el.nativeElement.value = '';
      const input = this.el.nativeElement.querySelector('input');
      if (input) input.value = '';
      return;
    }

    const num = parseInt(clean, 10);
    const formatted = num.toLocaleString('es-CO');
    const displayValue = `${this.currencySymbol} ${formatted}`;

    this.el.nativeElement.value = displayValue;
    const input = this.el.nativeElement.querySelector('input');
    if (input) {
      input.value = displayValue;
    }

    this.control.control?.setValue(num, { emitEvent: false });
  }
}
