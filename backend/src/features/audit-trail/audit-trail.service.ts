/**
 * Audit Trail - Service
 * Business logic for audit trail operations
 */

import { BaseService } from '../../core/base/base.service';
import { AuditTrailRepository } from './audit-trail.repository';
import { AuditLogEntity } from './entities/audit-trail.entity';
import {
  AuditLogFilters,
  AdmissionLogFilters,
  CreateAuditLogDto,
  CreateAdmissionLogDto,
  UpdateAuditLogDto,
  UpdateAdmissionLogDto,
  AuditTrailStatsResponse
} from './dto/audit-trail.dto';

export class AuditTrailService extends BaseService<AuditLogEntity> {
  private readonly auditRepo: AuditTrailRepository;

  constructor() {
    const repo = new AuditTrailRepository();
    super(repo);
    this.auditRepo = repo;
  }

  // ========================================================================
  // AUDIT LOGS
  // ========================================================================

  async getAuditLogs(filters: AuditLogFilters, page: number = 1, limit: number = 10) {
    return this.auditRepo.getAuditLogs(filters, page, limit);
  }

  async createAuditLog(dto: CreateAuditLogDto) {
    return this.auditRepo.createAuditLog(dto);
  }

  async updateAuditLog(audit_id: bigint, dto: UpdateAuditLogDto) {
    return this.auditRepo.updateAuditLog(audit_id, dto);
  }

  // ========================================================================
  // ADMISSION LOGS
  // ========================================================================

  async getAdmissionLogs(filters: AdmissionLogFilters, page: number = 1, limit: number = 10) {
    return this.auditRepo.getAdmissionLogs(filters, page, limit);
  }

  async createAdmissionLog(dto: CreateAdmissionLogDto) {
    return this.auditRepo.createAdmissionLog(dto);
  }

  async updateAdmissionLog(log_id: bigint, dto: UpdateAdmissionLogDto) {
    return this.auditRepo.updateAdmissionLog(log_id, dto);
  }

  // ========================================================================
  // STATISTICS
  // ========================================================================

  async getStats(): Promise<AuditTrailStatsResponse> {
    return this.auditRepo.getStats();
  }
}
