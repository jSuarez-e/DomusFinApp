// frontend/src/app/app.component.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';

import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  imports: [IonApp, IonRouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class AppComponent {
  constructor(
    private readonly themeService: ThemeService,
    private readonly platform: Platform
  ) {
    // Bloquear el botón de atrás nativo de los celulares
    this.platform.backButton.subscribeWithPriority(9999, () => {
      console.log('Botón atrás nativo bloqueado');
    });
  }
}
