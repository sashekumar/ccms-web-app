import { BaseService } from '../../core/base/base.service';
import { InvestigationRepository } from './investigation.repository';
import { InvestigationFilters, CreateInvestigationDto, UpdateInvestigationDto } from './dto/investigation.dto';
import { InvestigationEntity } from './investigation.entity';
import { logger } from '../../core/utils/logger.util';

/**
 * Investigation Service
 * Handles business logic for investigation case management
 * Extends BaseService for common patterns
 * 
 * Responsibilities:
 * - Create investigation cases
 * - Update investigation status and findings
 * - Manage investigation requests (document/info requests)
 * - Track call logs
 * - Apply business rules (status transitions, validations)
 * - Get investigation data with related information
 */
export class InvestigationService extends BaseService<InvestigationEntity> {
  protected repository: InvestigationRepository;

  constructor() {
    const repository = new InvestigationRepository();
    super(repository);
    this.repository = repository;
  }

  /**
   * Get investigations with filters
   * Status flow: OPEN → IN_PROGRESS → UNDER_REVIEW → COMPLETED → CLOSED
   */
  async getInvestigations(filters: InvestigationFilters): Promise<any> {
    try {
      const result = await this.repository.getInvestigations(filters);
      
      return {
        investigations: result.investigations,
        total: result.total,
        totalPages: Math.ceil(result.total / (filters.limit || 10)),
        page: filters.page || 1
      };
    } catch (error) {
      logger.error('Error fetching investigations:', error);
      throw new Error('Failed to fetch investigations');
    }
  }

  /**
   * Get single investigation with all related data
   */
  async getInvestigationById(ixId: number): Promise<any> {
    try {
      const investigation = await this.repository.getInvestigationById(ixId);
      
      if (!investigation) {
        throw new Error(`Investigation ${ixId} not found`);
      }

      // Fetch related requests and call logs
      const requests = await this.repository.getInvestigationRequests(ixId);
      const callLogs = await this.repository.getInvestigationCallLogs(ixId);

      return {
        ...investigation,
        requests,
        call_logs: callLogs
      };
    } catch (error) {
      logger.error(`Error fetching investigation ${ixId}:`, error);
      throw error;
    }
  }

  /**
   * Create investigation case
   * Business Rule: One active investigation per claim (status != CLOSED)
   */
  async createInvestigation(createDto: CreateInvestigationDto, userId: number): Promise<any> {
    try {
      // Check if active investigation exists
      const existing = await this.repository.checkExistingInvestigation(createDto.claim_id);
      if (existing) {
        throw new Error(
          `Active investigation already exists for this claim (ID: ${existing.ix_id}, Status: ${existing.status})`
        );
      }

      // Create investigation
      const ixId = await this.repository.createInvestigation(createDto, userId);
      logger.info(`Investigation created: ${ixId} for claim ${createDto.claim_id}`);

      // Return created investigation
      return await this.getInvestigationById(ixId);
    } catch (error) {
      logger.error('Error creating investigation:', error);
      throw error;
    }
  }

  /**
   * Update investigation status and findings
   * Business Rules:
   * - Status transitions must follow: OPEN → IN_PROGRESS → UNDER_REVIEW → COMPLETED → CLOSED
   * - Closing requires final_findings
   */
  async updateInvestigation(ixId: number, updateDto: UpdateInvestigationDto, userId: number): Promise<any> {
    try {
      const investigation = await this.repository.getInvestigationById(ixId);
      if (!investigation) {
        throw new Error(`Investigation ${ixId} not found`);
      }

      // Validate status transition
      if (updateDto.status) {
        const validTransitions: any = {
          'OPEN': ['IN_PROGRESS', 'CLOSED'],
          'IN_PROGRESS': ['UNDER_REVIEW', 'OPEN', 'CLOSED'],
          'UNDER_REVIEW': ['COMPLETED', 'IN_PROGRESS', 'CLOSED'],
          'COMPLETED': ['CLOSED'],
          'CLOSED': []
        };

        if (investigation.status === 'CLOSED') {
          throw new Error('Cannot update closed investigation. Create new investigation if needed.');
        }

        if (!validTransitions[investigation.status]?.includes(updateDto.status)) {
          throw new Error(
            `Invalid status transition from ${investigation.status} to ${updateDto.status}`
          );
        }
      }

      // Update investigation
      await this.repository.updateInvestigation(ixId, updateDto, userId);
      logger.info(`Investigation ${ixId} updated with status: ${updateDto.status || 'unchanged'}`);

      return await this.getInvestigationById(ixId);
    } catch (error) {
      logger.error(`Error updating investigation ${ixId}:`, error);
      throw error;
    }
  }

