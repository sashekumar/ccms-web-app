import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants';
import {
  MqTemplate,
  MqTemplateListItem,
  MqTemplateQuestion,
  MqTemplateWithQuestions,
  CreateMqTemplateDto,
  UpdateMqTemplateDto,
  CreateMqQuestionDto,
  UpdateMqQuestionDto,
  MqTemplateFilters,
  PaginatedMqTemplates,
  MqBuilderData
} from '../../shared/models/mq-template.model';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class MqTemplateService {
  constructor(private api: ApiService) {}

  // ─── Templates ─────────────────────────────────────────────────────────────

  getTemplates(filters: MqTemplateFilters = {}): Observable<PaginatedMqTemplates> {
    return this.api.post<ApiResponse<PaginatedMqTemplates>>(
      API_ENDPOINTS.MQ_TEMPLATES.LIST, filters
    ).pipe(map(r => r.data), catchError(e => { throw e; }));
  }

  getTemplateById(template_id: number): Observable<MqTemplate> {
    return this.api.post<ApiResponse<MqTemplate>>(
      API_ENDPOINTS.MQ_TEMPLATES.GET, { template_id }
    ).pipe(map(r => r.data), catchError(e => { throw e; }));
  }

  getTemplateWithQuestions(template_id: number): Observable<MqTemplateWithQuestions> {
    return this.api.post<ApiResponse<MqTemplateWithQuestions>>(
      API_ENDPOINTS.MQ_TEMPLATES.GET_WITH_QUESTIONS, { template_id }
    ).pipe(map(r => r.data), catchError(e => { throw e; }));
  }

  createTemplate(dto: CreateMqTemplateDto): Observable<number> {
    return this.api.post<ApiResponse<{ template_id: number }>>(
      API_ENDPOINTS.MQ_TEMPLATES.CREATE, dto
    ).pipe(map(r => r.data.template_id), catchError(e => { throw e; }));
  }

  updateTemplate(template_id: number, dto: UpdateMqTemplateDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.MQ_TEMPLATES.UPDATE, { template_id, ...dto }
    ).pipe(map(() => undefined), catchError(e => { throw e; }));
  }

  deleteTemplate(template_id: number): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.MQ_TEMPLATES.DELETE, { template_id }
    ).pipe(map(() => undefined), catchError(e => { throw e; }));
  }

  // ─── Questions ─────────────────────────────────────────────────────────────

  getQuestions(template_id: number): Observable<MqTemplateQuestion[]> {
    return this.api.post<ApiResponse<MqTemplateQuestion[]>>(
      API_ENDPOINTS.MQ_TEMPLATES.QUESTIONS.LIST, { template_id }
    ).pipe(map(r => r.data), catchError(e => { throw e; }));
  }

  createQuestion(dto: CreateMqQuestionDto): Observable<number> {
    return this.api.post<ApiResponse<{ question_id: number }>>(
      API_ENDPOINTS.MQ_TEMPLATES.QUESTIONS.CREATE, dto
    ).pipe(map(r => r.data.question_id), catchError(e => { throw e; }));
  }

  updateQuestion(question_id: number, dto: UpdateMqQuestionDto): Observable<void> {
    return this.api.put<ApiResponse<void>>(
      API_ENDPOINTS.MQ_TEMPLATES.QUESTIONS.UPDATE, { question_id, ...dto }
    ).pipe(map(() => undefined), catchError(e => { throw e; }));
  }

  deleteQuestion(question_id: number): Observable<void> {
    return this.api.post<ApiResponse<void>>(
      API_ENDPOINTS.MQ_TEMPLATES.QUESTIONS.DELETE, { question_id }
    ).pipe(map(() => undefined), catchError(e => { throw e; }));
  }

  getBuilderData(): Observable<MqBuilderData> {
    return this.api.get<ApiResponse<MqBuilderData>>(
      API_ENDPOINTS.MQ_TEMPLATES.BUILDER
    ).pipe(map(r => r.data), catchError(e => { throw e; }));
  }
}
