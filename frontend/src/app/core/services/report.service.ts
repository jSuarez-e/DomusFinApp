// frontend/src/app/core/services/report.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportDataDto } from '@shared/index';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly baseUrlEnv = environment.apiUrl;
  private readonly apiUrl = this.baseUrlEnv + '/reports';

  constructor(private readonly http: HttpClient) {}

  /**
   * Obtiene el reporte analítico agregado del mes desde el backend.
   * 
   * @param {object} params Filtros de búsqueda (month, year, userId, type).
   * @returns {Observable<ReportDataDto>}
   */
  getAnalyticsReport(params: {
    month?: number;
    year?: number;
    userId?: number;
    type?: string;
  }): Observable<ReportDataDto> {
    const httpParams: any = {};
    if (params.month) httpParams.month = String(params.month);
    if (params.year) httpParams.year = String(params.year);
    if (params.userId) httpParams.userId = String(params.userId);
    if (params.type) httpParams.type = params.type;

    return this.http.get<ReportDataDto>(this.apiUrl, { params: httpParams });
  }
}
