// frontend/src/app/presentation/directives/money-mask.directive.ts
import { Directive, ElementRef, HostListener, OnInit, OnDestroy, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

/**
 * @description
 * Directiva para enmascarar inputs de moneda.
 * Soporta inputs nativos y componentes de Ionic (ion-input).
 * Mantiene el valor numérico en el FormControl para las validaciones backend, 
 * pero muestra el formato de moneda en la vista para el usuario.
 */
@Directive({
  selector: '[appMoneyMask]',
  standalone: true,
})
export class MoneyMaskDirective implements OnInit, OnDestroy {
  private currencySymbol = '$';
  private valueChangesSub?: Subscription;

  constructor(
    private el: ElementRef<HTMLInputElement | any>,
    @Optional() @Self() private control: NgControl,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.setCurrencySymbol();
    this.formatInitialValue();
    this.listenToProgrammaticChanges();
  }

  ngOnDestroy(): void {
    if (this.valueChangesSub) {
      this.valueChangesSub.unsubscribe();
    }
  }

  /**
   * @description Escucha los cambios en inputs nativos.
   * @param event Evento del DOM generado por un input estándar.
   */
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    if (this.isIonicElement()) return; // Previene doble ejecución en Ionic
    const target = event.target as HTMLInputElement;
    this.applyMask(target.value);
  }

  /**
   * @description Escucha los cambios en componentes ion-input de Ionic.
   * @param event Evento CustomEvent emitido por Ionic.
   */
  @HostListener('ionInput', ['$event'])
  onIonInput(event: any): void {
    this.applyMask(event.target.value?.toString() || '');
  }

  /**
   * @description Configura el símbolo de la moneda basado en la preferencia del usuario.
   */
  private setCurrencySymbol(): void {
    const pref = this.authService.currentUser()?.currency;
    this.currencySymbol = pref === 'EUR' ? '€' : pref === 'GBP' ? '£' : '$';
  }

  /**
   * @description Aplica el formato si el formulario se carga con datos previos.
   */
  private formatInitialValue(): void {
    if (this.control?.value) {
      setTimeout(() => this.applyMask(this.control.value.toString()), 0);
    }
  }

  /**
   * @description Observa cambios inyectados por código para mantener la máscara sincronizada.
   */
  private listenToProgrammaticChanges(): void {
    if (!this.control?.control) return;

    this.valueChangesSub = this.control.control.valueChanges.subscribe((val) => {
      if (val !== null && val !== undefined) {
        const stringValue = val.toString();

        if (!stringValue.includes(this.currencySymbol)) {
          this.applyMask(stringValue);
        }
      }
    });
  }

  /**
   * @description Limpia el string, actualiza el FormControl con un Number y fuerza a la vista a mostrar el String formateado.
   * @param value El valor tecleado por el usuario o inyectado por el sistema.
   */
  private applyMask(value: string): void {
    if (!this.control?.control) return;

    const clean = value.replace(/\D/g, '');
    
    if (!clean) {
      this.control.control.setValue(null, { emitEvent: false });
      this.control.valueAccessor?.writeValue('');
      return;
    }

    const num = parseInt(clean, 10);
    const formatted = `${this.currencySymbol} ${num.toLocaleString('es-CO')}`;

    this.control.control.setValue(num, { emitEvent: false });

    if (this.control.valueAccessor) {
      this.control.valueAccessor.writeValue(formatted);
    }
  }

  /**
   * @description Determina si el elemento host es un componente de Ionic.
   * @returns {boolean} true si es un ion-input.
   */
  private isIonicElement(): boolean {
    return this.el.nativeElement.tagName.toLowerCase() === 'ion-input';
  }
}