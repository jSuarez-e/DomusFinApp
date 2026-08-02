// frontend/src/app/presentation/pages/reports/reports.page.ts
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, signal, computed, effect } from '@angular/core';
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
} from '@ionic/angular/standalone';
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
  helpCircleOutline
} from 'ionicons/icons';

import { ReportService } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { TransactionEventService } from '../../../core/services/transaction-event.service';
import { ReportDataDto } from '@shared/index';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.css'],
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
    IonToggle
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage implements OnInit {
  @ViewChild('donutCanvas', { static: false }) donutCanvas!: ElementRef<HTMLCanvasElement>;

  // Filters State
  public selectedYear = signal<number>(new Date().getFullYear());
  public selectedMonth = signal<number>(new Date().getMonth() + 1);
  public selectedMemberId = signal<number | null>(null);
  public activeType = signal<'General' | 'Gasto' | 'Ingreso' | 'Privado'>('General');

  // Server Data
  public reportData = signal<ReportDataDto | null>(null);
  public members = signal<any[]>([]);

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

  // Exclude Capital Movements Filter
  public excludeCapitalMovements = signal<boolean>(true);

  // Computed totals and lists
  public summary = computed(() => {
    const serverSummary = this.reportData()?.summary as any;
    if (!serverSummary) {
      return { totalSpent: 0, totalIncome: 0, netSavings: 0 };
    }

    const exclude = this.excludeCapitalMovements();
    const operating = Number(serverSummary.operatingExpenses || serverSummary.totalSpent || 0);
    const capital = Number(serverSummary.capitalMovements || 0);

    const totalSpent = exclude ? operating : (operating + capital);
    const totalIncome = Number(serverSummary.totalIncome || 0);
    const netSavings = totalIncome - totalSpent;

    return {
      totalSpent,
      totalIncome,
      netSavings,
    };
  });

  public byCategory = computed(() => this.reportData()?.byCategory || []);
  
  public movements = computed(() => {
    const list = this.reportData()?.movements || [];
    if (this.excludeCapitalMovements()) {
      return list.filter((m) => !['Ahorro', 'Pago Crédito', 'Pago TC'].includes(m.type));
    }
    return list;
  });

  // NUEVO: Agrupa los movimientos por día para replicar el diseño visual propuesto
  public groupedMovements = computed(() => {
    const list = this.movements();
    const groupsMap = new Map<string, { dateLabel: string, dateValue: Date, dailyTotal: number, items: any[] }>();

    list.forEach(m => {
      const d = new Date(m.transactionDate);
      const dateKey = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' }).format(d);
      
      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, {
          dateLabel: dateKey,
          dateValue: d,
          dailyTotal: 0,
          items: []
        });
      }
      
      const group = groupsMap.get(dateKey)!;
      group.items.push(m);
      
      const amount = Number(m.amount);
      if (m.type === 'Ingreso') {
        group.dailyTotal += amount;
      } else {
        group.dailyTotal -= amount;
      }
    });

    return Array.from(groupsMap.values()).sort((a, b) => b.dateValue.getTime() - a.dateValue.getTime());
  });

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
      helpCircleOutline
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
        this.loadReport();
      }
    });
  }

  ngOnInit() {
    this.loadHouseholdMembers();
    this.loadReport();
  }

  public loadHouseholdMembers() {
    this.http.get<any[]>(`${this.authService.apiUrlUsers}/members`).subscribe({
      next: (data) => {
        this.members.set(data || []);
      },
      error: (err) => console.error('Failed to load household members:', err)
    });
  }

  public loadReport() {
    const params = {
      month: this.selectedMonth(),
      year: this.selectedYear(),
      userId: this.selectedMemberId() || undefined,
      type: this.activeType()
    };

    this.reportService.getAnalyticsReport(params).subscribe({
      next: (data) => {
        this.reportData.set(data);
      },
      error: (err) => {
        console.error('Failed to load analytical report:', err);
        this.reportData.set(null);
      }
    });
  }

  public onMonthChange(event: any) {
    this.selectedMonth.set(Number(event.detail.value));
    this.loadReport();
  }

  public onYearChange(event: any) {
    this.selectedYear.set(Number(event.detail.value));
    this.loadReport();
  }

  public onMemberChange(event: any) {
    const val = event.detail.value;
    this.selectedMemberId.set(val ? Number(val) : null);
    this.loadReport();
  }

  public onTypeChange(event: any) {
    this.activeType.set(event.detail.value);
    this.loadReport();
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

  // NUEVO: Obtiene el color exacto para los iconos redondos basado en el ID de categoría
  public getCategoryColorById(categoryId: number | undefined): string {
    const id = categoryId || 0;
    return this.chartColors[id % this.chartColors.length];
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
    const innerRadius = radius * 0.6;

    ctx.clearRect(0, 0, size, size);

    const categories = this.byCategory().filter(c => c.categoryId !== 0); 
    const spentCategories = categories.filter(c => c.amount > 0);

    if (spentCategories.length === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#09090b'; 
      ctx.fill();

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

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#09090b'; 
    ctx.fill();

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 8px "Outfit", "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TOTAL GASTADO', centerX, centerY - 8);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Outfit", "Inter", sans-serif';
    const totalSpentStr = `$${totalAmount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    ctx.fillText(totalSpentStr, centerX, centerY + 6);
  }
}