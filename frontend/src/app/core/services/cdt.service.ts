// frontend/src/app/core/services/cdt.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Cdt } from '@shared/models/cdts/cdt.interface';
import { CreateCdtDto } from '@shared/models/cdts/cdt.dto';

@Injectable({
  providedIn: 'root'
})
export class CdtService {
  private readonly apiUrl = `${environment.apiUrl}/cdts`;

  constructor(private http: HttpClient) {}

  async getCdts(): Promise<Cdt[]> {
    return firstValueFrom(this.http.get<Cdt[]>(this.apiUrl));
  }

  async createCdt(dto: CreateCdtDto): Promise<Cdt> {
    return firstValueFrom(this.http.post<Cdt>(this.apiUrl, dto));
  }
}
