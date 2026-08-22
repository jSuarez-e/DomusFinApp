// frontend/src/app/shared/components/cdt-item/cdt-item.component.ts
import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonLabel, IonIcon, IonBadge, IonButton } from '@ionic/angular';
import { Cdt } from '@shared/models/cdts/cdt.interface';
import { addIcons } from 'ionicons';
import { documentTextOutline, alertCircleOutline, lockClosedOutline, globeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-cdt-item',
  standalone: true,
  templateUrl: './cdt-item.component.html',
  styleUrls: ['./cdt-item.component.scss'],
  imports: [CommonModule, IonItem, IonLabel, IonIcon, IonBadge, IonButton],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CdtItemComponent {
  cdt = input.required<Cdt>();
  onViewDetails = output<Cdt>();

  constructor() {
    addIcons({ documentTextOutline, alertCircleOutline, lockClosedOutline, globeOutline });
  }

  daysToMaturity = computed(() => {
    const cdt = this.cdt();
    const createdDate = new Date(cdt.createdAt);
    // Add termDays
    const maturityDate = new Date(createdDate.getTime() + cdt.termDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffTime = Math.max(0, maturityDate.getTime() - now.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  isExpiringSoon = computed(() => {
    return this.daysToMaturity() <= 10;
  });

  maturityDate = computed(() => {
    const cdt = this.cdt();
    const createdDate = new Date(cdt.createdAt);
    return new Date(createdDate.getTime() + cdt.termDays * 24 * 60 * 60 * 1000);
  });
}
