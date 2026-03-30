import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api.service';
import {
  FwdClientFilters, FwdDisabilityFilters, FwdOnetimeFilters, FwdPaFilters,
  FwdClientRecord, FwdDisabilityRecord, FwdOnetimeRecord, FwdPaRecord,
  FwdAccumulationStatsResponse,
  CreateFwdClientDto, CreateFwdDisabilityDto, CreateFwdOnetimeDto, CreateFwdPaDto,
  UpdateFwdClientDto, UpdateFwdDisabilityDto, UpdateFwdOnetimeDto, UpdateFwdPaDto,
  PaginatedFwdResponse,
  ApiResponse
} from '../../../shared/models/fwd-accumulation/fwd-accumulation.model';

@Injectable({
  providedIn: 'root'
})
export class FwdAccumulationService {
  private readonly apiEndpoint = 'fwd-accumulation';

  constructor(private apiService: ApiService) {}

  getStats(): Observable<FwdAccumulationStatsResponse> {
    return this.apiService
      .post<ApiResponse<FwdAccumulationStatsResponse>>(`${this.apiEndpoint}/stats`, {})
      .pipe(map((res) => res.data));
  }

  getClientRecords(page = 1, pageSize = 10, filters?: FwdClientFilters): Observable<PaginatedFwdResponse<FwdClientRecord>> {
    return this.apiService
      .post<ApiResponse<PaginatedFwdResponse<FwdClientRecord>>>(`${this.apiEndpoint}/client`, { page, limit: pageSize, ...filters })
      .pipe(map((res) => res.data));
  }

  getDisabilityRecords(page = 1, pageSize = 10, filters?: FwdDisabilityFilters): Observable<PaginatedFwdResponse<FwdDisabilityRecord>> {
    return this.apiService
      .post<ApiResponse<PaginatedFwdResponse<FwdDisabilityRecord>>>(`${this.apiEndpoint}/disability`, { page, limit: pageSize, ...filters })
      .pipe(map((res) => res.data));
  }

  getOnetimeRecords(page = 1, pageSize = 10, filters?: FwdOnetimeFilters): Observable<PaginatedFwdResponse<FwdOnetimeRecord>> {
    return this.apiService
      .post<ApiResponse<PaginatedFwdResponse<FwdOnetimeRecord>>>(`${this.apiEndpoint}/onetime`, { page, limit: pageSize, ...filters })
      .pipe(map((res) => res.data));
  }

  getPaRecords(page = 1, pageSize = 10, filters?: FwdPaFilters): Observable<PaginatedFwdResponse<FwdPaRecord>> {
    return this.apiService
      .post<ApiResponse<PaginatedFwdResponse<FwdPaRecord>>>(`${this.apiEndpoint}/pa`, { page, limit: pageSize, ...filters })
      .pipe(map((res) => res.data));
  }

  createClientRecord(dto: CreateFwdClientDto): Observable<any> {
    return this.apiService
      .post<ApiResponse<any>>(`${this.apiEndpoint}/client/create`, dto)
      .pipe(map((res) => res.data));
  }

  createDisabilityRecord(dto: CreateFwdDisabilityDto): Observable<any> {
    return this.apiService
      .post<ApiResponse<any>>(`${this.apiEndpoint}/disability/create`, dto)
      .pipe(map((res) => res.data));
  }

  createOnetimeRecord(dto: CreateFwdOnetimeDto): Observable<any> {
    return this.apiService
      .post<ApiResponse<any>>(`${this.apiEndpoint}/onetime/create`, dto)
      .pipe(map((res) => res.data));
  }

  createPaRecord(dto: CreateFwdPaDto): Observable<any> {
    return this.apiService
      .post<ApiResponse<any>>(`${this.apiEndpoint}/pa/create`, dto)
      .pipe(map((res) => res.data));
  }

  updateClientRecord(id: number, dto: UpdateFwdClientDto): Observable<any> {
    return this.apiService
      .put<ApiResponse<any>>(`${this.apiEndpoint}/client/${id}`, dto)
      .pipe(map((res) => res.data));
  }

  updateDisabilityRecord(id: number, dto: UpdateFwdDisabilityDto): Observable<any> {
    return this.apiService
      .put<ApiResponse<any>>(`${this.apiEndpoint}/disability/${id}`, dto)
      .pipe(map((res) => res.data));
  }

  updateOnetimeRecord(id: number, dto: UpdateFwdOnetimeDto): Observable<any> {
    return this.apiService
      .put<ApiResponse<any>>(`${this.apiEndpoint}/onetime/${id}`, dto)
      .pipe(map((res) => res.data));
  }

  updatePaRecord(id: number, dto: UpdateFwdPaDto): Observable<any> {
    return this.apiService
      .put<ApiResponse<any>>(`${this.apiEndpoint}/pa/${id}`, dto)
      .pipe(map((res) => res.data));
  }
}
