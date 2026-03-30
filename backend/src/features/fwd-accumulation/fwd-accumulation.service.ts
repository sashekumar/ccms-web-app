import { BaseService } from '../../core/base/base.service';
import { FwdAccumulationRepository } from './fwd-accumulation.repository';
import { FwdAccumulationClientEntity } from './entities/fwd-accumulation.entity';
import {
  FwdClientFilters, FwdDisabilityFilters, FwdOnetimeFilters, FwdPaFilters,
  CreateFwdClientDto, CreateFwdDisabilityDto, CreateFwdOnetimeDto, CreateFwdPaDto,
  UpdateFwdClientDto, UpdateFwdDisabilityDto, UpdateFwdOnetimeDto, UpdateFwdPaDto
} from './dto/fwd-accumulation.dto';

export class FwdAccumulationService extends BaseService<FwdAccumulationClientEntity> {
  private readonly fwdRepo: FwdAccumulationRepository;

  constructor() {
    const repo = new FwdAccumulationRepository();
    super(repo);
    this.fwdRepo = repo;
  }

  async getClientAccumulations(filters: FwdClientFilters) {
    return this.fwdRepo.getClientAccumulations(filters);
  }

  async getDisabilityAccumulations(filters: FwdDisabilityFilters) {
    return this.fwdRepo.getDisabilityAccumulations(filters);
  }

  async getOnetimeAccumulations(filters: FwdOnetimeFilters) {
    return this.fwdRepo.getOnetimeAccumulations(filters);
  }

  async getPaAccumulations(filters: FwdPaFilters) {
    return this.fwdRepo.getPaAccumulations(filters);
  }

  async getStats() {
    return this.fwdRepo.getStats();
  }

  async createClientAccumulation(dto: CreateFwdClientDto, userId: string) {
    return this.fwdRepo.createClientAccumulation(dto, userId);
  }

  async createDisabilityAccumulation(dto: CreateFwdDisabilityDto, userId: string) {
    return this.fwdRepo.createDisabilityAccumulation(dto, userId);
  }

  async createOnetimeAccumulation(dto: CreateFwdOnetimeDto, userId: string) {
    return this.fwdRepo.createOnetimeAccumulation(dto, userId);
  }

  async createPaAccumulation(dto: CreateFwdPaDto, userId: string) {
    return this.fwdRepo.createPaAccumulation(dto, userId);
  }

  async updateClientAccumulation(id: number, dto: UpdateFwdClientDto, userId: string) {
    return this.fwdRepo.updateClientAccumulation(id, dto, userId);
  }

  async updateDisabilityAccumulation(id: number, dto: UpdateFwdDisabilityDto, userId: string) {
    return this.fwdRepo.updateDisabilityAccumulation(id, dto, userId);
  }

  async updateOnetimeAccumulation(id: number, dto: UpdateFwdOnetimeDto, userId: string) {
    return this.fwdRepo.updateOnetimeAccumulation(id, dto, userId);
  }

  async updatePaAccumulation(id: number, dto: UpdateFwdPaDto, userId: string) {
    return this.fwdRepo.updatePaAccumulation(id, dto, userId);
  }
}
