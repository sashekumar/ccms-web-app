import { BaseService } from '../../core/base/base.service';
import { ClaimTrackingRepository } from './claim-tracking.repository';
import { ClaimStatusLogEntity } from './entities/claim-tracking.entity';
import {
  StatusLogFilters, MilestoneFilters, DurationFilters,
  CreateStatusLogDto, CreateMilestoneDto, CreateDurationDto,
  UpdateStatusLogDto, UpdateMilestoneDto, UpdateDurationDto
} from './dto/claim-tracking.dto';

export class ClaimTrackingService extends BaseService<ClaimStatusLogEntity> {
  private readonly trackingRepo: ClaimTrackingRepository;

  constructor() {
    const repo = new ClaimTrackingRepository();
    super(repo);
    this.trackingRepo = repo;
  }

  async getStatusLogs(filters: StatusLogFilters) { return this.trackingRepo.getStatusLogs(filters); }
  async createStatusLog(dto: CreateStatusLogDto, userId: string) { return this.trackingRepo.createStatusLog(dto, userId); }
  async updateStatusLog(logId: number, dto: UpdateStatusLogDto, userId: string) { return this.trackingRepo.updateStatusLog(logId, dto, userId); }

  async getMilestones(filters: MilestoneFilters) { return this.trackingRepo.getMilestones(filters); }
  async createMilestone(dto: CreateMilestoneDto, userId: string) { return this.trackingRepo.createMilestone(dto, userId); }
  async updateMilestone(milestoneId: number, dto: UpdateMilestoneDto, userId: string) { return this.trackingRepo.updateMilestone(milestoneId, dto, userId); }

  async getDurations(filters: DurationFilters) { return this.trackingRepo.getDurations(filters); }
  async createDuration(dto: CreateDurationDto, userId: string) { return this.trackingRepo.createDuration(dto, userId); }
  async updateDuration(durationId: number, dto: UpdateDurationDto, userId: string) { return this.trackingRepo.updateDuration(durationId, dto, userId); }

  async getStats() { return this.trackingRepo.getStats(); }
  async getClaimHistory(claimId: number) { return this.trackingRepo.getClaimHistory(claimId); }
}
