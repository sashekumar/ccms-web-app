import sql from 'mssql';
import { connectionManager } from '../../core/database/connection-manager';
import { DB_TABLES } from '../../core/constants';
import { MemberPoliciesRepository } from './member-policies.repository';
import { ClaimsRepository } from '../claims/claims.repository';

/**
 * Policy Validation Service
 * 
 * Purpose: Centralized policy validation logic (HARD STOPS)
 * Used by: Admissions, Claims, and other modules requiring policy checks
 * 
 * Validations:
 * 1. Policy Status - Must be INFORCE
 * 2. Waiting Period - Must be >= 30 days after effective_date
 * 3. Annual Limit - Utilized amount must be < ANNUAL limit from ccms_product_limits
 * 
 * Returns: ValidationResult with passed flag and detailed error reasons
 * 
 * Follows: COMMONIZATION principle - write once, use everywhere
 */
export interface PolicyValidationResult {
  passed: boolean;                  // Overall validation result
  errors: {                         // Array of validation failures (for detailed error reporting)
    code: string;                   // Machine-readable error code (e.g., POLICY_NOT_INFORCE)
    message: string;                // User-friendly error message with details
  }[];
}

export class PolicyValidationService {
  private policiesRepository = new MemberPoliciesRepository();
  private claimsRepository = new ClaimsRepository();

  /**
   * TASK 2.1: Validate policy eligibility for admission
   * Called before admission approval to check HARD STOPS
   * 
   * @param memberId - Member ID (number)
   * @param admissionDate - Date of admission (for waiting period check)
   * @param policyRecordId - Optional specific policy record ID
   * @returns ValidationResult with all failed checks listed
   */
  public async validatePolicyForAdmission(
    memberId: number,
    admissionDate: Date,
    policyRecordId?: number
  ): Promise<PolicyValidationResult> {
    const errors: PolicyValidationResult['errors'] = [];

    try {
      // Get member's active policy (or specific policy)
      // MemberPoliciesRepository uses string IDs (legacy VARCHAR keys)
      let policy = null;
      if (policyRecordId) {
        policy = await this.policiesRepository.getPolicyById(String(policyRecordId));
      } else {
        const policies = await this.policiesRepository.getPoliciesByMemberId(String(memberId));
        policy = policies && policies.length > 0 ? policies[0] : null;
      }

      if (!policy) {
        errors.push({
          code: 'POLICY_NOT_FOUND',
          message: 'No active policy found for this member'
        });
        return { passed: false, errors };
      }

      // HARD STOP #1: Policy Status Check
      if (policy.status !== 'INFORCE') {
        errors.push({
          code: 'POLICY_NOT_INFORCE',
          message: `Policy is not in force (Status: ${policy.status || 'UNKNOWN'})` +
            (policy.expiry_date
              ? ` - Expired on ${new Date(policy.expiry_date).toLocaleDateString('en-MY')}`
              : '')
        });
      }

      // HARD STOP #2: Waiting Period Check (30 days minimum)
      if (policy.effective_date) {
        const effectiveDate = new Date(policy.effective_date);
        const daysSinceEffective = Math.floor(
          (admissionDate.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceEffective < 30) {
          const daysRemaining = 30 - daysSinceEffective;
          errors.push({
            code: 'WAITING_PERIOD_NOT_CLEARED',
            message: `Policy waiting period not cleared. ${daysRemaining} day(s) remaining ` +
              `(Policy effective: ${effectiveDate.toLocaleDateString('en-MY')})`
          });
        }
      }

      // HARD STOP #3: Annual Limit Check
      // Annual limit stored in ccms_product_limits (limit_type = 'ANNUAL'), not ccms_products
      if (policy.product_id) {
        const annualLimit = await this.getAnnualLimit(Number(policy.product_id));

        if (annualLimit !== null) {
          const utilizedAmount = await this.claimsRepository.getTotalApprovedAmountForPolicy(
            Number(policy.policy_record_id)
          );

          if (utilizedAmount >= annualLimit) {
            errors.push({
              code: 'ANNUAL_LIMIT_EXCEEDED',
              message: `Annual limit exceeded. ` +
                `Limit: RM${annualLimit.toLocaleString('en-MY', { minimumFractionDigits: 2 })}, ` +
                `Used: RM${utilizedAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`
            });
          }
        }
      }
    } catch (error) {
      console.error('[PolicyValidationService] Error during policy validation:', error);
      errors.push({
        code: 'VALIDATION_ERROR',
        message: 'Error occurred during policy validation. Please contact support.'
      });
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * Get ANNUAL limit amount from ccms_product_limits for a product
   * Returns null if no annual limit is configured
   */
  private async getAnnualLimit(productId: number): Promise<number | null> {
    const pool = await connectionManager.getPool();
    const result = await pool.request()
      .input('productId', sql.BigInt, productId)
      .query(`
        SELECT TOP 1 limit_amount
        FROM ${DB_TABLES.PRODUCT_LIMITS}
        WHERE product_id = @productId
          AND limit_type = 'ANNUAL'
          AND is_active = 1
          AND limit_amount IS NOT NULL
          AND limit_amount > 0
      `);

    return result.recordset[0]?.limit_amount ?? null;
  }
}
