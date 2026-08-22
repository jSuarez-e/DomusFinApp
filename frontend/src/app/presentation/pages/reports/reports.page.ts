// frontend/src/app/presentation/pages/reports/reports.page.ts
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonIcon, 
  IonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonButton,
  IonBadge,
  IonItem,
  IonList,
  IonToggle
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  barChartOutline, 
  pieChartOutline, 
  analyticsOutline, 
  trendingUpOutline, 
  trendingDownOutline, 
  walletOutline,
  lockClosedOutline,
  lockClosed,
  flash,
  swapHorizontalOutline,
  cashOutline,
  fastFoodOutline,
  carOutline,
  cameraOutline,
  helpCircleOutline,
  receiptOutline
} from 'ionicons/icons';

import { ReportService } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { TransactionEventService } from '../../../core/services/transaction-event.service';
import { ReportDataDto } from '@shared/index';
import { ReportsStore } from './reports.store';
import { ReportLegendComponent } from '../../../shared/components/report-legend/report-legend.component';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonText,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonButton,
    IonBadge,
    IonItem,
    IonList,
    IonItem,
    IonList,
    IonToggle,
    ReportLegendComponent
  ],
  providers: [ReportsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage implements OnInit {
  public store = inject(ReportsStore);
  
  @ViewChild('donutCanvas', { static: false }) donutCanvas!: ElementRef<HTMLCanvasElement>;

  // Miembros del hogar (Estado local de la UI)
  public members = signal<any[]>([]);

  // Delegación de selectores del Store para uso en la plantilla HTML
  public selectedYear = this.store.selectedYear;
  public selectedMonth = this.store.selectedMonth;
  public selectedMemberId = this.store.selectedMemberId;
  public activeType = this.store.activeType;
  public excludeCapitalMovements = this.store.excludeCapitalMovements;
  public reportData = this.store.reportData;
  public summary = this.store.summary;
  public byCategory = this.store.byCategory;
  public movements = this.store.movements;
  public groupedMovements = this.store.groupedMovements;

  // Static options
  public availableYears = [2026, 2025, 2024];
  public availableMonths = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  public currentUser = this.authService.currentUser;

  // Corporate palette mapping for canvas chart drawing
  private chartColors = [
    '#88DCCC', // Sky Soft
    '#4C6793', // Steel Blue
    '#5C2E7E', // Amethyst Purple
    '#E11D48', // Rose Red
    '#F59E0B', // Amber Orange
    '#10B981', // Emerald Green
    '#6366F1', // Indigo Blue
    '#71717A'  // Muted Gray
  ];

  constructor(
    private readonly reportService: ReportService,
    private readonly authService: AuthService,
    private readonly http: HttpClient,
    private readonly transactionEventService: TransactionEventService
  ) {
    addIcons({ 
      barChartOutline, 
      pieChartOutline, 
      analyticsOutline,
      trendingUpOutline,
      trendingDownOutline,
      walletOutline,
      lockClosedOutline,
      lockClosed,
      flash,
      swapHorizontalOutline,
      cashOutline,
      fastFoodOutline,
      carOutline,
      cameraOutline,
      helpCircleOutline,
      receiptOutline
    });

    effect(() => {
      const data = this.reportData();
      if (data) {
        setTimeout(() => this.drawDonutChart(), 50);
      }
    });

    effect(() => {
      const changeCount = this.transactionEventService.transactionSaved();
      if (changeCount > 0) {
        this.store.loadReport();
      }
    });
  }

  ngOnInit() {
    this.loadHouseholdMembers();
    this.store.loadReport();
  }

  public loadHouseholdMembers() {
    this.http.get<any[]>(`${this.authService.apiUrlUsers}/members`).subscribe({
      next: (data) => {
        this.members.set(data || []);
      },
      error: (err) => console.error('Failed to load household members:', err)
    });
  }

  public onMonthChange(event: any) {
    this.store.updateFilter({ selectedMonth: Number(event.detail.value) });
    this.store.loadReport();
  }

  public onYearChange(event: any) {
    this.store.updateFilter({ selectedYear: Number(event.detail.value) });
    this.store.loadReport();
  }

  public onMemberChange(event: any) {
    const val = event.detail.value;
    this.store.updateFilter({ selectedMemberId: val ? Number(val) : null });
    this.store.loadReport();
  }

  public onTypeChange(event: any) {
    this.store.updateFilter({ activeType: event.detail.value });
    this.store.loadReport();
  }

  public onExcludeCapitalChange(event: any) {
    this.store.updateFilter({ excludeCapitalMovements: event.detail.checked });
  }

  public getCategoryIcon(categoryId: number): string {
    switch (categoryId) {
      case 1: return 'fast-food-outline';
      case 2: return 'flash-outline';
      case 3: return 'car-outline';
      case 4: return 'camera-outline';
      default: return 'help-circle-outline';
    }
  }

  public getMovementIcon(m: any): string {
    if (m.type === 'Ahorro' || m.type === 'Pago Crédito' || m.type === 'Pago TC') {
      return 'swap-horizontal-outline';
    }
    return this.getCategoryIcon(m.categoryId);
  }

  public getCategoryColor(index: number): string {
    return this.chartColors[index % this.chartColors.length];
  }

  /**
   * Obtiene la clase CSS para aplicar el color exacto en base a la categoría,
   * reemplazando los estilos inline obsoletos.
   * @param m Objeto de movimiento
   * @returns {string} Clase BEM para el icono
   */
  public getMovementIconClass(m: any): string {
    if (m.isPrivate && this.store.activeType() !== 'Privado') {
      return 'movement-icon--private';
    }
    const id = m.categoryId || 0;
    return `movement-icon--color-${id % 8}`;
  }

  private drawDonutChart() {
    if (!this.donutCanvas) return;

    const canvas = this.donutCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 200;
    canvas.width = size * 2;
    canvas.height = size * 2;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(2, 2);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.45;
    const innerRadius = radius * 0.70;

    ctx.clearRect(0, 0, size, size);

    const categories = this.store.byCategory().filter(c => c.categoryId !== 0); 
    const spentCategories = categories.filter(c => c.amount > 0);

    if (spentCategories.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(128, 128, 128, 0.1)';
      ctx.fill();

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      ctx.fillStyle = '#71717a';
      ctx.font = 'bold 10px "Outfit", "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SIN GASTOS', centerX, centerY);
      return;
    }

    const totalAmount = spentCategories.reduce((sum, c) => sum + c.amount, 0);
    let startAngle = 1.5 * Math.PI; 

    spentCategories.forEach((cat, index) => {
      const sliceAngle = (cat.amount / totalAmount) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      const color = this.getCategoryColor(index);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      startAngle = endAngle;
    });

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 11px "Outfit", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TOTAL GASTADO', centerX, centerY - 10);

    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    ctx.fillStyle = isDarkMode ? '#ffffff' : '#1e293b';
    ctx.font = 'bold 16px "Outfit", "Inter", sans-serif';
    const totalSpentStr = `$${totalAmount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    ctx.fillText(totalSpentStr, centerX, centerY + 8);
  }
}