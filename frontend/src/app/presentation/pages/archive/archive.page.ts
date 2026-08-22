// frontend/src/app/presentation/pages/archive/archive.page.ts
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonIcon, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonButtons, 
  IonMenuButton, 
  IonSegment, 
  IonSegmentButton,
  IonBadge,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  archiveOutline, 
  trendingUpOutline, 
  calculatorOutline, 
  cardOutline,
  lockClosedOutline,
  peopleOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';
import { SavingsGoal, Loan } from '@shared/index';
import { ArchiveStore } from './archive.store';
import { AppEmptyStateComponent } from '../../../shared/components/app-empty-state/app-empty-state.component';

@Component({
  selector: 'app-archive',
  templateUrl: './archive.page.html',
  styleUrls: ['./archive.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons,
    IonMenuButton,
    IonSegment,
    IonSegmentButton,
    IonBadge,
    AppEmptyStateComponent
  ],
  providers: [ArchiveStore],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArchivePage implements OnInit {
  public currentUser = this.authService.currentUser;
  public store = inject(ArchiveStore);
  public readonly Number = Number;

  constructor(
    private readonly authService: AuthService,
    private readonly toastController: ToastController
  ) {
    addIcons({
      archiveOutline,
      trendingUpOutline,
      calculatorOutline,
      cardOutline,
      lockClosedOutline,
      peopleOutline,
      checkmarkCircleOutline
    });
  }

  /**
   * Carga los datos del archivo histórico a través del store local
   * @returns {Promise<void>}
   */
  async ngOnInit(): Promise<void> {
    try {
      await this.store.loadArchiveData();
    } catch (err) {
      const toast = await this.toastController.create({
        message: 'Error al cargar el archivo histórico.',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  /**
   * Actualiza el segmento activo
   * @param {any} event - Evento del Segment
   */
  public onSegmentChange(event: any): void {
    this.store.setActiveSegment(event.detail.value);
  }

  public getSavedPercentage(goal: SavingsGoal): number {
    const target = Number(goal.targetAmount);
    if (target === 0) return 100;
    return Math.min(100, Math.max(0, (Number(goal.currentAmount) / target) * 100));
  }

  public getPaidPercentage(loan: Loan): number {
    const initial = Number(loan.initialPrincipal);
    if (initial === 0) return 100;
    const paid = initial - Number(loan.currentBalance);
    return Math.min(100, Math.max(0, (paid / initial) * 100));
  }
}