  /**
   * Add investigation request (document/info request)
   */
  async addInvestigationRequest(requestData: any, userId: number): Promise<any> {
    try {
      // Verify investigation exists
      const investigation = await this.repository.getInvestigationById(requestData.ix_id);
      if (!investigation) {
        throw new Error(`Investigation ${requestData.ix_id} not found`);
      }

      // Create request
      const requestId = await this.repository.createInvestigationRequest(requestData, userId);
      
      logger.info(
        `Investigation request created: ${requestId} for investigation ${requestData.ix_id} (Type: ${requestData.request_type})`
      );

      return { request_id: requestId, status: 'PENDING' };
    } catch (error) {
      logger.error('Error adding investigation request:', error);
      throw error;
    }
  }

  /**
   * Update investigation request status
   * Status: PENDING → RECEIVED | PARTIAL | NOT_AVAILABLE
   */
  async updateInvestigationRequest(requestId: number, updateData: any, userId: number): Promise<void> {
    try {
      await this.repository.updateInvestigationRequest(requestId, updateData, userId);
      
      logger.info(
        `Investigation request ${requestId} updated with status: ${updateData.status || 'unchanged'}`
      );
    } catch (error) {
      logger.error(`Error updating investigation request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Add call log entry during investigation
   */
  async addCallLog(callLogData: any, userId: number): Promise<any> {
    try {
      // Verify investigation exists
      const investigation = await this.repository.getInvestigationById(callLogData.ix_id);
      if (!investigation) {
        throw new Error(`Investigation ${callLogData.ix_id} not found`);
      }

      // Create call log
      const callId = await this.repository.createCallLog(callLogData, userId);
      
      logger.info(
        `Call log created: ${callId} for investigation ${callLogData.ix_id} (Contacted: ${callLogData.called_party})`
      );

      return { call_id: callId };
    } catch (error) {
      logger.error('Error creating call log:', error);
      throw error;
    }
  }

  /**
   * Get investigation requests with history
   */
  async getInvestigationRequests(ixId: number): Promise<any> {
    try {
      return await this.repository.getInvestigationRequests(ixId);
    } catch (error) {
      logger.error(`Error fetching requests for investigation ${ixId}:`, error);
      throw error;
    }
  }

  /**
   * Get investigation call logs
   */
  async getInvestigationCallLogs(ixId: number): Promise<any> {
    try {
      return await this.repository.getInvestigationCallLogs(ixId);
    } catch (error) {
      logger.error(`Error fetching call logs for investigation ${ixId}:`, error);
      throw error;
    }
  }

  /**
   * Get investigation statistics
   */
  async getInvestigationStats(): Promise<any> {
    try {
      return await this.repository.getInvestigationStats();
    } catch (error) {
      logger.error('Error fetching investigation statistics:', error);
      throw {};
    }
  }

  /**
   * Close investigation case
   * Final status: COMPLETED or CLOSED
   */
  async closeInvestigation(ixId: number, closeData: any, userId: number): Promise<any> {
    try {
      const investigation = await this.repository.getInvestigationById(ixId);
      if (!investigation) {
        throw new Error(`Investigation ${ixId} not found`);
      }

      if (investigation.status === 'CLOSED') {
        throw new Error('Investigation is already closed');
      }

      // Update to final status
      await this.repository.updateInvestigation(
        ixId,
        {
          status: closeData.status,
          findings: closeData.final_findings,
          is_pec_found: closeData.is_pec_found,
          request_payment_amt: closeData.request_payment_amt
        },
        userId
      );

      logger.info(`Investigation ${ixId} closed with status: ${closeData.status}`);

      return await this.getInvestigationById(ixId);
    } catch (error) {
      logger.error(`Error closing investigation ${ixId}:`, error);
      throw error;
    }
  }
}
